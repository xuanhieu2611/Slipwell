-- SLIP-009 core beta schema. This migration is deliberately additive: deployed
-- database changes are recovered with forward fixes rather than down migrations.
-- Row-level security is enabled here with no direct-client policies; SLIP-010
-- owns the workspace authorization policies and storage rules.

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function public.prevent_capture_source_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if new.workspace_id is distinct from old.workspace_id
    or new.source is distinct from old.source
    or new.input_type is distinct from old.input_type
    or new.original_text is distinct from old.original_text
    or new.audio_object_key is distinct from old.audio_object_key
    or new.client_captured_at is distinct from old.client_captured_at
    or new.client_timezone is distinct from old.client_timezone
  then
    raise exception 'capture source evidence is immutable' using errcode = '55000';
  end if;

  return new;
end;
$$;

create table public.captures (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  idempotency_key text not null check (length(trim(idempotency_key)) > 0),
  source text not null check (source in ('browser', 'pwa', 'api')),
  input_type text not null check (input_type in ('text', 'audio', 'mixed')),
  original_text text,
  audio_object_key text,
  client_captured_at timestamptz,
  client_timezone text check (
    client_timezone is null or public.is_valid_iana_timezone(client_timezone)
  ),
  status text not null default 'received'
    check (status in ('received', 'transcribing', 'interpreting', 'ready', 'failed')),
  failure_code text,
  retention_class text not null default 'standard'
    check (retention_class in ('standard', 'ephemeral', 'retained')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  unique (workspace_id, idempotency_key),
  check (original_text is not null or audio_object_key is not null)
);

create table public.capture_transcripts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  capture_id uuid not null,
  provider text not null,
  model text,
  language text,
  transcript text not null,
  cleaned_text text,
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  provider_request_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  foreign key (workspace_id, capture_id)
    references public.captures(workspace_id, id) on delete cascade
);

create table public.capture_proposals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  capture_id uuid not null,
  schema_version integer not null check (schema_version > 0),
  prompt_version text not null,
  provider text not null,
  model text not null,
  proposal_json jsonb not null,
  primary_type text not null,
  operation text not null check (operation in ('create', 'update', 'link', 'none')),
  overall_confidence numeric(4, 3) not null
    check (overall_confidence >= 0 and overall_confidence <= 1),
  status text not null default 'pending_review'
    check (status in ('pending_review', 'ready', 'accepted', 'discarded', 'failed')),
  reviewed_at timestamptz,
  accepted_mutation_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  foreign key (workspace_id, capture_id)
    references public.captures(workspace_id, id) on delete cascade
);

create table public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  capture_id uuid,
  proposal_id uuid,
  purpose text not null,
  provider text not null,
  model text not null,
  prompt_version text not null,
  schema_version integer not null check (schema_version > 0),
  retrieved_entity_ids uuid[] not null default '{}',
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  estimated_cost numeric(12, 6) check (estimated_cost is null or estimated_cost >= 0),
  result_status text not null check (result_status in ('started', 'succeeded', 'failed')),
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  foreign key (workspace_id, capture_id)
    references public.captures(workspace_id, id) on delete set null (capture_id),
  foreign key (workspace_id, proposal_id)
    references public.capture_proposals(workspace_id, id) on delete set null (proposal_id)
);

create table public.domains (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  color text,
  position integer not null default 0,
  version integer not null default 1 check (version > 0),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id)
);

create unique index domains_active_name_key
  on public.domains (workspace_id, lower(name))
  where deleted_at is null;

create table public.project_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  description text,
  template_kind text not null check (template_kind in ('finite', 'retainer')),
  version integer not null default 1 check (version > 0),
  structure_json jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id)
);

create unique index project_templates_active_name_key
  on public.project_templates (workspace_id, lower(name))
  where workspace_id is not null and deleted_at is null;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  kind text not null check (kind in ('finite', 'retainer')),
  name text not null check (length(trim(name)) > 0),
  description text,
  status text not null default 'planning'
    check (status in ('planning', 'active', 'paused', 'completed', 'cancelled')),
  domain_id uuid,
  start_on date,
  target_on date,
  attention_cadence_days integer check (attention_cadence_days is null or attention_cadence_days > 0),
  last_attention_at timestamptz,
  next_review_on date,
  template_id uuid,
  template_version integer check (template_version is null or template_version > 0),
  version integer not null default 1 check (version > 0),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  foreign key (workspace_id, domain_id)
    references public.domains(workspace_id, id) on delete set null (domain_id)
);

