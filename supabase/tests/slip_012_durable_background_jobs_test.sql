begin;
select no_plan();

select set_config(
  'slipwell.test.workspace',
  (select workspace_id::text from public.workspace_members where user_id = '10000000-0000-0000-0000-000000000001'),
  true
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.job_dead_letters'::regclass),
  'dead-letter entries have row-level security enabled'
);
select ok(
  not has_table_privilege('authenticated', 'public.jobs', 'select'),
  'job payloads are not readable by authenticated clients'
);
select ok(
  not has_table_privilege('authenticated', 'public.job_dead_letters', 'select'),
  'dead-letter operations remain server-only'
);
select ok(
  not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'job_dead_letters'
      and column_name in ('payload_json', 'deduplication_key', 'error_message')
  ),
  'dead-letter entries contain no payload, deduplication key, or exception message'
);

select is(
  (public.enqueue_job(
    current_setting('slipwell.test.workspace')::uuid,
    'test.effect',
    'slip-012:deduplication',
    '{"entity_id":"opaque-only"}'::jsonb
  ) ->> 'idempotent_replay')::boolean,
  false,
  'the first stable job key creates a durable job'
);
select is(
  (public.enqueue_job(
    current_setting('slipwell.test.workspace')::uuid,
    'test.effect',
    'slip-012:deduplication',
    '{"ignored":"duplicate payload"}'::jsonb
  ) ->> 'idempotent_replay')::boolean,
  true,
  'a duplicate delivery returns the existing job'
);
select is(
  (select count(*) from public.jobs
    where job_type = 'test.effect' and deduplication_key like '%:slip-012:deduplication'),
  1::bigint,
  'stable deduplication keys create one queue entry'
);
select is(
  (select payload_json ->> 'entity_id' from public.jobs
    where job_type = 'test.effect' and deduplication_key like '%:slip-012:deduplication'),
  'opaque-only',
  'an idempotent replay cannot replace the original private payload'
);

select public.enqueue_job(
  current_setting('slipwell.test.workspace')::uuid,
  'test.effect',
  'slip-012:competing-worker',
  '{}'::jsonb
);
create temporary table first_claim as
  select * from public.claim_jobs(
    'worker:first', array['test.effect'], 1, now()
  );
create temporary table second_claim as
  select * from public.claim_jobs(
    'worker:second', array['test.effect'], 1, now()
  );

select is((select count(*) from first_claim), 1::bigint, 'the first worker claims one job');
select is((select count(*) from second_claim), 1::bigint, 'a competing worker claims another job');
select isnt(
  (select job_id from first_claim),
  (select job_id from second_claim),
  'SKIP LOCKED leases never deliver one active job to competing workers'
);

select lives_ok(
  $$select public.complete_job(job_id, lock_token) from second_claim$$,
  'a worker can complete only the job identified by its lease token'
);
select lives_ok(
  $$select public.complete_job(job_id, lock_token) from second_claim$$,
  'completion acknowledgement is idempotent after a lost response'
);

select is(
  (select public.fail_job(job_id, lock_token, 'provider_unavailable', true) ->> 'status'
    from first_claim),
  'retry_scheduled',
  'retryable failures are rescheduled while attempts remain'
);
select ok(
  (select run_after > now() from public.jobs where id = (select job_id from first_claim)),
  'retry backoff moves the next delivery into the future'
);

create temporary table retry_claim as
  select * from public.claim_jobs(
    'worker:retry', array['test.effect'], 1, now() + interval '1 hour'
  );
select is(
  (select effect_key from retry_claim),
  (select effect_key from first_claim),
  'a retry receives the same visible-effect idempotency key'
);

select lives_ok(
  format(
    $mutation$
      select public.apply_domain_mutation(
        %L::uuid, null, 'system_job', 'task',
        '82000000-0000-4000-8000-000000000001'::uuid,
        'create', '{"title":"Synthetic job effect"}'::jsonb, null,
        %L, 'task.created'
      )
    $mutation$,
    current_setting('slipwell.test.workspace'),
    (select effect_key from retry_claim)
  ),
  'the first at-least-once delivery applies its domain effect'
);
select is(
  (public.apply_domain_mutation(
    current_setting('slipwell.test.workspace')::uuid,
    null,
    'system_job',
    'task',
    '82000000-0000-4000-8000-000000000001',
    'create',
    '{"title":"Ignored duplicate effect"}'::jsonb,
    null,
    (select effect_key from retry_claim),
    'task.created'
  ) ->> 'idempotent_replay')::boolean,
  true,
  'a repeated worker delivery reuses the transactional domain idempotency reservation'
);
select is(
  (select count(*) from public.tasks where id = '82000000-0000-4000-8000-000000000001'),
  1::bigint,
  'at-least-once delivery produces exactly one visible domain effect'
);

