import { describe, expect, it } from "vitest";
import {
  createObservability,
  createRequestTelemetryContext,
  type TelemetryDestination,
  type TelemetryEnvelope,
} from "./observability";

class MemoryDestination implements TelemetryDestination {
  readonly records: TelemetryEnvelope[] = [];

  send(record: TelemetryEnvelope): void {
    this.records.push(record);
  }
}

function testClient(destination: TelemetryDestination) {
  return createObservability({
    environment: "local",
    operationsDestination: destination,
    analyticsDestination: destination,
    now: () => new Date("2026-08-01T12:00:00.000Z"),
  });
}

describe("privacy-safe telemetry", () => {
  it("scrubs representative sensitive content from logs and error tracking", async () => {
    const destination = new MemoryDestination();
    const observability = testClient(destination);
    const sensitiveValues = [
      "private request body",
      "private task title",
      "private transcript",
      "Private Person Name",
      "private note body",
      "private calendar description",
      "private query value",
      "private exception message",
    ];

    await observability.log("info", "capture.received", {
      request_id: "84000000-0000-4000-8000-000000000001",
      capture_id: "84000000-0000-4000-8000-000000000002",
      route: "/api/v1/captures?text=private query value",
      request_body: { original_text: sensitiveValues[0] },
      title: sensitiveValues[1],
      transcript: sensitiveValues[2],
      name: sensitiveValues[3],
      note_body: sensitiveValues[4],
      calendar_description: sensitiveValues[5],
      query: sensitiveValues[6],
    });
    await observability.captureError(
      "provider_failure",
      new Error(sensitiveValues[7]),
      { request_body: sensitiveValues[0] },
    );
    await observability.log("info", "private_secret", {});

    const delivered = JSON.stringify(destination.records);
    for (const sensitiveValue of sensitiveValues) {
      expect(delivered).not.toContain(sensitiveValue);
    }
    expect(destination.records[0].attributes).toEqual({
      request_id: "84000000-0000-4000-8000-000000000001",
      capture_id: "84000000-0000-4000-8000-000000000002",
    });
    expect(destination.records[1].attributes).toMatchObject({
      error_code: "provider_failure",
      error_type: "Error",
    });
    expect(destination.records[2].name).toBe("log.invalid_name");
  });

  it("enforces an event and property allowlist for analytics", async () => {
    const destination = new MemoryDestination();
    const observability = testClient(destination);

    await expect(
      observability.track("capture_received", {
        source_type: "browser_text",
        title: "private analytics title",
      }),
    ).rejects.toThrow();
    expect(destination.records).toHaveLength(0);

    await observability.track("capture_received", {
      capture_id: "84000000-0000-4000-8000-000000000002",
      source_type: "browser_text",
      latency_bucket: "under_1s",
    });

    expect(destination.records).toHaveLength(1);
    expect(destination.records[0]).toMatchObject({
      kind: "analytics",
      name: "capture_received",
      attributes: {
        capture_id: "84000000-0000-4000-8000-000000000002",
        source_type: "browser_text",
        latency_bucket: "under_1s",
      },
    });
  });

  it("never turns a destination outage into an application failure", async () => {
    const unavailableDestination: TelemetryDestination = {
      send() {
        throw new Error("destination unavailable");
      },
    };
    const observability = testClient(unavailableDestination);

    await expect(
      observability.log("info", "capture.received", {
        capture_id: "84000000-0000-4000-8000-000000000002",
      }),
    ).resolves.toBeUndefined();
  });
});

describe("request correlation", () => {
  it("continues valid upstream correlation and rejects content-shaped headers", () => {
    const valid = createRequestTelemetryContext(
      new Headers({
        "x-request-id": "84000000-0000-4000-8000-000000000001",
        traceparent: "00-84000000000040008000000000000002-8400000000004000-01",
      }),
    );
    expect(valid).toMatchObject({
      requestId: "84000000-0000-4000-8000-000000000001",
      traceId: "84000000000040008000000000000002",
      parentSpanId: "8400000000004000",
    });
    expect(valid.traceparent).toMatch(
      /^00-84000000000040008000000000000002-[0-9a-f]{16}-01$/,
    );

    const rejected = createRequestTelemetryContext(
      new Headers({
        "x-request-id": "private customer name",
        traceparent: "private transcript",
      }),
    );
    expect(rejected.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(JSON.stringify(rejected)).not.toContain("private");
  });
});
