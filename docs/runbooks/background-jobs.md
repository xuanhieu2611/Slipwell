# Background job operations

SLIP-012 provides a Postgres-backed durable queue on the existing `jobs` table.
The database owns deduplication, delayed and recurring scheduling, leases,
timeouts, bounded exponential retry, dead-letter transitions, and replay. The
TypeScript worker owns handler dispatch and timeout cancellation.
The provisional architecture decision and its revisit triggers are recorded in
[DR-0004](../decisions/0004-postgres-backed-durable-job-queue.md).

## Delivery contract

- Enqueue with a stable, content-free `(job_type, deduplication_key)` pair.
- A due job is leased with `FOR UPDATE SKIP LOCKED`; competing workers receive
  disjoint jobs.
- Attempts use exponential backoff capped at one hour. A non-retryable failure,
  a final failed attempt, or a final expired lease enters dead letter.
- Every delivery and replay of one job receives `job:<opaque-id>:effect`.
  Handlers pass that value to their domain service as its idempotency key.
- Domain changes still go through the SLIP-011 transactional service. A worker
  must not mutate domain tables directly.
- Outbox promotion inserts the durable job and marks the outbox row published
  in one database transaction.

The queue is at-least-once. Exactly-once visible behavior comes from combining
its stable effect key with the domain mutation idempotency reservation.

## Registering work

Use `enqueueJob` for one-off or delayed work and `upsertJobSchedule` for a fixed
recurring interval. Deduplication and schedule keys may contain opaque ids and
version numbers, but never titles, names, note text, transcripts, calendar
details, email addresses, or other private facts.

Capture processing calls `enqueueJob` with its opaque `captureId`. Enqueue
validates the capture against the job workspace and copies the id to the
content-free trace column used by capture diagnostics. Do not add a second
capture id only inside an ad hoc payload field.

Register handlers by job type with `runJobWorker`. A handler receives an
`AbortSignal`, payload version, attempt metadata, and the stable `effectKey`.
Provider adapters should honor cancellation and translate failures into a
bounded `JobExecutionError` code. Unclassified exceptions become
`unexpected_error`; exception messages are never persisted.

A production-only scheduled invocation still needs to call the registered
worker regularly before the first production job type is enabled. The trigger
must be authenticated, must not exist on credential-free previews, and should
claim a bounded batch so it stays within the host function timeout. This is an
environment setup task rather than a database migration because the available
schedule frequency depends on the founder's hosting plan.

## Inspecting health

Use `readJobQueueMetrics` or the service-role-only `job_queue_metrics()` RPC.
It reports, per job type:

- queued, running, and dead-letter counts;
- age in seconds of the oldest queued job;
- failure events in the last hour;
- measurement time.

Failure events and dead-letter entries contain opaque job/workspace ids, job
type, attempt counts, timestamps, and allowlisted error codes only. Do not query
or copy `jobs.payload_json` into logs, traces, alerts, support tools, or issue
comments.

SLIP-013 should export these values to the production observability provider
and set alert thresholds for queue age, failure rate, and dead-letter growth.

## Replaying a dead letter

1. Identify the opaque `job_id`, job type, error code, attempt count, and last
   failure time in `job_dead_letters`. Do not inspect the payload unless a user
   has explicitly consented to bounded production-content debugging.
2. Resolve the provider, configuration, or code failure first.
3. Call `replayDeadLetterJob(jobId)`. This resets delivery attempts and retains
   the original stable effect key.
4. Confirm the job leaves `dead_letter`, succeeds, and does not create another
   visible domain effect.
5. If it fails again, retain the new bounded error code and replay count for the
   incident record.

## Queue stall response

1. Check whether oldest queued age is increasing and whether workers hold
   expired leases.
2. Confirm the scheduled runner is invoking production and is authorized.
3. Check failure counts by job type and provider availability without logging
   payloads.
4. Restore the runner or provider. Expired leases are recovered automatically
   on the next claim.
5. Replay only dead letters whose underlying failure is resolved.
