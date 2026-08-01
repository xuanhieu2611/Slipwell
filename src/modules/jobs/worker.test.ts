import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("../../lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import type { JobsRpcClient } from "./server";
import { JobExecutionError, runJobWorker } from "./worker";

const jobId = "81000000-0000-4000-8000-000000000001";
const lockToken = "81000000-0000-4000-8000-000000000002";
const workspaceId = "81000000-0000-4000-8000-000000000003";

function claimedJob() {
  return {
    job_id: jobId,
    workspace_id: workspaceId,
    job_type: "test.effect",
    payload_json: { entity_id: "opaque-entity" },
    payload_version: 1,
    attempt: 1,
    max_attempts: 5,
    timeout_seconds: 30,
    lock_token: lockToken,
    effect_key: `job:${jobId}:effect`,
  };
}

function metric() {
  return {
    job_type: "test.effect",
    queued_count: 0,
    running_count: 0,
    dead_letter_count: 0,
    oldest_queued_age_seconds: 0,
    failures_last_hour: 0,
    measured_at: new Date().toISOString(),
  };
}

function rpcClient(
  resolver: (name: string, parameters: unknown) => unknown,
): JobsRpcClient {
  return {
    rpc: vi.fn(async (name: string, parameters?: unknown) => ({
      data: resolver(name, parameters),
      error: null,
    })),
  } as unknown as JobsRpcClient;
}

describe("runJobWorker", () => {
  it("preserves one effect key across concurrent at-least-once deliveries", async () => {
    const appliedEffects = new Set<string>();
    const deliveredEffectKeys: string[] = [];
    let visibleEffects = 0;
    const client = rpcClient((name) => {
      if (
        name === "materialize_due_job_schedules" ||
        name === "promote_outbox_events"
      ) {
        return 0;
      }
      if (name === "claim_jobs") {
        return [claimedJob()];
      }
      if (name === "complete_job") {
        return true;
      }
      if (name === "job_queue_metrics") {
        return [metric()];
      }
      throw new Error(`Unexpected RPC ${name}`);
    });

    const handler = vi.fn(async ({ effectKey }: { effectKey: string }) => {
      deliveredEffectKeys.push(effectKey);
      if (appliedEffects.has(effectKey)) {
        return;
      }
      appliedEffects.add(effectKey);
      await Promise.resolve();
      visibleEffects += 1;
    });

    const options = {
      workerId: "worker:test",
      handlers: { "test.effect": handler },
      client,
    };
    const [first, second] = await Promise.all([
      runJobWorker(options),
      runJobWorker(options),
    ]);

    expect(first.succeeded).toBe(1);
    expect(second.succeeded).toBe(1);
    expect(handler).toHaveBeenCalledTimes(2);
    expect(new Set(deliveredEffectKeys)).toEqual(
      new Set([`job:${jobId}:effect`]),
    );
    expect(visibleEffects).toBe(1);
  });

  it("records bounded error codes without forwarding private exception text", async () => {
    const privateMessage = "private transcript must not enter operations";
    const calls: Array<{ name: string; parameters: unknown }> = [];
    const client = rpcClient((name, parameters) => {
      calls.push({ name, parameters });
      if (
        name === "materialize_due_job_schedules" ||
        name === "promote_outbox_events"
      ) {
        return 0;
      }
      if (name === "claim_jobs") {
        return [claimedJob()];
      }
      if (name === "fail_job") {
        return {
          job_id: jobId,
          status: "retry_scheduled",
          run_after: new Date().toISOString(),
        };
      }
      if (name === "job_queue_metrics") {
        return [metric()];
      }
      throw new Error(`Unexpected RPC ${name}`);
    });

    const result = await runJobWorker({
      workerId: "worker:test",
      handlers: {
        "test.effect": async () => {
          throw new Error(privateMessage);
        },
      },
      client,
    });

    const failureCall = calls.find((call) => call.name === "fail_job");
    expect(result.failed).toBe(1);
    expect(failureCall).toBeDefined();
    expect(failureCall?.parameters).toMatchObject({
      p_error_code: "unexpected_error",
      p_retryable: true,
    });
    expect(JSON.stringify(calls)).not.toContain(privateMessage);
  });

  it("honors explicit non-retryable handler failures", async () => {
    const client = rpcClient((name, parameters) => {
      if (
        name === "materialize_due_job_schedules" ||
        name === "promote_outbox_events"
      ) {
        return 0;
      }
      if (name === "claim_jobs") {
        return [claimedJob()];
      }
      if (name === "fail_job") {
        expect(parameters).toMatchObject({
          p_error_code: "invalid_provider_response",
          p_retryable: false,
        });
        return { job_id: jobId, status: "dead_letter", run_after: null };
      }
      if (name === "job_queue_metrics") {
        return [metric()];
      }
      throw new Error(`Unexpected RPC ${name}`);
    });

    const result = await runJobWorker({
      workerId: "worker:test",
      handlers: {
        "test.effect": async () => {
          throw new JobExecutionError("invalid_provider_response", false);
        },
      },
      client,
    });

    expect(result.failed).toBe(1);
  });
});
