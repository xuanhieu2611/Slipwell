import { z } from "zod";
import { createClient } from "@/src/lib/supabase/server";
import { onboardingStateSchema } from "./identity";

const identitySchema = z.object({
  user_id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  locale: z.string(),
  timezone: z.string(),
  week_start: z.number().int().min(0).max(6),
  morning_time: z.string(),
  onboarding_state: onboardingStateSchema,
});

export type Identity = z.infer<typeof identitySchema>;

/**
 * Reads identity through the database's authorization boundary. A missing row
 * is treated the same as a missing session so an inconsistent account cannot
 * reveal application content.
 */
export async function getCurrentIdentity(): Promise<Identity | null> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();

  if (!claims) {
    return null;
  }

  const { data, error } = await supabase.rpc("get_my_identity");

  if (error || !Array.isArray(data) || data.length !== 1) {
    return null;
  }

  const identity = identitySchema.safeParse(data[0]);
  return identity.success ? identity.data : null;
}
