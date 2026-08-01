begin;
select no_plan();

select set_config(
  'slipwell.test.workspace',
  (select workspace_id::text from public.workspace_members where user_id = '10000000-0000-0000-0000-000000000001'),
  true
);

select lives_ok(
  $$
    select public.apply_domain_mutation(
      current_setting('slipwell.test.workspace')::uuid,
      '10000000-0000-0000-0000-000000000001',
      'user',
      'task',
      '80000000-0000-0000-0000-000000000001',
      'create',
      '{"title":"Synthetic transaction task","description":"Synthetic only"}'::jsonb,
      null,
      'slip-011-create-task',
      'task.created',
      false,
      null,
      '{}'::jsonb
    )
  $$,
  'a domain mutation commits successfully'
);

select is(
  (select count(*) from public.tasks where id = '80000000-0000-0000-0000-000000000001'),
  1::bigint,
  'the task is written'
);
select is(
  (select count(*) from public.mutation_events where idempotency_key = 'slip-011-create-task'),
  1::bigint,
  'the mutation snapshot is written in the transaction'
);
select is(
  (select count(*) from public.activity_events where entity_id = '80000000-0000-0000-0000-000000000001'),
  1::bigint,
  'the append-only activity event is written in the transaction'
);
select is(
  (select count(*) from public.outbox_events where payload_json ->> 'entity_id' = '80000000-0000-0000-0000-000000000001'),
  1::bigint,
  'the transactional outbox event is written with the mutation'
);
select ok(
  (select published_at is null from public.outbox_events where payload_json ->> 'entity_id' = '80000000-0000-0000-0000-000000000001'),
  'the transaction does not pretend an outbox event has already been published'
);

select is(
  (public.apply_domain_mutation(
    current_setting('slipwell.test.workspace')::uuid,
    '10000000-0000-0000-0000-000000000001',
    'user',
    'task',
    '80000000-0000-0000-0000-000000000001',
    'create',
    '{"title":"Ignored retry"}'::jsonb,
    null,
    'slip-011-create-task',
    'task.created'
  ) ->> 'idempotent_replay')::boolean,
  true,
  'replaying a mutation key returns the original mutation without a second task'
);
select is(
  (select count(*) from public.tasks where id = '80000000-0000-0000-0000-000000000001'),
  1::bigint,
  'the idempotency replay did not create a second task'
);

select lives_ok(
  $$
    select public.apply_domain_mutation(
      current_setting('slipwell.test.workspace')::uuid,
      '10000000-0000-0000-0000-000000000001',
      'user',
      'task',
      '80000000-0000-0000-0000-000000000001',
      'update',
      '{"description":"Updated synthetic description"}'::jsonb,
      1,
      'slip-011-update-task',
      'task.updated'
    )
  $$,
  'an updated beta record stores a reversible mutation'
);
select is(
  (select description from public.tasks where id = '80000000-0000-0000-0000-000000000001'),
  'Updated synthetic description',
  'the update applies'
);
select ok(
  exists (
    select 1 from public.mutation_events
    where idempotency_key = 'slip-011-update-task'
      and inverse_patch ->> 'operation' = 'update'
      and inverse_patch -> 'fields' ->> 'description' = 'Synthetic only'
  ),
  'the update mutation stores the inverse values'
);

select is(
  (public.undo_domain_mutation(
    current_setting('slipwell.test.workspace')::uuid,
    '10000000-0000-0000-0000-000000000001',
    (select id from public.mutation_events where idempotency_key = 'slip-011-update-task')
  ) ->> 'idempotent_replay')::boolean,
  false,
  'Undo applies the recorded inverse once'
);
select is(
  (select description from public.tasks where id = '80000000-0000-0000-0000-000000000001'),
  'Synthetic only',
  'Undo restores the original value'
);
select is(
  (public.undo_domain_mutation(
    current_setting('slipwell.test.workspace')::uuid,
    '10000000-0000-0000-0000-000000000001',
    (select id from public.mutation_events where idempotency_key = 'slip-011-update-task')
  ) ->> 'idempotent_replay')::boolean,
  true,
  'repeated Undo is idempotent'
);

select lives_ok(
  $$
    select public.apply_domain_mutation(
      current_setting('slipwell.test.workspace')::uuid,
      '10000000-0000-0000-0000-000000000001',
      'user',
      'task',
      '80000000-0000-0000-0000-000000000003',
      'create',
      '{"title":"Synthetic task for create Undo"}'::jsonb,
      null,
      'slip-011-create-task-for-undo',
      'task.created'
    )
  $$,
  'a second created record is available for an independent Undo check'
);
select is(
  (public.undo_domain_mutation(
    current_setting('slipwell.test.workspace')::uuid,
    '10000000-0000-0000-0000-000000000001',
    (select id from public.mutation_events where idempotency_key = 'slip-011-create-task-for-undo')
  ) ->> 'idempotent_replay')::boolean,
  false,
  'Undo supports created beta records'
);
select ok(
  (select deleted_at is not null from public.tasks where id = '80000000-0000-0000-0000-000000000003'),
  'Undo soft-deletes a record created by the original mutation'
);

select lives_ok(
  $$
    select public.apply_domain_mutation(
      current_setting('slipwell.test.workspace')::uuid,
      '10000000-0000-0000-0000-000000000001',
      'user',
      'note',
      '80000000-0000-0000-0000-000000000002',
      'create',
      '{"title":"Synthetic private note","body":"body that must never enter general activity","sensitivity":"sensitive"}'::jsonb,
      null,
      'slip-011-create-note',
      'note.created'
    )
  $$,
  'a sensitive note can be mutated through the same service'
);
select ok(
  not exists (
    select 1 from public.activity_events
    where entity_id = '80000000-0000-0000-0000-000000000002'
      and metadata_json::text like '%body that must never enter general activity%'
  ),
  'sensitive record bodies are absent from general activity metadata'
);
select throws_ok(
  $$update public.activity_events set event_type = 'tampered'$$,
  '55000',
  'activity events are append-only',
  'activity events cannot be changed after insertion'
);
select throws_ok(
  $$
    select public.apply_domain_mutation(
      current_setting('slipwell.test.workspace')::uuid,
      '10000000-0000-0000-0000-000000000099',
      'user',
      'task',
      null,
      'create',
      '{"title":"Unauthorized"}'::jsonb,
      null,
      'slip-011-unauthorized',
      'task.created'
    )
  $$,
  '42501',
  'actor is not authorized for this workspace',
  'a non-member cannot create a mutation for a workspace'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.outbox_events'::regclass),
  'outbox events have row-level security enabled'
);
select ok(
  not has_table_privilege('authenticated', 'public.outbox_events', 'select'),
  'authenticated clients cannot read internal outbox events'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.apply_domain_mutation(uuid, uuid, text, text, uuid, text, jsonb, integer, text, text, boolean, uuid, jsonb)',
    'execute'
  ),
  'authenticated clients cannot call the privileged mutation RPC directly'
);

select * from finish();
rollback;
