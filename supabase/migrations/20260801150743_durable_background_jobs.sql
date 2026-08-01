-- SLIP-012 turns the jobs relation introduced in SLIP-009 into a durable,
-- leased queue. Payloads remain an internal implementation detail: operators
-- inspect opaque job ids, bounded error codes, and aggregate metrics instead
-- of user content.

alter table public.jobs
  add column payload_version integer not null default 1,
  add column timeout_seconds integer not null default 300,
  add column backoff_base_seconds integer not null default 15,
  add column locked_by text,
  add column lock_token uuid,
  add column started_at timestamptz,
  add column finished_at timestamptz,
  add column replay_count integer not null default 0;

alter table public.jobs
  add constraint jobs_payload_is_object check (jsonb_typeof(payload_json) = 'object'),
  add constraint jobs_payload_version_positive check (payload_version > 0),
  add constraint jobs_timeout_bounded check (timeout_seconds between 1 and 600),
  add constraint jobs_backoff_bounded check (backoff_base_seconds between 1 and 3600),
  add constraint jobs_max_attempts_bounded check (max_attempts between 1 and 25),
  add constraint jobs_replay_count_nonnegative check (replay_count >= 0),
  add constraint jobs_job_type_bounded check (
    job_type ~ '^[a-z][a-z0-9_.-]{0,79}$'
  ),
  add constraint jobs_deduplication_key_bounded check (
    length(trim(deduplication_key)) between 1 and 200
  ),
  add constraint jobs_running_lease_present check (
    status <> 'running'
    or (locked_at is not null and locked_by is not null and lock_token is not null)
  );

create index jobs_expired_lease_idx
  on public.jobs (locked_at)
  where status = 'running';

-- Job payloads may reference private records, so the queue must not be a
-- client-readable status table. User-facing processing state belongs on the
-- relevant domain record.
drop policy if exists workspace_members_can_select on public.jobs;
revoke all on table public.jobs from anon, authenticated;

create table public.job_schedules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  job_type text not null check (job_type ~ '^[a-z][a-z0-9_.-]{0,79}$'),
  schedule_key text not null check (length(trim(schedule_key)) between 1 and 160),
  payload_json jsonb not null default '{}'::jsonb
    check (jsonb_typeof(payload_json) = 'object'),
  payload_version integer not null default 1 check (payload_version > 0),
  interval_seconds integer not null check (interval_seconds between 60 and 31536000),
  max_attempts integer not null default 5 check (max_attempts between 1 and 25),
  timeout_seconds integer not null default 300 check (timeout_seconds between 1 and 600),
  backoff_base_seconds integer not null default 15
    check (backoff_base_seconds between 1 and 3600),
  next_run_at timestamptz not null,
  last_materialized_at timestamptz,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (workspace_id, job_type, schedule_key)
);

create index job_schedules_due_idx
  on public.job_schedules (next_run_at)
  where enabled;

alter table public.job_schedules enable row level security;
revoke all on table public.job_schedules from anon, authenticated;

create trigger job_schedules_set_updated_at before update on public.job_schedules
  for each row execute function public.set_updated_at();

