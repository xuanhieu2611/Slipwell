import { z } from "zod";

const requiredEnvironmentKeys = [
  "SLIPWELL_ENVIRONMENT",
  "NEXT_PUBLIC_APP_URL",
] as const;

const productionOnlyEnvironmentKeys = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_DB_PASSWORD",
  "GOOGLE_CLIENT_SECRET",
  "OAUTH_TOKEN_ENCRYPTION_KEY",
  "TRANSCRIPTION_API_KEY",
  "AI_PROVIDER_API_KEY",
] as const;

const environmentSchema = z.object({
  SLIPWELL_ENVIRONMENT: z.enum(["local", "preview", "production"]),
  NEXT_PUBLIC_APP_URL: z
    .url("must be a valid absolute URL")
    .refine(
      (value) => value.startsWith("http://") || value.startsWith("https://"),
      "must use the http or https protocol",
    ),
  VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
});

export type Environment = Readonly<
  Pick<
    z.infer<typeof environmentSchema>,
    "SLIPWELL_ENVIRONMENT" | "NEXT_PUBLIC_APP_URL"
  >
>;

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

  const issues: string[] = [];
  const { SLIPWELL_ENVIRONMENT, NEXT_PUBLIC_APP_URL, VERCEL_ENV } = result.data;

  if (
    SLIPWELL_ENVIRONMENT === "production" &&
    !NEXT_PUBLIC_APP_URL.startsWith("https://")
  ) {
    issues.push("NEXT_PUBLIC_APP_URL must use https in production");
  }

  const expectedVercelEnvironment = {
    local: "development",
    preview: "preview",
    production: "production",
  }[SLIPWELL_ENVIRONMENT];

  if (VERCEL_ENV && VERCEL_ENV !== expectedVercelEnvironment) {
    issues.push(
      `SLIPWELL_ENVIRONMENT ${SLIPWELL_ENVIRONMENT} does not match VERCEL_ENV ${VERCEL_ENV}`,
    );
  }

  if (SLIPWELL_ENVIRONMENT !== "production") {
    for (const key of productionOnlyEnvironmentKeys) {
      if (environment[key]?.trim()) {
        issues.push(`${key} must not be available outside production`);
      }
    }
  }

  if (issues.length > 0) {
    throw new EnvironmentValidationError(issues);
  }

  return Object.freeze({
    SLIPWELL_ENVIRONMENT,
    NEXT_PUBLIC_APP_URL,
  });
}
