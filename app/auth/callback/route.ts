import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { safeNextPath } from "@/src/modules/identity/identity";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeNextPath(requestUrl.searchParams.get("next"), "/onboarding");

  if (!code) {
    return NextResponse.redirect(
      new URL("/sign-in?reason=callback-error", requestUrl),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL("/sign-in?reason=callback-error", requestUrl),
    );
  }

  return NextResponse.redirect(new URL(next, requestUrl));
}
