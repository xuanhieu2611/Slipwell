import { type NextRequest } from "next/server";
import { updateSession } from "@/src/lib/supabase/proxy";
import { createRequestTelemetryContext } from "@/src/modules/observability";

export async function proxy(request: NextRequest) {
  const context = createRequestTelemetryContext(request.headers);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", context.requestId);
  requestHeaders.set("traceparent", context.traceparent);

  const response = await updateSession(request, requestHeaders);
  response.headers.set("x-request-id", context.requestId);
  response.headers.set("traceparent", context.traceparent);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
