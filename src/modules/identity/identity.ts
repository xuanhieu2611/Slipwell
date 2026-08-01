import { z } from "zod";

const validTimezones = new Set(Intl.supportedValuesOf("timeZone"));

export const onboardingStepSchema = z.enum([
  "preferences",
  "calendar",
  "workflows",
]);

export const onboardingStateSchema = z.object({
  version: z.literal(1),
  completed_steps: z.object({
    preferences: z.boolean(),
    calendar: z.boolean(),
    workflows: z.boolean(),
  }),
  last_completed_step: onboardingStepSchema.nullable(),
});

export type OnboardingState = z.infer<typeof onboardingStateSchema>;

export const workspacePreferencesSchema = z.object({
  timezone: z
    .string()
    .refine(
      (timezone) => validTimezones.has(timezone),
      "Choose an IANA timezone.",
    ),
  locale: z
    .string()
    .regex(
      /^[A-Za-z]{2,3}([_-][A-Za-z0-9]{2,8})*$/,
      "Choose a valid language tag.",
    ),
  weekStart: z.coerce.number().int().min(0).max(6),
  morningTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});

export type WorkspacePreferences = z.infer<typeof workspacePreferencesSchema>;

export function hasCompletedPreferences(state: OnboardingState): boolean {
  return state.completed_steps.preferences;
}

export function signInPathForSessionExpiry(): string {
  return "/sign-in?reason=session-expired";
}

export function signInPathAfterSignOut(): string {
  return "/sign-in?reason=signed-out";
}

export function safeNextPath(next: string | null, fallback = "/"): string {
  return next?.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
