# Production deployment and rollback

This runbook implements
[DR-0002](../decisions/0002-founder-only-production-environment.md). Slipwell
currently has one persistent hosted environment: Vercel Production.

## Release path

1. Open a pull request into `main`.
2. Confirm the required CI check passes. It runs dependency auditing, the
   database migration safety policy, formatting, linting, strict type checking,
   unit tests, a production build, and browser tests.
3. Review the diff for credentials, generated files, destructive migrations,
   and unrelated changes.
4. Merge the pull request. Vercel's Git integration deploys `main` to
   Production.
5. Inspect the deployment and exercise the home page at desktop and 320 px
   widths. Confirm typed capture still works when microphone access is denied.

Direct pushes to `main` bypass the intended release review and are not an
approved deployment path.

## Secret scopes

- Vercel **Production** may contain application and provider credentials.
- Vercel **Preview** and **Development** contain only non-sensitive build
  configuration. They must not contain database URLs/passwords, Supabase
  service-role keys, OAuth secrets, encryption keys, or AI-provider keys.
- GitHub secrets are stored in repository or Production-environment settings,
  never workflow YAML.
- `.env.local` is ignored and may contain local-only values. `.env.example`
  contains names and safe placeholders only.

The application build also rejects known production-only keys whenever
`SLIPWELL_ENVIRONMENT` is `local` or `preview`.

## Application rollback

Use this when a production deployment introduces an application regression and
no database change prevents the previous build from running.

1. Stop further merges.
2. Find the last known-good immutable deployment:

   ```sh
   vercel ls --environment production --format json
   vercel inspect <deployment-url>
   ```

3. Roll production traffic back:

   ```sh
   vercel rollback <deployment-url>
   ```

4. Inspect the production URL and repeat the release smoke checks.
5. Record the affected deployment, restored deployment, time, observed impact,
   and verification in the incident or pull request.
6. Fix forward in a new pull request. Do not rewrite shared Git history.

## Database rollback boundary

Do not reverse a production database change by dropping tables, columns,
constraints, or data. The deployment safety check rejects these operations.
Restore application compatibility and apply an additive forward fix. SLIP-009
owns the full migration and recovery policy once the schema exists.

## Rollback exercise

The first exercise deployed two immutable versions with no database change,
rolled traffic to the earlier version, verified the public URL, and restored the
latest version.

- Date: 2026-07-30
- Earlier deployment: `dpl_KgoNmsGBT1G5FsryVzq2bWVueNNR`
- Later deployment: `dpl_GEfDBY1grCoY6zSB7LEGYQLfjgGY`
- Rollback result: Vercel reassigned `https://slipwell.vercel.app` to the earlier
  deployment; inspection reported Ready and the home-page title smoke check
  passed.
- Restoration result: the later deployment was promoted, inspection confirmed
  the canonical URL targeted it, and the home-page title smoke check passed.
