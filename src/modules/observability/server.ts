import "server-only";

import { z } from "zod";
import { createAdminClient } from "../../lib/supabase/admin";
import type { JobQueueMetric } from "../jobs";
import { emitJobQueueObservability } from "./alerts";
import {
  getObservabilityConfiguration,
  type AlertThresholds,
  type ObservabilityConfiguration,
  type TelemetryEndpointConfiguration,
} from "./config";
import {
  createObservability,
  type ObservabilityClient,
  type TelemetryDestination,
  type TelemetryEnvelope,
} from "./observability";

class JsonConsoleDestination implements TelemetryDestination {
  send(record: TelemetryEnvelope): void {
    console.info(JSON.stringify(record));
  }
}

class NoopDestination implements TelemetryDestination {
  send(record: TelemetryEnvelope): void {
    void record;
  }
}

class HttpTelemetryDestination implements TelemetryDestination {
  constructor(private readonly configuration: TelemetryEndpointConfiguration) {}

  async send(record: TelemetryEnvelope): Promise<void> {
    const response = await fetch(this.configuration.endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.configuration.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(record),
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      throw new Error("Telemetry delivery failed.");
    }
  }
}

function destination(
  configuration: TelemetryEndpointConfiguration | null,
  fallback: TelemetryDestination,
): TelemetryDestination {
  return configuration ? new HttpTelemetryDestination(configuration) : fallback;
}

export type ServerObservability = Readonly<{
  client: ObservabilityClient;
  alerts: AlertThresholds;
}>;

export function createServerObservability(
  configuration: ObservabilityConfiguration,
): ServerObservability {
  return Object.freeze({
    client: createObservability({
      environment: configuration.environment,
      release: configuration.release,
      operationsDestination: destination(
        configuration.operations,
        new JsonConsoleDestination(),
      ),
      analyticsDestination: destination(
        configuration.analytics,
        new NoopDestination(),
      ),
    }),
    alerts: configuration.alerts,
  });
}

let cached: ServerObservability | undefined;

export function getServerObservability(): ServerObservability {
  cached ??= createServerObservability(
    getObservabilityConfiguration(process.env),
  );
  return cached;
}

export async function exportJobQueueObservability(
  metrics: readonly JobQueueMetric[],
  serverObservability: ServerObservability = getServerObservability(),
): Promise<void> {
  await emitJobQueueObservability(
    metrics,
    serverObservability.client,
    serverObservability.alerts,
  );
}

const captureTraceLineageSchema = z.object({
  request_id: z.string().uuid().nullable(),
  capture_id: z.string().uuid(),
  job_ids: z.array(z.string().uuid()),
  ai_run_ids: z.array(z.string().uuid()),
  proposal_ids: z.array(z.string().uuid()),
  mutation_ids: z.array(z.string().uuid()),
});

export type CaptureTraceLineage = z.infer<typeof captureTraceLineageSchema>;
export type ObservabilityRpcClient = Pick<
  ReturnType<typeof createAdminClient>,
  "rpc"
>;

export async function readCaptureTraceLineage(
  workspaceId: string,
  captureId: string,
  client: ObservabilityRpcClient = createAdminClient(),
): Promise<CaptureTraceLineage | null> {
  const identifiers = z
    .object({ workspaceId: z.string().uuid(), captureId: z.string().uuid() })
    .parse({ workspaceId, captureId });
  const { data, error } = await client.rpc("capture_trace_lineage", {
    p_workspace_id: identifiers.workspaceId,
    p_capture_id: identifiers.captureId,
  });

  if (error) {
    throw new Error("Capture trace lineage could not be read.", {
      cause: error,
    });
  }

  const rows = captureTraceLineageSchema.array().parse(data);
  return rows.at(0) ?? null;
}
