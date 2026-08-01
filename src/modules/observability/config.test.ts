import { describe, expect, it } from "vitest";
import {
  getObservabilityConfiguration,
  ObservabilityConfigurationError,
} from "./config";

describe("getObservabilityConfiguration", () => {
  it("provides content-free default alert thresholds", () => {
    expect(
      getObservabilityConfiguration({ SLIPWELL_ENVIRONMENT: "local" }),
    ).toMatchObject({
      environment: "local",
      operations: null,
      analytics: null,
      alerts: {
        queueAgeSeconds: 300,
        processingFailuresPerHour: 5,
        authorizationFailuresPerFiveMinutes: 3,
      },
    });
  });

  it("parses provider endpoints and configurable thresholds", () => {
    expect(
      getObservabilityConfiguration({
        SLIPWELL_ENVIRONMENT: "production",
        OBSERVABILITY_INGEST_URL: "https://telemetry.example/v1/events",
        OBSERVABILITY_INGEST_TOKEN: "operations-token",
        ANALYTICS_INGEST_URL: "https://analytics.example/v1/events",
        ANALYTICS_INGEST_TOKEN: "analytics-token",
        ALERT_QUEUE_AGE_SECONDS: "120",
        ALERT_PROCESSING_FAILURES_PER_HOUR: "2",
        ALERT_AUTHORIZATION_FAILURES_PER_5M: "4",
      }),
    ).toMatchObject({
      operations: {
        endpoint: "https://telemetry.example/v1/events",
        token: "operations-token",
      },
      analytics: {
        endpoint: "https://analytics.example/v1/events",
        token: "analytics-token",
      },
      alerts: {
        queueAgeSeconds: 120,
        processingFailuresPerHour: 2,
        authorizationFailuresPerFiveMinutes: 4,
      },
    });
  });

  it("rejects partial configuration without echoing the token", () => {
    const secret = "token-that-must-not-appear";
    try {
      getObservabilityConfiguration({
        SLIPWELL_ENVIRONMENT: "production",
        OBSERVABILITY_INGEST_TOKEN: secret,
      });
      expect.unreachable("configuration should have failed");
    } catch (error) {
      expect(error).toBeInstanceOf(ObservabilityConfigurationError);
      expect(String(error)).not.toContain(secret);
    }
  });

  it("keeps local and preview environments credential-free", () => {
    expect(() =>
      getObservabilityConfiguration({
        SLIPWELL_ENVIRONMENT: "preview",
        ANALYTICS_INGEST_URL: "https://analytics.example/v1/events",
        ANALYTICS_INGEST_TOKEN: "preview-token",
      }),
    ).toThrow("Telemetry destinations may only be configured in production");
  });
});
