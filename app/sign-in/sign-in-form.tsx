"use client";

import { useState } from "react";
import type { Provider } from "@supabase/supabase-js";
import { createClient } from "@/src/lib/supabase/client";

type SignInFormProps = Readonly<{
  sessionExpired: boolean;
}>;

export function SignInForm({ sessionExpired }: SignInFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function signIn(provider: Provider) {
    setMessage(null);
    setIsSubmitting(true);

    const { error } = await createClient().auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: new URL(
          "/auth/callback",
          window.location.origin,
        ).toString(),
      },
    });

    if (error) {
      setIsSubmitting(false);
      setMessage("We could not start sign-in. Please try again.");
    }
  }

  return (
    <section aria-labelledby="sign-in-title" className="auth-card">
      <p className="auth-eyebrow">Slipwell</p>
      <h1 id="sign-in-title">Sign in to your workspace</h1>
      <p className="auth-copy">
        Your work stays in your personal workspace. Continue with a provider you
        trust.
      </p>
      {sessionExpired ? (
        <p className="auth-notice" role="status">
          Your session ended. Sign in again to continue.
        </p>
      ) : null}
      {message ? (
        <p className="auth-error" role="alert">
          {message}
        </p>
      ) : null}
      <div className="auth-providers">
        <button
          className="auth-provider"
          disabled={isSubmitting}
          onClick={() => signIn("google")}
          type="button"
        >
          Continue with Google
        </button>
        <button
          className="auth-provider"
          disabled={isSubmitting}
          onClick={() => signIn("apple")}
          type="button"
        >
          Continue with Apple
        </button>
      </div>
    </section>
  );
}
