-- SLIP-011 creates the only persistence primitive for beta-domain changes.
-- The caller records the domain write, provenance, activity, and projection
-- work in one Postgres transaction. Workers consume outbox_events in SLIP-012;
-- they must never enqueue a visible effect before this transaction commits.

create table public.outbox_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  topic text not null check (topic in ('entity.changed')),
  payload_json jsonb not null,
  deduplication_key text not null check (length(trim(deduplication_key)) > 0),
  available_at timestamptz not null default now(),
  published_at timestamptz,
  locked_at timestamptz,
  attempts integer not null default 0 check (attempts >= 0),
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (deduplication_key)
);

create index outbox_events_ready_idx
  on public.outbox_events (available_at, created_at)
  where published_at is null;

alter table public.outbox_events enable row level security;
revoke all on table public.outbox_events from anon, authenticated;

create trigger outbox_events_set_updated_at before update on public.outbox_events
  for each row execute function public.set_updated_at();

alter table public.mutation_events
  add column idempotency_key text;

create unique index mutation_events_workspace_idempotency_key
  on public.mutation_events (workspace_id, idempotency_key)
  where idempotency_key is not null;

-- Activity is evidence, not a mutable projection. `updated_at` remains for
-- schema consistency but no activity row may be changed after insertion.
create function public.prevent_activity_event_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  raise exception 'activity events are append-only' using errcode = '55000';
end;
$$;

create trigger activity_events_are_append_only
  before update or delete on public.activity_events
  for each row execute function public.prevent_activity_event_mutation();

-- General activity feeds deliberately receive a small, content-free metadata
-- shape. Full before/after values live only in the restricted mutation event.
create function public.validate_activity_metadata(candidate jsonb)
returns jsonb
language plpgsql
immutable
set search_path = pg_catalog
as $$
declare
  candidate_key text;
begin
  if candidate is null then
    return '{}'::jsonb;
  end if;

  if jsonb_typeof(candidate) <> 'object' then
    raise exception 'activity metadata must be an object' using errcode = '22023';
  end if;

  for candidate_key in select jsonb_object_keys(candidate)
  loop
    if candidate_key <> 'event_version' then
      raise exception 'activity metadata key % is not allowed', candidate_key
        using errcode = '22023';
    end if;
  end loop;

  if candidate ? 'event_version'
    and jsonb_typeof(candidate -> 'event_version') <> 'number' then
    raise exception 'activity event_version must be a number' using errcode = '22023';
  end if;

  return candidate;
end;
$$;

create function public.beta_mutation_field_names(candidate_entity_type text)
returns text[]
language sql
immutable
set search_path = pg_catalog
as $$
  select case candidate_entity_type
    when 'domain' then array['name', 'color', 'position']
    when 'task' then array[
      'title', 'description', 'status', 'priority', 'domain_id', 'project_id',
      'start_on', 'due_at', 'due_on', 'due_timezone', 'reminder_at',
      'recurrence_rule', 'recurrence_series_id', 'source_capture_id'
    ]
    when 'project' then array[
      'kind', 'name', 'description', 'status', 'domain_id', 'start_on',
      'target_on', 'attention_cadence_days', 'next_review_on', 'template_id',
      'template_version'
    ]
    when 'person' then array[
      'display_name', 'organization', 'role', 'pronouns', 'email', 'phone',
      'private_facts', 'last_interaction_at', 'next_follow_up_on', 'source_capture_id'
    ]
    when 'note' then array[
      'title', 'body', 'note_type', 'sensitivity', 'domain_id', 'event_at',
      'source_capture_id'
    ]
    else null
  end;
$$;

create function public.assert_beta_mutation_fields(
  candidate_entity_type text,
  candidate_fields jsonb
)
returns void
language plpgsql
immutable
set search_path = pg_catalog
as $$
declare
  allowed_fields text[] := public.beta_mutation_field_names(candidate_entity_type);
  candidate_key text;
