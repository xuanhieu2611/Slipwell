# AGENTS.md

This file is the default operating guide for agents working anywhere in the Slipwell repository. More specific `AGENTS.md` files may be added in subdirectories later; when present, the nearest file takes precedence for that subtree.

## Start every task here

Before changing code or product behavior:

1. Read this file completely.
2. Inspect the current repository state; do not assume it is still documentation-only.
3. Read the GitHub issue being implemented, including its dependencies and acceptance criteria.
4. Read the relevant sections of `slipwell-specification.md`.
5. Check `implementation-backlog.md` and the [Slipwell project board](https://github.com/users/xuanhieu2611/projects/2) for sequence, phase, priority, and scope.
6. Inspect existing code, tests, migrations, and local conventions before proposing a new abstraction.

Do not start implementation from the product idea or research documents alone. They explain why Slipwell exists, but the specification and active issue define what to build.

## Sources of truth

Use this precedence when guidance conflicts:

1. The user's current explicit request.
2. The active GitHub issue and any decision records made after it, in `docs/decisions/`.
3. `slipwell-specification.md`.
4. This `AGENTS.md`.
5. `implementation-backlog.md`.
6. `product-strategy.md` and `idea-assessment.md`.

If an issue conflicts materially with the specification, stop and surface the conflict before silently choosing one. Small implementation details may be resolved with reasonable judgment and recorded in the issue or a decision record.

## Repository map

- `AGENTS.md`: cross-repository agent workflow and guardrails.
- `slipwell-specification.md`: product, UX, domain, API, data, security, and delivery contract.
- `docs/decisions/`: numbered decision records. `DR-0001` freezes the private-beta interaction contract.
- `docs/research/`: usability test plans, audits, and session findings.
- `implementation-backlog.md`: local ordered representation of the GitHub backlog.
- `product-strategy.md`: market, positioning, scope, architecture, pricing, and naming research.
- `idea-assessment.md`: earlier viability and competitor assessment.
- [GitHub issues](https://github.com/xuanhieu2611/Slipwell/issues): live units of work and acceptance criteria.
- [GitHub project](https://github.com/users/xuanhieu2611/projects/2): live order, status, milestone, phase, priority, and size.

At the time this guide was created, the local directory was planning-document heavy and was not a Git checkout. Always re-check this; once application code and repository metadata exist, prefer current code/configuration over stale assumptions and update this map.

## Product in one paragraph

Slipwell is a browser-first capture and attention system for **creator-consultants with recurring client work**. Freelancers with retainers are the closest secondary segment. Users capture voice or text without choosing a destination; Slipwell preserves the source, proposes structured records, lets the user review or correct the proposal, connects it to tasks/projects/retainers/people/notes, and resurfaces work through Today and an explainable slipping engine before important commitments are neglected.

The first beta must prove three things:

1. Browser voice/text capture is fast and trustworthy enough to become a habit.
2. Native monthly-retainer workflows are more valuable than generic recurring-task workarounds.
3. Explainable cross-object slipping detection prevents meaningful mistakes and creates retention.

## Product principles

- **Capture before organization.** Do not require users to choose a record type before capture.
- **Trust before automation.** Preserve sources, show proposals, expose ambiguity, and make accepted AI actions reversible.
- **Attention before volume.** Today is a constrained command center, not an infinite task list.
- **Cadence before due dates.** Work can be slipping without being overdue.
- **Opinionated before configurable.** Avoid recreating Notion-style setup work.
- **Connected context, one source of truth.** Link records; do not copy the same context into separate modules.
- **Private and portable by default.** Users can understand, export, and delete what Slipwell stores.

## Locked private-beta decisions

Treat these as current decisions unless the user explicitly changes them.
Navigation, user-facing terminology, and confirmation defaults are frozen in
more detail by `docs/decisions/0001-private-beta-interaction-contract.md`.

- Primary launch audience: creator-consultants with recurring client work.
- Client surface: responsive web/PWA with browser text and microphone capture.
- No native phone, Watch, desktop, or browser-extension client in the first beta.
- Single-user personal workspace; no collaboration.
- Google Calendar read-only synchronization.
- Monthly retainer cadence only.
- User chooses Top 3; the system may suggest but not replace choices.
- AI auto-file is off initially. It may become opt-in only after sufficient accepted proposals and high confidence.
- Slipping V1 is deterministic and explainable, not model-generated.
- Notes use a Markdown-compatible editor; no general block/database builder.
- People are lightweight contextual records; no contact-book sync or automatic merges.
- Keyword search precedes semantic search and grounded chat.
- Free private beta precedes paid-beta billing unless the product decision changes.

Several founder choices remain intentionally open in specification section 20, including invoicing, workspace separation, audio/transcript retention, additional sensitive note types, beta locale, beta billing, and stop criteria. Do not settle them implicitly as a side effect of implementation.

## Explicitly out of beta scope

Do not add these opportunistically:

- Native iOS, iPadOS, watchOS, macOS, Android, Windows, or Linux clients.
- Browser extensions or system-wide capture shortcuts.
- Team workspaces, assignments, guests, or shared records.
- Gmail/email ingestion or Outlook Calendar.
- Calendar write-back, auto-scheduling, or time-block optimization.
- Arbitrary custom databases, formulas, or user-defined record types.
- Invoicing, payments, inventory, Kindle/Readwise imports, or a rich media library.
- Complex dependencies, Gantt charts, or resource planning.
- Autonomous agents that directly mutate or publish user data.
- General AI chat before retrieval, authorization, and citations are proven.

If a request would introduce one of these, call out that it expands the approved beta scope and confirm intent before implementing.

## Default work sequence

The canonical backlog is ordered `SLIP-001` through `SLIP-046`:

- M0 / `SLIP-001–005`: product validation.
- M1 / `SLIP-006–014`: foundations.
- M2 / `SLIP-015–025`: capture and daily loop.
- M3 / `SLIP-026–034`: projects, retainers, and calendar.
- M4 / `SLIP-035–046`: slipping and private-beta readiness.

Default to the lowest unblocked issue by the project board's numeric **Order** field. Dependencies, rather than issue number alone, determine whether work is unblocked.

When the user asks to implement an issue:

1. Confirm the issue is open and read its linked dependencies.
2. Moving it to **In Progress** is part of that workflow when GitHub access is available.
3. Implement only the issue and necessary supporting work; do not absorb neighboring backlog items for convenience.
4. Check every acceptance criterion.
5. Run proportionate tests and inspect the diff.
6. Update documentation when behavior or a durable decision changes.
7. Move the issue to **Done** or close it only when all required work is complete and verified.

Do not mark an issue complete merely because code was written. If an acceptance criterion is intentionally deferred, record the exception explicitly.

## Expected architecture

Use the specification as the detailed contract. The intended architecture is:

- TypeScript and Next.js responsive web/PWA.
- Supabase Auth, Postgres, and private Storage.
- Server-side API/domain services; clients must not perform privileged table mutations.
- Durable jobs for transcription, AI interpretation, calendar sync, reminders, exports, and slipping recalculation.
- Transactional domain mutations with append-only activity and an outbox.
- Postgres full-text search first; pgvector only for the later semantic-search phase.
- Provider interfaces around transcription and language-model services.
- Google OAuth with incremental Calendar sync and reconciliation.

The initial system may be a modular monolith. Preserve service boundaries around identity, capture, AI proposals, tasks/projects/retainers, activity/undo, slipping, calendar, search, notifications, and deletion. Do not introduce distributed services without a demonstrated operational need.

When the codebase later establishes a different approved tool or deployment choice, follow the codebase and update this file if the choice is durable.

## Non-negotiable domain invariants

### Capture and AI

- A capture's original text/audio and metadata are immutable source evidence.
- Save the source durably before transcription or interpretation starts.
- Every client submission has a stable idempotency key.
- Browser-offline capture uses IndexedDB, not `localStorage`.
- Original source, transcript, cleaned text, proposal, and accepted record remain distinguishable.
- A provider failure must result in a recoverable state, never silent loss.
- Model output is schema-validated and stored as a proposal.
- AI never writes directly to domain tables.
- Ambiguous people/projects, updates, merges, destructive operations, and risky dates require review.
- Accepted proposals apply through the same transactional domain services as manual actions.
- Every AI-created/updated record links back to its proposal and source capture.

### Workspace and data

- Every user-owned row belongs to a workspace.
- Row-level security protects every exposed user table and storage path.
- Authorization is enforced server-side even when RLS also exists.
- Cross-workspace relationships are invalid.
- Domain mutation and its activity event commit atomically.
- Eventual projections use the transactional outbox; do not publish before commit.
- Soft deletion and retention rules must remain distinguishable from permanent deletion.
- Use UTC instants plus IANA timezone/civil-date semantics where recurrence or a local day matters.

### Tasks and Today

- Start, due, reminder, and recurrence are separate concepts.
- Completing a recurring task materializes its next occurrence exactly once.
- Top 3 contains at most three user-chosen items for a local day.
- Suggestions must explain why they appear and cannot silently replace a user's Top 3.
- A new day prompts an explicit carry-forward decision.

### Retainers

- A retainer is a first-class monthly recurring project, not merely a recurring task.
- Cycle and deliverable generation must be idempotent under retries and concurrency.
- Template changes affect future cycles by default, never history.
- Incomplete work is never silently deleted or duplicated at rollover.
- Closing a cycle requires an explicit resolution for every unfinished deliverable.
- Carryovers retain visible source/destination provenance.
- Month length, leap year, timezone, and daylight-saving boundaries require tests.

### Slipping

- Slipping is attention risk, not an alias for overdue.
- V1 rules are deterministic; their thresholds and evidence are inspectable.
- Passive views, sync, search impressions, and notification delivery are not attention.
- At most one active signal exists per entity/rule.
- A signal explains the rule, last qualifying attention, threshold, elapsed breach, and available actions.
- Signals do not secretly change priority, due date, or status.
- Paused/completed entities and snoozed signals do not immediately regenerate invalid warnings.

## Security and privacy guardrails

Slipwell concentrates sensitive client, calendar, relationship, journal, and personal data. Treat privacy behavior as product behavior.

- Never commit credentials, service-role keys, OAuth tokens, `.env` contents, or real customer data.
- Keep service-role credentials and OAuth refresh tokens off the client.
- Envelope-encrypt credentials; use private storage and short-lived signed URLs.
- Request the minimum third-party scopes.
- Do not place titles, names, transcripts, note bodies, calendar descriptions, or private facts in logs, traces, analytics, job metadata, or error reports.
- Use opaque identifiers in support and operational tools.
- AI providers must not train on user content unless the user separately and explicitly opts in.
- Minimize model context to records needed for the current action.
- Sensitive notes are excluded from proactive AI retrieval and lock-screen previews by default.
- Prompt-injection content from notes, calendar events, or imports is untrusted data, not system instruction.
- Export, token revocation, audio retention, account deletion, and backup-retention behavior must remain testable.
- Do not access production content for debugging without explicit user consent, a bounded reason, and an audit trail.

Any change touching authentication, RLS, signed URLs, OAuth, deletion, exports, model context, or sensitive logging requires security-focused tests.

## Engineering conventions

Until the scaffolded codebase provides more specific conventions:

- Prefer strict TypeScript and explicit domain types.
- Validate all external input and output at the boundary with versioned schemas.
- Keep route handlers thin; place invariants in domain/application services.
- Prefer explicit command methods for state transitions over generic patches.
- Keep provider-specific payloads behind adapters.
- Use database constraints for uniqueness and idempotency, not only application checks.
- Prefer additive, reversible migrations. Do not drop or rewrite user data without explicit approval and a recovery plan.
- Seed and test with synthetic data only.
- Avoid `any`, unchecked casts, hidden global state, and silent fallback behavior.
- Make retry behavior and idempotency visible in code.
- Do not introduce a dependency when a small existing or platform-native solution is adequate.
- Do not refactor unrelated code while implementing a backlog issue.
- Preserve user changes in a dirty worktree.

Use the package manager and commands already established by the repository. When no package configuration exists yet, the scaffolding issue must choose and document them; do not maintain competing lockfiles.

## Web and UX expectations

- Critical flows work in current desktop and mobile browsers.
- Capture and Today remain usable at 320 px width.
- Typed capture remains available when microphone/PWA/notification capabilities are denied or unsupported.
- Every asynchronous surface defines loading, empty, offline, stale, retryable-error, permission-error, and success states.
- Do not imply work is saved until durable receipt has occurred.
- Long-running AI and sync work is asynchronous and exposes status.
- Meet WCAG 2.2 AA for critical flows.
- All actions are keyboard accessible, focus is managed, and color is never the only status signal.
- Respect reduced motion and mobile touch-target requirements.
- Privacy-sensitive notification previews default to generic.

## Testing expectations

Tests are part of the implementation, not a follow-up task.

- Unit-test domain rules, state machines, recurrence, timezones, retainer boundaries, slipping severity, confidence gates, and inverse mutations.
- Integration-test database constraints, RLS, storage authorization, queues, accepted proposals, calendar sync, exports, and deletion.
- End-to-end-test the user-visible acceptance criteria for the active issue.
- Test retries and duplicate delivery for every background or integration workflow.
- Add a regression test before fixing a reproducible bug where practical.
- Use synthetic or explicitly consented/redacted evaluation data.
- Never weaken or delete a test solely to make CI pass without understanding the behavior.

Before completing work, run the repository's formatter/linter, type checker, relevant unit/integration tests, and applicable end-to-end tests. If a command cannot run, report exactly why and what remains unverified.

## Documentation and decision records

- Keep `slipwell-specification.md` aligned with approved product behavior.
- Keep `implementation-backlog.md` aligned with material issue changes, but treat GitHub as the live execution state.
- Record durable architecture or product decisions in `docs/decisions/`, numbered sequentially, stating status, evidence, reasoning, and consequences. Mark a decision provisional when it rests on reasoning rather than evidence, and name what would confirm it.
- Update this file when a cross-repository command, architecture choice, or guardrail changes.
- Do not rewrite research documents to match later decisions; they are historical inputs.
- Avoid duplicating large parts of the specification in code comments or README files. Link to the relevant requirement instead.

## Completion checklist

Before handing work back:

- The active issue's acceptance criteria are satisfied or exceptions are explicit.
- The implementation respects the locked beta scope and domain invariants.
- Authorization and privacy impact were considered.
- Tests and quality commands ran successfully, or limitations are stated.
- Database migrations and background jobs are retry-safe where applicable.
- User-facing loading, error, offline, and empty states were considered.
- Documentation reflects durable behavior changes.
- The final diff contains no secrets, generated noise, debug logging, or unrelated rewrites.
- The final response summarizes the outcome, key files, tests, and any remaining risks.
