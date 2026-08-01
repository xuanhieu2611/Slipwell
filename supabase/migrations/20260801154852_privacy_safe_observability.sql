-- SLIP-013 adds opaque request and capture lineage without creating an
-- operational content-browsing surface. General telemetry remains in the
-- application; Postgres exposes only identifiers required to correlate the
-- durable capture pipeline.

alter table public.captures
  add column request_id uuid;

create unique index captures_workspace_request_id_key
  on public.captures (workspace_id, request_id)
  where request_id is not null;

alter table public.jobs
  add column trace_capture_id uuid,
  add constraint jobs_trace_capture_requires_workspace check (
    trace_capture_id is null or workspace_id is not null
  ),
  add constraint jobs_trace_capture_fk foreign key (workspace_id, trace_capture_id)
    references public.captures(workspace_id, id) on delete set null (trace_capture_id);

create index jobs_trace_capture_id_idx
  on public.jobs (workspace_id, trace_capture_id)
  where trace_capture_id is not null;

create function public.prevent_capture_request_id_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if new.request_id is distinct from old.request_id then
    raise exception 'capture request lineage is immutable' using errcode = '55000';
  end if;
  return new;
end;
$$;

create trigger captures_request_lineage_is_immutable
  before update of request_id on public.captures
  for each row execute function public.prevent_capture_request_id_mutation();

-- Keep the existing RPC signature so PostgREST has no overloaded function to
-- disambiguate. Capture jobs carry the opaque capture id in their private
-- payload; enqueue validates it and copies it to a dedicated diagnostic column
-- that operators may correlate without reading that payload.
create or replace function public.enqueue_job(
  p_workspace_id uuid,
  p_job_type text,
  p_deduplication_key text,
  p_payload_json jsonb default '{}'::jsonb,
  p_run_after timestamptz default now(),
  p_max_attempts integer default 5,
  p_timeout_seconds integer default 300,
  p_backoff_base_seconds integer default 15,
  p_payload_version integer default 1
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_job public.jobs%rowtype;
  v_inserted boolean := false;
  v_scoped_deduplication_key text;
  v_capture_id uuid;
begin
  if p_job_type is null or p_job_type !~ '^[a-z][a-z0-9_.-]{0,79}$' then
    raise exception 'invalid job type' using errcode = '22023';
  end if;
  if p_deduplication_key is null
    or length(trim(p_deduplication_key)) not between 1 and 160 then
    raise exception 'invalid job deduplication key' using errcode = '22023';
  end if;
  if p_payload_json is null or jsonb_typeof(p_payload_json) <> 'object' then
    raise exception 'job payload must be an object' using errcode = '22023';
  end if;
  if p_run_after is null or p_max_attempts not between 1 and 25
    or p_timeout_seconds not between 1 and 600
    or p_backoff_base_seconds not between 1 and 3600
    or p_payload_version <= 0 then
    raise exception 'invalid job execution policy' using errcode = '22023';
  end if;
  if p_workspace_id is not null
    and not exists (select 1 from public.workspaces where id = p_workspace_id) then
    raise exception 'job workspace does not exist' using errcode = '23503';
  end if;

  if p_payload_json ? 'capture_id' then
    if jsonb_typeof(p_payload_json -> 'capture_id') <> 'string'
      or (p_payload_json ->> 'capture_id') !~
        '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$' then
      raise exception 'invalid capture trace id' using errcode = '22023';
    end if;
    v_capture_id := (p_payload_json ->> 'capture_id')::uuid;
    if p_workspace_id is null or not exists (
      select 1 from public.captures
      where workspace_id = p_workspace_id and id = v_capture_id
    ) then
      raise exception 'capture trace does not belong to the job workspace'
        using errcode = '23503';
    end if;
  end if;

  v_scoped_deduplication_key := coalesce(p_workspace_id::text, 'global')
    || ':' || trim(p_deduplication_key);

  insert into public.jobs (
    workspace_id, job_type, deduplication_key, payload_json, payload_version,
    run_after, max_attempts, timeout_seconds, backoff_base_seconds,
    trace_capture_id
  ) values (
    p_workspace_id, p_job_type, v_scoped_deduplication_key, p_payload_json,
    p_payload_version, p_run_after, p_max_attempts, p_timeout_seconds,
    p_backoff_base_seconds, v_capture_id
  )
  on conflict (job_type, deduplication_key) do nothing
  returning * into v_job;

  if found then
    v_inserted := true;
  else
    select * into strict v_job from public.jobs
      where job_type = p_job_type
        and deduplication_key = v_scoped_deduplication_key;
    if v_job.trace_capture_id is distinct from v_capture_id then
      raise exception 'job deduplication key has different capture lineage'
        using errcode = '22023';
    end if;
  end if;

  return jsonb_build_object(
    'job_id', v_job.id,
    'status', v_job.status,
    'idempotent_replay', not v_inserted
  );
end;
$$;

create function public.capture_trace_lineage(
  p_workspace_id uuid,
  p_capture_id uuid
)
returns table (
  request_id uuid,
  capture_id uuid,
  job_ids uuid[],
  ai_run_ids uuid[],
  proposal_ids uuid[],
  mutation_ids uuid[]
)
language sql
stable
security invoker
set search_path = pg_catalog
as $$
  select
    capture.request_id,
    capture.id,
    coalesce((
      select array_agg(job.id order by job.created_at, job.id)
      from public.jobs job
      where job.workspace_id = capture.workspace_id
        and job.trace_capture_id = capture.id
    ), array[]::uuid[]),
    coalesce((
      select array_agg(ai_run.id order by ai_run.created_at, ai_run.id)
      from public.ai_runs ai_run
      where ai_run.workspace_id = capture.workspace_id
        and ai_run.capture_id = capture.id
    ), array[]::uuid[]),
    coalesce((
      select array_agg(proposal.id order by proposal.created_at, proposal.id)
      from public.capture_proposals proposal
      where proposal.workspace_id = capture.workspace_id
        and proposal.capture_id = capture.id
    ), array[]::uuid[]),
    coalesce((
      select array_agg(candidate.mutation_id order by candidate.mutation_id)
      from (
        select proposal.accepted_mutation_id as mutation_id
        from public.capture_proposals proposal
        where proposal.workspace_id = capture.workspace_id
          and proposal.capture_id = capture.id
          and proposal.accepted_mutation_id is not null
        union
        select activity.mutation_id
        from public.activity_events activity
        where activity.workspace_id = capture.workspace_id
          and activity.source_capture_id = capture.id
          and activity.mutation_id is not null
      ) candidate
    ), array[]::uuid[])
  from public.captures capture
  where capture.workspace_id = p_workspace_id
    and capture.id = p_capture_id;
$$;

revoke all on function public.prevent_capture_request_id_mutation() from public;
revoke all on function public.capture_trace_lineage(uuid, uuid) from public;
revoke all on function public.capture_trace_lineage(uuid, uuid) from anon, authenticated;
grant execute on function public.capture_trace_lineage(uuid, uuid) to service_role;
