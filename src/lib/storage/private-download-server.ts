import "server-only";

import { getCurrentIdentity } from "@/src/modules/identity/server";
import { createClient } from "@/src/lib/supabase/server";
import {
  createPrivateDownloadUrl,
  type PrivateDownloadRequest,
} from "./private-download";

/**
 * Mints at most a five-minute private URL for the authenticated workspace.
 * Storage RLS remains the final authorization boundary for the object itself.
 */
export async function createCurrentWorkspacePrivateDownloadUrl(
  request: PrivateDownloadRequest,
): Promise<string> {
  const identity = await getCurrentIdentity();

  if (!identity || identity.workspace_id !== request.workspaceId) {
    throw new Error("The requested private download is unavailable.");
  }

  return createPrivateDownloadUrl(await createClient(), request);
}
