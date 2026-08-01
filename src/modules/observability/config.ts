import { z } from "zod";

export type TelemetryEndpointConfiguration = Readonly<{
  endpoint: string;
  token: string;
}>;

export type AlertThresholds = Readonly<{
  queueAgeSeconds: number;
  processingFailuresPerHour: number;
  authorizationFailuresPerFiveMinutes: number;
}>;

export type ObservabilityConfiguration = Readonly<{
  environment: "local" | "preview" | "production";
  release?: string;
  operations: TelemetryEndpointConfiguration | null;
  analytics: TelemetryEndpointConfiguration | null;
  alerts: AlertThresholds;
}>;

export class ObservabilityConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ObservabilityConfigurationError";
  }
}

function endpointPair(
  environment: Readonly<Record<string, string | undefined>>,
  endpointKey: string,
  tokenKey: string,
): TelemetryEndpointConfiguration | null {
  const endpoint = environment[endpointKey]?.trim();
  const token = environment[tokenKey]?.trim();
  if (!endpoint && !token) {
    return null;
  }
  if (!endpoint || !token) {
    throw new ObservabilityConfigurationError(
      `${endpointKey} and ${tokenKey} must be configured together`,
    );
  }
  const parsedEndpoint = z.url().safeParse(endpoint);
  if (!parsedEndpoint.success || !parsedEndpoint.data.startsWith("https://")) {
    throw new ObservabilityConfigurationError(
      `${endpointKey} must be a valid HTTPS URL`,
    );
  }
  return Object.freeze({ endpoint: parsedEndpoint.data, token });
}

function positiveInteger(
  environment: Readonly<Record<string, string | undefined>>,
  key: string,
  fallback: number,
): number {
  const raw = environment[key]?.trim();
  if (!raw) {
    return fallback;
  }
  const parsed = z.coerce.number().int().positive().safeParse(raw);
  if (!parsed.success) {
    throw new ObservabilityConfigurationError(
      `${key} must be a positive integer`,
    );
  }
  return parsed.data;
}

export function getObservabilityConfiguration(
  environment: Readonly<Record<string, string | undefined>>,
): ObservabilityConfiguration {
  const runtime = z
    .enum(["local", "preview", "production"])
    .safeParse(environment.SLIPWELL_ENVIRONMENT);
  if (!runtime.success) {
    throw new ObservabilityConfigurationError(
      "SLIPWELL_ENVIRONMENT must be local, preview, or production",
    );
  }

  const release = environment.SLIPWELL_RELEASE?.trim();
  if (release && !/^[a-zA-Z0-9][a-zA-Z0-9_.+-]{0,79}$/.test(release)) {
    throw new ObservabilityConfigurationError(
      "SLIPWELL_RELEASE must be a content-free version identifier",
    );
  }

  const operations = endpointPair(
    environment,
    "OBSERVABILITY_INGEST_URL",
    "OBSERVABILITY_INGEST_TOKEN",
  );
  const analytics = endpointPair(
    environment,
    "ANALYTICS_INGEST_URL",
    "ANALYTICS_INGEST_TOKEN",
  );
  if (runtime.data !== "production" && (operations || analytics)) {
    throw new ObservabilityConfigurationError(
      "Telemetry destinations may only be configured in production",
    );
  }

  return Object.freeze({
    environment: runtime.data,
    ...(release ? { release } : {}),
    operations,
    analytics,
    alerts: Object.freeze({
      queueAgeSeconds: positiveInteger(
        environment,
        "ALERT_QUEUE_AGE_SECONDS",
        300,
      ),
      processingFailuresPerHour: positiveInteger(
        environment,
        "ALERT_PROCESSING_FAILURES_PER_HOUR",
        5,
      ),
      authorizationFailuresPerFiveMinutes: positiveInteger(
        environment,
        "ALERT_AUTHORIZATION_FAILURES_PER_5M",
        3,
      ),
    }),
  });
}
