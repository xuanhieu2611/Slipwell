export interface MigrationFile {
  readonly path: string;
  readonly sql: string;
}

export interface MigrationSafetyIssue {
  readonly path: string;
  readonly message: string;
}

const migrationFilenamePattern = /^\d{14}_[a-z0-9_]+\.sql$/;

const destructiveStatements = [
  {
    pattern: /\bdrop\s+database\b/i,
    message: "DROP DATABASE is not allowed",
  },
  {
    pattern: /\bdrop\s+schema\b/i,
    message: "DROP SCHEMA is not allowed",
  },
  {
    pattern: /\bdrop\s+table\b/i,
    message: "DROP TABLE is not allowed",
  },
  {
    pattern: /\btruncate(?:\s+table)?\b/i,
    message: "TRUNCATE is not allowed",
  },
  {
    pattern: /\balter\s+table\b[^;]*?\bdrop\s+(?:column|constraint)\b/i,
    message: "destructive ALTER TABLE is not allowed",
  },
  {
    pattern: /\bdelete\s+from\s+[^;]+;/i,
    message: "bulk DELETE statements require a reviewed forward-fix plan",
  },
] as const;

function stripSqlComments(sql: string): string {
  return sql.replace(/\/\*[\s\S]*?\*\//g, "").replace(/--.*$/gm, "");
}

export function inspectMigrationSafety(
  migrations: readonly MigrationFile[],
): readonly MigrationSafetyIssue[] {
  const issues: MigrationSafetyIssue[] = [];

  for (const migration of migrations) {
    const filename = migration.path.split("/").at(-1) ?? migration.path;

    if (!migrationFilenamePattern.test(filename)) {
      issues.push({
        path: migration.path,
        message:
          "migration filename must match YYYYMMDDHHMMSS_lower_snake_case.sql",
      });
    }

    const executableSql = stripSqlComments(migration.sql);

    for (const statement of destructiveStatements) {
      if (statement.pattern.test(executableSql)) {
        issues.push({
          path: migration.path,
          message: statement.message,
        });
      }
    }
  }

  return issues;
}
