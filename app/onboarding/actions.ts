"use server";

import { createClient } from "@/src/lib/supabase/server";
import {
  onboardingStateSchema,
  workspacePreferencesSchema,
} from "@/src/modules/identity/identity";

export type SaveWorkspacePreferencesResult =
  | { readonly success: true }
  | {
      readonly success: false;
      readonly message: string;
      readonly sessionExpired?: boolean;
    };

export async function saveWorkspacePreferences(
  input: unknown,
): Promise<SaveWorkspacePreferencesResult> {
  const preferences = workspacePreferencesSchema.safeParse(input);

  if (!preferences.success) {
    return { success: false, message: "Check your timezone and preferences." };
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();

  if (!claims) {
    return {
      success: false,
      message: "Your session has expired. Sign in again.",
      sessionExpired: true,
    };
  }

  const { data, error } = await supabase.rpc("complete_workspace_preferences", {
    p_timezone: preferences.data.timezone,
    p_locale: preferences.data.locale,
    p_week_start: preferences.data.weekStart,
    p_morning_time: preferences.data.morningTime,
  });

  if (error || !onboardingStateSchema.safeParse(data).success) {
    return {
      success: false,
      message: "We could not save your preferences. Please try again.",
    };
  }

  return { success: true };
}
