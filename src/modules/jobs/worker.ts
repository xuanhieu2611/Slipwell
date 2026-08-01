import "server-only";

import type { ClaimedJob, JobQueueMetric } from "./jobs";
import {
  claimJobs,
  completeJob,
  failJob,
  prepareJobQueue,
  readJobQueueMetrics,
  type JobsRpcClient,
} from "./server";

export type JobExecutionContext = Readonly<{
  jobId: string;
  workspaceId: string | null;
  jobType: string;
  payload: Readonly<Record<string, unknown>>;
  payloadVersion: number;
  attempt: number;
  maxAttempts: number;
  effectKey: string;
  signal: AbortSignal;
}>;

export type JobHandler = (context: JobExecutionContext) => Promise<void>;

export class JobExecutionError extends Error {
  constructor(
    readonly code: string,
    readonly retryable = true,
  ) {
    super("The background operation failed.");
    this.name = "JobExecutionError";
  }
}

export type JobWorkerOptions = Readonly<{
  workerId: string;
  handlers: Readonly<Record<string, JobHandler>>;
  limit?: number;
  client?: JobsRpcClient;
  emitMetrics?: (metrics: readonly JobQueueMetric[]) => Promise<void> | void;
}>;

export type JobWorkerResult = Readonly<{
  claimed: number;
  succeeded: number;
  failed: number;
  materializedSchedules: number;
  promotedOutboxEvents: number;
  metrics: readonly JobQueueMetric[];
}>;

function failureFrom(error: unknown): {
  errorCode: string;
  retryable: boolean;
} {
  if (error instanceof JobExecutionError) {
    return { errorCode: error.code, retryable: error.retryable };
  }
  return { errorCode: "unexpected_error", retryable: true };
}

async function executeWithTimeout(
  job: ClaimedJob,
  handler: JobHandler,
): Promise<void> {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      controller.abort();
      reject(new JobExecutionError("worker_timeout", true));
    }, job.timeout_seconds * 1_000);
  });

  try {
    await Promise.race([
      handler({
        jobId: job.job_id,
        workspaceId: job.workspace_id,
        jobType: job.job_type,
        payload: job.payload_json,
        payloadVersion: job.payload_version,
        attempt: job.attempt,
        maxAttempts: job.max_attempts,
        effectKey: job.effect_key,
        signal: controller.signal,
      }),
      timeoutPromise,
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

async function executeClaimedJob(
  job: ClaimedJob,
  handler: JobHandler,
  client: JobsRpcClient | undefined,
): Promise<"succeeded" | "failed"> {
  try {
    await executeWithTimeout(job, handler);
    await completeJob(job, client);
    return "succeeded";
  } catch (error) {
    await failJob(job, failureFrom(error), client);
    return "failed";
  }
}

export async function runJobWorker(
  options: JobWorkerOptions,
): Promise<JobWorkerResult> {
  const limit = options.limit ?? 10;
  const prepared = await prepareJobQueue(Math.max(limit, 1), options.client);
  const jobTypes = Object.keys(options.handlers);
  const jobs =
    jobTypes.length === 0
      ? []
      : await claimJobs(options.workerId, jobTypes, limit, options.client);

  const outcomes = await Promise.all(
    jobs.map((job) =>
      executeClaimedJob(job, options.handlers[job.job_type], options.client),
    ),
  );
  const metrics = await readJobQueueMetrics(options.client);
  await options.emitMetrics?.(metrics);

  return {
    claimed: jobs.length,
    succeeded: outcomes.filter((outcome) => outcome === "succeeded").length,
    failed: outcomes.filter((outcome) => outcome === "failed").length,
    materializedSchedules: prepared.schedules,
    promotedOutboxEvents: prepared.outboxEvents,
    metrics,
  };
}
