begin;
select no_plan();

select set_config(
  'slipwell.test.workspace',
  (select workspace_id::text from public.workspace_members
    where user_id = '10000000-0000-0000-0000-000000000001'),
  true
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.capture_trace_lineage(uuid,uuid)',
    'execute'
  ),
  'capture diagnostics remain server-only'
);

insert into public.captures (
  id, workspace_id, idempotency_key, request_id, source, input_type,
  original_text, status
) values (
  '83000000-0000-4000-8000-000000000001',
  current_setting('slipwell.test.workspace')::uuid,
  'slip-013-capture',
  '83000000-0000-4000-8000-000000000002',
  'browser',
  'text',
  'Representative private capture text that must not enter diagnostics.',
  'ready'
);

select public.enqueue_job(
  current_setting('slipwell.test.workspace')::uuid,
  'capture.interpret',
  'slip-013-capture',
  jsonb_build_object(
    'capture_id', '83000000-0000-4000-8000-000000000001',
    'transcript', 'Representative private transcript'
  )
);

insert into public.capture_proposals (
  id, workspace_id, capture_id, schema_version, prompt_version, provider,
  model, proposal_json, primary_type, operation, overall_confidence, status
) values (
  '83000000-0000-4000-8000-000000000003',
  current_setting('slipwell.test.workspace')::uuid,
  '83000000-0000-4000-8000-000000000001',
  1, 'prompt-v1', 'synthetic-provider', 'synthetic-model',
  '{"title":"Representative private proposal title"}'::jsonb,
  'task', 'create', 0.9, 'accepted'
);

insert into public.ai_runs (
  id, workspace_id, capture_id, proposal_id, purpose, provider, model,
  prompt_version, schema_version, result_status
) values (
  '83000000-0000-4000-8000-000000000004',
  current_setting('slipwell.test.workspace')::uuid,
  '83000000-0000-4000-8000-000000000001',
  '83000000-0000-4000-8000-000000000003',
  'interpret', 'synthetic-provider', 'synthetic-model', 'prompt-v1', 1,
  'succeeded'
);

select public.apply_domain_mutation(
  current_setting('slipwell.test.workspace')::uuid,
  '10000000-0000-0000-0000-000000000001',
  'capture_accept',
  'task',
  '83000000-0000-4000-8000-000000000005',
  'create',
  '{"title":"Representative private accepted task"}'::jsonb,
  null,
  'test',
  'task.created',
  true,
  '83000000-0000-4000-8000-000000000001',
  '{}'::jsonb
);

update public.capture_proposals
set accepted_mutation_id = (
  select id from public.mutation_events
  where workspace_id = current_setting('slipwell.test.workspace')::uuid
    and idempotency_key = 'test'
)
where id = '83000000-0000-4000-8000-000000000003';

select is(
  (select request_id from public.capture_trace_lineage(
    current_setting('slipwell.test.workspace')::uuid,
    '83000000-0000-4000-8000-000000000001'
  )),
  '83000000-0000-4000-8000-000000000002'::uuid,
  'capture lineage retains the opaque API request id'
);

select is(
  (select cardinality(job_ids) from public.capture_trace_lineage(
    current_setting('slipwell.test.workspace')::uuid,
    '83000000-0000-4000-8000-000000000001'
  )),
  1,
  'capture lineage includes its durable job'
);

select is(
  (select cardinality(ai_run_ids) from public.capture_trace_lineage(
    current_setting('slipwell.test.workspace')::uuid,
    '83000000-0000-4000-8000-000000000001'
  )),
  1,
  'capture lineage includes its AI run'
);

select is(
  (select cardinality(proposal_ids) from public.capture_trace_lineage(
    current_setting('slipwell.test.workspace')::uuid,
    '83000000-0000-4000-8000-000000000001'
  )),
  1,
  'capture lineage includes its proposal'
);

select is(
  (select cardinality(mutation_ids) from public.capture_trace_lineage(
    current_setting('slipwell.test.workspace')::uuid,
    '83000000-0000-4000-8000-000000000001'
  )),
  1,
  'capture lineage includes its accepted mutation'
);

select ok(
  (select row_to_json(lineage)::text not like '%Representative private%'
    from public.capture_trace_lineage(
      current_setting('slipwell.test.workspace')::uuid,
      '83000000-0000-4000-8000-000000000001'
    ) lineage),
  'capture diagnostics expose opaque ids and never source, proposal, or domain content'
);

select throws_ok(
  $$
    update public.captures
    set request_id = '83000000-0000-4000-8000-000000000099'
    where id = '83000000-0000-4000-8000-000000000001'
  $$,
  '55000',
  'capture request lineage is immutable',
  'capture request lineage cannot be rewritten'
);

select * from finish();
rollback;
