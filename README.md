# Slipwell

Slipwell is a browser-first capture and attention system for
creator-consultants with recurring client work.

The current application renders the validated SLIP-003–005 prototype while the
production foundation is built behind it. Prototype data is synthetic and
client-side only; Supabase and AI providers are not connected yet.

## Prerequisites

- Node.js 24
- npm 11
- Docker Desktop, Podman, or another Docker-compatible runtime for local
  Supabase migration verification

The repository includes an `.nvmrc` for version managers that support it.

## Local setup

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Typed capture remains
available in browsers where microphone access is unavailable or denied.

`SLIPWELL_ENVIRONMENT` and `NEXT_PUBLIC_APP_URL` are required. The environment
must be `local`, `preview`, or `production`, and the URL must be an absolute
HTTP(S) URL. Production requires HTTPS. Startup and production builds fail with
a focused error when required configuration is missing, invalid, or exposes a
known production-only credential to a local or preview build. Keep real secrets
in ignored `.env.local` files; only safe example values belong in
`.env.example`.

`SUPABASE_SERVICE_ROLE_KEY` is server-only production configuration. It must
never use a `NEXT_PUBLIC_` name or be imported into a client component. The
only privileged client factory is marked server-only; request handlers still
authorize callers before any privileged domain work.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local Next.js development server |
| `npm run build` | Create a production build |
| `npm run format` | Format supported repository files |
| `npm run format:check` | Verify formatting without changing files |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run strict TypeScript checks |
| `npm test` | Run unit tests once |
| `npm run test:unit:watch` | Run unit tests in watch mode |
| `npm run test:e2e` | Run Playwright browser tests |
| `npm run db:safety` | Reject malformed or destructive database migrations |
| `npm run db:verify` | Rebuild the local Supabase database, load synthetic seed data, and run database and RLS tests |
| `npm run quality` | Run formatting, lint, types, unit tests, and build |
| `npm run ci` | Run every pull-request quality gate, including E2E tests |

Install Playwright's Chromium binary once before running E2E tests on a new
machine:

```sh
npx playwright install chromium
```

The repository pins the Supabase CLI as a development dependency. To verify
the database locally, start a Docker-compatible runtime and run:

```sh
npx supabase start
npm run db:verify
```

See the [core schema map and migration policy](docs/schema/core-schema.md) for
the relational model and production recovery procedure.

## Repository structure

- `app/`: Next.js routes, layouts, and global styling.
- `components/`: temporary prototype UI components.
- `src/config/`: validated runtime configuration.
- `src/modules/`: application service boundaries for the modular monolith.
- `tests/`: browser-level acceptance and regression tests.
- `docs/`: decision records, research, and prototype notes.

The service-boundary rules in [`src/modules/README.md`](src/modules/README.md)
are the starting architecture contract. Route handlers and background workers
must call module application services rather than updating persistence directly.

## Contributor conventions

- Keep TypeScript strict and validate external data at its boundary.
- Keep Next.js route handlers thin; domain invariants belong in modules.
- Import another module only through its public entry point once it has one.
- Preserve immutable capture evidence and workspace authorization boundaries.
- Add or update tests with behavior changes.
- Run `npm run quality` and relevant E2E tests before opening a pull request.
- Never commit credentials, `.env.local`, real customer data, or sensitive
  content in logs and fixtures.

Product behavior is governed by [`slipwell-specification.md`](slipwell-specification.md),
and active work is scoped by the corresponding GitHub issue.

## Deployment and environments

Slipwell currently has one persistent hosted environment: production on
Vercel. Local development uses synthetic data, and Vercel preview deployments
must remain free of application, database, OAuth, and provider credentials.
Production secrets are scoped to Vercel's Production environment and are never
committed.

Every release reaches `main` through a pull request whose required CI check runs
quality gates, dependency auditing, a full local database rebuild with
synthetic seed data, and the database migration safety policy.
The deployment and rollback procedure is documented in
[`docs/runbooks/deployment-and-rollback.md`](docs/runbooks/deployment-and-rollback.md).
The single-environment decision and the conditions for revisiting it are
recorded in
[`DR-0002`](docs/decisions/0002-founder-only-production-environment.md).

## Authentication setup

Production authentication uses Supabase Auth with Google and Apple OAuth. The
application runs its synthetic prototype locally until the two public Supabase
values in `.env.local` are supplied. Provider secrets are configured only in
Supabase and are never Vercel or browser environment variables. Follow the
[Supabase authentication runbook](docs/runbooks/supabase-authentication.md)
when the production project and provider credentials are ready.

## Prototype references

See the guides for [SLIP-003](docs/prototypes/slip-003.md) and
[SLIP-004](docs/prototypes/slip-004.md), plus the frozen private-beta contract
in [DR-0001](docs/decisions/0001-private-beta-interaction-contract.md).
