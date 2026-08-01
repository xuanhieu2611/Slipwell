import "server-only";

import { createAdminClient } from "../../lib/supabase/admin";
import {
  claimedJobSchema,
  enqueueJobResultSchema,
  enqueueJobSchema,
  failJobResultSchema,
  jobFailureCodeSchema,
  jobQueueMetricSchema,
  jobTypeSchema,
  replayJobResultSchema,
  upsertJobScheduleSchema,
  type ClaimedJob,
  type EnqueueJob,
  type EnqueueJobResult,
  type JobQueueMetric,
  type UpsertJobSchedule,
} from "./jobs";

export type JobsRpcClient = Pick<ReturnType<typeof createAdminClient>, "rpc">;

function throwRpcError(message: string, error: unknown): never {
  throw new Error(message, { cause: error });
}

export async function enqueueJob(
  input: EnqueueJob,
  client: JobsRpcClient = createAdminClient(),
): Promise<EnqueueJobResult> {
  const command = enqueueJobSchema.parse(input);
  const payload = command.captureId
    ? { ...command.payload, capture_id: command.captureId }
    : command.payload;
  const { data, error } = await client.rpc("enqueue_job", {
    p_workspace_id: command.workspaceId,
    p_job_type: command.jobType,
    p_deduplication_key: command.deduplicationKey,
    p_payload_json: payload,
    p_run_after: command.runAfter ?? new Date().toISOString(),
    p_max_attempts: command.maxAttempts,
    p_timeout_seconds: command.timeoutSeconds,
    p_backoff_base_seconds: command.backoffBaseSeconds,
    p_payload_version: command.payloadVersion,
  });

  if (error) {
    throwRpcError("The job could not be queued.", error);
  }
  return enqueueJobResultSchema.parse(data);
}

export async function upsertJobSchedule(
  input: UpsertJobSchedule,
  client: JobsRpcClient = createAdminClient(),
): Promise<string> {
  const command = upsertJobScheduleSchema.parse(input);
  const { data, error } = await client.rpc("upsert_job_schedule", {
    p_workspace_id: command.workspaceId,
    p_job_type: command.jobType,
    p_schedule_key: command.scheduleKey,
    p_payload_json: command.payload,
    p_interval_seconds: command.intervalSeconds,
    p_next_run_at: command.nextRunAt,
    p_max_attempts: command.maxAttempts,
    p_timeout_seconds: command.timeoutSeconds,
    p_backoff_base_seconds: command.backoffBaseSeconds,
    p_payload_version: command.payloadVersion,
    p_enabled: command.enabled,
  });

  if (error) {
    throwRpcError("The job schedule could not be saved.", error);
  }
  return claimedJobSchema.shape.job_id.parse(data);
}

export async function prepareJobQueue(
  limit: number,
  client: JobsRpcClient = createAdminClient(),
): Promise<{ schedules: number; outboxEvents: number }> {
  const boundedLimit = Math.max(1, Math.min(500, Math.trunc(limit)));
  const scheduleResult = await client.rpc("materialize_due_job_schedules", {
    p_limit: boundedLimit,
    p_now: new Date().toISOString(),
  });
  if (scheduleResult.error) {
    throwRpcError(
      "Scheduled jobs could not be materialized.",
      scheduleResult.error,
    );
  }

  const outboxResult = await client.rpc("promote_outbox_events", {
    p_limit: boundedLimit,
  });
  if (outboxResult.error) {
    throwRpcError("Outbox events could not be promoted.", outboxResult.error);
  }

  return {
    schedules: Number(scheduleResult.data),
    outboxEvents: Number(outboxResult.data),
  };
}

export async function claimJobs(
  workerId: string,
  jobTypes: readonly string[],
  limit: number,
  client: JobsRpcClient = createAdminClient(),
): Promise<readonly ClaimedJob[]> {
  const parsedTypes = jobTypes.map((jobType) => jobTypeSchema.parse(jobType));
  const { data, error } = await client.rpc("claim_jobs", {
    p_worker_id: workerId,
    p_job_types: parsedTypes,
    p_limit: Math.max(1, Math.min(100, Math.trunc(limit))),
    p_now: new Date().toISOString(),
  });

  if (error) {
    throwRpcError("Jobs could not be claimed.", error);
  }
  return claimedJobSchema.array().parse(data);
}

export async function completeJob(
  job: Pick<ClaimedJob, "job_id" | "lock_token">,
  client: JobsRpcClient = createAdminClient(),
): Promise<void> {
  const { error } = await client.rpc("complete_job", {
    p_job_id: job.job_id,
    p_lock_token: job.lock_token,
    p_now: new Date().toISOString(),
  });
  if (error) {
    throwRpcError("The job completion could not be recorded.", error);
  }
}

export async function failJob(
  job: Pick<ClaimedJob, "job_id" | "lock_token">,
  failure: { errorCode: string; retryable: boolean },
  client: JobsRpcClient = createAdminClient(),
) {
  const errorCode = jobFailureCodeSchema.parse(failure.errorCode);
  const { data, error } = await client.rpc("fail_job", {
    p_job_id: job.job_id,
    p_lock_token: job.lock_token,
    p_error_code: errorCode,
    p_retryable: failure.retryable,
    p_now: new Date().toISOString(),
  });
  if (error) {
    throwRpcError("The job failure could not be recorded.", error);
  }
  return failJobResultSchema.parse(data);
}

export async function replayDeadLetterJob(
  jobId: string,
  runAfter = new Date(),
  client: JobsRpcClient = createAdminClient(),
) {
  const { data, error } = await client.rpc("replay_dead_letter_job", {
    p_job_id: claimedJobSchema.shape.job_id.parse(jobId),
    p_run_after: runAfter.toISOString(),
  });
  if (error) {
    throwRpcError("The dead-letter job could not be replayed.", error);
  }
  return replayJobResultSchema.parse(data);
}

export async function readJobQueueMetrics(
  client: JobsRpcClient = createAdminClient(),
): Promise<readonly JobQueueMetric[]> {
  const { data, error } = await client.rpc("job_queue_metrics", {
    p_now: new Date().toISOString(),
  });
  if (error) {
    throwRpcError("Job queue metrics could not be read.", error);
  }
  return jobQueueMetricSchema.array().parse(data);
}
