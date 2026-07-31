# Slipwell

Slipwell is a browser-first capture and attention system for
creator-consultants with recurring client work.

The current application renders the validated SLIP-003–005 prototype while the
production foundation is built behind it. Prototype data is synthetic and
client-side only; Supabase and AI providers are not connected yet.

## Prerequisites

- Node.js 24
- npm 11

The repository includes an `.nvmrc` for version managers that support it.

## Local setup

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Typed capture remains
available in browsers where microphone access is unavailable or denied.

`NEXT_PUBLIC_APP_URL` is required and must be an absolute HTTP(S) URL. Startup
and production builds fail with a focused error when required configuration is
missing or invalid. Keep real secrets in ignored `.env.local` files; only safe
example values belong in `.env.example`.

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
| `npm run quality` | Run formatting, lint, types, unit tests, and build |
| `npm run ci` | Run every pull-request quality gate, including E2E tests |

Install Playwright's Chromium binary once before running E2E tests on a new
machine:

```sh
npx playwright install chromium
```

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

## Prototype references

See the guides for [SLIP-003](docs/prototypes/slip-003.md) and
[SLIP-004](docs/prototypes/slip-004.md), plus the frozen private-beta contract
in [DR-0001](docs/decisions/0001-private-beta-interaction-contract.md).
