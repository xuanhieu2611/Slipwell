import { describe, expect, it } from "vitest";
import { inspectMigrationSafety } from "./database-safety";

describe("inspectMigrationSafety", () => {
  it("accepts an additive timestamped migration", () => {
    expect(
      inspectMigrationSafety([
        {
          path: "supabase/migrations/20260730090000_create_workspaces.sql",
          sql: "create table workspaces (id uuid primary key);",
        },
      ]),
    ).toEqual([]);
  });

  it("rejects malformed migration names", () => {
    expect(
      inspectMigrationSafety([
        {
          path: "supabase/migrations/create-workspaces.sql",
          sql: "select 1;",
        },
      ]),
    ).toEqual([
      {
        path: "supabase/migrations/create-workspaces.sql",
        message:
          "migration filename must match YYYYMMDDHHMMSS_lower_snake_case.sql",
      },
    ]);
  });

  it.each([
    ["drop table workspaces;", "DROP TABLE is not allowed"],
    ["truncate table workspaces;", "TRUNCATE is not allowed"],
    [
      "alter table workspaces drop column timezone;",
      "destructive ALTER TABLE is not allowed",
    ],
    [
      "delete from workspaces;",
      "bulk DELETE statements require a reviewed forward-fix plan",
    ],
  ])("rejects destructive SQL: %s", (sql, message) => {
    expect(
      inspectMigrationSafety([
        {
          path: "supabase/migrations/20260730090000_unsafe_change.sql",
          sql,
        },
      ]),
    ).toEqual([
      {
        path: "supabase/migrations/20260730090000_unsafe_change.sql",
        message,
      },
    ]);
  });

  it("does not treat comments as executable destructive SQL", () => {
    expect(
      inspectMigrationSafety([
        {
          path: "supabase/migrations/20260730090000_safe_change.sql",
          sql: [
            "-- Never run: drop table workspaces;",
            "/* truncate table workspaces; */",
            "alter table workspaces add column timezone text;",
          ].join("\n"),
        },
      ]),
    ).toEqual([]);
  });
});
