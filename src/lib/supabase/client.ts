"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfiguration } from "@/src/config/environment";

export function createClient() {
  const configuration = getSupabasePublicConfiguration(process.env);

  if (!configuration) {
    throw new Error("Supabase is not configured for this environment.");
  }

  return createBrowserClient(configuration.url, configuration.publishableKey);
}