create table public.retainer_settings (
  project_id uuid primary key,
  workspace_id uuid not null,
  client_person_id uuid,
  cadence text not null default 'monthly' check (cadence = 'monthly'),
  anchor_day smallint not null default 1 check (anchor_day between 1 and 31),
  timezone text not null check (public.is_valid_iana_timezone(timezone)),
  default_rollover_policy text not null default 'carry_forward'
    check (default_rollover_policy in ('carry_forward', 'skip', 'resolve_on_close')),
  paused_until date,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, project_id),
  foreign key (workspace_id, project_id)
    references public.projects(workspace_id, id) on delete cascade
);

create table public.retainer_deliverable_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  project_id uuid not null,
  name text not null check (length(trim(name)) > 0),
  description text,
  expected_start_offset integer,
  due_offset integer,
  position integer not null default 0,
  active_from_cycle date,
  retired_after_cycle date,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  foreign key (workspace_id, project_id)
    references public.projects(workspace_id, id) on delete cascade,
  check (retired_after_cycle is null or active_from_cycle is null or retired_after_cycle >= active_from_cycle)
);

create table public.retainer_task_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  deliverable_template_id uuid not null,
  title text not null check (length(trim(title)) > 0),
  description text,
  start_offset integer,
  due_offset integer,
  position integer not null default 0,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  foreign key (workspace_id, deliverable_template_id)
    references public.retainer_deliverable_templates(workspace_id, id) on delete cascade
);

create table public.retainer_cycles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  project_id uuid not null,
  cycle_key text not null check (cycle_key ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  starts_on date not null,
  ends_on date not null,
  status text not null default 'planned'
    check (status in ('planned', 'active', 'closing', 'closed', 'skipped')),
  generated_at timestamptz,
  closed_at timestamptz,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  unique (project_id, cycle_key),
  foreign key (workspace_id, project_id)
    references public.projects(workspace_id, id) on delete cascade,
  check (ends_on >= starts_on)
);

create table public.retainer_deliverables (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  cycle_id uuid not null,
  template_id uuid,
  name text not null check (length(trim(name)) > 0),
  description text,
  status text not null default 'planned'
    check (status in ('planned', 'in_progress', 'completed', 'skipped', 'carried_over')),
  expected_start_on date,
  due_on date,
  started_at timestamptz,
  completed_at timestamptz,
  carryover_from_id uuid,
  resolution text check (resolution in ('completed', 'skipped', 'carried_forward')),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  foreign key (workspace_id, cycle_id)
    references public.retainer_cycles(workspace_id, id) on delete cascade,
  foreign key (workspace_id, template_id)
    references public.retainer_deliverable_templates(workspace_id, id) on delete set null (template_id),
  foreign key (workspace_id, carryover_from_id)
    references public.retainer_deliverables(workspace_id, id) on delete set null (carryover_from_id)
);

create unique index retainer_deliverables_cycle_template_key
  on public.retainer_deliverables (cycle_id, template_id)
  where template_id is not null;

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  description text,
  status text not null default 'inbox'
    check (status in ('inbox', 'open', 'in_progress', 'blocked', 'completed', 'cancelled')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  domain_id uuid,
  project_id uuid,
  retainer_deliverable_id uuid,
  retainer_task_template_id uuid,
  start_on date,
  due_at timestamptz,
  due_on date,
  due_timezone text check (
    due_timezone is null or public.is_valid_iana_timezone(due_timezone)
  ),
  reminder_at timestamptz,
  recurrence_rule text,
  recurrence_series_id uuid,
  source_capture_id uuid,
  completed_at timestamptz,
  cancelled_at timestamptz,
  last_attention_at timestamptz,
  version integer not null default 1 check (version > 0),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  foreign key (workspace_id, domain_id)
    references public.domains(workspace_id, id) on delete set null (domain_id),
  foreign key (workspace_id, project_id)
    references public.projects(workspace_id, id) on delete set null (project_id),
  foreign key (workspace_id, retainer_deliverable_id)
    references public.retainer_deliverables(workspace_id, id) on delete set null (retainer_deliverable_id),
  foreign key (workspace_id, retainer_task_template_id)
    references public.retainer_task_templates(workspace_id, id) on delete set null (retainer_task_template_id),
  foreign key (workspace_id, source_capture_id)
    references public.captures(workspace_id, id) on delete set null (source_capture_id),
  check (not (due_at is not null and due_on is not null))
);

create unique index tasks_generated_retainer_task_key
  on public.tasks (retainer_deliverable_id, retainer_task_template_id)
  where retainer_deliverable_id is not null and retainer_task_template_id is not null;

