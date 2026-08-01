import { z } from "zod";

export const requestIdSchema = z.string().uuid();
export const traceIdSchema = z.string().regex(/^[0-9a-f]{32}$/);
export const spanIdSchema = z.string().regex(/^[0-9a-f]{16}$/);

const telemetryCodeSchema = z.string().regex(/^[a-z][a-z0-9_.-]{0,119}$/);
const operationsEventSchema = z.enum([
  "api.request",
  "api.request.started",
  "api.request.completed",
  "api.request.duration",
  "authorization.failure",
  "capture.received",
  "error.captured",
  "job.started",
  "job.succeeded",
  "job.execution",
  "job.queue.oldest_age",
  "job.processing.failures",
  "alert.queue_age",
  "alert.processing_failure",
]);
const safeRouteSchema = z
  .string()
  .max(200)
  .regex(/^\/[a-zA-Z0-9_./:-]*$/);
const safeVersionSchema = z
  .string()
  .max(80)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9_.+-]*$/);
const nonnegativeNumberSchema = z.number().finite().nonnegative();
const positiveIntegerSchema = z.number().int().positive();

const telemetryAttributeSchemas = {
  request_id: requestIdSchema,
  trace_id: traceIdSchema,
  span_id: spanIdSchema,
  parent_span_id: spanIdSchema,
  capture_id: z.string().uuid(),
  job_id: z.string().uuid(),
  ai_run_id: z.string().uuid(),
  proposal_id: z.string().uuid(),
  mutation_id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  entity_id: z.string().uuid(),
  route: safeRouteSchema,
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]),
  status_code: z.number().int().min(100).max(599),
  duration_ms: nonnegativeNumberSchema,
  latency_ms: nonnegativeNumberSchema,
  queued_count: z.number().int().nonnegative(),
  running_count: z.number().int().nonnegative(),
  dead_letter_count: z.number().int().nonnegative(),
  oldest_queued_age_seconds: z.number().int().nonnegative(),
  failures_last_hour: z.number().int().nonnegative(),
  attempt: positiveIntegerSchema,
  max_attempts: positiveIntegerSchema,
  schema_version: positiveIntegerSchema,
  job_type: telemetryCodeSchema,
  error_code: telemetryCodeSchema,
  error_type: safeVersionSchema,
  provider_code: telemetryCodeSchema,
  model_code: safeVersionSchema,
  prompt_version: safeVersionSchema,
  stage: telemetryCodeSchema,
  outcome: telemetryCodeSchema,
  source_type: telemetryCodeSchema,
  record_type: telemetryCodeSchema,
  rule_type: telemetryCodeSchema,
  severity: z.enum(["watch", "at_risk", "critical"]),
  plan: z.enum(["private_beta", "free", "paid"]),
  client_version: safeVersionSchema,
  latency_bucket: z.enum([
    "under_1s",
    "1s_to_5s",
    "5s_to_10s",
    "10s_to_30s",
    "over_30s",
  ]),
  confidence_bucket: z.enum(["low", "review", "high"]),
  value: nonnegativeNumberSchema,
  unit: z.enum(["count", "milliseconds", "seconds"]),
} as const;

export type TelemetryAttribute = string | number | boolean | null;
export type TelemetryAttributes = Readonly<Record<string, TelemetryAttribute>>;

/**
 * Telemetry is allowlist-first. Unknown keys, nested values, query strings,
 * free-form messages, and invalid identifiers are discarded before a sink is
 * invoked. This makes logging a request object or domain record harmless.
 */
export function scrubTelemetryAttributes(
  candidate: unknown,
): TelemetryAttributes {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return Object.freeze({});
  }

  const source = candidate as Readonly<Record<string, unknown>>;
  const scrubbed: Record<string, TelemetryAttribute> = {};

  for (const [key, schema] of Object.entries(telemetryAttributeSchemas)) {
    const result = schema.safeParse(source[key]);
    if (result.success) {
      scrubbed[key] = result.data;
    }
  }

  return Object.freeze(scrubbed);
}