begin
  if allowed_fields is null then
    raise exception 'unsupported beta entity type %', candidate_entity_type
      using errcode = '22023';
  end if;

  if jsonb_typeof(candidate_fields) <> 'object' then
    raise exception 'mutation fields must be an object' using errcode = '22023';
  end if;

  for candidate_key in select jsonb_object_keys(candidate_fields)
  loop
    if not candidate_key = any (allowed_fields) then
      raise exception 'mutation field % is not allowed for %', candidate_key, candidate_entity_type
        using errcode = '22023';
    end if;
  end loop;
end;
$$;

create function public.beta_mutation_fields_from_record(
  candidate_entity_type text,
  candidate_record jsonb
)
returns jsonb
language sql
immutable
set search_path = pg_catalog
as $$
  select coalesce(
    jsonb_object_agg(key, value) filter (
      where key = any (public.beta_mutation_field_names(candidate_entity_type))
    ),
    '{}'::jsonb
  )
  from jsonb_each(candidate_record);
$$;

-- This internal helper is intentionally not executable by API roles. It is
-- called by the two bounded public RPCs below and supports the first mutable
-- beta records. Later domain services extend the list rather than bypassing it.
create function public.apply_beta_record_change(
  p_workspace_id uuid,
  p_entity_type text,
  p_entity_id uuid,
  p_operation text,
  p_fields jsonb,
  p_expected_version integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_before jsonb;
  v_after jsonb;
  v_domain public.domains%rowtype;
  v_task public.tasks%rowtype;
  v_project public.projects%rowtype;
  v_person public.people%rowtype;
  v_note public.notes%rowtype;
begin
  if p_operation not in ('create', 'update') then
    raise exception 'unsupported mutation operation %', p_operation using errcode = '22023';
  end if;

  perform public.assert_beta_mutation_fields(p_entity_type, p_fields);

  if p_operation = 'create' and p_expected_version is not null then
    raise exception 'created records cannot declare an expected version' using errcode = '22023';
  end if;

  if p_operation = 'update' and p_expected_version is null then
    raise exception 'updated records require an expected version' using errcode = '22023';
  end if;

  case p_entity_type
    when 'domain' then
      if p_operation = 'create' then
        if not (p_fields ? 'name') then
          raise exception 'domains require a name' using errcode = '22023';
        end if;
        insert into public.domains (id, workspace_id, name, color, position)
        values (
          p_entity_id, p_workspace_id, p_fields ->> 'name', p_fields ->> 'color',
          coalesce((p_fields ->> 'position')::integer, 0)
        ) returning to_jsonb(domains.*) into v_after;
      else
        select * into strict v_domain from public.domains
          where workspace_id = p_workspace_id and id = p_entity_id and deleted_at is null for update;
        if v_domain.version <> p_expected_version then
          raise exception 'domain version conflict' using errcode = '40001';
        end if;
        v_before := to_jsonb(v_domain);
        select * into v_domain from jsonb_populate_record(v_domain, p_fields);
        update public.domains set name = v_domain.name, color = v_domain.color,
          position = v_domain.position, version = version + 1
          where workspace_id = p_workspace_id and id = p_entity_id
          returning to_jsonb(domains.*) into v_after;
      end if;
    when 'task' then
      if p_operation = 'create' then
        if not (p_fields ? 'title') then
          raise exception 'tasks require a title' using errcode = '22023';
        end if;
        insert into public.tasks (
          id, workspace_id, title, description, status, priority, domain_id, project_id,
          start_on, due_at, due_on, due_timezone, reminder_at, recurrence_rule,
          recurrence_series_id, source_capture_id
        ) values (
          p_entity_id, p_workspace_id, p_fields ->> 'title', p_fields ->> 'description',
          coalesce(p_fields ->> 'status', 'inbox'), coalesce(p_fields ->> 'priority', 'normal'),
          (p_fields ->> 'domain_id')::uuid, (p_fields ->> 'project_id')::uuid,
          (p_fields ->> 'start_on')::date, (p_fields ->> 'due_at')::timestamptz,
          (p_fields ->> 'due_on')::date, p_fields ->> 'due_timezone',
          (p_fields ->> 'reminder_at')::timestamptz, p_fields ->> 'recurrence_rule',
          (p_fields ->> 'recurrence_series_id')::uuid, (p_fields ->> 'source_capture_id')::uuid
        ) returning to_jsonb(tasks.*) into v_after;
      else
        select * into strict v_task from public.tasks
          where workspace_id = p_workspace_id and id = p_entity_id and deleted_at is null for update;
        if v_task.version <> p_expected_version then
          raise exception 'task version conflict' using errcode = '40001';
        end if;
        v_before := to_jsonb(v_task);
        select * into v_task from jsonb_populate_record(v_task, p_fields);
        update public.tasks set
          title = v_task.title, description = v_task.description, status = v_task.status,
          priority = v_task.priority, domain_id = v_task.domain_id, project_id = v_task.project_id,
          start_on = v_task.start_on, due_at = v_task.due_at, due_on = v_task.due_on,
          due_timezone = v_task.due_timezone, reminder_at = v_task.reminder_at,
          recurrence_rule = v_task.recurrence_rule, recurrence_series_id = v_task.recurrence_series_id,
          source_capture_id = v_task.source_capture_id, version = version + 1
          where workspace_id = p_workspace_id and id = p_entity_id
          returning to_jsonb(tasks.*) into v_after;
      end if;
    when 'project' then
      if p_operation = 'create' then
        if not (p_fields ? 'kind' and p_fields ? 'name') then
          raise exception 'projects require a kind and name' using errcode = '22023';
        end if;
        insert into public.projects (
          id, workspace_id, kind, name, description, status, domain_id, start_on,
          target_on, attention_cadence_days, next_review_on, template_id, template_version
        ) values (
          p_entity_id, p_workspace_id, p_fields ->> 'kind', p_fields ->> 'name',
          p_fields ->> 'description', coalesce(p_fields ->> 'status', 'planning'),
          (p_fields ->> 'domain_id')::uuid, (p_fields ->> 'start_on')::date,
          (p_fields ->> 'target_on')::date, (p_fields ->> 'attention_cadence_days')::integer,
          (p_fields ->> 'next_review_on')::date, (p_fields ->> 'template_id')::uuid,
          (p_fields ->> 'template_version')::integer
        ) returning to_jsonb(projects.*) into v_after;
      else
        select * into strict v_project from public.projects
          where workspace_id = p_workspace_id and id = p_entity_id and deleted_at is null for update;
        if v_project.version <> p_expected_version then
          raise exception 'project version conflict' using errcode = '40001';
        end if;
        v_before := to_jsonb(v_project);
        select * into v_project from jsonb_populate_record(v_project, p_fields);
        update public.projects set
          kind = v_project.kind, name = v_project.name, description = v_project.description,
          status = v_project.status, domain_id = v_project.domain_id, start_on = v_project.start_on,
          target_on = v_project.target_on, attention_cadence_days = v_project.attention_cadence_days,
          next_review_on = v_project.next_review_on, template_id = v_project.template_id,
          template_version = v_project.template_version, version = version + 1
          where workspace_id = p_workspace_id and id = p_entity_id
          returning to_jsonb(projects.*) into v_after;
      end if;
    when 'person' then
      if p_operation = 'create' then
        if not (p_fields ? 'display_name') then
          raise exception 'people require a display name' using errcode = '22023';
        end if;
        insert into public.people (
          id, workspace_id, display_name, organization, role, pronouns, email, phone,
          private_facts, last_interaction_at, next_follow_up_on, source_capture_id
        ) values (
          p_entity_id, p_workspace_id, p_fields ->> 'display_name', p_fields ->> 'organization',
          p_fields ->> 'role', p_fields ->> 'pronouns', p_fields ->> 'email', p_fields ->> 'phone',
          p_fields ->> 'private_facts', (p_fields ->> 'last_interaction_at')::timestamptz,
          (p_fields ->> 'next_follow_up_on')::date, (p_fields ->> 'source_capture_id')::uuid
        ) returning to_jsonb(people.*) into v_after;
      else
        select * into strict v_person from public.people
          where workspace_id = p_workspace_id and id = p_entity_id and deleted_at is null for update;
        if v_person.version <> p_expected_version then
          raise exception 'person version conflict' using errcode = '40001';
        end if;
        v_before := to_jsonb(v_person);
        select * into v_person from jsonb_populate_record(v_person, p_fields);
        update public.people set
          display_name = v_person.display_name, organization = v_person.organization,
          role = v_person.role, pronouns = v_person.pronouns, email = v_person.email,
          phone = v_person.phone, private_facts = v_person.private_facts,
          last_interaction_at = v_person.last_interaction_at,
          next_follow_up_on = v_person.next_follow_up_on,
          source_capture_id = v_person.source_capture_id, version = version + 1
          where workspace_id = p_workspace_id and id = p_entity_id
          returning to_jsonb(people.*) into v_after;
      end if;
    when 'note' then
      if p_operation = 'create' then
        if not (p_fields ? 'title') then
          raise exception 'notes require a title' using errcode = '22023';
        end if;
        insert into public.notes (
          id, workspace_id, title, body, note_type, sensitivity, domain_id, event_at, source_capture_id
        ) values (
          p_entity_id, p_workspace_id, p_fields ->> 'title', coalesce(p_fields ->> 'body', ''),
          coalesce(p_fields ->> 'note_type', 'general'), coalesce(p_fields ->> 'sensitivity', 'standard'),
          (p_fields ->> 'domain_id')::uuid, (p_fields ->> 'event_at')::timestamptz,
          (p_fields ->> 'source_capture_id')::uuid
        ) returning to_jsonb(notes.*) into v_after;
      else
        select * into strict v_note from public.notes
          where workspace_id = p_workspace_id and id = p_entity_id and deleted_at is null for update;
        if v_note.version <> p_expected_version then
          raise exception 'note version conflict' using errcode = '40001';
        end if;
        v_before := to_jsonb(v_note);
        select * into v_note from jsonb_populate_record(v_note, p_fields);
        update public.notes set
          title = v_note.title, body = v_note.body, note_type = v_note.note_type,
          sensitivity = v_note.sensitivity, domain_id = v_note.domain_id,
          event_at = v_note.event_at, source_capture_id = v_note.source_capture_id,
          version = version + 1
          where workspace_id = p_workspace_id and id = p_entity_id
          returning to_jsonb(notes.*) into v_after;
      end if;
  end case;

  return jsonb_build_object('before', v_before, 'after', v_after);
end;
$$;

create function public.soft_delete_beta_record(
  p_workspace_id uuid,
  p_entity_type text,
  p_entity_id uuid,
  p_expected_version integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_after jsonb;
begin
  if p_entity_type not in ('domain', 'task', 'project', 'person', 'note') then
    raise exception 'unsupported beta entity type %', p_entity_type using errcode = '22023';
  end if;

  execute format(
    'update public.%I set deleted_at = now(), version = version + 1
     where workspace_id = $1 and id = $2 and deleted_at is null and version = $3
     returning to_jsonb(%I.*)',
    case p_entity_type
      when 'domain' then 'domains'
      when 'task' then 'tasks'
      when 'project' then 'projects'
      when 'person' then 'people'
      when 'note' then 'notes'
    end,
    case p_entity_type
      when 'domain' then 'domains'
      when 'task' then 'tasks'
      when 'project' then 'projects'
      when 'person' then 'people'
      when 'note' then 'notes'
    end
  ) into v_after using p_workspace_id, p_entity_id, p_expected_version;

  if v_after is null then
    raise exception '% record changed before it could be undone', p_entity_type
      using errcode = '40001';
  end if;

  return v_after;
end;
$$;

create function public.assert_mutation_actor(
  p_workspace_id uuid,
  p_actor_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if p_reason not in ('user', 'capture_accept', 'sync', 'system_job') then
    raise exception 'invalid mutation reason' using errcode = '22023';
  end if;

  if p_actor_id is null then
    if p_reason not in ('sync', 'system_job') then
      raise exception 'an actor is required for this mutation reason' using errcode = '42501';
    end if;
    return;
  end if;

  if not exists (
    select 1 from public.workspace_members
    where workspace_id = p_workspace_id and user_id = p_actor_id
  ) then
    raise exception 'actor is not authorized for this workspace' using errcode = '42501';
  end if;
end;
$$;

create function public.apply_domain_mutation(
  p_workspace_id uuid,
  p_actor_id uuid,
  p_reason text,
  p_entity_type text,
  p_entity_id uuid,
  p_operation text,
  p_fields jsonb,
  p_expected_version integer,
  p_idempotency_key text,
  p_event_type text,
  p_qualifies_as_attention boolean default false,
  p_source_capture_id uuid default null,
  p_activity_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_existing public.mutation_events%rowtype;
  v_mutation_id uuid := gen_random_uuid();
  v_entity_id uuid := coalesce(p_entity_id, gen_random_uuid());
  v_change jsonb;
  v_before jsonb;
  v_after jsonb;
  v_forward jsonb;
  v_inverse jsonb;
  v_metadata jsonb;
begin
  if p_workspace_id is null or nullif(trim(p_idempotency_key), '') is null then
    raise exception 'workspace and idempotency key are required' using errcode = '22023';
  end if;

  perform public.assert_mutation_actor(p_workspace_id, p_actor_id, p_reason);
  perform public.assert_beta_mutation_fields(p_entity_type, p_fields);
  v_metadata := public.validate_activity_metadata(p_activity_metadata);

  select * into v_existing from public.mutation_events
    where workspace_id = p_workspace_id and idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object(
      'mutation_id', v_existing.id,
      'entity_id', (v_existing.forward_patch ->> 'entity_id')::uuid,
      'entity_type', v_existing.forward_patch ->> 'entity_type',
      'idempotent_replay', true
    );
  end if;

  -- Inserting the idempotency reservation before the domain write serializes
  -- concurrent retries. Any later error rolls it back with the entire command.
  insert into public.mutation_events (
    id, workspace_id, actor_id, reason, idempotency_key, forward_patch, inverse_patch
  ) values (
    v_mutation_id, p_workspace_id, p_actor_id, p_reason, p_idempotency_key,
    '{}'::jsonb, '{}'::jsonb
  ) on conflict (workspace_id, idempotency_key) where idempotency_key is not null do nothing;

  if not found then
    select * into strict v_existing from public.mutation_events
      where workspace_id = p_workspace_id and idempotency_key = p_idempotency_key;
    return jsonb_build_object(
      'mutation_id', v_existing.id,
      'entity_id', (v_existing.forward_patch ->> 'entity_id')::uuid,
      'entity_type', v_existing.forward_patch ->> 'entity_type',
      'idempotent_replay', true
    );
  end if;

  v_change := public.apply_beta_record_change(
    p_workspace_id, p_entity_type, v_entity_id, p_operation, p_fields, p_expected_version
  );
  v_before := v_change -> 'before';
  v_after := v_change -> 'after';
  v_forward := jsonb_build_object(
    'entity_type', p_entity_type,
    'entity_id', v_entity_id,
    'operation', p_operation,
    'fields', public.beta_mutation_fields_from_record(p_entity_type, v_after),
    'version', v_after -> 'version'
  );
  v_inverse := case p_operation
    when 'create' then jsonb_build_object(
      'entity_type', p_entity_type,
      'entity_id', v_entity_id,
      'operation', 'soft_delete',
      'expected_version', v_after -> 'version'
    )
    else jsonb_build_object(
      'entity_type', p_entity_type,
      'entity_id', v_entity_id,
      'operation', 'update',
      'fields', public.beta_mutation_fields_from_record(p_entity_type, v_before),
      'expected_version', v_after -> 'version'
    )
  end;

  update public.mutation_events
  set forward_patch = v_forward,
      inverse_patch = v_inverse
  where id = v_mutation_id;

  insert into public.activity_events (
    workspace_id, actor_type, actor_id, entity_type, entity_id, event_type,
    qualifies_as_attention, source_capture_id, mutation_id, metadata_json
  ) values (
    p_workspace_id,
    case when p_actor_id is null then 'system' else 'user' end,
    p_actor_id, p_entity_type, v_entity_id, p_event_type, p_qualifies_as_attention,
    p_source_capture_id, v_mutation_id,
    v_metadata || jsonb_build_object(
      'operation', p_operation,
      'changed_fields', to_jsonb(array(select jsonb_object_keys(p_fields))),
      'event_version', 1
    )
  );

  insert into public.outbox_events (workspace_id, topic, payload_json, deduplication_key)
  values (
    p_workspace_id,
    'entity.changed',
    jsonb_build_object(
      'entity_type', p_entity_type,
      'entity_id', v_entity_id,
      'mutation_id', v_mutation_id,
      'operation', p_operation,
      'version', v_after -> 'version'
    ),
    format('mutation:%s:entity.changed', v_mutation_id)
  );

  return jsonb_build_object(
    'mutation_id', v_mutation_id,
    'entity_id', v_entity_id,
    'entity_type', p_entity_type,
    'idempotent_replay', false
  );
end;
$$;

create function public.undo_domain_mutation(
  p_workspace_id uuid,
  p_actor_id uuid,
  p_mutation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_mutation public.mutation_events%rowtype;
  v_inverse jsonb;
  v_after jsonb;
  v_entity_type text;
  v_entity_id uuid;
begin
  perform public.assert_mutation_actor(p_workspace_id, p_actor_id, 'user');

  select * into strict v_mutation from public.mutation_events
    where id = p_mutation_id and workspace_id = p_workspace_id for update;

  if v_mutation.undone_at is not null then
    return jsonb_build_object(
      'mutation_id', p_mutation_id,
      'undone', true,
      'idempotent_replay', true
    );
  end if;

  v_inverse := v_mutation.inverse_patch;
  v_entity_type := v_inverse ->> 'entity_type';
  v_entity_id := (v_inverse ->> 'entity_id')::uuid;

  if v_inverse ->> 'operation' = 'soft_delete' then
    v_after := public.soft_delete_beta_record(
      p_workspace_id, v_entity_type, v_entity_id, (v_inverse ->> 'expected_version')::integer
    );
  elsif v_inverse ->> 'operation' = 'update' then
    v_after := (public.apply_beta_record_change(
      p_workspace_id,
      v_entity_type,
      v_entity_id,
      'update',
      v_inverse -> 'fields',
      (v_inverse ->> 'expected_version')::integer
    ) -> 'after');
  else
    raise exception 'mutation has no supported inverse' using errcode = '55000';
  end if;

  update public.mutation_events set undone_at = now() where id = p_mutation_id;

  insert into public.activity_events (
    workspace_id, actor_type, actor_id, entity_type, entity_id, event_type,
    mutation_id, metadata_json
  ) values (
    p_workspace_id, 'user', p_actor_id, v_entity_type, v_entity_id,
    v_entity_type || '.undone', p_mutation_id,
    jsonb_build_object(
      'operation', 'undo',
      'changed_fields', to_jsonb(public.beta_mutation_field_names(v_entity_type)),
      'event_version', 1
    )
  );

  insert into public.outbox_events (workspace_id, topic, payload_json, deduplication_key)
  values (
    p_workspace_id,
    'entity.changed',
    jsonb_build_object(
      'entity_type', v_entity_type,
      'entity_id', v_entity_id,
      'mutation_id', p_mutation_id,
      'operation', 'undo',
      'version', v_after -> 'version'
    ),
    format('undo:%s:entity.changed', p_mutation_id)
  );

  return jsonb_build_object(
    'mutation_id', p_mutation_id,
    'undone', true,
    'idempotent_replay', false
  );
end;
$$;

revoke all on function public.apply_beta_record_change(uuid, text, uuid, text, jsonb, integer) from public;
revoke all on function public.soft_delete_beta_record(uuid, text, uuid, integer) from public;
revoke all on function public.assert_mutation_actor(uuid, uuid, text) from public;
revoke all on function public.apply_domain_mutation(uuid, uuid, text, text, uuid, text, jsonb, integer, text, text, boolean, uuid, jsonb) from public;
revoke all on function public.undo_domain_mutation(uuid, uuid, uuid) from public;
grant execute on function public.apply_domain_mutation(uuid, uuid, text, text, uuid, text, jsonb, integer, text, text, boolean, uuid, jsonb) to service_role;
grant execute on function public.undo_domain_mutation(uuid, uuid, uuid) to service_role;
