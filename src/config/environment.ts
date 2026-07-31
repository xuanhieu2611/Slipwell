import { z } from "zod";

const requiredEnvironmentKeys = ["NEXT_PUBLIC_APP_URL"] as const;

const environmentSchema = z.object({
  NEXT_PUBLIC_APP_URL: z
    .url("must be a valid absolute URL")
    .refine(
      (value) => value.startsWith("http://") || value.startsWith("https://"),
      "must use the http or https protocol",
    ),
});

export type Environment = Readonly<z.infer<typeof environmentSchema>>;

export class EnvironmentValidationError extends Error {
  constructor(issues: readonly string[]) {
    super(`Invalid environment configuration:\n- ${issues.join("\n- ")}`);
    this.name = "EnvironmentValidationError";
  }
}

export function validateEnvironment(
  environment: Readonly<Record<string, string | undefined>>,
): Environment {
  const missingKeys = requiredEnvironmentKeys.filter(
    (key) => !environment[key]?.trim(),
  );

  if (missingKeys.length > 0) {
    throw new EnvironmentValidationError(
      missingKeys.map((key) => `${key} is required`),
    );
  }

  const result = environmentSchema.safeParse(environment);

  if (!result.success) {
    throw new EnvironmentValidationError(
      result.error.issues.map(
        (issue) => `${issue.path.join(".") || "environment"} ${issue.message}`,
      ),
    );
  }

  return Object.freeze(result.data);
}
