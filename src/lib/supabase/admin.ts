import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceConfiguration } from "@/src/config/environment";

/**
 * Creates a privileged client for bounded server-side jobs only. Route handlers
 * must authorize the caller before delegating to a domain service that uses it.
 */
export function createAdminClient() {
  const configuration = getSupabaseServiceConfiguration(process.env);

  if (!configuration) {
    throw new Error(
      "Supabase service access is not configured for this environment.",
    );
  }

  return createClient(configuration.url, configuration.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
