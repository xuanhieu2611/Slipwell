# Application service boundaries

Slipwell starts as a modular monolith. Each directory below owns its domain
rules and persistence access, and will expose a deliberately small public entry
point as implementation arrives. Other modules, route handlers, and workers
must call that public API instead of importing internals or mutating tables
directly.

| Boundary | Directory | Owns |
| --- | --- | --- |
| Identity and authorization | `identity/` | Authentication context, workspace membership, and authorization policy |
| Capture ingestion | `capture/` | Durable immutable source receipt, idempotency, and capture state |
| AI and transcription orchestration | `interpretation/` | Provider adapters, transcription, structured routing, and schema validation |
| Proposal application | `proposals/` | Review decisions and applying accepted proposals through domain services |
| Work domain | `work/` | Task, project, and monthly-retainer rules |
| Activity and undo | `activity/` | Append-only activity, mutation provenance, outbox, and inverse mutations |
| Slipping | `slipping/` | Deterministic evaluation, evidence, signal lifecycle, and snoozing |
| Calendar | `calendar/` | Google Calendar read-only connection, synchronization, and reconciliation |
| Search | `search/` | Authorized keyword indexing and retrieval projections |
| Notifications | `notifications/` | Reminder and digest policy, privacy-safe delivery, and preferences |
| Data management | `data-management/` | Export, revocation, retention, and deletion workflows |

Cross-cutting technical utilities may live outside these directories only when
they contain no domain rules. Shared domain models are not a shortcut around a
module's public API. Every user-owned operation carries a workspace context,
and background workers use the same application services as interactive
requests.
