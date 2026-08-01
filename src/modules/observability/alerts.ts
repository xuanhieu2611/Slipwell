import type { JobQueueMetric } from "../jobs";
import type { AlertThresholds } from "./config";
import type { ObservabilityClient } from "./observability";

export const authorizationFailureMetricName = "authorization.failure";

export type ConfigurableAlertRule = Readonly<{
  name: string;
  metric: string;
  operator: ">=";
  threshold: number;
  windowSeconds: number;
}>;

export function configurableAlertRules(
  thresholds: AlertThresholds,
): readonly ConfigurableAlertRule[] {
  return Object.freeze([
    Object.freeze({
      name: "queue_age",
      metric: "job.queue.oldest_age",
      operator: ">=" as const,
      threshold: thresholds.queueAgeSeconds,
      windowSeconds: 60,
    }),
    Object.freeze({
      name: "processing_failure",
      metric: "job.processing.failures",
      operator: ">=" as const,
      threshold: thresholds.processingFailuresPerHour,
      windowSeconds: 3_600,
    }),
    Object.freeze({
      name: "authorization_failure",
      metric: authorizationFailureMetricName,
      operator: ">=" as const,
      threshold: thresholds.authorizationFailuresPerFiveMinutes,
      windowSeconds: 300,
    }),
  ]);
}

export async function emitJobQueueObservability(
  metrics: readonly JobQueueMetric[],
  observability: ObservabilityClient,
  thresholds: AlertThresholds,
): Promise<void> {
  for (const metric of metrics) {
    const attributes = {
      job_type: metric.job_type,
      queued_count: metric.queued_count,
      running_count: metric.running_count,
      dead_letter_count: metric.dead_letter_count,
      oldest_queued_age_seconds: metric.oldest_queued_age_seconds,
      failures_last_hour: metric.failures_last_hour,
    };

    await Promise.all([
      observability.metric(
        "job.queue.oldest_age",
        metric.oldest_queued_age_seconds,
        "seconds",
        attributes,
      ),
      observability.metric(
        "job.processing.failures",
        metric.failures_last_hour,
        "count",
        attributes,
      ),
    ]);

    if (metric.oldest_queued_age_seconds >= thresholds.queueAgeSeconds) {
      await observability.alert("alert.queue_age", attributes);
    }
    if (
      metric.failures_last_hour >= thresholds.processingFailuresPerHour ||
      metric.dead_letter_count > 0
    ) {
      await observability.alert("alert.processing_failure", attributes);
    }
  }
}

export async function recordAuthorizationFailure(
  observability: ObservabilityClient,
  attributes: unknown,
): Promise<void> {
  await observability.metric(
    authorizationFailureMetricName,
    1,
    "count",
    attributes,
  );
}
