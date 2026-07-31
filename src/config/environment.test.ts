import { describe, expect, it } from "vitest";
import { EnvironmentValidationError, validateEnvironment } from "./environment";

describe("validateEnvironment", () => {
  it("returns validated public configuration", () => {
    expect(
      validateEnvironment({
        NEXT_PUBLIC_APP_URL: "https://slipwell.example",
      }),
    ).toEqual({
      NEXT_PUBLIC_APP_URL: "https://slipwell.example",
    });
  });

  it("identifies missing required configuration", () => {
    expect(() => validateEnvironment({})).toThrowError(
      new EnvironmentValidationError(["NEXT_PUBLIC_APP_URL is required"]),
    );
  });

  it("rejects non-HTTP URLs without including unrelated values", () => {
    const unrelatedSecret = "do-not-print-this";

    expect(() =>
      validateEnvironment({
        NEXT_PUBLIC_APP_URL: "ftp://slipwell.example",
        UNRELATED_SECRET: unrelatedSecret,
      }),
    ).toThrowError("NEXT_PUBLIC_APP_URL must use the http or https protocol");

    try {
      validateEnvironment({
        NEXT_PUBLIC_APP_URL: "ftp://slipwell.example",
        UNRELATED_SECRET: unrelatedSecret,
      });
    } catch (error) {
      expect(String(error)).not.toContain(unrelatedSecret);
    }
  });
});
