# Durable jobs boundary

This module owns queue orchestration, leases, retries, schedules, replay, and
content-free operational signals. Domain handlers remain in their owning
modules and are registered with `runJobWorker`; a worker must never update a
domain table directly.

Every delivery of one job receives the same `effectKey`, including after lease
expiry or dead-letter replay. Handlers use that value as the idempotency key
when calling transactional domain services. This is the exactly-once visible
effect boundary over the queue's at-least-once delivery contract.

Payloads are private and available only to the server-side worker. Metrics,
failure events, and dead-letter rows contain job type, opaque ids, bounded error
codes, counts, and timestamps—never payloads or exception messages.

Capture work uses the explicit `captureId` enqueue property. The worker receives
that opaque id separately for safe correlation and exports content-free job
logs, traces, queue metrics, failures, and alerts through server observability
by default. Tests may pass `observability: null`; production workers must not
disable it.

See `docs/runbooks/background-jobs.md` for the operational workflow.
