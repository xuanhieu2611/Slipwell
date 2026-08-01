# Slipwell Implementation Backlog

**Status:** Ready for execution  
**Source:** [Slipwell product and technical specification](slipwell-specification.md)  
**GitHub board:** [Slipwell project](https://github.com/users/xuanhieu2611/projects/2)  
**Recommended execution model:** Work in ascending `SLIP` order unless an issue explicitly permits parallel work.

This backlog takes Slipwell from product validation to a browser-only private beta. The primary launch audience is creator-consultants with recurring client work; freelancers with retainers are the closest secondary research and beta segment.

## Milestone summary

| Milestone | Issues | Exit outcome |
|---|---:|---|
| M0 — Product Validation | SLIP-001–005 | The target user, workflows, and beta interaction model are validated |
| M1 — Foundations | SLIP-006–014 | A secure, observable, deployable application foundation exists |
| M2 — Capture & Daily Loop | SLIP-015–025 | Browser capture reliably becomes actionable work in Review, Tasks, and Today |
| M3 — Projects, Retainers & Calendar | SLIP-026–034 | The commercial wedge works end to end |
| M4 — Slipping & Private Beta | SLIP-035–046 | Slipping, retrieval, privacy controls, measurement, and beta operations are ready |

---

<!-- ISSUE
milestone: M0 — Product Validation
priority: P0
size: M
labels: type:research,area:product,priority:P0
-->
## SLIP-001 — Define the beta research protocol and recruit participants

### Outcome

Create a repeatable research plan and recruit 25–40 suitable interview participants.

### Acceptance criteria

- [ ] Screening criteria prioritize creator-consultants with recurring client work.
- [ ] Freelancers with retainers are represented as the secondary comparison segment.
- [ ] Interview guide tests current behavior, missed commitments, tool spend, and willingness to switch without pitching the full feature list.
- [ ] Consent, note-taking, incentive, and data-retention procedures are documented.
- [ ] A participant tracker contains at least 25 qualified candidates.

### Dependencies

None.

### Spec references

Sections 2.4, 3, and Phase 0.

---

<!-- ISSUE
milestone: M0 — Product Validation
priority: P0
size: L
labels: type:research,area:product,priority:P0
-->
## SLIP-002 — Conduct customer interviews and synthesize the launch problem

### Outcome

Establish whether creator-consultants experience the proposed capture, retainer, and neglected-attention problems strongly enough to justify the beta.

### Acceptance criteria

- [ ] At least 25 qualified interviews are completed.
- [ ] Findings distinguish observed behavior from stated preferences.
- [ ] Current tool stacks, recurring-work workarounds, failure stories, and monthly spend are summarized.
- [ ] Results are segmented between creator-consultants and freelancers with retainers.
- [ ] The Phase 0 proceed/warning thresholds are evaluated.
- [ ] A concise recommendation records whether to proceed, narrow, or stop.

### Dependencies

SLIP-001.

### Spec references

Sections 2.3–2.5, 3.2, and Phase 0.

---

<!-- ISSUE
milestone: M0 — Product Validation
priority: P0
size: M
labels: type:design,area:product,priority:P0
-->
## SLIP-003 — Prototype the browser Capture → Review → Today loop

### Outcome

Produce a clickable prototype that demonstrates the core value loop without production code.

### Acceptance criteria

- [ ] Prototype supports typed and simulated voice capture from desktop and mobile browser layouts.
- [ ] AI proposal clearly distinguishes original input, cleaned text, destination, confidence, and extracted context.
- [ ] User can correct record type, date, project, and person before accepting.
- [ ] Accepted work appears in Today and can be selected for Top 3.
- [ ] Failure, ambiguity, and Undo states are represented.
- [ ] Prototype does not rely on native app or Watch behavior.

### Dependencies

SLIP-002.

### Spec references

Sections 4.1–4.2, 6.2, 7.2–7.5, and 8.

---

<!-- ISSUE
milestone: M0 — Product Validation
priority: P0
size: M
labels: type:design,area:retainers,area:slipping,priority:P0
-->
## SLIP-004 — Prototype retainer rollover and slipping explanations

### Outcome

Validate the two workflows that differentiate Slipwell from generic task managers.

### Acceptance criteria

- [ ] Prototype creates a monthly retainer with deliverable templates.
- [ ] Complete, incomplete, skipped, and carried-over cycle states are shown.
- [ ] No unfinished item is silently deleted or duplicated.
- [ ] Task, project-inactivity, missing-next-action, and retainer-risk slipping examples are shown.
- [ ] Every slipping signal explains its rule, threshold, last attention, and available actions.
- [ ] Users can act, snooze, dismiss, change cadence, or pause.

### Dependencies

SLIP-002.

### Spec references

Sections 6.3–6.4, 7.8–7.9, and 9.4.

---

<!-- ISSUE
milestone: M0 — Product Validation
priority: P0
size: M
labels: type:research,type:design,area:product,priority:P0
-->
## SLIP-005 — Test the prototypes and freeze private-beta interaction decisions

### Outcome

Turn prototype evidence into a stable interaction contract for implementation.

Delivered as Pass A: expert audit plus a founder walkthrough, without external
participants, so M1 was not blocked on recruiting. Results in
`docs/research/slip-005-pass-a-findings.md`; decisions in
`docs/decisions/0001-private-beta-interaction-contract.md`.

### Acceptance criteria

- [ ] At least 10 target users attempt capture, route correction, Top 3, retainer creation, rollover, and slipping explanation without coaching. **Exception: 1 participant, carried to SLIP-005B.**
- [ ] Completion time, errors, hesitation, and qualitative feedback are recorded. **Partial: outcome, comprehension, and notes recorded; timing and detours deferred to SLIP-005B as meaningless for a self-test.**
- [x] Browser voice permission and mobile-browser constraints are tested conceptually.
- [x] High-severity usability failures are resolved in the prototype.
- [x] A decision record freezes beta navigation, terminology, confirmation defaults, and deferred scope.
- [x] The decision record confirms or revises the creator-consultant launch identity. **Provisional pending SLIP-002.**

### Dependencies

SLIP-003 and SLIP-004.

### Spec references

Sections 2.6, 8, 17.5, and Phase 0.

---

<!-- ISSUE
milestone: M0 — Product Validation
priority: P0
size: M
labels: type:research,type:design,area:product,priority:P0
-->
## SLIP-005B — Run Pass B usability sessions with ten target users

### Outcome

Confirm or revise the provisional parts of the private-beta interaction
contract with evidence from people who did not design the product.

### Acceptance criteria

- [ ] At least 10 target users attempt the six flows without coaching.
- [ ] Completion time, errors, detours, hesitation, and qualitative feedback are recorded per task.
- [ ] The retainer model is understood as more than a monthly reminder, re-testing the Pass A F1 fix.
- [ ] Participants correctly identify who chose their focus items, re-testing the F2 fix.
- [ ] "Slipping" is confirmed or replaced, with its perceived value against a plain overdue list recorded.
- [ ] The removal of People from primary navigation is confirmed or reversed.
- [ ] "Proposal" is confirmed or replaced without collapsing the proposal/suggestion distinction.
- [ ] Any severity 3 or 4 problem is fixed and the affected tasks re-run.
- [ ] DR-0001 is amended or superseded and its provisional markers resolved.

### Dependencies

SLIP-001 for recruiting. Does not block M1 or M2.

### Spec references

Sections 2.6, 8, 17.5, and Phase 0.

---

<!-- ISSUE
milestone: M1 — Foundations
priority: P0
size: S
labels: type:infrastructure,area:platform,priority:P0
-->
## SLIP-006 — Bootstrap the Next.js and TypeScript application

### Outcome

Create the maintainable application skeleton used by all later work.

### Acceptance criteria

- [ ] Next.js and TypeScript application runs locally with documented commands.
- [ ] Formatting, linting, type checking, and unit-test commands exist.
- [ ] CI runs all quality gates on pull requests.
- [ ] Environment validation fails clearly when required configuration is absent.
- [ ] Initial module boundaries follow the specification's service boundaries.
- [ ] A basic contributor README explains setup and conventions.

### Dependencies

SLIP-005.

### Spec references

Sections 12.1 and 12.3.

---

<!-- ISSUE
milestone: M1 — Foundations
priority: P0
size: M
labels: type:infrastructure,area:platform,priority:P0
-->
## SLIP-007 — Configure production deployment and secrets

### Outcome

Provide a reproducible founder-operated production environment without leaking
credentials.

### Acceptance criteria

- [ ] One Vercel production project deploys the reviewed `main` branch.
- [ ] Required pull-request checks run dependency, secret, database-safety, and
      application quality checks before release.
- [ ] Production secrets are stored outside the repository and scoped to
      Vercel Production or the owning provider.
- [ ] Preview deployments cannot access production data or application/provider
      credentials.
- [ ] Application rollback is documented and tested once in production, then
      the latest deployment is restored.
- [ ] The single-environment exception and triggers for adding staging are
      recorded in DR-0002.

### Dependencies

SLIP-006.

### Spec references

Sections 13.1 and 16.2.

---

<!-- ISSUE
milestone: M1 — Foundations
priority: P0
size: M
labels: type:feature,area:identity,priority:P0
-->
## SLIP-008 — Implement authentication, personal workspace creation, and onboarding state

### Outcome

Users can sign in and receive exactly one isolated personal workspace.

### Acceptance criteria

- [ ] Google and Apple OAuth are configured, or an explicitly documented beta subset is approved.
- [ ] First authentication creates one profile, workspace, and owner membership transactionally.
- [ ] Replayed callbacks cannot create duplicate workspaces.
- [ ] Workspace stores IANA timezone, locale, week start, and morning default.
- [ ] Onboarding progress can be resumed.
- [ ] Sign-out and session-expiry behavior are tested.

### Dependencies

SLIP-007.

### Spec references

AUTH-01–AUTH-05 and section 10.2.

---

<!-- ISSUE
milestone: M1 — Foundations
priority: P0
size: L
labels: type:infrastructure,area:data,priority:P0
-->
## SLIP-009 — Create the core Postgres schema and migration workflow

### Outcome

Implement the relational source of truth for beta records.

### Acceptance criteria

- [ ] Versioned migrations create identity, capture, task, project, retainer, people, notes, activity, slipping, search, calendar, notification, job, and export tables.
- [ ] Foreign keys, unique constraints, soft deletion, versions, and timestamps follow the specification.
- [ ] Idempotency constraints exist for captures, retainer cycles, generated tasks, notifications, and jobs.
- [ ] Seed data supports local development without real user content.
- [ ] Migration rollback or forward-fix policy is documented.
- [ ] Schema diagrams or generated documentation are available.

### Dependencies

SLIP-008.

### Spec references

Section 10.

---

<!-- ISSUE
milestone: M1 — Foundations
priority: P0
size: L
labels: type:security,area:data,priority:P0
-->
## SLIP-010 — Enforce row-level security and private storage policies

### Outcome

Make tenant isolation a tested invariant rather than an application convention.

### Acceptance criteria

- [ ] Every exposed user-owned table has row-level security enabled.
- [ ] Policies authorize only valid workspace members.
- [ ] Private audio and export buckets use short-lived signed URLs.
- [ ] Service-role credentials are server-only.
- [ ] Automated negative tests attempt cross-workspace read and mutation for every exposed table.
- [ ] Storage cross-workspace and expired-link tests pass.

### Dependencies

SLIP-009.

### Spec references

AUTH-03, DAT-02, sections 13.1 and 17.4.

---

<!-- ISSUE
milestone: M1 — Foundations
priority: P0
size: L
labels: type:infrastructure,area:data,priority:P0
-->
## SLIP-011 — Build transactional domain, activity, outbox, and Undo foundations

### Outcome

Provide one safe mutation path for user actions, background jobs, and accepted AI proposals.

### Acceptance criteria

- [ ] Domain mutations and append-only activity events commit in the same transaction.
- [ ] Transactional outbox publishes eventual work without a database/queue loss window.
- [ ] Mutation events store forward and inverse changes with authorization.
- [ ] Undo is idempotent and supports created and updated beta records.
- [ ] Background workers call domain services instead of updating tables ad hoc.
- [ ] Sensitive record bodies are absent from general activity metadata.

### Dependencies

SLIP-009 and SLIP-010.

### Spec references

REV-05, sections 10.5, 12.3, and 12.4.

---

<!-- ISSUE
milestone: M1 — Foundations
priority: P0
size: M
labels: type:infrastructure,area:jobs,priority:P0
-->
## SLIP-012 — Implement durable background jobs and dead-letter handling

### Outcome

Run transcription, routing, sync, reminders, and recalculation reliably.

### Acceptance criteria

- [ ] Jobs support schedules, retries with backoff, locks, timeouts, and maximum attempts.
- [ ] Stable deduplication keys prevent duplicate visible effects.
- [ ] Failed jobs become inspectable dead-letter entries without exposing private content.
- [ ] Workers can be replayed safely.
- [ ] Queue age and failure metrics are emitted.
- [ ] Concurrency tests verify exactly-once domain effects over at-least-once delivery.

### Dependencies

SLIP-011.

### Spec references

Sections 10.7, 12.4, and 16.2.

---

<!-- ISSUE
milestone: M1 — Foundations
priority: P0
size: M
labels: type:infrastructure,area:observability,priority:P0
-->
## SLIP-013 — Add privacy-safe observability and analytics plumbing

### Outcome

Diagnose system behavior and measure product use without logging private content.

### Acceptance criteria

- [ ] Structured logs, request IDs, traces, metrics, and error tracking are configured.
- [ ] Request bodies, titles, transcripts, names, note bodies, and calendar descriptions are scrubbed.
- [ ] A capture can be traced by opaque ID across API, job, AI run, proposal, and mutation.
- [ ] Analytics wrapper enforces an allowlist of content-free properties.
- [ ] Alerts can be configured for queue age, processing failure, and authorization failure.
- [ ] A test verifies representative sensitive content never reaches logs or analytics.

### Dependencies

SLIP-007 and SLIP-012.

### Spec references

AIR-09, sections 13.2, 15, and 16.

---

<!-- ISSUE
milestone: M1 — Foundations
priority: P0
size: L
labels: type:feature,type:design,area:web,priority:P0
-->
## SLIP-014 — Build the responsive PWA shell and accessible navigation

### Outcome

Create the browser-only application frame used on desktop and mobile.

### Acceptance criteria

- [ ] Desktop and mobile navigation expose Today, Review, Tasks, Projects, People, Notes, Search, Settings, and persistent Capture.
- [ ] PWA manifest and install behavior work on supported browsers.
- [ ] Authentication, loading, empty, offline, stale, and error layouts exist.
- [ ] Keyboard navigation, focus management, reduced motion, contrast, and 44-point mobile targets meet the stated accessibility baseline.
- [ ] Today and Capture are usable at 320 px width.
- [ ] Unsupported microphone or PWA capabilities degrade to typed capture without blocking use.

### Dependencies

SLIP-006, SLIP-008, and SLIP-005.

### Spec references

Sections 4.1–4.2, 8, and 12.1.

---

<!-- ISSUE
milestone: M2 — Capture & Daily Loop
priority: P0
size: M
labels: type:feature,area:capture,priority:P0
-->
## SLIP-015 — Implement browser text and audio capture UX

### Outcome

Let users capture a thought quickly from desktop or mobile browser.

### Acceptance criteria

- [ ] Persistent Capture supports typed text and microphone recording.
- [ ] Microphone permission is requested only after a clear user action.
- [ ] Recording duration, stop, cancel, upload, and failure states are accessible.
- [ ] Five-minute and 25 MB beta limits are enforced and explained.
- [ ] Unsupported or denied microphone access falls back to text.
- [ ] The UI separates local pending, server received, processing, ready, and failed status.

### Dependencies

SLIP-014.

### Spec references

CAP-01, CAP-06, CAP-08, CAP-09, and section 6.2.

---

<!-- ISSUE
milestone: M2 — Capture & Daily Loop
priority: P0
size: L
labels: type:feature,area:capture,priority:P0
-->
## SLIP-016 — Build the IndexedDB offline capture queue

### Outcome

Prevent browser refreshes, network loss, and transient failures from losing captures.

### Acceptance criteria

- [ ] Every capture receives a stable client idempotency key.
- [ ] Pending text/audio and metadata are stored in IndexedDB, not `localStorage`.
- [ ] Queue retries with backoff after reconnect and exposes manual retry/discard.
- [ ] Successfully acknowledged captures are removed safely from local storage.
- [ ] Multiple tabs coordinate to avoid duplicate upload attempts.
- [ ] Offline, refresh, crash, and repeated-retry tests produce one server capture.

### Dependencies

SLIP-015.

### Spec references

CAP-03–CAP-06 and section 12.5.

---

<!-- ISSUE
milestone: M2 — Capture & Daily Loop
priority: P0
size: L
labels: type:feature,area:capture,area:api,priority:P0
-->
## SLIP-017 — Implement idempotent capture API and private audio ingestion

### Outcome

Durably receive the original source before any AI processing begins.

### Acceptance criteria

- [ ] Text capture and signed audio-upload initialization endpoints follow `/api/v1`.
- [ ] Source is committed before a processing job is enqueued.
- [ ] Repeated idempotency keys return the original capture.
- [ ] Audio completion validates object ownership, size, and media type.
- [ ] Processing-state endpoint reports safe, actionable failures.
- [ ] Twenty repeated submissions produce one capture in an automated test.

### Dependencies

SLIP-009, SLIP-010, SLIP-012, and SLIP-016.

### Spec references

CAP-02–CAP-09 and section 11.1.

---

<!-- ISSUE
milestone: M2 — Capture & Daily Loop
priority: P0
size: M
labels: type:feature,area:ai,area:capture,priority:P0
-->
## SLIP-018 — Implement transcription worker and source preservation

### Outcome

Turn audio into a versioned transcript without overwriting the original source.

### Acceptance criteria

- [ ] Transcription provider is behind an internal interface.
- [ ] Original audio, raw transcript, cleaned text, provider, model, language, duration, and request ID remain distinct.
- [ ] Provider timeouts and malformed responses retry safely.
- [ ] Final failure preserves the source and exposes retry.
- [ ] Transcription content is excluded from logs and analytics.
- [ ] Retention hooks support later audio deletion without deleting accepted records.

### Dependencies

SLIP-017.

### Spec references

CAP-07, AIR-08–AIR-10, and section 10.3.

---

<!-- ISSUE
milestone: M2 — Capture & Daily Loop
priority: P0
size: L
labels: type:feature,area:ai,priority:P0
-->
## SLIP-019 — Build structured AI interpretation and confidence gating

### Outcome

Produce safe, schema-valid routing proposals for tasks, notes, person updates, project updates, or inbox items.

### Acceptance criteria

- [ ] Versioned structured schema covers type, operation, fields, dates, relationships, field confidence, and ambiguities.
- [ ] Context retrieval sends only likely active projects, retainers, people, domains, timezone, and defaults.
- [ ] Relative dates resolve against capture time and workspace timezone.
- [ ] Ambiguous project/person matches require Review.
- [ ] Low-confidence and malformed results fall back to an inbox item.
- [ ] AI cannot write directly to domain tables or propose destructive beta actions.

### Dependencies

SLIP-018 and SLIP-009.

### Spec references

AIR-01–AIR-10 and section 14.

---

<!-- ISSUE
milestone: M2 — Capture & Daily Loop
priority: P0
size: L
labels: type:feature,area:capture,area:web,priority:P0
-->
## SLIP-020 — Build the Review inbox and proposal editor

### Outcome

Give users a clear place to understand and correct every uncertain capture.

### Acceptance criteria

- [ ] Review sections show Needs attention, Ready to confirm, Failed, and Recently filed.
- [ ] Proposal editor shows original source, cleaned text, destination, title, dates, domain, project, people, and confidence.
- [ ] Changing primary type revalidates compatible fields.
- [ ] User can retry failed processing and discard unresolved captures.
- [ ] Navigation count updates without a full reload.
- [ ] Batch acceptance is limited to high-confidence creates.

### Dependencies

SLIP-019 and SLIP-014.

### Spec references

REV-01–REV-06.

---

<!-- ISSUE
milestone: M2 — Capture & Daily Loop
priority: P0
size: L
labels: type:feature,area:capture,area:data,priority:P0
-->
## SLIP-021 — Apply accepted proposals transactionally and support Undo

### Outcome

Convert a reviewed proposal into domain records without orphaned data or irreversible AI mistakes.

### Acceptance criteria

- [ ] Acceptance validates proposal version, authorization, type, and relationships.
- [ ] Domain mutation, entity links, activity, and mutation event commit atomically.
- [ ] Accepted proposal links to its mutation and source capture.
- [ ] Undo restores prior values or soft-deletes a created record.
- [ ] Repeated accept and Undo requests are idempotent.
- [ ] Correction feedback records structure without sending raw content to analytics.

### Dependencies

SLIP-011 and SLIP-020.

### Spec references

REV-04–REV-05, section 6.5, and section 12.4.

---

<!-- ISSUE
milestone: M2 — Capture & Daily Loop
priority: P0
size: L
labels: type:feature,area:tasks,area:api,priority:P0
-->
## SLIP-022 — Implement task domain rules and API

### Outcome

Provide dependable task creation, scheduling, recurrence, completion, and deferment.

### Acceptance criteria

- [ ] Task fields and statuses match TSK-01 and TSK-02.
- [ ] Start, due, reminder, and recurrence semantics remain separate.
- [ ] Completion materializes a recurring occurrence exactly once.
- [ ] Explicit command endpoints implement complete and defer invariants.
- [ ] Soft deletion and 30-day recovery work.
- [ ] Timezone, DST, recurrence, replay, and optimistic-concurrency tests pass.

### Dependencies

SLIP-011.

### Spec references

TSK-01–TSK-08 and sections 9.2 and 11.3.

---

<!-- ISSUE
milestone: M2 — Capture & Daily Loop
priority: P0
size: L
labels: type:feature,area:tasks,area:web,priority:P0
-->
## SLIP-023 — Build task list, detail, filters, and inline actions

### Outcome

Make tasks usable independently of AI capture.

### Acceptance criteria

- [ ] User can create, edit, complete, cancel, reopen, defer, and soft-delete tasks.
- [ ] Views support status, project, retainer, person, domain, due state, and slipping-state filters.
- [ ] Task detail shows source capture and linked context.
- [ ] Optimistic UI reconciles version conflicts explicitly.
- [ ] Loading, empty, offline, and failure states are implemented.
- [ ] Keyboard and mobile interactions pass accessibility checks.

### Dependencies

SLIP-014 and SLIP-022.

### Spec references

TSK-01–TSK-08 and section 8.

---

<!-- ISSUE
milestone: M2 — Capture & Daily Loop
priority: P0
size: L
labels: type:feature,area:today,priority:P0
-->
## SLIP-024 — Implement Today, Top 3, and daily carry-forward

### Outcome

Provide a constrained daily command center rather than another infinite task list.

### Acceptance criteria

- [ ] Today uses the workspace's local date and timezone.
- [ ] User can choose at most three supported focus items.
- [ ] Due tasks, retainer previews, slipping placeholders, review count, and quick capture are sectioned and collapsible.
- [ ] Suggested items expose deterministic reasons and never replace user choices.
- [ ] Next-day carry-forward asks the user to retain, replace, schedule, or remove each incomplete item.
- [ ] Inline completion updates activity and all visible projections.

### Dependencies

SLIP-021 and SLIP-023.

### Spec references

TOD-01–TOD-07 and section 11.2.

---

<!-- ISSUE
milestone: M2 — Capture & Daily Loop
priority: P1
size: L
labels: type:feature,area:notifications,priority:P1
-->
## SLIP-025 — Implement notification preferences and reliable delivery

### Outcome

Deliver capture failures, reminders, briefs, and later slipping digests without noise or privacy leaks.

### Acceptance criteria

- [ ] Preferences exist per category and channel.
- [ ] Quiet hours, workspace timezone, and full/generic/disabled previews are supported.
- [ ] Notification jobs use stable deduplication keys.
- [ ] Completed or invalidated items cancel pending reminders.
- [ ] Browser notification denial leaves in-app notifications usable.
- [ ] Delivery and disable rates are measurable without content.

### Dependencies

SLIP-012, SLIP-013, and SLIP-024.

### Spec references

NTF-01–NTF-05 and section 10.7.

---

<!-- ISSUE
milestone: M3 — Projects, Retainers & Calendar
priority: P0
size: L
labels: type:feature,area:projects,priority:P0
-->
## SLIP-026 — Implement finite projects domain and UI

### Outcome

Support one-time client and content projects with clear next actions and activity.

### Acceptance criteria

- [ ] Project fields, kinds, statuses, dates, cadence, and pause behavior follow the specification.
- [ ] Project view shows overview, next actions, tasks, people, notes, activity, and slipping placeholder.
- [ ] Active projects can identify a missing next action.
- [ ] Completing a project does not silently complete tasks.
- [ ] Paused projects suppress new inactivity signals while preserving overdue tasks.
- [ ] API commands and UI honor optimistic concurrency.

### Dependencies

SLIP-023.

### Spec references

PRJ-01–PRJ-06 and section 9.3.

---

<!-- ISSUE
milestone: M3 — Projects, Retainers & Calendar
priority: P1
size: M
labels: type:feature,area:projects,priority:P1
-->
## SLIP-027 — Add versioned opinionated project templates

### Outcome

Create projects quickly without introducing a general custom-database builder.

### Acceptance criteria

- [ ] System templates are versioned and cannot be mutated by users.
- [ ] Applying a template copies structure and records template/version provenance.
- [ ] Initial templates cover a finite client project and a creator content project.
- [ ] Template application is idempotent.
- [ ] Existing projects do not change when a template version changes.
- [ ] A usability check creates a templated project in under two minutes.

### Dependencies

SLIP-026.

### Spec references

PRJ-05, section 10.4, and section 21.

---

<!-- ISSUE
milestone: M3 — Projects, Retainers & Calendar
priority: P0
size: L
labels: type:feature,area:retainers,priority:P0
-->
## SLIP-028 — Implement monthly retainer setup and deliverable templates

### Outcome

Represent recurring client commitments as first-class data.

### Acceptance criteria

- [ ] Retainer setup captures client, timezone, anchor, monthly cadence, and rollover default.
- [ ] User can create, order, edit, retire, and version deliverable and task templates.
- [ ] Expected-start and due offsets validate against cycle semantics.
- [ ] Template edits default to future cycles.
- [ ] Retainer can be paused or archived without losing history.
- [ ] User can create a usable retainer in under five minutes.

### Dependencies

SLIP-026 and SLIP-027.

### Spec references

RET-01–RET-02, RET-06–RET-07, and section 10.4.

---

<!-- ISSUE
milestone: M3 — Projects, Retainers & Calendar
priority: P0
size: L
labels: type:feature,area:retainers,area:jobs,priority:P0
-->
## SLIP-029 — Generate retainer cycles and deliverable instances idempotently

### Outcome

Create each monthly cycle and its planned work exactly once.

### Acceptance criteria

- [ ] Scheduled and manual early generation use the same domain command.
- [ ] Unique cycle and template constraints prevent duplicate work under concurrency.
- [ ] Generated dates honor workspace timezone, anchor, month length, leap years, and DST.
- [ ] One-cycle exceptions do not mutate templates.
- [ ] Generated tasks retain deliverable and template provenance.
- [ ] Concurrent-worker and replay tests pass.

### Dependencies

SLIP-012 and SLIP-028.

### Spec references

RET-03, section 9.4, and section 10.4.

---

<!-- ISSUE
milestone: M3 — Projects, Retainers & Calendar
priority: P0
size: L
labels: type:feature,area:retainers,priority:P0
-->
## SLIP-030 — Implement cycle closing, carryover, and rollover

### Outcome

Preserve unfinished recurring work without silent loss or duplication.

### Acceptance criteria

- [ ] Closing identifies every unfinished deliverable.
- [ ] User chooses carry forward, move with history, cancel, or retain as overdue.
- [ ] Default retains overdue and suggests carry forward.
- [ ] Cycle cannot close while an item has an unspecified resolution.
- [ ] Source and destination display carryover provenance.
- [ ] Replaying close or resolution commands cannot duplicate records.

### Dependencies

SLIP-029.

### Spec references

RET-04 and section 9.4.

---

<!-- ISSUE
milestone: M3 — Projects, Retainers & Calendar
priority: P0
size: L
labels: type:feature,area:retainers,area:web,priority:P0
-->
## SLIP-031 — Build retainer cycle health, history, and rollover UI

### Outcome

Give users a clear operational view of current and prior client cycles.

### Acceptance criteria

- [ ] Current cycle shows completion, due soon, overdue, carryovers, and attention status.
- [ ] History preserves prior cycle dates, template versions, work, and resolutions.
- [ ] User can generate early, skip, close, pause, archive, and resolve carryovers from explicit flows.
- [ ] Planned current work is visually distinct from prior-cycle carryover.
- [ ] Empty, first-cycle, closed, skipped, and error states are covered.
- [ ] Rollover usability test succeeds without coaching.

### Dependencies

SLIP-030 and SLIP-014.

### Spec references

RET-05–RET-07 and section 6.3.

---

<!-- ISSUE
milestone: M3 — Projects, Retainers & Calendar
priority: P0
size: L
labels: type:feature,area:calendar,priority:P0
-->
## SLIP-032 — Implement Google Calendar OAuth, source selection, and privacy modes

### Outcome

Connect Google Calendar with the minimum read-only access and visible user control.

### Acceptance criteria

- [ ] OAuth uses state, PKCE where applicable, and minimum read scopes.
- [ ] Refresh tokens are envelope-encrypted and never returned to the browser.
- [ ] User can select calendars and choose full-detail or busy-only behavior where supported.
- [ ] Settings shows connection state, selected sources, and disconnect action.
- [ ] Revocation removes credentials and stops future sync.
- [ ] OAuth replay, cancellation, and wrong-workspace tests pass.

### Dependencies

SLIP-008, SLIP-010, and SLIP-014.

### Spec references

CAL-01–CAL-02, CAL-05, CAL-07, and section 11.4.

---

<!-- ISSUE
milestone: M3 — Projects, Retainers & Calendar
priority: P0
size: L
labels: type:feature,area:calendar,area:jobs,priority:P0
-->
## SLIP-033 — Build incremental Google Calendar sync and reconciliation

### Outcome

Keep read-only calendar data fresh without duplication or silent staleness.

### Acceptance criteria

- [ ] Initial full sync stores stable external identities.
- [ ] Incremental sync tokens and provider notifications process changes idempotently.
- [ ] Periodic reconciliation recovers missed notifications.
- [ ] Deletes, cancellations, recurring instances, all-day events, moved events, and DST fixtures pass.
- [ ] Expired tokens produce a visible reconnect state.
- [ ] Last successful sync and error code are observable.

### Dependencies

SLIP-012 and SLIP-032.

### Spec references

CAL-03–CAL-06 and section 10.7.

---

<!-- ISSUE
milestone: M3 — Projects, Retainers & Calendar
priority: P0
size: M
labels: type:feature,area:today,area:calendar,area:retainers,priority:P0
-->
## SLIP-034 — Integrate calendar and retainer health into Today

### Outcome

Complete the daily command center with real schedule and recurring-client context.

### Acceptance criteria

- [ ] Today displays selected calendar agenda with freshness and reconnect state.
- [ ] Busy-only events do not leak provider details.
- [ ] Retainer deliverables due soon, overdue, and carried over appear in constrained sections.
- [ ] Top 3 supports retainer deliverables.
- [ ] Calendar and retainer loading failures do not block tasks or capture.
- [ ] Aggregation performance meets the API target with representative data.

### Dependencies

SLIP-024, SLIP-031, and SLIP-033.

### Spec references

TOD-02–TOD-04, CAL-05–CAL-07, and RET-05.

---

<!-- ISSUE
milestone: M4 — Slipping & Private Beta
priority: P0
size: M
labels: type:feature,area:slipping,area:data,priority:P0
-->
## SLIP-035 — Classify attention events and publish recalculation triggers

### Outcome

Create trustworthy evidence for the slipping engine.

### Acceptance criteria

- [ ] Qualifying and non-qualifying activity types are encoded centrally.
- [ ] Task, project, and retainer domain actions publish the correct attention state.
- [ ] Passive views, sync, search impressions, and notification delivery never count.
- [ ] Relevant events enqueue slipping recalculation through the outbox.
- [ ] Test fixtures cover create, complete, defer, pause, note, carryover, and acknowledgement behavior.
- [ ] Historical events can be replayed safely for recalculation.

### Dependencies

SLIP-011, SLIP-026, and SLIP-031.

### Spec references

Section 7.9.2 and section 10.5.

---

<!-- ISSUE
milestone: M4 — Slipping & Private Beta
priority: P0
size: L
labels: type:feature,area:slipping,area:jobs,priority:P0
-->
## SLIP-036 — Implement deterministic slipping rules, severity, and reconciliation

### Outcome

Detect stale tasks, inactive projects, missing next actions, and at-risk retainer work explainably.

### Acceptance criteria

- [ ] All V1 rules in section 7.9.3 are implemented.
- [ ] Watch, at-risk, and critical severity is deterministic and tested.
- [ ] At most one active signal exists per entity/rule.
- [ ] Paused/completed projects and snoozed signals behave correctly.
- [ ] Relevant events recalculate promptly and a daily job reconciles missed work.
- [ ] The engine answers why a signal exists without an AI call.

### Dependencies

SLIP-012 and SLIP-035.

### Spec references

SLP-01–SLP-04 and sections 7.9.3–7.9.5.

---

<!-- ISSUE
milestone: M4 — Slipping & Private Beta
priority: P0
size: L
labels: type:feature,area:slipping,area:web,priority:P0
-->
## SLIP-037 — Build Slipping views and signal actions

### Outcome

Help users resolve attention risk without mutating hidden priorities or due dates.

### Acceptance criteria

- [ ] Today and dedicated view show severity, explanation, last attention, threshold, and suggested actions.
- [ ] User can open/work, acknowledge, snooze, dismiss with reason, change cadence, or pause.
- [ ] Signal state transitions are idempotent.
- [ ] No signal changes an entity's due date, priority, or status implicitly.
- [ ] "No slipping items" is a positive empty state.
- [ ] Action and dismissal reason analytics contain no record content.

### Dependencies

SLIP-014, SLIP-034, and SLIP-036.

### Spec references

Section 6.4, section 7.9.5, and SLP-01–SLP-04.

---

<!-- ISSUE
milestone: M4 — Slipping & Private Beta
priority: P1
size: M
labels: type:feature,area:slipping,area:notifications,priority:P1
-->
## SLIP-038 — Add slipping digest and retainer-risk notifications

### Outcome

Surface attention risk without sending a noisy notification for every signal.

### Acceptance criteria

- [ ] Slipping defaults to a digest, not per-signal push.
- [ ] Digest respects quiet hours, timezone, privacy preview, and category settings.
- [ ] Resolved, dismissed, and currently snoozed signals are excluded.
- [ ] Stable keys prevent duplicate digest delivery.
- [ ] Deep links open the relevant signal.
- [ ] Action and disable rates are measured.

### Dependencies

SLIP-025 and SLIP-037.

### Spec references

NTF-01–NTF-05 and section 7.9.

---

<!-- ISSUE
milestone: M4 — Slipping & Private Beta
priority: P1
size: M
labels: type:feature,area:people,priority:P1
-->
## SLIP-039 — Implement lightweight people records and contextual links

### Outcome

Preserve enough relationship context for capture routing and client work without building a full CRM.

### Acceptance criteria

- [ ] User can create, edit, view, and soft-delete people and important dates.
- [ ] People link to tasks, projects, retainers, notes, captures, and calendar events.
- [ ] Ambiguous first names never link silently.
- [ ] AI person updates require review and cannot merge records.
- [ ] Deleting a person preserves linked work and removes or tombstones the relationship safely.
- [ ] Private facts stay out of previews, logs, and analytics.

### Dependencies

SLIP-011 and SLIP-014.

### Spec references

PPL-01–PPL-05 and section 10.4.

---

<!-- ISSUE
milestone: M4 — Slipping & Private Beta
priority: P1
size: L
labels: type:feature,area:notes,priority:P1
-->
## SLIP-040 — Implement notes, sensitivity defaults, and version history

### Outcome

Store lightweight project, meeting, general, and journal context safely.

### Acceptance criteria

- [ ] Markdown-compatible notes support the four beta types and typed record links.
- [ ] Journal notes default to sensitive.
- [ ] Sensitive notes are excluded from lock-screen previews and proactive AI context.
- [ ] Edits retain recoverable history for at least 30 days.
- [ ] Changing type or links never alters the source capture.
- [ ] Notes can export as Markdown with stable IDs and front matter.

### Dependencies

SLIP-011 and SLIP-014.

### Spec references

NTE-01–NTE-05 and section 10.4.

---

<!-- ISSUE
milestone: M4 — Slipping & Private Beta
priority: P1
size: L
labels: type:feature,area:search,priority:P1
-->
## SLIP-041 — Implement authorized keyword search and structured filters

### Outcome

Find known tasks, projects, retainers, people, and notes in fewer than three interactions.

### Acceptance criteria

- [ ] Outbox-driven search documents index the required record types.
- [ ] Results support record type, status, domain, project, person, date, and slipping filters.
- [ ] Ranking combines text relevance, exact title, recency, active state, and relationship proximity.
- [ ] Soft-deleted and unauthorized records never appear.
- [ ] Source authorization is synchronously rechecked before returning results.
- [ ] Index lag over 30 seconds is visible and measurable.

### Dependencies

SLIP-023, SLIP-026, SLIP-031, SLIP-039, and SLIP-040.

### Spec references

SEA-01–SEA-05 and section 10.6.

---

<!-- ISSUE
milestone: M4 — Slipping & Private Beta
priority: P0
size: L
labels: type:feature,area:privacy,priority:P0
-->
## SLIP-042 — Implement portable export, integration revocation, and account deletion

### Outcome

Give users practical control over all data stored by Slipwell.

### Acceptance criteria

- [ ] Export contains versioned JSON, common CSVs, Markdown notes, relationships, and retained media.
- [ ] Export runs asynchronously and uses an expiring signed link.
- [ ] Google disconnect revokes tokens and offers a clear cached-event choice.
- [ ] Account deletion requires reauthentication and starts a documented 30-day recovery period.
- [ ] In-flight jobs, exports, and captures become safe during deletion.
- [ ] Permanent deletion is auditable without retaining deleted content in logs.

### Dependencies

SLIP-010, SLIP-033, and SLIP-040.

### Spec references

DAT-01–DAT-05 and section 11.4.

---

<!-- ISSUE
milestone: M4 — Slipping & Private Beta
priority: P0
size: M
labels: type:analytics,area:product,priority:P0
-->
## SLIP-043 — Instrument activation, retention, slipping, and cost dashboards

### Outcome

Measure whether the private beta proves the product hypotheses without reading user content.

### Acceptance criteria

- [ ] Allowlisted events in section 15.1 are instrumented.
- [ ] Activation funnel matches section 3.3.
- [ ] Cohort retention covers weeks 1–8.
- [ ] Dashboards cover capture reliability/latency, routing correction, Today, retainer rollover, slipping action, notification disable, and AI cost.
- [ ] Raw titles, names, notes, transcripts, and calendar details are absent.
- [ ] Proceed and warning thresholds can be evaluated directly.

### Dependencies

SLIP-013, SLIP-034, and SLIP-037.

### Spec references

Sections 3 and 15.

---

<!-- ISSUE
milestone: M4 — Slipping & Private Beta
priority: P0
size: L
labels: type:quality,area:ai,priority:P0
-->
## SLIP-044 — Build the AI routing benchmark and failure evaluation suite

### Outcome

Measure routing quality, safety, latency, and cost before real users depend on it.

### Acceptance criteria

- [ ] Synthetic and consented cases cover ambiguity, dates, DST, negation, multiple intents, journals, people, retainers, noisy audio, and prompt injection.
- [ ] Measures include type accuracy, field validity, date exact match, entity-link accuracy, false update rate, safe-review rate, latency, and cost.
- [ ] Provider timeouts, malformed output, and fallback behavior are tested.
- [ ] Benchmark content contains no unconsented private beta data.
- [ ] Results are versioned by prompt, schema, provider, and model.
- [ ] Phase 2 quality thresholds are evaluated and documented.

### Dependencies

SLIP-019 and SLIP-021.

### Spec references

Section 14 and Phase 2 exit criteria.

---

<!-- ISSUE
milestone: M4 — Slipping & Private Beta
priority: P0
size: L
labels: type:security,type:quality,area:platform,priority:P0
-->
## SLIP-045 — Perform private-beta security, privacy, accessibility, and reliability hardening

### Outcome

Resolve release-blocking risks across the complete beta system.

### Acceptance criteria

- [ ] Automated RLS, authorization fuzzing, signed-link, webhook replay, and rate-limit tests pass.
- [ ] Threat scenarios in section 13.3 are exercised.
- [ ] Capture, queue, AI, calendar, notification, export, and deletion failure paths are tested end to end.
- [ ] Backup restoration is tested against the documented recovery targets.
- [ ] WCAG 2.2 AA and target-browser checks pass for critical flows.
- [ ] No raw private content appears in logs, analytics, or support tools.
- [ ] All P0 findings are closed and accepted P1 limitations are documented.

### Dependencies

SLIP-010, SLIP-017, SLIP-033, SLIP-042, and SLIP-044.

### Spec references

Sections 13, 16, 17, and 19.

---

<!-- ISSUE
milestone: M4 — Slipping & Private Beta
priority: P0
size: M
labels: type:documentation,area:beta,priority:P0
-->
## SLIP-046 — Prepare beta onboarding, operational runbooks, and launch checklist

### Outcome

Make the private beta supportable for approximately 50 selected users.

### Acceptance criteria

- [ ] Creator-consultant onboarding reaches the activation checklist without requiring every module.
- [ ] Known limitations, privacy behavior, data controls, and support path are visible.
- [ ] Runbooks cover transcription/model outage, queue stall, calendar outage/token compromise, notification backlog, and bad slipping rules.
- [ ] Support diagnostics use opaque IDs and consented troubleshooting bundles.
- [ ] Definition-of-done checklist in section 19 is completed or each exception is approved.
- [ ] Initial cohort invitation, feedback cadence, and success review dates are documented.
- [ ] Go/no-go review uses the thresholds in section 3.

### Dependencies

SLIP-034, SLIP-038, SLIP-041, SLIP-043, SLIP-044, and SLIP-045.

### Spec references

Sections 3, 6.1, 13.4, 16.2, 19, and Phase 4.