create table public.people (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  display_name text not null check (length(trim(display_name)) > 0),
  organization text,
  role text,
  pronouns text,
  email text,
  phone text,
  private_facts text,
  last_interaction_at timestamptz,
  next_follow_up_on date,
  source_capture_id uuid,
  version integer not null default 1 check (version > 0),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  foreign key (workspace_id, source_capture_id)
    references public.captures(workspace_id, id) on delete set null (source_capture_id)
);

create table public.person_dates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  person_id uuid not null,
  label text not null check (length(trim(label)) > 0),
  month smallint not null check (month between 1 and 12),
  day smallint not null check (day between 1 and 31),
  year integer check (year is null or year between 1 and 9999),
  reminder_offset_days integer not null default 0,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  foreign key (workspace_id, person_id)
    references public.people(workspace_id, id) on delete cascade
);

create unique index person_dates_meaningful_key
  on public.person_dates (person_id, lower(label), month, day, coalesce(year, 0));

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  body text not null default '',
  note_type text not null check (note_type in ('project', 'meeting', 'general', 'journal')),
  sensitivity text not null default 'standard' check (sensitivity in ('standard', 'sensitive')),
  domain_id uuid,
  event_at timestamptz,
  source_capture_id uuid,
  version integer not null default 1 check (version > 0),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  foreign key (workspace_id, domain_id)
    references public.domains(workspace_id, id) on delete set null (domain_id),
  foreign key (workspace_id, source_capture_id)
    references public.captures(workspace_id, id) on delete set null (source_capture_id)
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  color text,
  version integer not null default 1 check (version > 0),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id)
);

create unique index tags_active_name_key
  on public.tags (workspace_id, lower(name))
  where deleted_at is null;

create table public.taggings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  tag_id uuid not null,
  entity_type text not null,
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  unique (workspace_id, tag_id, entity_type, entity_id),
  foreign key (workspace_id, tag_id)
    references public.tags(workspace_id, id) on delete cascade
);

create table public.entity_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  from_type text not null,
  from_id uuid not null,
  to_type text not null,
  to_id uuid not null,
  link_type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  unique (workspace_id, from_type, from_id, to_type, to_id, link_type),
  check (not (from_type = to_type and from_id = to_id))
);

create table public.mutation_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id uuid,
  reason text not null check (reason in ('user', 'capture_accept', 'sync', 'system_job')),
  forward_patch jsonb not null,
  inverse_patch jsonb not null,
  undone_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id)
);

alter table public.capture_proposals
  add constraint capture_proposals_accepted_mutation_fk
  foreign key (workspace_id, accepted_mutation_id)
  references public.mutation_events(workspace_id, id) on delete set null (accepted_mutation_id);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_type text not null,
  actor_id uuid,
  entity_type text not null,
  entity_id uuid not null,
  event_type text not null,
  occurred_at timestamptz not null default now(),
  qualifies_as_attention boolean not null default false,
  source_capture_id uuid,
  mutation_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  foreign key (workspace_id, source_capture_id)
    references public.captures(workspace_id, id) on delete set null (source_capture_id),
  foreign key (workspace_id, mutation_id)
    references public.mutation_events(workspace_id, id) on delete set null (mutation_id)
);

create table public.slipping_rules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  rule_type text not null,
  entity_type text not null,
  entity_id uuid,
  threshold_json jsonb not null,
  enabled boolean not null default true,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id)
);

create table public.slipping_signals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  rule_id uuid not null,
  entity_type text not null,
  entity_id uuid not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'active'
    check (status in ('active', 'snoozed', 'dismissed', 'resolved')),
  reason_code text not null,
  last_attention_at timestamptz,
  threshold_at timestamptz not null,
  detected_at timestamptz not null default now(),
  snoozed_until timestamptz,
  resolution_action text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  foreign key (workspace_id, rule_id)
    references public.slipping_rules(workspace_id, id) on delete cascade
);

create unique index slipping_signals_one_active_per_rule
  on public.slipping_signals (workspace_id, rule_id, entity_type, entity_id)
  where status = 'active';

create table public.daily_priorities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  local_date date not null,
  position smallint not null check (position between 1 and 3),
  entity_type text not null,
  entity_id uuid not null,
  selected_by text not null check (selected_by in ('user', 'carried')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  unique (workspace_id, local_date, position),
  unique (workspace_id, local_date, entity_type, entity_id)
);

create table public.search_documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  title text not null,
  search_vector tsvector not null default ''::tsvector,
  content_hash text not null,
  indexed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  unique (workspace_id, entity_type, entity_id)
);

create index search_documents_vector_idx
  on public.search_documents using gin (search_vector);

