import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("../../lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import {
  applyDomainMutation,
  type MutationRpcClient,
  undoDomainMutation,
} from "./server";

const workspaceId = "10000000-0000-4000-8000-000000000001";
const actorId = "10000000-0000-4000-8000-000000000002";
const entityId = "10000000-0000-4000-8000-000000000003";
const mutationId = "10000000-0000-4000-8000-000000000004";

function rpcClient(data: unknown): MutationRpcClient {
  return {
    rpc: vi.fn().mockResolvedValue({ data, error: null }),
  } as unknown as MutationRpcClient;
}

describe("transactional activity service", () => {
  it("sends a validated task mutation to the single database command", async () => {
    const client = rpcClient({
      mutation_id: mutationId,
      entity_id: entityId,
      entity_type: "task",
      idempotent_replay: false,
    });

    await expect(
      applyDomainMutation(
        {
          workspaceId,
          actorId,
          reason: "user",
          entityType: "task",
          operation: "create",
          fields: { title: "Review draft" },
          idempotencyKey: "request-001",
          eventType: "task.created",
        },
        client,
      ),
    ).resolves.toMatchObject({ mutation_id: mutationId, entity_id: entityId });

    expect(client.rpc).toHaveBeenCalledWith("apply_domain_mutation", {
      p_workspace_id: workspaceId,
      p_actor_id: actorId,
      p_reason: "user",
      p_entity_type: "task",
      p_entity_id: null,
      p_operation: "create",
      p_fields: { title: "Review draft" },
      p_expected_version: null,
      p_idempotency_key: "request-001",
      p_event_type: "task.created",
      p_qualifies_as_attention: false,
      p_source_capture_id: null,
      p_activity_metadata: {},
    });
  });

  it("rejects sensitive activity metadata before persistence", async () => {
    const client = rpcClient({});

    await expect(
      applyDomainMutation(
        {
          workspaceId,
          actorId,
          reason: "user",
          entityType: "note",
          operation: "create",
          fields: { title: "Private note", body: "Do not expose this." },
          idempotencyKey: "request-002",
          eventType: "note.created",
          activityMetadata: { body: "Do not expose this." },
        },
        client,
      ),
    ).rejects.toThrow();
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it("delegates Undo to the idempotent inverse-mutation RPC", async () => {
    const client = rpcClient({
      mutation_id: mutationId,
      undone: true,
      idempotent_replay: true,
    });

    await expect(
      undoDomainMutation({ workspaceId, actorId, mutationId }, client),
    ).resolves.toEqual({
      mutation_id: mutationId,
      undone: true,
      idempotent_replay: true,
    });
    expect(client.rpc).toHaveBeenCalledWith("undo_domain_mutation", {
      p_workspace_id: workspaceId,
      p_actor_id: actorId,
      p_mutation_id: mutationId,
    });
  });
});
