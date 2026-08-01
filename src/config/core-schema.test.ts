import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repositoryRoot = process.cwd();
const migrationPath = join(
  repositoryRoot,
  "supabase/migrations/20260801014648_core_beta_schema.sql",
);
const seedPath = join(repositoryRoot, "supabase/seed.sql");
const schemaDocsPath = join(repositoryRoot, "docs/schema/core-schema.md");

function readRequiredFile(path: string): string {
  expect(existsSync(path)).toBe(true);
  return readFileSync(path, "utf8");
}

describe("SLIP-009 core schema migration", () => {
  const expectedTables = [
    "captures",
    "capture_transcripts",
    "capture_proposals",
    "ai_runs",
    "domains",
    "project_templates",
    "projects",
    "retainer_settings",
    "retainer_deliverable_templates",
    "retainer_task_templates",
    "retainer_cycles",
    "retainer_deliverables",
    "tasks",
    "people",
    "person_dates",
    "notes",
    "tags",
    "taggings",
    "entity_links",
    "activity_events",
    "mutation_events",
    "slipping_rules",
    "slipping_signals",
    "daily_priorities",
    "search_documents",
    "calendar_connections",
    "calendar_sources",
    "calendar_events",
    "notification_preferences",
    "device_installations",
    "notification_deliveries",
    "jobs",
    "exports",
  ] as const;

  it("creates every beta record family with RLS enabled", () => {
    const sql = readRequiredFile(migrationPath);

    for (const table of expectedTables) {
      expect(sql).toContain(`create table public.${table}`);
      expect(sql).toContain(
        `alter table public.${table} enable row level security;`,
      );
    }
  });

  it("preserves source evidence and database-enforced idempotency", () => {
    const sql = readRequiredFile(migrationPath);

    expect(sql).toContain(
      "create function public.prevent_capture_source_mutation()",
    );
    expect(sql).toContain("capture source evidence is immutable");
    expect(sql).toContain("unique (workspace_id, idempotency_key)");
    expect(sql).toContain("unique (project_id, cycle_key)");
    expect(sql).toContain("tasks_generated_retainer_task_key");
    expect(sql).toContain("unique (deduplication_key)");
    expect(sql).toContain("unique (job_type, deduplication_key)");
    expect(sql).toContain("on delete set null (source_capture_id)");
  });

  it("ships synthetic local data and migration documentation", () => {
    const seed = readRequiredFile(seedPath);
    const docs = readRequiredFile(schemaDocsPath);

    expect(seed).toContain("sample-owner@slipwell.test");
    expect(seed).toContain("Synthetic development data only");
    expect(docs).toContain("## Relationship map");
    expect(docs).toContain("## Migration and recovery policy");
  });
});
