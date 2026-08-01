# Core beta schema

SLIP-009 establishes the relational source of truth used by Slipwell's beta.
The complete, executable definition is the versioned SQL in
`supabase/migrations/`; this document is a maintained map, not a second schema
source.

## Relationship map

```mermaid
erDiagram
  WORKSPACES ||--o{ WORKSPACE_MEMBERS : contains
  WORKSPACES ||--o{ CAPTURES : owns
  CAPTURES ||--o{ CAPTURE_TRANSCRIPTS : produces
  CAPTURES ||--o{ CAPTURE_PROPOSALS : proposes
  WORKSPACES ||--o{ DOMAINS : organizes
  WORKSPACES ||--o{ PROJECTS : owns
  PROJECTS ||--o| RETAINER_SETTINGS : configures
  PROJECTS ||--o{ RETAINER_DELIVERABLE_TEMPLATES : defines
  RETAINER_DELIVERABLE_TEMPLATES ||--o{ RETAINER_TASK_TEMPLATES : contains
  PROJECTS ||--o{ RETAINER_CYCLES : repeats
  RETAINER_CYCLES ||--o{ RETAINER_DELIVERABLES : materializes
  RETAINER_DELIVERABLES ||--o{ TASKS : contains
  WORKSPACES ||--o{ TASKS : owns
  WORKSPACES ||--o{ PEOPLE : owns
  PEOPLE ||--o{ PERSON_DATES : tracks
  WORKSPACES ||--o{ NOTES : owns
  WORKSPACES ||--o{ ACTIVITY_EVENTS : records
  WORKSPACES ||--o{ SLIPPING_RULES : configures
  SLIPPING_RULES ||--o{ SLIPPING_SIGNALS : detects
  WORKSPACES ||--o{ CALENDAR_CONNECTIONS : connects
  CALENDAR_CONNECTIONS ||--o{ CALENDAR_SOURCES : exposes
  CALENDAR_SOURCES ||--o{ CALENDAR_EVENTS : mirrors
  WORKSPACES ||--o{ JOBS : schedules
  WORKSPACES ||--o{ EXPORTS : creates
```

All user-owned records carry `workspace_id`. Where the related table is also
workspace-owned, a composite foreign key `(workspace_id, id)` prevents a row
from pointing to an object in another workspace. Polymorphic edges
(`taggings`, `entity_links`, activity, slipping, daily priorities, and search
documents) retain the workspace key; their typed endpoint validation belongs in
the application services that create them.

Every mutable table has UTC `created_at` and `updated_at` timestamps. Domain
records that users can remove retain `deleted_at`; optimistic-concurrency
records carry a positive integer `version`. Capture evidence remains immutable
source material and is not soft-deleted as a domain record.

## Idempotency and projections

- Captures are unique by `(workspace_id, idempotency_key)`.
- Retainer cycles are unique by `(project_id, cycle_key)`.
- Generated retainer tasks are unique by `(retainer_deliverable_id,
  retainer_task_template_id)` when both are present.
- Notification deliveries have a globally unique `deduplication_key`.
- Jobs are unique by `(job_type, deduplication_key)`.
- Search documents are derived, one per workspace/entity pair; their outbox
  production and authorization recheck are implemented in SLIP-011 and
  SLIP-041.

RLS is enabled on every workspace-owned table with no direct-client policies.
SLIP-010 adds the workspace authorization policies and private-storage rules.

## Migration and recovery policy

Migrations are append-only, timestamped SQL files generated with
`supabase migration new <name>` and committed with their tests and docs. The
database-safety check rejects destructive DDL and bulk deletes.

Before merging a schema change:

1. Review the SQL and run `npm run db:safety`.
2. Rebuild a local database with `supabase db reset` and confirm the synthetic
   seed data loads.
3. Run `supabase db advisors` and `supabase migration list --local`.
4. Run the repository quality gates.

Production uses one founder-operated Supabase environment. Preview with
`supabase db push --dry-run`; then apply pending migrations with
`supabase db push`. Never use `supabase db reset --linked` against production.
There are no down migrations: restore application compatibility and ship a
reviewed additive forward fix. If migration history and schema diverge, inspect
the state with `supabase migration list`; use `supabase db pull` to capture
approved remote changes, and use `supabase migration repair` only to correct a
known-good history record.
