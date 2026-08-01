-- SLIP-010 tenant isolation. Clients may read only rows in a workspace of
-- which they are a member. All domain writes remain server-mediated so later
-- command services can apply their authorization and invariant checks first.

create function public.is_workspace_member(candidate_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.workspace_members
      where workspace_id = candidate_workspace_id
        and user_id = (select auth.uid())
    );
$$;

revoke all on function public.is_workspace_member(uuid) from public;
grant execute on function public.is_workspace_member(uuid) to authenticated;

do $$
declare
  workspace_table text;
begin
  foreach workspace_table in array array[
    'captures',
    'capture_transcripts',
    'capture_proposals',
    'ai_runs',
    'domains',
    'project_templates',
    'projects',
    'retainer_settings',
    'retainer_deliverable_templates',
    'retainer_task_templates',
    'retainer_cycles',
    'retainer_deliverables',
    'tasks',
    'people',
    'person_dates',
    'notes',
    'tags',
    'taggings',
    'entity_links',
    'mutation_events',
    'activity_events',
    'slipping_rules',
    'slipping_signals',
    'daily_priorities',
    'search_documents',
    'calendar_connections',
    'calendar_sources',
    'calendar_events',
    'notification_preferences',
    'device_installations',
    'notification_deliveries',
    'jobs',
    'exports'
  ] loop
    execute format(
      'create policy workspace_members_can_select on public.%I for select to authenticated using ((select public.is_workspace_member(workspace_id)))',
      workspace_table
    );
    execute format('grant select on public.%I to authenticated', workspace_table);
  end loop;
end;
$$;

-- Identity policies remain intentionally narrow: each user sees only their
-- profile and one owner membership. Explicit SELECT grants make the existing
-- RLS policies effective while writes stay behind bounded RPCs.
grant select on public.profiles, public.workspaces, public.workspace_members
  to authenticated;

create function public.can_access_workspace_storage_object(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  workspace_path_segment text;
begin
  workspace_path_segment := (storage.foldername(object_name))[1];

  if workspace_path_segment is null then
    return false;
  end if;

  return public.is_workspace_member(workspace_path_segment::uuid);
exception
  when invalid_text_representation then
    return false;
end;
$$;

revoke all on function public.can_access_workspace_storage_object(text) from public;
grant execute on function public.can_access_workspace_storage_object(text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'capture-audio',
    'capture-audio',
    false,
    52428800,
    array['audio/aac', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/webm']
  ),
  (
    'exports',
    'exports',
    false,
    104857600,
    array['application/json', 'application/zip', 'text/csv']
  )
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

grant select, insert, update, delete on storage.objects to authenticated;

create policy workspace_members_can_read_private_objects
on storage.objects
for select
to authenticated
using (
  bucket_id in ('capture-audio', 'exports')
  and (select public.can_access_workspace_storage_object(name))
);

create policy workspace_members_can_upload_private_objects
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('capture-audio', 'exports')
  and (select public.can_access_workspace_storage_object(name))
);

create policy workspace_members_can_update_private_objects
on storage.objects
for update
to authenticated
using (
  bucket_id in ('capture-audio', 'exports')
  and (select public.can_access_workspace_storage_object(name))
)
with check (
  bucket_id in ('capture-audio', 'exports')
  and (select public.can_access_workspace_storage_object(name))
);

create policy workspace_members_can_delete_private_objects
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('capture-audio', 'exports')
  and (select public.can_access_workspace_storage_object(name))
);
