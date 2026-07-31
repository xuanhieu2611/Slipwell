-- SLIP-008 identity foundation. This migration is intentionally additive. The
-- auth.users trigger creates each user's only workspace in the same database
-- transaction as the user row, so replaying an OAuth callback cannot create a
-- second workspace.

create function public.is_valid_iana_timezone(candidate text)
returns boolean
language sql
stable
set search_path = pg_catalog
as $$
  select exists (
    select 1
    from pg_timezone_names
    where name = candidate
  );
$$;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  locale text not null default 'en',
  default_timezone text not null default 'Etc/UTC'
    check (public.is_valid_iana_timezone(default_timezone)),
  onboarding_state jsonb not null default jsonb_build_object(
    'version', 1,
    'completed_steps', jsonb_build_object(
      'preferences', false,
      'calendar', false,
      'workflows', false
    ),
    'last_completed_step', null
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  locale text not null default 'en',
  timezone text not null default 'Etc/UTC'
    check (public.is_valid_iana_timezone(timezone)),
  week_start smallint not null default 1 check (week_start between 0 and 6),
  morning_time time not null default time '09:00',
  quiet_hours jsonb,
  plan text not null default 'beta',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deletion_requested_at timestamptz
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role = 'owner'),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id),
  unique (workspace_id),
  unique (user_id)
);

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

-- Identity mutations go through the bounded functions below. Do not expose
-- profile or workspace tables through the Data API merely because a caller has
-- an authenticated JWT.
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.workspaces from anon, authenticated;
revoke all on table public.workspace_members from anon, authenticated;

create policy "profiles_are_private_to_the_user"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "profiles_can_be_updated_by_the_user"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "members_can_read_their_workspace"
on public.workspaces
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members
    where workspace_members.workspace_id = workspaces.id
      and workspace_members.user_id = (select auth.uid())
  )
);

create policy "memberships_are_private_to_the_user"
on public.workspace_members
for select
to authenticated
using ((select auth.uid()) = user_id);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  created_profile_user_id uuid;
  created_workspace_id uuid;
begin
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '')
  )
  on conflict (user_id) do nothing
  returning user_id into created_profile_user_id;

  if created_profile_user_id is not null then
    insert into public.workspaces (name)
    values ('Personal workspace')
    returning id into created_workspace_id;

    insert into public.workspace_members (workspace_id, user_id, role)
    values (created_workspace_id, new.id, 'owner');
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create function public.complete_workspace_preferences(
  p_timezone text,
  p_locale text,
  p_week_start smallint,
  p_morning_time time
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  current_user_id uuid := auth.uid();
  current_workspace_id uuid;
  state jsonb;
begin
  if current_user_id is null then
    raise exception 'authentication is required' using errcode = '42501';
  end if;

  if not public.is_valid_iana_timezone(p_timezone) then
    raise exception 'timezone must be an IANA timezone' using errcode = '22023';
  end if;

  if p_locale !~ '^[A-Za-z]{2,3}([_-][A-Za-z0-9]{2,8})*$' then
    raise exception 'locale must be a valid language tag' using errcode = '22023';
  end if;

  if p_week_start not between 0 and 6 then
    raise exception 'week_start must be between 0 and 6' using errcode = '22023';
  end if;

  select workspace_id
  into strict current_workspace_id
  from public.workspace_members
  where user_id = current_user_id;

  update public.workspaces
  set timezone = p_timezone,
      locale = p_locale,
      week_start = p_week_start,
      morning_time = p_morning_time,
      updated_at = now()
  where id = current_workspace_id;

  update public.profiles
  set locale = p_locale,
      default_timezone = p_timezone,
      onboarding_state = jsonb_set(
        jsonb_set(
          onboarding_state,
          array['completed_steps', 'preferences'],
          'true'::jsonb,
          true
        ),
        array['last_completed_step'],
        to_jsonb('preferences'::text),
        true
      ),
      updated_at = now()
  where user_id = current_user_id
  returning onboarding_state into state;

  return state;
end;
$$;

create function public.get_my_identity()
returns table (
  user_id uuid,
  workspace_id uuid,
  locale text,
  timezone text,
  week_start smallint,
  morning_time time,
  onboarding_state jsonb
)
language sql
security definer
stable
set search_path = public, pg_catalog
as $$
  select
    profiles.user_id,
    workspaces.id,
    workspaces.locale,
    workspaces.timezone,
    workspaces.week_start,
    workspaces.morning_time,
    profiles.onboarding_state
  from public.profiles
  join public.workspace_members on workspace_members.user_id = profiles.user_id
  join public.workspaces on workspaces.id = workspace_members.workspace_id
  where profiles.user_id = auth.uid();
$$;

revoke all on function public.handle_new_user() from public;
revoke all on function public.complete_workspace_preferences(text, text, smallint, time) from public;
revoke all on function public.get_my_identity() from public;
grant execute on function public.complete_workspace_preferences(text, text, smallint, time) to authenticated;
grant execute on function public.get_my_identity() to authenticated;
