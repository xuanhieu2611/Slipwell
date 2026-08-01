"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfiguration } from "@/src/config/environment";

export function createClient() {
  // Next.js inlines public browser variables only for static property access.
  // Passing process.env itself leaves this client with an empty object at
  // runtime, even when .env contains both values.
  const configuration = getSupabasePublicConfiguration({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!configuration) {
    throw new Error("Supabase is not configured for this environment.");
  }

  return createBrowserClient(configuration.url, configuration.publishableKey);
}
