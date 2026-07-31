import { SlipwellPrototype } from "@/components/slipwell-prototype";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { getSupabasePublicConfiguration } from "@/src/config/environment";
import {
  hasCompletedPreferences,
  signInPathForSessionExpiry,
} from "@/src/modules/identity/identity";
import { getCurrentIdentity } from "@/src/modules/identity/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (!getSupabasePublicConfiguration(process.env)) {
    return <SlipwellPrototype />;
  }

  const identity = await getCurrentIdentity();

  if (!identity) {
    redirect(signInPathForSessionExpiry());
  }

  if (!hasCompletedPreferences(identity.onboarding_state)) {
    redirect("/onboarding");
  }

  return (
    <>
      <div className="signed-in-actions">
        <SignOutButton />
      </div>
      <SlipwellPrototype />
    </>
  );
}