create table public.calendar_connections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider text not null check (provider = 'google'),
  provider_account_id text not null,
  encrypted_access_token_ref text,
  encrypted_refresh_token_ref text,
  status text not null default 'connected'
    check (status in ('connected', 'reauth_required', 'revoked', 'failed')),
  last_sync_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  unique (workspace_id, provider, provider_account_id)
);

create table public.calendar_sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  connection_id uuid not null,
  provider_calendar_id text not null,
  name text not null,
  color text,
  selected boolean not null default false,
  privacy_mode text not null default 'full'
    check (privacy_mode in ('full', 'busy_only', 'excluded')),
  sync_token_encrypted text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  unique (connection_id, provider_calendar_id),
  foreign key (workspace_id, connection_id)
    references public.calendar_connections(workspace_id, id) on delete cascade
);

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  calendar_source_id uuid not null,
  provider_event_id text not null,
  provider_updated_at timestamptz,
  title text,
  description text,
  location text,
  starts_at timestamptz,
  ends_at timestamptz,
  start_on date,
  end_on date,
  all_day boolean not null default false,
  status text not null default 'confirmed'
    check (status in ('confirmed', 'tentative', 'cancelled')),
  recurring_event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  unique (calendar_source_id, provider_event_id),
  foreign key (workspace_id, calendar_source_id)
    references public.calendar_sources(workspace_id, id) on delete cascade,
  check (
    (all_day and start_on is not null and end_on is not null and starts_at is null and ends_at is null)
    or (not all_day and starts_at is not null and ends_at is not null and start_on is null and end_on is null)
  ),
  check (ends_at is null or starts_at is null or ends_at >= starts_at),
  check (end_on is null or start_on is null or end_on >= start_on)
);

create table public.notification_preferences (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  category_settings jsonb not null default '{}'::jsonb,
  channel_settings jsonb not null default '{}'::jsonb,
  preview_mode text not null default 'generic' check (preview_mode in ('generic', 'full')),
  quiet_hours jsonb,
  daily_brief_time time,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.device_installations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  user_id uuid not null,
  platform text not null check (platform in ('web', 'pwa')),
  push_token_encrypted text not null,
  push_token_fingerprint text not null,
  client_version text,
  last_seen_at timestamptz,
  notifications_authorized boolean not null default false,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  foreign key (workspace_id, user_id)
    references public.workspace_members(workspace_id, user_id) on delete cascade
);

create unique index device_installations_active_token_key
  on public.device_installations (workspace_id, push_token_fingerprint)
  where revoked_at is null;

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deduplication_key text not null check (length(trim(deduplication_key)) > 0),
  category text not null,
  channel text not null check (channel in ('push', 'email', 'in_app')),
  scheduled_at timestamptz not null,
  sent_at timestamptz,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'sending', 'sent', 'failed', 'cancelled')),
  failure_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  unique (deduplication_key)
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  job_type text not null,
  deduplication_key text not null check (length(trim(deduplication_key)) > 0),
  payload_json jsonb not null default '{}'::jsonb,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'succeeded', 'failed', 'dead_letter', 'cancelled')),
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 5 check (max_attempts > 0),
  run_after timestamptz not null default now(),
  locked_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  unique (job_type, deduplication_key),
  check (attempts <= max_attempts)
);

create table public.exports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'completed', 'failed', 'expired')),
  format_version integer not null check (format_version > 0),
  object_key text,
  expires_at timestamptz,
  failure_code text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (workspace_id, id)
);

create index captures_workspace_created_at_idx on public.captures (workspace_id, created_at desc);
create index tasks_workspace_status_idx on public.tasks (workspace_id, status) where deleted_at is null;
create index projects_workspace_status_idx on public.projects (workspace_id, status) where deleted_at is null;
create index activity_events_workspace_occurred_at_idx on public.activity_events (workspace_id, occurred_at desc);
create index slipping_signals_workspace_status_idx on public.slipping_signals (workspace_id, status);
create index calendar_events_workspace_starts_at_idx on public.calendar_events (workspace_id, starts_at);
create index jobs_ready_idx on public.jobs (run_after) where status = 'queued';

create trigger captures_source_is_immutable before update on public.captures
  for each row execute function public.prevent_capture_source_mutation();
create trigger captures_set_updated_at before update on public.captures
  for each row execute function public.set_updated_at();
create trigger capture_transcripts_set_updated_at before update on public.capture_transcripts
  for each row execute function public.set_updated_at();
create trigger capture_proposals_set_updated_at before update on public.capture_proposals
  for each row execute function public.set_updated_at();
