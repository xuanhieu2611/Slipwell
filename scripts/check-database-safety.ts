import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import {
  inspectMigrationSafety,
  type MigrationFile,
} from "../src/config/database-safety.ts";

const repositoryRoot = process.cwd();
const migrationsDirectory = join(repositoryRoot, "supabase", "migrations");

if (!existsSync(migrationsDirectory)) {
  console.log(
    "Database safety check passed: no migrations exist before SLIP-009.",
  );
  process.exit(0);
}

const migrations: MigrationFile[] = readdirSync(migrationsDirectory, {
  withFileTypes: true,
})
  .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
  .map((entry) => {
    const path = join(migrationsDirectory, entry.name);

    return {
      path: relative(repositoryRoot, path),
      sql: readFileSync(path, "utf8"),
    };
  });

const issues = inspectMigrationSafety(migrations);

if (issues.length > 0) {
  console.error("Database safety check failed:");
  for (const issue of issues) {
    console.error(`- ${issue.path}: ${issue.message}`);
  }
  process.exit(1);
}

console.log(
  `Database safety check passed for ${migrations.length} migration(s).`,
);
