# DR-0002: Use one hosted production environment during founder development

- **Status:** Accepted
- **Date:** 2026-07-30
- **Decision owner:** Founder
- **Related work:** SLIP-007

## Context

SLIP-007 and specification section 13.1 originally required separate local,
staging, and production environments while also delaying production creation.
The founder is currently the only user and wants the hosted application to
match the real deployment that will later receive a custom domain and be shared
with early testers. Maintaining another persistent environment now would add
operational work without a second user cohort or production dataset to protect.

This consciously accepts more deployment risk during founder-only development.
It does not relax secret isolation, pull-request checks, rollback readiness, or
the requirement to avoid exposing production credentials to previews.

## Decision

1. Slipwell has one persistent hosted environment: **production on Vercel**.
2. Local development uses synthetic data and ignored local configuration. It is
   not a hosted data environment.
3. Vercel may create preview deployments for pull requests, but previews receive
   no database, OAuth, AI-provider, encryption, or other application
   credentials. They are UI/build validation surfaces, not data environments.
4. Production credentials are stored outside Git in Vercel's Production scope
   or a provider's secret store. GitHub receives only credentials needed for CI
   or deployment, scoped to its Production environment where applicable.
5. The Supabase project required by later identity and schema work will be the
   single production project. SLIP-007 does not create an empty database project
   before that work needs it.
6. Releases reach `main` through a pull request after required quality,
   dependency, secret, and database-safety checks. Production rollback uses
   immutable Vercel deployments. Database migrations use additive forward fixes;
   SLIP-009 will define the detailed migration policy.
7. A staging environment must not be created merely because a later backlog
   item mentions staging. This decision must be explicitly superseded first.

## Revisit triggers

Reconsider an isolated staging environment when any of these becomes true:

- non-founder data becomes important enough that a failed deployment or test
  mutation would be costly;
- database migrations, OAuth integrations, background jobs, or provider changes
  cannot be safely validated with local and preview checks;
- availability expectations make rollback testing in production unacceptable;
- the founder explicitly chooses separate release promotion.

Sharing the prototype with a small number of friends does not automatically
supersede this decision.

## Consequences

- Setup and domain attachment remain simple during founder development.
- Production and founder testing use the same runtime behavior.
- Preview builds fail if known production-only credentials leak into them.
- Rollback tests happen against production and must be brief, recorded, and
  restored immediately.
- A later move to staging is an intentional infrastructure migration, not an
  implied part of unrelated feature work.
