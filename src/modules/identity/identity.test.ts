import { describe, expect, it } from "vitest";
import {
  hasCompletedPreferences,
  onboardingStateSchema,
  safeNextPath,
  signInPathAfterSignOut,
  signInPathForSessionExpiry,
  workspacePreferencesSchema,
} from "./identity";

describe("workspacePreferencesSchema", () => {
  it("accepts the workspace defaults required for a first run", () => {
    expect(
      workspacePreferencesSchema.parse({
        timezone: "America/Vancouver",
        locale: "en-CA",
        weekStart: 1,
        morningTime: "09:00",
      }),
    ).toEqual({
      timezone: "America/Vancouver",
      locale: "en-CA",
      weekStart: 1,
      morningTime: "09:00",
    });
  });

  it("rejects a non-IANA timezone and an invalid week start", () => {
    const preferences = workspacePreferencesSchema.safeParse({
      timezone: "PST",
      locale: "en",
      weekStart: 7,
      morningTime: "09:00",
    });

    expect(preferences.success).toBe(false);
  });
});

describe("onboarding state", () => {
  it("identifies resumable onboarding before preferences are complete", () => {
    const state = onboardingStateSchema.parse({
      version: 1,
      completed_steps: {
        preferences: false,
        calendar: false,
        workflows: false,
      },
      last_completed_step: null,
    });

    expect(hasCompletedPreferences(state)).toBe(false);
  });
});

describe("session redirects", () => {
  it("returns signed-out and expired sessions to sign-in and rejects external callback targets", () => {
    expect(signInPathForSessionExpiry()).toBe(
      "/sign-in?reason=session-expired",
    );
    expect(signInPathAfterSignOut()).toBe("/sign-in?reason=signed-out");
    expect(safeNextPath("/onboarding")).toBe("/onboarding");
    expect(safeNextPath("https://untrusted.example")).toBe("/");
    expect(safeNextPath("//untrusted.example")).toBe("/");
  });
});
