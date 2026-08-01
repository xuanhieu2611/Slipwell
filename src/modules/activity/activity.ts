import { z } from "zod";

export const betaEntityTypeSchema = z.enum([
  "domain",
  "task",
  "project",
  "person",
  "note",
]);

export const mutationReasonSchema = z.enum([
  "user",
  "capture_accept",
  "sync",
  "system_job",
]);

const activityMetadataSchema = z
  .object({
    event_version: z.number().finite().optional(),
  })
  .strict();

const baseCommandSchema = z.object({
  workspaceId: z.string().uuid(),
  actorId: z.string().uuid().nullable(),
  reason: mutationReasonSchema,
  entityType: betaEntityTypeSchema,
  idempotencyKey: z.string().trim().min(1).max(200),
  eventType: z.string().trim().min(1).max(120),
  qualifiesAsAttention: z.boolean().default(false),
  sourceCaptureId: z.string().uuid().nullable().default(null),
  activityMetadata: activityMetadataSchema.default({}),
});

export const createDomainMutationSchema = baseCommandSchema.extend({
  operation: z.literal("create"),
  entityId: z.string().uuid().nullable().optional(),
  expectedVersion: z.null().optional(),
  fields: z.record(z.string(), z.unknown()),
});

export const updateDomainMutationSchema = baseCommandSchema.extend({
  operation: z.literal("update"),
  entityId: z.string().uuid(),
  expectedVersion: z.number().int().positive(),
  fields: z.record(z.string(), z.unknown()),
});

export const domainMutationSchema = z.discriminatedUnion("operation", [
  createDomainMutationSchema,
  updateDomainMutationSchema,
]);

export type DomainMutation = z.infer<typeof domainMutationSchema>;

export const domainMutationResultSchema = z.object({
  mutation_id: z.string().uuid(),
  entity_id: z.string().uuid(),
  entity_type: betaEntityTypeSchema,
  idempotent_replay: z.boolean(),
});

export type DomainMutationResult = z.infer<typeof domainMutationResultSchema>;

export const undoDomainMutationSchema = z.object({
  workspaceId: z.string().uuid(),
  actorId: z.string().uuid(),
  mutationId: z.string().uuid(),
});

export const undoDomainMutationResultSchema = z.object({
  mutation_id: z.string().uuid(),
  undone: z.literal(true),
  idempotent_replay: z.boolean(),
});

export type UndoDomainMutationResult = z.infer<
  typeof undoDomainMutationResultSchema
>;
