# Privacy-safe observability

SLIP-013 provides one provider-neutral envelope for structured logs, traces,
metrics, bounded error reports, alerts, and product analytics. The application
scrubs every operations attribute through a content-free allowlist before a
destination receives it. Analytics uses strict event and property schemas and
rejects unknown fields.

Never attach request bodies, query strings, URLs with query parameters, titles,
transcripts, names, note bodies, calendar descriptions, provider payloads,
exception messages, or arbitrary metadata to telemetry. Operational records
may contain opaque UUIDs, bounded category codes, counts, durations, route
templates, and status codes.

## Production configuration

The operations and analytics destinations each accept an HTTPS `POST` whose
body is a `TelemetryEnvelope`; authentication is a bearer token. Configure the
following as Vercel Production values only:

- `OBSERVABILITY_INGEST_URL` and `OBSERVABILITY_INGEST_TOKEN` for logs, traces,
  metrics, error records, and alert envelopes;
- `ANALYTICS_INGEST_URL` and `ANALYTICS_INGEST_TOKEN` for allowlisted product
  analytics;
- `SLIPWELL_RELEASE` with the deployed version or commit identifier.

Local operations records use structured JSON console output. Local and preview
analytics are disabled. A partial destination configuration fails safely and
does not print its token.

Before enabling the first production capture handler, the founder must choose
the two ingestion destinations, store their tokens in the Production scope,
and send a synthetic event through each. This is an external deployment task;
no provider credential belongs in the repository.

## Alert rules

`configurableAlertRules()` exposes the provider-neutral monitor definitions.
Defaults can be overridden with the listed environment variables:

| Alert | Metric | Default rule | Configuration |
| --- | --- | --- | --- |
| Queue age | `job.queue.oldest_age` | at least 300 seconds | `ALERT_QUEUE_AGE_SECONDS` |
| Processing failure | `job.processing.failures` | at least 5 in one hour | `ALERT_PROCESSING_FAILURES_PER_HOUR` |
| Authorization failure | `authorization.failure` | at least 3 in five minutes | `ALERT_AUTHORIZATION_FAILURES_PER_5M` |

The job worker exports queue and failure metrics and emits immediate alert
envelopes when configured thresholds are breached. API wrappers emit one
authorization-failure metric for each 401 or 403. Configure the destination's
monitor using the same five-minute aggregation rule, then test all three rules
with synthetic identifiers before relying on paging.

## Request and capture diagnosis

The Next.js proxy assigns every request an opaque UUID in `x-request-id` and a
W3C `traceparent`, forwards both to route handlers, and returns both headers to
the client. Route handlers must pass a static route template to
`observeApiRequest`; never pass `request.url`.

Capture receipt stores the request UUID. Capture jobs use the explicit
`captureId` enqueue property, which is validated against the workspace and
copied into `jobs.trace_capture_id`. AI runs and proposals already reference
the capture, while accepted proposals and activity reference the mutation.
Use the server-only `readCaptureTraceLineage(workspaceId, captureId)` helper to
retrieve these identifiers. Do not inspect `jobs.payload_json` or copy content
into an incident, support message, trace, or issue.

## Privacy verification and incident response

1. Reproduce with synthetic data and capture the request or capture UUID.
2. Inspect structured status, durations, bounded error codes, and opaque
   lineage only.
3. If content appears in a destination, revoke its token, disable ingestion,
   preserve a bounded audit record, delete the affected telemetry under the
   provider's retention controls, and treat the event as a privacy incident.
4. Add the leaked shape to the representative privacy regression test before
   restoring ingestion.
