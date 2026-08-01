import "server-only";

import { recordAuthorizationFailure } from "./alerts";
import {
  createRequestTelemetryContext,
  type ObservabilityClient,
  type RequestTelemetryContext,
} from "./observability";
import { getServerObservability } from "./server";

export async function observeApiRequest(
  request: Request,
  route: string,
  handler: (context: RequestTelemetryContext) => Promise<Response>,
  observability: ObservabilityClient = getServerObservability().client,
): Promise<Response> {
  const context = createRequestTelemetryContext(request.headers);
  const startedAt = performance.now();
  const baseAttributes = {
    request_id: context.requestId,
    trace_id: context.traceId,
    span_id: context.spanId,
    parent_span_id: context.parentSpanId,
    route,
    method: request.method,
  };

  await observability.log("info", "api.request.started", baseAttributes);

  try {
    const response = await handler(context);
    const attributes = {
      ...baseAttributes,
      status_code: response.status,
      duration_ms: performance.now() - startedAt,
    };

    response.headers.set("x-request-id", context.requestId);
    response.headers.set("traceparent", context.traceparent);
    await Promise.all([
      observability.log("info", "api.request.completed", attributes),
      observability.trace(
        "api.request",
        response.status >= 500 ? "error" : "ok",
        attributes,
      ),
      observability.metric(
        "api.request.duration",
        attributes.duration_ms,
        "milliseconds",
        attributes,
      ),
    ]);

    if (response.status === 401 || response.status === 403) {
      await recordAuthorizationFailure(observability, attributes);
    }

    return response;
  } catch (error) {
    const attributes = {
      ...baseAttributes,
      duration_ms: performance.now() - startedAt,
    };
    await Promise.all([
      observability.captureError("api_request_failed", error, attributes),
      observability.trace("api.request", "error", attributes),
    ]);
    throw error;
  }
}
