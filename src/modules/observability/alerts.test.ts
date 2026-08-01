import { describe, expect, it } from "vitest";
import type { JobQueueMetric } from "../jobs";
import { configurableAlertRules, emitJobQueueObservability } from "./alerts";
import {
  createObservability,
  type TelemetryDestination,
  type TelemetryEnvelope,
} from "./observability";

class MemoryDestination implements TelemetryDestination {
  readonly records: TelemetryEnvelope[] = [];
  send(record: TelemetryEnvelope): void {
    this.records.push(record);
  }
}

describe("operational alerts", () => {
  it("publishes provider-neutral rules for every required alert", () => {
    expect(
      configurableAlertRules({
        queueAgeSeconds: 300,
        processingFailuresPerHour: 5,
        authorizationFailuresPerFiveMinutes: 3,
      }),
    ).toEqual([
      {
        name: "queue_age",
        metric: "job.queue.oldest_age",
        operator: ">=",
        threshold: 300,
        windowSeconds: 60,
      },
      {
        name: "processing_failure",
        metric: "job.processing.failures",
        operator: ">=",
        threshold: 5,
        windowSeconds: 3600,
      },
      {
        name: "authorization_failure",
        metric: "authorization.failure",
        operator: ">=",
        threshold: 3,
        windowSeconds: 300,
      },
    ]);
  });

  it("emits queue and processing alerts from content-free metrics", async () => {
    const destination = new MemoryDestination();
    const observability = createObservability({
      environment: "production",
      operationsDestination: destination,
      analyticsDestination: destination,
    });
    const metric: JobQueueMetric = {
      job_type: "capture.interpret",
      queued_count: 7,
      running_count: 1,
      dead_letter_count: 1,
      oldest_queued_age_seconds: 301,
      failures_last_hour: 5,
      measured_at: "2026-08-01T12:00:00.000Z",
    };

    await emitJobQueueObservability([metric], observability, {
      queueAgeSeconds: 300,
      processingFailuresPerHour: 5,
      authorizationFailuresPerFiveMinutes: 3,
    });

    expect(destination.records.map((record) => record.name)).toEqual([
      "job.queue.oldest_age",
      "job.processing.failures",
      "alert.queue_age",
      "alert.processing_failure",
    ]);
    expect(JSON.stringify(destination.records)).not.toContain("payload");
  });
});
