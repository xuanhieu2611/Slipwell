# DR-0004: Use the application Postgres schema as the durable job queue

- **Status:** Provisional
- **Date:** 2026-08-01
- **Decision owner:** Engineering
- **Related work:** SLIP-011, SLIP-012

## Context

SLIP-009 already introduced a workspace-aware `jobs` relation, and SLIP-011
introduced the transactional outbox and idempotent domain mutation boundary.
SLIP-012 needs delayed and recurring scheduling, retry, leases, timeouts,
dead-letter visibility, replay, and metrics without creating a database/queue
loss window.

Supabase Queues (`pgmq`) is a viable Postgres-native queue, but adopting it now
would create a second persistence primitive beside `jobs`, require translation
between outbox, queue messages, operational state, and workspace ownership, and
couple the beta to extension-version behavior before throughput requires it.
The founder environment currently runs one modular monolith and has no measured
queue load.

## Decision

1. The existing `public.jobs` relation is Slipwell's durable queue for the
   private-beta modular monolith.
2. Database functions own enqueue deduplication, fixed-interval schedule
   materialization, outbox promotion, `SKIP LOCKED` leases, timeout recovery,
   exponential retry, maximum attempts, completion, dead-letter transition,
   replay, and aggregate metrics.
3. Private payloads remain in the server-only job row. Failure metrics and
   dead-letter inspection expose only opaque ids, job type, bounded error codes,
   attempts, counts, and timestamps.
4. The queue provides at-least-once delivery. Every attempt and replay receives
   one stable effect key; handlers pass it to the SLIP-011 transactional domain
   service to produce exactly one visible effect.
5. The TypeScript worker dispatches to owning domain modules and never mutates
   their tables directly.
6. The production runner host is not frozen by this decision. Before the first
   production job handler is enabled, an authenticated, production-only,
   bounded scheduled invocation must be configured at a frequency that meets
   that handler's service target.

## Evidence needed to confirm or supersede

Confirm this decision after production metrics show the founder workload stays
within Postgres connection, lease, queue-age, and host-function duration
targets. Supersede it if measurement shows sustained queue contention,
long-running work that exceeds the function host limit, isolation requirements,
or operational burden that a managed queue/worker platform materially reduces.

## Consequences

- Outbox promotion and durable enqueue share one transaction and one recovery
  model.
- Local database tests exercise queue and domain idempotency together.
- The beta avoids an additional extension and service while load is unknown.
- Polling cadence and worker runtime are an explicit production setup task, not
  hidden in a database migration.
- Moving to `pgmq` or an external queue later requires an adapter and migration,
  but the handler contract and stable effect keys can remain unchanged.
