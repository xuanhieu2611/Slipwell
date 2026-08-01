# Supabase authentication setup and verification

This runbook configures SLIP-008's Google and Apple OAuth sign-in. Do this only
for the single production Supabase project described in
[DR-0002](../decisions/0002-founder-only-production-environment.md). Never put
the provider credentials, Apple `.p8` signing key, Supabase database password,
or service-role key in this repository, browser variables, previews, logs, or
issue comments.

## Application configuration

1. In Supabase **Authentication → URL Configuration**, set the Site URL to the
   production `https://` Slipwell origin.
2. Add the exact production callback URL
   `https://<slipwell-origin>/auth/callback` to the redirect allow-list. Add
   `http://localhost:3000/auth/callback` only for bounded local testing.
3. Add the Supabase Project URL and publishable key to Vercel's **Production**
   environment as `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. These values are public browser
   configuration, unlike service-role credentials.
4. In local development, copy those two public values into ignored `.env.local`.

## Google

1. Create a Web OAuth client in Google Cloud. Configure only `openid`, email,
   and profile scopes.
2. Add the production Slipwell origin as an Authorized JavaScript origin.
3. Add Supabase's Google provider callback URL, shown in the Supabase Dashboard,
   as the Authorized redirect URI. Do not use Slipwell's callback route here.
4. In Supabase **Authentication → Providers → Google**, enable Google and enter
   the client ID and client secret.
5. Test sign-in with a non-owner account, complete onboarding preferences, sign
   out, and sign in again. Confirm one profile, workspace, and owner membership
   still exist.

## Apple

1. Register a Services ID and a Sign in with Apple key in Apple Developer.
2. Set the Services ID's Return URL to Supabase's Apple provider callback URL,
   shown in the Supabase Dashboard; it is not Slipwell's `/auth/callback` URL.
3. In Supabase **Authentication → Providers → Apple**, enable Apple and enter
   the Services ID, Team ID, Key ID, and generated client secret according to
   Supabase's provider form. Keep the `.p8` signing key in a restricted secret
   store.
4. Test the same first-login, replay, sign-out, and re-login flow. Apple web
   OAuth does not provide a full name, so the product must not rely on it.
5. Create a calendar reminder and rotate the Apple OAuth secret before each
   six-month expiry. Revoke and replace the signing key immediately if it is
   lost or compromised.

## Final verification

1. Run `supabase db push` from an authenticated, linked production project.
2. Run `supabase db advisors` and resolve any security findings before enabling
   invitations.
3. Verify that direct calls cannot read or update a second user's profile,
   workspace, or membership.
4. Verify a callback replay creates no extra workspace, and an expired or
   revoked browser session returns to the sign-in page without leaking prior
   content.
