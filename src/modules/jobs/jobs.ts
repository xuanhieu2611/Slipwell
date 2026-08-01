import { z } from "zod";

export const jobTypeSchema = z.string().regex(/^[a-z][a-z0-9_.-]{0,79}$/);

export const jobPayloadSchema = z.record(z.string(), z.unknown());

export const enqueueJobSchema = z.object({
  workspaceId: z.string().uuid().nullable(),
  jobType: jobTypeSchema,
  deduplicationKey: z.string().trim().min(1).max(160),
  payload: jobPayloadSchema.default({}),
  payloadVersion: z.number().int().positive().default(1),
  runAfter: z.iso.datetime({ offset: true }).optional(),
  maxAttempts: z.number().int().min(1).max(25).default(5),
  timeoutSeconds: z.number().int().min(1).max(600).default(300),
  backoffBaseSeconds: z.number().int().min(1).max(3600).default(15),
});

export type EnqueueJob = z.input<typeof enqueueJobSchema>;

export const enqueueJobResultSchema = z.object({
  job_id: z.string().uuid(),
  status: z.enum([
    "queued",
    "running",
    "succeeded",
    "failed",
    "dead_letter",
    "cancelled",
  ]),
  idempotent_replay: z.boolean(),
});

export type EnqueueJobResult = z.infer<typeof enqueueJobResultSchema>;

export const upsertJobScheduleSchema = z.object({
  workspaceId: z.string().uuid().nullable(),
  jobType: jobTypeSchema,
  scheduleKey: z.string().trim().min(1).max(160),
  payload: jobPayloadSchema.default({}),
  payloadVersion: z.number().int().positive().default(1),
  intervalSeconds: z.number().int().min(60).max(31_536_000),
  nextRunAt: z.iso.datetime({ offset: true }),
  maxAttempts: z.number().int().min(1).max(25).default(5),
  timeoutSeconds: z.number().int().min(1).max(600).default(300),
  backoffBaseSeconds: z.number().int().min(1).max(3600).default(15),
  enabled: z.boolean().default(true),
});

export type UpsertJobSchedule = z.input<typeof upsertJobScheduleSchema>;

export const claimedJobSchema = z.object({
  job_id: z.string().uuid(),
  workspace_id: z.string().uuid().nullable(),
  job_type: jobTypeSchema,
  payload_json: jobPayloadSchema,
  payload_version: z.number().int().positive(),
  attempt: z.number().int().positive(),
  max_attempts: z.number().int().positive(),
  timeout_seconds: z.number().int().positive(),
  lock_token: z.string().uuid(),
  effect_key: z.string().min(1),
});

export type ClaimedJob = z.infer<typeof claimedJobSchema>;

export const failJobResultSchema = z.object({
  job_id: z.string().uuid(),
  status: z.enum(["retry_scheduled", "dead_letter"]),
  run_after: z.string().nullable(),
});

export const replayJobResultSchema = z.object({
  job_id: z.string().uuid(),
  status: z.literal("queued"),
  replay_count: z.number().int().positive(),
  effect_key: z.string().min(1),
});

export const jobQueueMetricSchema = z.object({
  job_type: jobTypeSchema,
  queued_count: z.coerce.number().int().nonnegative(),
  running_count: z.coerce.number().int().nonnegative(),
  dead_letter_count: z.coerce.number().int().nonnegative(),
  oldest_queued_age_seconds: z.coerce.number().int().nonnegative(),
  failures_last_hour: z.coerce.number().int().nonnegative(),
  measured_at: z.string(),
});

export type JobQueueMetric = z.infer<typeof jobQueueMetricSchema>;

export const jobFailureCodeSchema = z
  .string()
  .regex(/^[a-z][a-z0-9_.-]{0,63}$/);
