import { redirect } from "next/navigation";
import { OnboardingForm } from "./onboarding-form";
import { getSupabasePublicConfiguration } from "@/src/config/environment";
import { getCurrentIdentity } from "@/src/modules/identity/server";
import { signInPathForSessionExpiry } from "@/src/modules/identity/identity";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  if (!getSupabasePublicConfiguration(process.env)) {
    redirect("/");
  }

  const identity = await getCurrentIdentity();

  if (!identity) {
    redirect(signInPathForSessionExpiry());
  }

  return (
    <main className="auth-page">
      <OnboardingForm
        locale={identity.locale}
        morningTime={identity.morning_time}
        timezone={identity.timezone}
        weekStart={identity.week_start}
      />
    </main>
  );
}
