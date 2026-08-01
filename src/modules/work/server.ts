import "server-only";

import { applyDomainMutation, type DomainMutationResult } from "../activity";

export interface WorkActorContext {
  readonly workspaceId: string;
  readonly actorId: string;
}

export interface CreateTaskInput {
  readonly title: string;
  readonly description?: string;
  readonly idempotencyKey: string;
}

/**
 * The first work-domain entry point demonstrates the required boundary for
 * interactive requests, accepted proposals, and future workers: all writes
 * use the activity module's transaction, never a table-level client query.
 */
export async function createTask(
  context: WorkActorContext,
  input: CreateTaskInput,
): Promise<DomainMutationResult> {
  return applyDomainMutation({
    workspaceId: context.workspaceId,
    actorId: context.actorId,
    reason: "user",
    entityType: "task",
    operation: "create",
    fields: {
      title: input.title,
      ...(input.description === undefined
        ? {}
        : { description: input.description }),
    },
    idempotencyKey: input.idempotencyKey,
    eventType: "task.created",
  });
}
