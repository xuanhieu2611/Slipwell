import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repositoryRoot = process.cwd();
const rlsMigrationPath = join(
  repositoryRoot,
  "supabase/migrations/20260801021910_enforce_workspace_rls_and_private_storage.sql",
);
const adminClientPath = join(repositoryRoot, "src/lib/supabase/admin.ts");
const privateDownloadServerPath = join(
  repositoryRoot,
  "src/lib/storage/private-download-server.ts",
);

function readRequiredFile(path: string): string {
  expect(existsSync(path)).toBe(true);
  return readFileSync(path, "utf8");
}

describe("SLIP-010 access-control contract", () => {
  it("creates member-only policies and denies direct domain writes", () => {
    const sql = readRequiredFile(rlsMigrationPath);

    expect(sql).toContain("create function public.is_workspace_member");
    expect(sql).toContain("security definer");
    expect(sql).toContain("grant select on public.%I to authenticated");
    expect(sql).not.toMatch(
      /grant\s+(?:insert|update|delete|all)\s+on\s+public\./i,
    );
  });

  it("keeps audio and export objects private and workspace scoped", () => {
    const sql = readRequiredFile(rlsMigrationPath);

    expect(sql).toContain("'capture-audio'");
    expect(sql).toContain("'exports'");
    expect(sql).toContain("false,");
    expect(sql).toContain("can_access_workspace_storage_object");
    expect(sql).toContain("workspace_members_can_read_private_objects");
    expect(sql).toContain("workspace_members_can_update_private_objects");
  });

  it("keeps service credentials and signed-link creation in server-only modules", () => {
    const adminClient = readRequiredFile(adminClientPath);
    const privateDownloadServer = readRequiredFile(privateDownloadServerPath);

    expect(adminClient).toContain('import "server-only"');
    expect(adminClient).toContain("getSupabaseServiceConfiguration");
    expect(privateDownloadServer).toContain('import "server-only"');
    expect(privateDownloadServer).toContain("createPrivateDownloadUrl");
  });
});