export const analyticsEventSchema = z.enum([
  "onboarding_step_completed",
  "calendar_connected",
  "capture_started",
  "capture_received",
  "capture_processed",
  "capture_failed",
  "proposal_viewed",
  "proposal_accepted",
  "proposal_corrected",
  "mutation_undone",
  "top3_selected",
  "task_completed",
  "retainer_created",
  "retainer_cycle_generated",
  "retainer_cycle_closed",
  "slipping_signal_viewed",
  "slipping_signal_acted",
  "search_performed",
  "export_requested",
]);

const analyticsPropertiesSchema = z
  .object({
    workspace_id: z.string().uuid().optional(),
    capture_id: z.string().uuid().optional(),
    entity_id: z.string().uuid().optional(),
    source_type: z
      .enum(["browser_text", "browser_audio", "pwa_text", "pwa_audio", "api"])
      .optional(),
    record_type: z
      .enum([
        "capture",
        "proposal",
        "mutation",
        "task",
        "project",
        "retainer",
        "person",
        "note",
        "calendar_event",
      ])
      .optional(),
    latency_bucket: telemetryAttributeSchemas.latency_bucket.optional(),
    confidence_bucket: telemetryAttributeSchemas.confidence_bucket.optional(),
    rule_type: z
      .enum([
        "slip_task_stale",
        "slip_task_overdue",
        "slip_project_inactive",
        "slip_project_next",
        "slip_retainer_start",
        "slip_retainer_due",
        "slip_carryover",
      ])
      .optional(),
    severity: telemetryAttributeSchemas.severity.optional(),
    plan: telemetryAttributeSchemas.plan.optional(),
    client_version: safeVersionSchema.optional(),
    stage: z
      .enum([
        "receipt",
        "transcription",
        "interpretation",
        "proposal",
        "mutation",
        "calendar_sync",
        "notification",
        "export",
      ])
      .optional(),
    provider_code: telemetryCodeSchema.optional(),
    outcome: z
      .enum([
        "started",
        "received",
        "succeeded",
        "failed",
        "corrected",
        "undone",
      ])
      .optional(),
  })
  .strict();

export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;
export type AnalyticsProperties = z.infer<typeof analyticsPropertiesSchema>;

export type TelemetryEnvelope = Readonly<{
  kind: "log" | "trace" | "metric" | "error" | "analytics" | "alert";
  name: string;
  timestamp: string;
  service: "slipwell";
  environment: "local" | "preview" | "production";
  release?: string;
  level?: "debug" | "info" | "warn" | "error";
  status?: "ok" | "error";
  attributes: TelemetryAttributes;
}>;

export interface TelemetryDestination {
  send(record: TelemetryEnvelope): Promise<void> | void;
}

export type ObservabilityOptions = Readonly<{
  environment: "local" | "preview" | "production";
  release?: string;
  operationsDestination: TelemetryDestination;
  analyticsDestination: TelemetryDestination;
  now?: () => Date;
}>;

export interface ObservabilityClient {
  log(
    level: "debug" | "info" | "warn" | "error",
    event: string,
    attributes?: unknown,
  ): Promise<void>;
  trace(
    name: string,
    status: "ok" | "error",
    attributes?: unknown,
  ): Promise<void>;
  metric(
    name: string,
    value: number,
    unit: "count" | "milliseconds" | "seconds",
    attributes?: unknown,
  ): Promise<void>;
  captureError(
    code: string,
    error: unknown,
    attributes?: unknown,
  ): Promise<void>;
  track(event: AnalyticsEvent, properties?: unknown): Promise<void>;
  alert(name: string, attributes?: unknown): Promise<void>;
}

function randomHexId(): string {
  return crypto.randomUUID().replaceAll("-", "");
}

export function createRequestId(): string {
  return crypto.randomUUID();
}

export function createTraceId(): string {
  return randomHexId();
}

export function createSpanId(): string {
  return randomHexId().slice(0, 16);
}

function validTraceParent(value: string | null): {
  traceId: string;
  parentSpanId: string;
} | null {
  if (!value) {
    return null;
  }
  const match = /^00-([0-9a-f]{32})-([0-9a-f]{16})-(?:00|01)$/.exec(value);
  if (!match || /^0+$/.test(match[1]) || /^0+$/.test(match[2])) {
    return null;
  }
  return { traceId: match[1], parentSpanId: match[2] };
}

