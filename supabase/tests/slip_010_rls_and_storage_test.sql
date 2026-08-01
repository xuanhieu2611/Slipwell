begin;
select no_plan();

-- A second synthetic owner provides a concrete foreign workspace without
-- relying on production data. The auth trigger provisions its workspace.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  '10000000-0000-0000-0000-000000000010',
  'authenticated',
  'authenticated',
  'other-owner@slipwell.test',
  '',
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Other synthetic owner"}'::jsonb,
  now(),
  now()
)
on conflict (id) do nothing;

select set_config(
  'slipwell.test.owner_workspace',
  (select workspace_id::text from public.workspace_members where user_id = '10000000-0000-0000-0000-000000000001'),
  true
);
select set_config(
  'slipwell.test.foreign_workspace',
  (select workspace_id::text from public.workspace_members where user_id = '10000000-0000-0000-0000-000000000010'),
  true
);

with workspace_tables(table_name) as (
  values
    ('captures'), ('capture_transcripts'), ('capture_proposals'), ('ai_runs'),
    ('domains'), ('project_templates'), ('projects'), ('retainer_settings'),
    ('retainer_deliverable_templates'), ('retainer_task_templates'),
    ('retainer_cycles'), ('retainer_deliverables'), ('tasks'), ('people'),
    ('person_dates'), ('notes'), ('tags'), ('taggings'), ('entity_links'),
    ('mutation_events'), ('activity_events'), ('slipping_rules'),
    ('slipping_signals'), ('daily_priorities'), ('search_documents'),
    ('calendar_connections'), ('calendar_sources'), ('calendar_events'),
    ('notification_preferences'), ('device_installations'),
    ('notification_deliveries'), ('jobs'), ('exports')
), checks as (
  select
    table_name,
    1 as assertion_order,
    (select relrowsecurity from pg_class where oid = format('public.%I', table_name)::regclass) as passed,
    format('%s has row-level security enabled', table_name) as description
  from workspace_tables
  union all
  select
    table_name,
    2,
    exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = workspace_tables.table_name
        and policyname = 'workspace_members_can_select'
        and roles = array['authenticated']::name[]
    ),
    format('%s has a workspace-member read policy', table_name)
  from workspace_tables
  union all
  select
    table_name,
    3,
    has_table_privilege('authenticated', format('public.%I', table_name), 'select'),
    format('%s grants authenticated read access through RLS', table_name)
  from workspace_tables
  union all
  select
    table_name,
    4,
    not has_table_privilege('authenticated', format('public.%I', table_name), 'update'),
    format('%s keeps direct mutations server-mediated', table_name)
  from workspace_tables
)
select ok(passed, description)
from checks
order by table_name, assertion_order;

with identity_tables(table_name) as (
  values ('profiles'), ('workspaces'), ('workspace_members')
), checks as (
  select
    table_name,
    1 as assertion_order,
    (select relrowsecurity from pg_class where oid = format('public.%I', table_name)::regclass) as passed,
    format('%s has row-level security enabled', table_name) as description
  from identity_tables
  union all
  select
    table_name,
    2,
    has_table_privilege('authenticated', format('public.%I', table_name), 'select'),
    format('%s grants authenticated read access through RLS', table_name)
  from identity_tables
  union all
  select
    table_name,
    3,
    not has_table_privilege('authenticated', format('public.%I', table_name), 'update'),
    format('%s keeps direct mutations server-mediated', table_name)
  from identity_tables
)
select ok(passed, description)
from checks
order by table_name, assertion_order;

insert into storage.objects (bucket_id, name)
values
  ('capture-audio', current_setting('slipwell.test.foreign_workspace') || '/foreign.webm'),
  ('exports', current_setting('slipwell.test.foreign_workspace') || '/foreign.zip');

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select is(
  public.is_workspace_member(current_setting('slipwell.test.owner_workspace')::uuid),
  true,
  'the owner is a member of their workspace'
);
select is(
  public.is_workspace_member(current_setting('slipwell.test.foreign_workspace')::uuid),
  false,
  'the owner is not a member of the foreign workspace'
);

create function pg_temp.workspace_cross_tenant_checks()
returns table (passed boolean, description text)
language plpgsql
as $$
declare
  workspace_table text;
  visible_rows bigint;
  mutation_was_denied boolean;
