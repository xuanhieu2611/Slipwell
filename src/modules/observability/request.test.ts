import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("./server", () => ({ getServerObservability: vi.fn() }));

import {
  createObservability,
  type TelemetryDestination,
  type TelemetryEnvelope,
} from "./observability";
import { observeApiRequest } from "./request";

class MemoryDestination implements TelemetryDestination {
  readonly records: TelemetryEnvelope[] = [];
  send(record: TelemetryEnvelope): void {
    this.records.push(record);
  }
}

describe("observeApiRequest", () => {
  it("returns correlation headers and records authorization failures without request content", async () => {
    const destination = new MemoryDestination();
    const observability = createObservability({
      environment: "local",
      operationsDestination: destination,
      analyticsDestination: destination,
    });
    const privateQuery = "private-calendar-description";

    const response = await observeApiRequest(
      new Request(
        `https://slipwell.test/api/v1/captures?value=${privateQuery}`,
        {
          method: "POST",
        },
      ),
      "/api/v1/captures",
      async () =>
        Response.json(
          { error: "Authentication is required." },
          { status: 401 },
        ),
      observability,
    );

    expect(response.headers.get("x-request-id")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f-]{27}$/,
    );
    expect(response.headers.get("traceparent")).toMatch(
      /^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/,
    );
    expect(destination.records.map((record) => record.name)).toEqual([
      "api.request.started",
      "api.request.completed",
      "api.request",
      "api.request.duration",
      "authorization.failure",
    ]);
    expect(JSON.stringify(destination.records)).not.toContain(privateQuery);
  });
});