export type RequestTelemetryContext = Readonly<{
  requestId: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  traceparent: string;
}>;

export function createRequestTelemetryContext(
  headers: Pick<Headers, "get">,
): RequestTelemetryContext {
  const suppliedRequestId = requestIdSchema.safeParse(
    headers.get("x-request-id"),
  );
  const parent = validTraceParent(headers.get("traceparent"));
  const requestId = suppliedRequestId.success
    ? suppliedRequestId.data
    : createRequestId();
  const traceId = parent?.traceId ?? createTraceId();
  const spanId = createSpanId();

  return Object.freeze({
    requestId,
    traceId,
    spanId,
    ...(parent ? { parentSpanId: parent.parentSpanId } : {}),
    traceparent: `00-${traceId}-${spanId}-01`,
  });
}

function safeCode(candidate: string, fallback: string): string {
  const result = telemetryCodeSchema.safeParse(candidate);
  return result.success ? result.data : fallback;
}

function safeTelemetryName(candidate: string, fallback: string): string {
  const operations = operationsEventSchema.safeParse(candidate);
  if (operations.success) {
    return operations.data;
  }
  const analytics = analyticsEventSchema.safeParse(candidate);
  return analytics.success ? analytics.data : fallback;
}

export function createObservability(
  options: ObservabilityOptions,
): ObservabilityClient {
  const now = options.now ?? (() => new Date());

  async function deliver(
    destination: TelemetryDestination,
    record: TelemetryEnvelope,
  ): Promise<void> {
    try {
      await destination.send(record);
    } catch {
      // Telemetry must never turn a successful capture, request, or job into a
      // user-visible failure. Destination health is monitored out of band.
    }
  }

  function envelope(
    kind: TelemetryEnvelope["kind"],
    name: string,
    attributes: unknown,
    extra: Pick<TelemetryEnvelope, "level" | "status"> = {},
  ): TelemetryEnvelope {
    return Object.freeze({
      kind,
      name: safeTelemetryName(name, `${kind}.invalid_name`),
      timestamp: now().toISOString(),
      service: "slipwell",
      environment: options.environment,
      ...(options.release ? { release: options.release } : {}),
      ...extra,
      attributes: scrubTelemetryAttributes(attributes),
    });
  }

  const client: ObservabilityClient = {
    async log(level, event, attributes) {
      await deliver(
        options.operationsDestination,
        envelope("log", event, attributes, { level }),
      );
    },
    async trace(name, status, attributes) {
      await deliver(
        options.operationsDestination,
        envelope("trace", name, attributes, { status }),
      );
    },
    async metric(name, value, unit, attributes) {
      await deliver(
        options.operationsDestination,
        envelope("metric", name, {
          ...scrubTelemetryAttributes(attributes),
          value,
          unit,
        }),
      );
    },
    async captureError(code, error, attributes) {
      const parsedErrorType = z
        .enum([
          "Error",
          "TypeError",
          "RangeError",
          "SyntaxError",
          "ZodError",
          "JobExecutionError",
        ])
        .safeParse(error instanceof Error ? error.name : "UnknownError");
      const errorType = parsedErrorType.success
        ? parsedErrorType.data
        : "UnknownError";
      await deliver(
        options.operationsDestination,
        envelope(
          "error",
          "error.captured",
          {
            ...scrubTelemetryAttributes(attributes),
            error_code: safeCode(code, "unexpected_error"),
            error_type: errorType,
          },
          { level: "error", status: "error" },
        ),
      );
    },
    async track(event, properties = {}) {
      const parsedEvent = analyticsEventSchema.parse(event);
      const parsedProperties = analyticsPropertiesSchema.parse(properties);
      await deliver(
        options.analyticsDestination,
        envelope("analytics", parsedEvent, parsedProperties),
      );
    },
    async alert(name, attributes) {
      await deliver(
        options.operationsDestination,
        envelope("alert", name, attributes, {
          level: "error",
          status: "error",
        }),
      );
    },
  };
  return Object.freeze(client);
}
