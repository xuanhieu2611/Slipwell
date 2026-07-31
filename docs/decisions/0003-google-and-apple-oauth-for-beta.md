# DR-0003: Use Google and Apple OAuth for beta authentication

- **Status:** Accepted
- **Date:** 2026-07-31
- **Decision owner:** Founder
- **Related work:** SLIP-008

## Context

The initial specification described Apple Sign in and email magic links.
During SLIP-008, the founder explicitly selected Google and Apple OAuth instead
and will provide provider credentials when the production Supabase project is
ready.

## Decision

1. The beta supports Google and Apple OAuth through Supabase Auth.
2. Password and email magic-link sign-in are not enabled for this beta.
3. OAuth client secrets, Apple signing keys, and Supabase service-role keys
   remain outside Git and outside browser-exposed environment variables.
4. The production Supabase Auth configuration, redirect allow-list, and
   provider credentials are completed from the runbook before invitations are
   sent.
5. Apple web OAuth secret rotation is a six-month operational requirement.

## Consequences

- Google and Apple users have a familiar sign-in option without password
  handling in Slipwell.
- The project cannot perform a live provider login until the founder configures
  the provider credentials, so the implementation is tested with local
  database and client seams until then.
- Adding another provider requires an explicit product decision and security
  review.
