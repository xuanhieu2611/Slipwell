import "server-only";

import { createAdminClient } from "../../lib/supabase/admin";
import {
  domainMutationResultSchema,
  domainMutationSchema,
  type DomainMutationResult,
  type UndoDomainMutationResult,
  undoDomainMutationResultSchema,
  undoDomainMutationSchema,
} from "./activity";

export type MutationRpcClient = Pick<
  ReturnType<typeof createAdminClient>,
  "rpc"
>;

export async function applyDomainMutation(
  input: unknown,
  client: MutationRpcClient = createAdminClient(),
): Promise<DomainMutationResult> {
  const command = domainMutationSchema.parse(input);
  const { data, error } = await client.rpc("apply_domain_mutation", {
    p_workspace_id: command.workspaceId,
    p_actor_id: command.actorId,
    p_reason: command.reason,
    p_entity_type: command.entityType,
    p_entity_id: command.entityId ?? null,
    p_operation: command.operation,
    p_fields: command.fields,
    p_expected_version: command.expectedVersion ?? null,
    p_idempotency_key: command.idempotencyKey,
    p_event_type: command.eventType,
    p_qualifies_as_attention: command.qualifiesAsAttention,
    p_source_capture_id: command.sourceCaptureId,
    p_activity_metadata: command.activityMetadata,
  });

  if (error) {
    throw new Error("The domain change could not be saved.", { cause: error });
  }

  return domainMutationResultSchema.parse(data);
}

export async function undoDomainMutation(
  input: unknown,
  client: MutationRpcClient = createAdminClient(),
): Promise<UndoDomainMutationResult> {
  const command = undoDomainMutationSchema.parse(input);
  const { data, error } = await client.rpc("undo_domain_mutation", {
    p_workspace_id: command.workspaceId,
    p_actor_id: command.actorId,
    p_mutation_id: command.mutationId,
  });

  if (error) {
    throw new Error("The change could not be undone.", { cause: error });
  }

  return undoDomainMutationResultSchema.parse(data);
}
