-- Synthetic development data only. This account has no usable credentials and
-- is not representative of a real person or client.
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  '10000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'sample-owner@slipwell.test',
  '',
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Sample Slipwell Owner"}'::jsonb,
  now(),
  now()
)
on conflict (id) do nothing;

do $$
declare
  sample_user_id constant uuid := '10000000-0000-0000-0000-000000000001';
  sample_workspace_id uuid;
  sample_domain_id constant uuid := '20000000-0000-0000-0000-000000000001';
  sample_capture_id constant uuid := '30000000-0000-0000-0000-000000000001';
  sample_person_id constant uuid := '40000000-0000-0000-0000-000000000001';
  sample_project_id constant uuid := '50000000-0000-0000-0000-000000000001';
  sample_retainer_id constant uuid := '50000000-0000-0000-0000-000000000002';
  sample_deliverable_template_id constant uuid := '60000000-0000-0000-0000-000000000001';
  sample_task_template_id constant uuid := '60000000-0000-0000-0000-000000000002';
  sample_cycle_id constant uuid := '70000000-0000-0000-0000-000000000001';
  sample_deliverable_id constant uuid := '70000000-0000-0000-0000-000000000002';
begin
  select workspace_id
  into strict sample_workspace_id
  from public.workspace_members
  where user_id = sample_user_id;

  insert into public.domains (id, workspace_id, name, color, position)
  values (sample_domain_id, sample_workspace_id, 'Studio work', '#4F46E5', 1)
  on conflict (id) do nothing;

  insert into public.captures (
    id, workspace_id, idempotency_key, source, input_type, original_text,
    client_captured_at, client_timezone, status
  ) values (
    sample_capture_id, sample_workspace_id, 'seed-capture-001', 'browser', 'text',
    'Draft a synthetic project brief for the sample workspace.', now(), 'Etc/UTC', 'ready'
  ) on conflict (id) do nothing;

  insert into public.people (
    id, workspace_id, display_name, organization, role, email, source_capture_id
  ) values (
    sample_person_id, sample_workspace_id, 'Sample Client', 'Example Studio',
    'Creative director', 'sample-client@slipwell.test', sample_capture_id
  ) on conflict (id) do nothing;

  insert into public.projects (
    id, workspace_id, kind, name, description, status, domain_id, start_on,
    attention_cadence_days
  ) values (
    sample_project_id, sample_workspace_id, 'finite', 'Sample launch brief',
    'Synthetic project used only for local development.', 'active', sample_domain_id,
    current_date, 7
  ) on conflict (id) do nothing;

  insert into public.projects (
    id, workspace_id, kind, name, status, domain_id, attention_cadence_days
  ) values (
    sample_retainer_id, sample_workspace_id, 'retainer', 'Sample monthly retainer',
    'active', sample_domain_id, 7
  ) on conflict (id) do nothing;

  insert into public.retainer_settings (
    project_id, workspace_id, client_person_id, cadence, anchor_day, timezone
  ) values (
    sample_retainer_id, sample_workspace_id, sample_person_id, 'monthly', 1, 'Etc/UTC'
  ) on conflict (project_id) do nothing;

  insert into public.retainer_deliverable_templates (
    id, workspace_id, project_id, name, expected_start_offset, due_offset, position
  ) values (
    sample_deliverable_template_id, sample_workspace_id, sample_retainer_id,
    'Monthly creative review', 0, 20, 1
  ) on conflict (id) do nothing;

  insert into public.retainer_task_templates (
    id, workspace_id, deliverable_template_id, title, start_offset, due_offset, position
  ) values (
    sample_task_template_id, sample_workspace_id, sample_deliverable_template_id,
    'Prepare review notes', 0, 18, 1
  ) on conflict (id) do nothing;

  insert into public.retainer_cycles (
    id, workspace_id, project_id, cycle_key, starts_on, ends_on, status, generated_at
  ) values (
    sample_cycle_id, sample_workspace_id, sample_retainer_id,
    to_char(current_date, 'YYYY-MM'), date_trunc('month', current_date)::date,
    (date_trunc('month', current_date) + interval '1 month - 1 day')::date,
    'active', now()
  ) on conflict (id) do nothing;

  insert into public.retainer_deliverables (
    id, workspace_id, cycle_id, template_id, name, status, expected_start_on, due_on
  ) values (
    sample_deliverable_id, sample_workspace_id, sample_cycle_id,
    sample_deliverable_template_id, 'Monthly creative review', 'planned',
    date_trunc('month', current_date)::date,
    (date_trunc('month', current_date) + interval '20 days')::date
  ) on conflict (id) do nothing;

  insert into public.tasks (
    workspace_id, title, status, priority, domain_id, project_id, source_capture_id, due_on
  ) values (
    sample_workspace_id, 'Review sample launch brief', 'open', 'high', sample_domain_id,
    sample_project_id, sample_capture_id, current_date + 3
  ) on conflict do nothing;

  insert into public.tasks (
    workspace_id, title, status, priority, project_id, retainer_deliverable_id,
    retainer_task_template_id, due_on
  ) values (
    sample_workspace_id, 'Prepare review notes', 'open', 'normal', sample_retainer_id,
    sample_deliverable_id, sample_task_template_id, current_date + 18
  ) on conflict do nothing;

  insert into public.notes (
    workspace_id, title, body, note_type, domain_id, source_capture_id
  ) values (
    sample_workspace_id, 'Sample working note',
    'This is synthetic local development content.', 'general', sample_domain_id, sample_capture_id
  ) on conflict do nothing;

  insert into public.notification_preferences (workspace_id, daily_brief_time)
  values (sample_workspace_id, time '09:00')
  on conflict (workspace_id) do nothing;
end;
$$;