select is(
  (select public.fail_job(job_id, lock_token, 'invalid_provider_response', false) ->> 'status'
    from retry_claim),
  'dead_letter',
  'a non-retryable failure becomes a dead letter'
);
select ok(
  exists (
    select 1 from public.job_dead_letters
    where job_id = (select job_id from retry_claim)
      and error_code = 'invalid_provider_response'
  ),
  'operators can inspect an opaque dead-letter entry and bounded error code'
);
select ok(
  (select row_to_json(dead_letter)::text not like '%Synthetic job effect%'
    from public.job_dead_letters dead_letter
    where job_id = (select job_id from retry_claim)),
  'dead-letter inspection never exposes job or domain content'
);

select is(
  (public.replay_dead_letter_job((select job_id from retry_claim)) ->> 'effect_key'),
  (select effect_key from retry_claim),
  'dead-letter replay preserves the visible-effect idempotency key'
);
create temporary table replay_claim as
  select * from public.claim_jobs(
    'worker:replay', array['test.effect'], 1, now() + interval '2 hours'
  );
select is(
  (select effect_key from replay_claim),
  (select effect_key from retry_claim),
  'a replayed worker delivery receives the original effect key'
);
select lives_ok(
  $$select public.complete_job(job_id, lock_token) from replay_claim$$,
  'a safely replayed job can complete'
);

select public.enqueue_job(
  current_setting('slipwell.test.workspace')::uuid,
  'test.timeout',
  'slip-012:lease-timeout',
  '{}'::jsonb,
  now(),
  1,
  1,
  1
);
create temporary table timed_claim as
  select * from public.claim_jobs(
    'worker:timeout', array['test.timeout'], 1, now()
  );
select is(
  public.recover_expired_jobs(10, now() + interval '2 seconds'),
  1,
  'an expired lease is recovered'
);
select is(
  (select status from public.jobs where id = (select job_id from timed_claim)),
  'dead_letter',
  'a timed-out final attempt becomes a dead letter'
);

select lives_ok(
  format(
    $schedule$
      select public.upsert_job_schedule(
        %L::uuid, 'test.scheduled', 'slip-012:daily-reconciliation',
        '{}'::jsonb, 86400, now() - interval '1 minute'
      )
    $schedule$,
    current_setting('slipwell.test.workspace')
  ),
  'a recurring job schedule can be registered idempotently'
);
select is(
  public.materialize_due_job_schedules(10, now()),
  1,
  'a due schedule materializes one durable job'
);
select is(
  public.materialize_due_job_schedules(10, now()),
  0,
  'the same schedule occurrence cannot materialize twice'
);

select lives_ok(
  $$
    select public.apply_domain_mutation(
      current_setting('slipwell.test.workspace')::uuid,
      null,
      'system_job',
      'task',
      '82000000-0000-4000-8000-000000000002',
      'create',
      '{"title":"Synthetic outbox source"}'::jsonb,
      null,
      'slip-012:outbox-source',
      'task.created'
    )
  $$,
  'a committed domain mutation produces an outbox event'
);
select is(public.promote_outbox_events(100), 2, 'pending SLIP-011 test events are promoted atomically');
select is(public.promote_outbox_events(100), 0, 'published outbox events are not promoted twice');
select ok(
  exists (
    select 1 from public.jobs
    where job_type = 'outbox.entity_changed'
      and payload_json ->> 'mutation_id' = (
        select id::text from public.mutation_events where idempotency_key = 'slip-012:outbox-source'
      )
  ),
  'outbox publication creates a durable projection job'
);

select ok(
  exists (
    select 1 from public.job_queue_metrics(now())
    where job_type = 'test.timeout'
      and dead_letter_count = 1
      and failures_last_hour >= 1
  ),
  'queue metrics emit dead-letter, failure, and queue-age dimensions without content'
);
select throws_ok(
  $$update public.job_failure_events set error_code = 'tampered'$$,
  '55000',
  'job failure events are append-only',
  'failure metric events cannot be rewritten'
);

select * from finish();
rollback;
