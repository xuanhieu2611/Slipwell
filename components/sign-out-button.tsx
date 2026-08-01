"use client";

import { useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { signInPathAfterSignOut } from "@/src/modules/identity/identity";

export function SignOutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function signOut() {
    setIsSigningOut(true);
    await createClient().auth.signOut();
    window.location.assign(signInPathAfterSignOut());
  }

  return (
    <button
      className="sign-out-button"
      disabled={isSigningOut}
      onClick={signOut}
      type="button"
    >
      {isSigningOut ? "Signing out…" : "Sign out"}
    </button>
  );
}
