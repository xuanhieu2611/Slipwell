import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabasePublicConfiguration } from "@/src/config/environment";

export async function updateSession(
  request: NextRequest,
  requestHeaders: Headers = new Headers(request.headers),
): Promise<NextResponse> {
  const configuration = getSupabasePublicConfiguration(process.env);
  let response = NextResponse.next({ request: { headers: requestHeaders } });

  if (!configuration) {
    return response;
  }

  const supabase = createServerClient(
    configuration.url,
    configuration.publishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }

          response = NextResponse.next({
            request: { headers: requestHeaders },
          });

          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getClaims verifies the JWT and refreshes a rotating session cookie when it
  // can. Server components must not trust getSession() for authorization.
  await supabase.auth.getClaims();

  return response;
}