begin
  foreach workspace_table in array array[
    'captures', 'capture_transcripts', 'capture_proposals', 'ai_runs',
    'domains', 'project_templates', 'projects', 'retainer_settings',
    'retainer_deliverable_templates', 'retainer_task_templates',
    'retainer_cycles', 'retainer_deliverables', 'tasks', 'people',
    'person_dates', 'notes', 'tags', 'taggings', 'entity_links',
    'mutation_events', 'activity_events', 'slipping_rules',
    'slipping_signals', 'daily_priorities', 'search_documents',
    'calendar_connections', 'calendar_sources', 'calendar_events',
    'notification_preferences', 'device_installations',
    'notification_deliveries', 'jobs', 'exports'
  ] loop
    execute format('select count(*) from public.%I where workspace_id = $1', workspace_table)
      into visible_rows
      using current_setting('slipwell.test.foreign_workspace')::uuid;
    passed := visible_rows = 0;
    description := format('%s hides foreign workspace rows', workspace_table);
    return next;

    mutation_was_denied := false;
    begin
      execute format('update public.%I set workspace_id = workspace_id where workspace_id = $1', workspace_table)
        using current_setting('slipwell.test.foreign_workspace')::uuid;
    exception when insufficient_privilege then
      mutation_was_denied := true;
    end;
    passed := mutation_was_denied;
    description := format('%s rejects a foreign direct mutation', workspace_table);
    return next;
  end loop;

  select count(*) into visible_rows from public.profiles
    where user_id = '10000000-0000-0000-0000-000000000010';
  passed := visible_rows = 0;
  description := 'profiles hide the foreign owner';
  return next;

  select count(*) into visible_rows from public.workspaces
    where id = current_setting('slipwell.test.foreign_workspace')::uuid;
  passed := visible_rows = 0;
  description := 'workspaces hide the foreign workspace';
  return next;

  select count(*) into visible_rows from public.workspace_members
    where user_id = '10000000-0000-0000-0000-000000000010';
  passed := visible_rows = 0;
  description := 'memberships hide the foreign owner';
  return next;

  foreach workspace_table in array array['profiles', 'workspaces', 'workspace_members'] loop
    mutation_was_denied := false;
    begin
      if workspace_table = 'profiles' then
        update public.profiles set locale = locale
        where user_id = '10000000-0000-0000-0000-000000000010';
      elsif workspace_table = 'workspaces' then
        update public.workspaces set locale = locale
        where id = current_setting('slipwell.test.foreign_workspace')::uuid;
      else
        update public.workspace_members set role = role
        where user_id = '10000000-0000-0000-0000-000000000010';
      end if;
    exception when insufficient_privilege then
      mutation_was_denied := true;
    end;
    passed := mutation_was_denied;
    description := format('%s rejects a foreign direct mutation', workspace_table);
    return next;
  end loop;
end;
$$;

set local role authenticated;
select ok(passed, description) from pg_temp.workspace_cross_tenant_checks();
reset role;

select ok(
  (select not public from storage.buckets where id = 'capture-audio'),
  'capture audio bucket is private'
);
select ok(
  (select not public from storage.buckets where id = 'exports'),
  'exports bucket is private'
);
with storage_policies(policy_name) as (
  values
    ('workspace_members_can_read_private_objects'),
    ('workspace_members_can_upload_private_objects'),
    ('workspace_members_can_update_private_objects'),
    ('workspace_members_can_delete_private_objects')
)
select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = storage_policies.policy_name
  ),
  format('%s protects private storage objects', policy_name)
)
from storage_policies;

create function pg_temp.storage_cross_tenant_checks()
returns table (passed boolean, description text)
language plpgsql
as $$
declare
  storage_bucket text;
  foreign_name text;
  visible_rows bigint;
  changed_rows bigint;
begin
  foreach storage_bucket in array array['capture-audio', 'exports'] loop
    foreign_name := current_setting('slipwell.test.foreign_workspace') ||
      case when storage_bucket = 'capture-audio' then '/foreign.webm' else '/foreign.zip' end;
    select count(*) into visible_rows from storage.objects
      where bucket_id = storage_bucket and name = foreign_name;
    passed := visible_rows = 0;
    description := format('%s hides a foreign storage object', storage_bucket);
    return next;

    update storage.objects set name = name
      where bucket_id = storage_bucket and name = foreign_name;
    get diagnostics changed_rows = row_count;
    passed := changed_rows = 0;
    description := format('%s rejects a foreign storage mutation', storage_bucket);
    return next;
  end loop;

  passed := not public.can_access_workspace_storage_object('not-a-workspace/object.webm');
  description := 'storage objects require a UUID workspace prefix';
  return next;
end;
$$;

set local role authenticated;
select ok(passed, description) from pg_temp.storage_cross_tenant_checks();
reset role;

select * from finish();
rollback;