create table public.job_failure_events (
  id bigint generated always as identity primary key,
  job_id uuid not null references public.jobs(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  job_type text not null,
  attempt integer not null check (attempt > 0),
  outcome text not null check (outcome in ('retry_scheduled', 'dead_letter')),
  error_code text not null check (error_code ~ '^[a-z][a-z0-9_.-]{0,63}$'),
  occurred_at timestamptz not null default now()
);

create index job_failure_events_type_occurred_idx
  on public.job_failure_events (job_type, occurred_at desc);

alter table public.job_failure_events enable row level security;
revoke all on table public.job_failure_events from anon, authenticated;

create table public.job_dead_letters (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references public.jobs(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  job_type text not null,
  error_code text not null check (error_code ~ '^[a-z][a-z0-9_.-]{0,63}$'),
  attempts integer not null check (attempts > 0),
  first_enqueued_at timestamptz not null,
  last_failed_at timestamptz not null,
  replay_count integer not null default 0 check (replay_count >= 0),
  last_replayed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index job_dead_letters_failed_at_idx
  on public.job_dead_letters (last_failed_at desc);

alter table public.job_dead_letters enable row level security;
revoke all on table public.job_dead_letters from anon, authenticated;

create trigger job_dead_letters_set_updated_at before update on public.job_dead_letters
  for each row execute function public.set_updated_at();

create function public.prevent_job_failure_event_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  raise exception 'job failure events are append-only' using errcode = '55000';
end;
$$;

create trigger job_failure_events_are_append_only
  before update or delete on public.job_failure_events
  for each row execute function public.prevent_job_failure_event_mutation();

create function public.enqueue_job(
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

  -- The SLIP-009 uniqueness constraint is global. Namespace caller keys with
  -- the opaque workspace id so the same domain key is safe in every tenant.
  v_scoped_deduplication_key := coalesce(p_workspace_id::text, 'global')
    || ':' || trim(p_deduplication_key);

  insert into public.jobs (
    workspace_id, job_type, deduplication_key, payload_json, payload_version,
    run_after, max_attempts, timeout_seconds, backoff_base_seconds
  ) values (
    p_workspace_id, p_job_type, v_scoped_deduplication_key, p_payload_json,
    p_payload_version, p_run_after, p_max_attempts, p_timeout_seconds,
    p_backoff_base_seconds
  )
  on conflict (job_type, deduplication_key) do nothing
  returning * into v_job;

  if found then
    v_inserted := true;
  else
    select * into strict v_job from public.jobs
      where job_type = p_job_type
        and deduplication_key = v_scoped_deduplication_key;
  end if;

  return jsonb_build_object(
    'job_id', v_job.id,
    'status', v_job.status,
    'idempotent_replay', not v_inserted
  );
end;
$$;

create function public.upsert_job_schedule(
  p_workspace_id uuid,
  p_job_type text,
  p_schedule_key text,
  p_payload_json jsonb,
  p_interval_seconds integer,
  p_next_run_at timestamptz,
  p_max_attempts integer default 5,
  p_timeout_seconds integer default 300,
  p_backoff_base_seconds integer default 15,
  p_payload_version integer default 1,
  p_enabled boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_schedule_id uuid;
begin
  if p_job_type is null or p_job_type !~ '^[a-z][a-z0-9_.-]{0,79}$'
    or p_schedule_key is null
    or length(trim(p_schedule_key)) not between 1 and 160
    or p_payload_json is null or jsonb_typeof(p_payload_json) <> 'object'
    or p_interval_seconds not between 60 and 31536000
    or p_next_run_at is null
    or p_max_attempts not between 1 and 25
    or p_timeout_seconds not between 1 and 600
    or p_backoff_base_seconds not between 1 and 3600
    or p_payload_version <= 0 then
    raise exception 'invalid job schedule' using errcode = '22023';
  end if;
  if p_workspace_id is not null
    and not exists (select 1 from public.workspaces where id = p_workspace_id) then
    raise exception 'job schedule workspace does not exist' using errcode = '23503';
  end if;

  insert into public.job_schedules (
    workspace_id, job_type, schedule_key, payload_json, payload_version,
    interval_seconds, next_run_at, max_attempts, timeout_seconds,
    backoff_base_seconds, enabled
  ) values (
    p_workspace_id, p_job_type, trim(p_schedule_key), p_payload_json,
    p_payload_version, p_interval_seconds, p_next_run_at, p_max_attempts,
    p_timeout_seconds, p_backoff_base_seconds, p_enabled
  )
  on conflict (workspace_id, job_type, schedule_key) do update set
    payload_json = excluded.payload_json,
    payload_version = excluded.payload_version,
    interval_seconds = excluded.interval_seconds,
    next_run_at = excluded.next_run_at,
    max_attempts = excluded.max_attempts,
    timeout_seconds = excluded.timeout_seconds,
    backoff_base_seconds = excluded.backoff_base_seconds,
    enabled = excluded.enabled
  returning id into v_schedule_id;
  return v_schedule_id;
end;
$$;

create function public.materialize_due_job_schedules(
  p_limit integer default 100,
  p_now timestamptz default now()
)
returns integer
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_schedule public.job_schedules%rowtype;
  v_count integer := 0;
begin
  if p_limit not between 1 and 500 or p_now is null then
    raise exception 'invalid schedule materialization request' using errcode = '22023';
  end if;

  for v_schedule in
    select * from public.job_schedules
      where enabled and next_run_at <= p_now
      order by next_run_at, created_at
      for update skip locked
      limit p_limit
  loop
    perform public.enqueue_job(
      v_schedule.workspace_id,
      v_schedule.job_type,
      format('schedule:%s:%s', v_schedule.id, extract(epoch from v_schedule.next_run_at)::numeric),
      v_schedule.payload_json,
      v_schedule.next_run_at,
      v_schedule.max_attempts,
      v_schedule.timeout_seconds,
      v_schedule.backoff_base_seconds,
      v_schedule.payload_version
    );

    update public.job_schedules set
      last_materialized_at = v_schedule.next_run_at,
      next_run_at = v_schedule.next_run_at
        + make_interval(secs => v_schedule.interval_seconds)
    where id = v_schedule.id;
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

create function public.promote_outbox_events(p_limit integer default 100)
returns integer
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_event public.outbox_events%rowtype;
  v_count integer := 0;
begin
  if p_limit not between 1 and 500 then
    raise exception 'invalid outbox promotion limit' using errcode = '22023';
  end if;

  for v_event in
    select * from public.outbox_events
      where published_at is null and available_at <= now()
      order by available_at, created_at
      for update skip locked
      limit p_limit
  loop
    perform public.enqueue_job(
      v_event.workspace_id,
      'outbox.' || replace(v_event.topic, '.', '_'),
      v_event.deduplication_key,
      v_event.payload_json || jsonb_build_object('outbox_event_id', v_event.id),
      v_event.available_at,
      8,
      300,
      15,
      1
    );
    update public.outbox_events set published_at = now(), locked_at = null
      where id = v_event.id;
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

create function public.record_job_dead_letter(
  p_job public.jobs,
  p_error_code text,
  p_now timestamptz
)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  insert into public.job_dead_letters (
    job_id, workspace_id, job_type, error_code, attempts,
    first_enqueued_at, last_failed_at, replay_count
  ) values (
    p_job.id, p_job.workspace_id, p_job.job_type, p_error_code, p_job.attempts,
    p_job.created_at, p_now, p_job.replay_count
  )
  on conflict (job_id) do update set
    error_code = excluded.error_code,
    attempts = excluded.attempts,
    last_failed_at = excluded.last_failed_at,
    replay_count = excluded.replay_count;
end;
$$;

create function public.recover_expired_jobs(
  p_limit integer default 100,
  p_now timestamptz default now()
)
returns integer
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_job public.jobs%rowtype;
  v_count integer := 0;
  v_outcome text;
begin
  if p_limit not between 1 and 500 or p_now is null then
    raise exception 'invalid expired lease request' using errcode = '22023';
  end if;

  for v_job in
    select * from public.jobs
      where status = 'running'
        and locked_at + make_interval(secs => timeout_seconds) <= p_now
      order by locked_at
      for update skip locked
      limit p_limit
  loop
    v_outcome := case when v_job.attempts >= v_job.max_attempts
      then 'dead_letter' else 'retry_scheduled' end;

    insert into public.job_failure_events (
      job_id, workspace_id, job_type, attempt, outcome, error_code, occurred_at
    ) values (
      v_job.id, v_job.workspace_id, v_job.job_type, v_job.attempts,
      v_outcome, 'lease_timeout', p_now
    );

    if v_outcome = 'dead_letter' then
      update public.jobs set
        status = 'dead_letter', last_error_code = 'lease_timeout',
        locked_at = null, locked_by = null, finished_at = p_now
      where id = v_job.id;
      perform public.record_job_dead_letter(v_job, 'lease_timeout', p_now);
    else
      update public.jobs set
        status = 'queued', last_error_code = 'lease_timeout',
        run_after = p_now + make_interval(secs => least(
          3600,
          (v_job.backoff_base_seconds * power(2::numeric, v_job.attempts - 1))::integer
        )),
        locked_at = null, locked_by = null
      where id = v_job.id;
    end if;
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

create function public.claim_jobs(
  p_worker_id text,
  p_job_types text[],
  p_limit integer default 10,
  p_now timestamptz default now()
)
returns table (
  job_id uuid,
  workspace_id uuid,
  job_type text,
  payload_json jsonb,
  payload_version integer,
  attempt integer,
  max_attempts integer,
  timeout_seconds integer,
  lock_token uuid,
  effect_key text
)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if p_worker_id is null or p_worker_id !~ '^[a-zA-Z0-9_.:-]{1,120}$'
    or p_job_types is null or cardinality(p_job_types) = 0
    or p_limit not between 1 and 100 or p_now is null then
    raise exception 'invalid job claim request' using errcode = '22023';
  end if;

  perform public.recover_expired_jobs(least(p_limit * 2, 500), p_now);

  return query
  with candidates as (
    select candidate.id
    from public.jobs candidate
    where candidate.status = 'queued'
      and candidate.run_after <= p_now
      and candidate.job_type = any (p_job_types)
    order by candidate.run_after, candidate.created_at
    for update skip locked
    limit p_limit
  ), claimed as (
    update public.jobs candidate set
      status = 'running',
      attempts = candidate.attempts + 1,
      locked_at = p_now,
      locked_by = p_worker_id,
      lock_token = gen_random_uuid(),
      started_at = p_now,
      finished_at = null
    from candidates
    where candidate.id = candidates.id
    returning candidate.*
  )
  select
    claimed.id,
    claimed.workspace_id,
    claimed.job_type,
    claimed.payload_json,
    claimed.payload_version,
    claimed.attempts,
    claimed.max_attempts,
    claimed.timeout_seconds,
    claimed.lock_token,
    format('job:%s:effect', claimed.id)
  from claimed
  order by claimed.run_after, claimed.created_at;
end;
$$;

create function public.complete_job(
  p_job_id uuid,
  p_lock_token uuid,
  p_now timestamptz default now()
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_job public.jobs%rowtype;
begin
  if p_job_id is null or p_lock_token is null or p_now is null then
    raise exception 'job completion requires its lease token' using errcode = '22023';
  end if;

  select * into strict v_job from public.jobs where id = p_job_id for update;
  if v_job.status = 'succeeded' and v_job.lock_token = p_lock_token then
    return true;
  end if;
  if v_job.status <> 'running' or v_job.lock_token <> p_lock_token then
    raise exception 'job lease is no longer active' using errcode = '40001';
  end if;

  update public.jobs set
    status = 'succeeded', locked_at = null, locked_by = null,
    finished_at = p_now, last_error_code = null
  where id = p_job_id;
  return true;
end;
$$;

create function public.fail_job(
  p_job_id uuid,
  p_lock_token uuid,
  p_error_code text,
  p_retryable boolean default true,
  p_now timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_job public.jobs%rowtype;
  v_outcome text;
  v_run_after timestamptz;
begin
  if p_job_id is null or p_lock_token is null or p_now is null
    or p_error_code is null or p_error_code !~ '^[a-z][a-z0-9_.-]{0,63}$' then
    raise exception 'invalid job failure result' using errcode = '22023';
  end if;

  select * into strict v_job from public.jobs where id = p_job_id for update;
  if v_job.status <> 'running' or v_job.lock_token <> p_lock_token then
    raise exception 'job lease is no longer active' using errcode = '40001';
  end if;

  v_outcome := case when p_retryable and v_job.attempts < v_job.max_attempts
    then 'retry_scheduled' else 'dead_letter' end;

  insert into public.job_failure_events (
    job_id, workspace_id, job_type, attempt, outcome, error_code, occurred_at
  ) values (
    v_job.id, v_job.workspace_id, v_job.job_type, v_job.attempts,
    v_outcome, p_error_code, p_now
  );

  if v_outcome = 'retry_scheduled' then
    v_run_after := p_now + make_interval(secs => least(
      3600,
      (v_job.backoff_base_seconds * power(2::numeric, v_job.attempts - 1))::integer
    ));
    update public.jobs set
      status = 'queued', run_after = v_run_after,
      locked_at = null, locked_by = null, last_error_code = p_error_code
    where id = p_job_id;
  else
    update public.jobs set
      status = 'dead_letter', locked_at = null, locked_by = null,
      finished_at = p_now, last_error_code = p_error_code
    where id = p_job_id;
    perform public.record_job_dead_letter(v_job, p_error_code, p_now);
  end if;

  return jsonb_build_object(
    'job_id', p_job_id,
    'status', v_outcome,
    'run_after', v_run_after
  );
end;
$$;

create function public.replay_dead_letter_job(
  p_job_id uuid,
  p_run_after timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_job public.jobs%rowtype;
begin
  if p_job_id is null or p_run_after is null then
    raise exception 'invalid dead-letter replay request' using errcode = '22023';
  end if;

  select * into strict v_job from public.jobs where id = p_job_id for update;
  if v_job.status <> 'dead_letter' then
    raise exception 'only dead-letter jobs can be replayed' using errcode = '55000';
  end if;

  update public.jobs set
    status = 'queued', attempts = 0, run_after = p_run_after,
    locked_at = null, locked_by = null, lock_token = null,
    started_at = null, finished_at = null, last_error_code = null,
    replay_count = replay_count + 1
  where id = p_job_id
  returning * into v_job;

  update public.job_dead_letters set
    replay_count = v_job.replay_count,
    last_replayed_at = now()
  where job_id = p_job_id;

  return jsonb_build_object(
    'job_id', p_job_id,
    'status', 'queued',
    'replay_count', v_job.replay_count,
    'effect_key', format('job:%s:effect', p_job_id)
  );
end;
$$;

create function public.job_queue_metrics(p_now timestamptz default now())
returns table (
  job_type text,
  queued_count bigint,
  running_count bigint,
  dead_letter_count bigint,
  oldest_queued_age_seconds bigint,
  failures_last_hour bigint,
  measured_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select
    candidate.job_type,
    count(*) filter (where candidate.status = 'queued'),
    count(*) filter (where candidate.status = 'running'),
    count(*) filter (where candidate.status = 'dead_letter'),
    coalesce(
      greatest(
        0,
        extract(epoch from p_now - min(candidate.run_after)
          filter (where candidate.status = 'queued'))::bigint
      ),
      0
    ),
    (
      select count(*)
      from public.job_failure_events failure
      where failure.job_type = candidate.job_type
        and failure.occurred_at >= p_now - interval '1 hour'
    ),
    p_now
  from public.jobs candidate
  group by candidate.job_type
  order by candidate.job_type;
$$;

revoke all on function public.prevent_job_failure_event_mutation() from public;
revoke all on function public.enqueue_job(uuid, text, text, jsonb, timestamptz, integer, integer, integer, integer) from public;
revoke all on function public.upsert_job_schedule(uuid, text, text, jsonb, integer, timestamptz, integer, integer, integer, integer, boolean) from public;
revoke all on function public.materialize_due_job_schedules(integer, timestamptz) from public;
revoke all on function public.promote_outbox_events(integer) from public;
revoke all on function public.record_job_dead_letter(public.jobs, text, timestamptz) from public;
revoke all on function public.recover_expired_jobs(integer, timestamptz) from public;
revoke all on function public.claim_jobs(text, text[], integer, timestamptz) from public;
revoke all on function public.complete_job(uuid, uuid, timestamptz) from public;
revoke all on function public.fail_job(uuid, uuid, text, boolean, timestamptz) from public;
revoke all on function public.replay_dead_letter_job(uuid, timestamptz) from public;
revoke all on function public.job_queue_metrics(timestamptz) from public;

grant execute on function public.enqueue_job(uuid, text, text, jsonb, timestamptz, integer, integer, integer, integer) to service_role;
grant execute on function public.upsert_job_schedule(uuid, text, text, jsonb, integer, timestamptz, integer, integer, integer, integer, boolean) to service_role;
grant execute on function public.materialize_due_job_schedules(integer, timestamptz) to service_role;
grant execute on function public.promote_outbox_events(integer) to service_role;
grant execute on function public.claim_jobs(text, text[], integer, timestamptz) to service_role;
grant execute on function public.complete_job(uuid, uuid, timestamptz) to service_role;
grant execute on function public.fail_job(uuid, uuid, text, boolean, timestamptz) to service_role;
grant execute on function public.replay_dead_letter_job(uuid, timestamptz) to service_role;
grant execute on function public.job_queue_metrics(timestamptz) to service_role;