create trigger ai_runs_set_updated_at before update on public.ai_runs
  for each row execute function public.set_updated_at();
create trigger domains_set_updated_at before update on public.domains
  for each row execute function public.set_updated_at();
create trigger project_templates_set_updated_at before update on public.project_templates
  for each row execute function public.set_updated_at();
create trigger projects_set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger retainer_settings_set_updated_at before update on public.retainer_settings
  for each row execute function public.set_updated_at();
create trigger retainer_deliverable_templates_set_updated_at before update on public.retainer_deliverable_templates
  for each row execute function public.set_updated_at();
create trigger retainer_task_templates_set_updated_at before update on public.retainer_task_templates
  for each row execute function public.set_updated_at();
create trigger retainer_cycles_set_updated_at before update on public.retainer_cycles
  for each row execute function public.set_updated_at();
create trigger retainer_deliverables_set_updated_at before update on public.retainer_deliverables
  for each row execute function public.set_updated_at();
create trigger tasks_set_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();
create trigger people_set_updated_at before update on public.people
  for each row execute function public.set_updated_at();
create trigger person_dates_set_updated_at before update on public.person_dates
  for each row execute function public.set_updated_at();
create trigger notes_set_updated_at before update on public.notes
  for each row execute function public.set_updated_at();
create trigger tags_set_updated_at before update on public.tags
  for each row execute function public.set_updated_at();
create trigger taggings_set_updated_at before update on public.taggings
  for each row execute function public.set_updated_at();
create trigger entity_links_set_updated_at before update on public.entity_links
  for each row execute function public.set_updated_at();
create trigger mutation_events_set_updated_at before update on public.mutation_events
  for each row execute function public.set_updated_at();
create trigger activity_events_set_updated_at before update on public.activity_events
  for each row execute function public.set_updated_at();
create trigger slipping_rules_set_updated_at before update on public.slipping_rules
  for each row execute function public.set_updated_at();
create trigger slipping_signals_set_updated_at before update on public.slipping_signals
  for each row execute function public.set_updated_at();
create trigger daily_priorities_set_updated_at before update on public.daily_priorities
  for each row execute function public.set_updated_at();
create trigger search_documents_set_updated_at before update on public.search_documents
  for each row execute function public.set_updated_at();
create trigger calendar_connections_set_updated_at before update on public.calendar_connections
  for each row execute function public.set_updated_at();
create trigger calendar_sources_set_updated_at before update on public.calendar_sources
  for each row execute function public.set_updated_at();
create trigger calendar_events_set_updated_at before update on public.calendar_events
  for each row execute function public.set_updated_at();
create trigger notification_preferences_set_updated_at before update on public.notification_preferences
  for each row execute function public.set_updated_at();
create trigger device_installations_set_updated_at before update on public.device_installations
  for each row execute function public.set_updated_at();
create trigger notification_deliveries_set_updated_at before update on public.notification_deliveries
  for each row execute function public.set_updated_at();
create trigger jobs_set_updated_at before update on public.jobs
  for each row execute function public.set_updated_at();
create trigger exports_set_updated_at before update on public.exports
  for each row execute function public.set_updated_at();

alter table public.captures enable row level security;
alter table public.capture_transcripts enable row level security;
alter table public.capture_proposals enable row level security;
alter table public.ai_runs enable row level security;
alter table public.domains enable row level security;
alter table public.project_templates enable row level security;
alter table public.projects enable row level security;
alter table public.retainer_settings enable row level security;
alter table public.retainer_deliverable_templates enable row level security;
alter table public.retainer_task_templates enable row level security;
alter table public.retainer_cycles enable row level security;
alter table public.retainer_deliverables enable row level security;
alter table public.tasks enable row level security;
alter table public.people enable row level security;
alter table public.person_dates enable row level security;
alter table public.notes enable row level security;
alter table public.tags enable row level security;
alter table public.taggings enable row level security;
alter table public.entity_links enable row level security;
alter table public.mutation_events enable row level security;
alter table public.activity_events enable row level security;
alter table public.slipping_rules enable row level security;
alter table public.slipping_signals enable row level security;
alter table public.daily_priorities enable row level security;
alter table public.search_documents enable row level security;
alter table public.calendar_connections enable row level security;
alter table public.calendar_sources enable row level security;
alter table public.calendar_events enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.device_installations enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.jobs enable row level security;
alter table public.exports enable row level security;

revoke all on function public.set_updated_at() from public;
revoke all on function public.prevent_capture_source_mutation() from public;
revoke all on all tables in schema public from anon, authenticated;
