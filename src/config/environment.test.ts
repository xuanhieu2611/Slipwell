import { describe, expect, it } from "vitest";
import {
  EnvironmentValidationError,
  getSupabasePublicConfiguration,
  SupabaseConfigurationError,
  validateEnvironment,
} from "./environment";

describe("validateEnvironment", () => {
  it("returns validated public configuration", () => {
    expect(
      validateEnvironment({
        SLIPWELL_ENVIRONMENT: "production",
        NEXT_PUBLIC_APP_URL: "https://slipwell.example",
      }),
    ).toEqual({
      SLIPWELL_ENVIRONMENT: "production",
      NEXT_PUBLIC_APP_URL: "https://slipwell.example",
    });
  });

  it("identifies missing required configuration", () => {
    expect(() => validateEnvironment({})).toThrowError(
      new EnvironmentValidationError([
        "SLIPWELL_ENVIRONMENT is required",
        "NEXT_PUBLIC_APP_URL is required",
      ]),
    );
  });

  it("rejects non-HTTP URLs without including unrelated values", () => {
    const unrelatedSecret = "do-not-print-this";

    expect(() =>
      validateEnvironment({
        SLIPWELL_ENVIRONMENT: "local",
        NEXT_PUBLIC_APP_URL: "ftp://slipwell.example",
        UNRELATED_SECRET: unrelatedSecret,
      }),
    ).toThrowError("NEXT_PUBLIC_APP_URL must use the http or https protocol");

    try {
      validateEnvironment({
        SLIPWELL_ENVIRONMENT: "local",
        NEXT_PUBLIC_APP_URL: "ftp://slipwell.example",
        UNRELATED_SECRET: unrelatedSecret,
      });
    } catch (error) {
      expect(String(error)).not.toContain(unrelatedSecret);
    }
  });

  it("requires HTTPS for production", () => {
    expect(() =>
      validateEnvironment({
        SLIPWELL_ENVIRONMENT: "production",
        NEXT_PUBLIC_APP_URL: "http://slipwell.example",
      }),
    ).toThrowError("NEXT_PUBLIC_APP_URL must use https in production");
  });

  it("rejects mismatched Vercel and Slipwell environments", () => {
    expect(() =>
      validateEnvironment({
        SLIPWELL_ENVIRONMENT: "preview",
        NEXT_PUBLIC_APP_URL: "https://preview.slipwell.example",
        VERCEL_ENV: "production",
      }),
    ).toThrowError(
      "SLIPWELL_ENVIRONMENT preview does not match VERCEL_ENV production",
    );
  });

  it.each([
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_DB_PASSWORD",
    "GOOGLE_CLIENT_SECRET",
    "OAUTH_TOKEN_ENCRYPTION_KEY",
    "TRANSCRIPTION_API_KEY",
    "AI_PROVIDER_API_KEY",
  ])("rejects %s outside production without printing its value", (key) => {
    const secret = "private-value-that-must-not-appear";

    try {
      validateEnvironment({
        SLIPWELL_ENVIRONMENT: "preview",
        NEXT_PUBLIC_APP_URL: "https://preview.slipwell.example",
        [key]: secret,
      });
      expect.unreachable("validation should have failed");
    } catch (error) {
      expect(String(error)).toContain(
        `${key} must not be available outside production`,
      );
      expect(String(error)).not.toContain(secret);
    }
  });
});

describe("getSupabasePublicConfiguration", () => {
  it("leaves the synthetic local experience disabled when both values are absent", () => {
    expect(getSupabasePublicConfiguration({})).toBeNull();
  });

  it("returns only the public browser configuration", () => {
    expect(
      getSupabasePublicConfiguration({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
      }),
    ).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "sb_publishable_example",
    });
  });

  it("rejects a partial configuration without echoing any key", () => {
    const key = "private-looking-public-key";

    try {
      getSupabasePublicConfiguration({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key,
      });
      expect.unreachable("configuration should have failed");
    } catch (error) {
      expect(error).toBeInstanceOf(SupabaseConfigurationError);
      expect(String(error)).not.toContain(key);
    }
  });
});
