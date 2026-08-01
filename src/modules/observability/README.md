# Observability and analytics

This module is the only application boundary for logs, traces, metrics, error
tracking, product analytics, and operational alerts.

- Telemetry attributes are copied through a content-free allowlist. Unknown or
  nested values are discarded before a destination receives a record.
- Error tracking records a bounded error code and error type, never the error
  message, request body, provider payload, or query string.
- Analytics event names and properties are strict runtime schemas. Adding an
  event or property requires an explicit review here.
- API request correlation uses an opaque UUID request id and W3C `traceparent`.
- Capture diagnostics use `capture_trace_lineage()` and expose only opaque ids
  for the request, capture, jobs, AI runs, proposals, and mutations.

Provider credentials are production-only. When no operations endpoint is
configured, scrubbed records use structured JSON console output. Analytics is
a no-op until its production destination is configured, so development and
credential-free previews cannot accidentally collect product activity.

See `docs/runbooks/observability.md` for configuration, alert rules, and
privacy-safe incident handling.
