# SLIP-005 usability test plan

This plan governs the usability evaluation that gates the private-beta
interaction contract. It covers both evaluation passes:

- **Pass A** — founder self-test plus expert audit, run without external
  participants so that [SLIP-006](https://github.com/xuanhieu2611/Slipwell/issues/6)
  and [SLIP-014](https://github.com/xuanhieu2611/Slipwell/issues/14) are not
  blocked. Pass A is run from
  [the walkthrough checklist](./slip-005-walkthrough-checklist.md), which is
  the same tasks in a form that needs no tooling. **Complete.** Results are in
  [the Pass A findings](./slip-005-pass-a-findings.md) and the decisions they
  produced are in
  [DR-0001](../decisions/0001-private-beta-interaction-contract.md).
- **Pass B** — ten external target users, run once recruiting from
  [SLIP-001](https://github.com/xuanhieu2611/Slipwell/issues/1) exists.

Both passes use the same six tasks and the same severity rubric so their
results are directly comparable.

## What each pass can and cannot establish

| Question | Pass A | Pass B |
|---|---|---|
| Is a control discoverable without coaching? | Partly — founder knows the model | Yes |
| Is a label or term misread? | Weakly — founder wrote the labels | Yes |
| Is a flow reachable, complete, and reversible? | Yes | Yes |
| Does focus order, keyboard access, and 320 px layout hold? | Yes | Yes |
| Is the proposal/review trust model understood on first contact? | No | Yes |
| Is slipping perceived as more useful than an overdue list? | No | Yes |
| Is creator-consultant the right launch identity? | No | Only with SLIP-002 |

Pass A therefore produces a **provisional** interaction contract. Anything the
table marks "No" stays open in the decision record until Pass B.

## Participant profile, Pass B

Qualify a participant when all of the following hold.

- Sells recurring or repeat services to clients, as a creator-consultant,
  independent strategist, or studio of one.
- Holds at least one monthly commitment that repeats without a fixed calendar
  date.
- Manages client work in at least two tools today.
- Has missed, rebuilt, or reconstructed a recurring commitment in the last 90
  days.

Recruit eight primary participants and two freelancers-with-retainers as the
secondary comparison segment. Exclude salaried employees at companies larger
than ten people, and anyone who has seen the prototype before.

## Session protocol

### Setup

- Desktop browser at a normal window size for tasks 1 through 6.
- Repeat tasks 1 and 3 at 320 px width, via responsive emulation, to satisfy
  the mobile-constraint criterion.
- Run `npm run dev` and open `http://localhost:3000`.
- Read the participant only the goal of each task, never the steps.

### Moderation rules

- Read the task goal aloud verbatim, then stop talking.
- Do not answer "am I doing this right?" during a task. Say "what do you think
  would happen?" and wait.
- Offer a hint only after 90 seconds of no progress, and record that the task
  was completed with assistance rather than unaided.
- Never explain a term the participant is struggling with until the task ends.
  Confusion about terminology is the finding.

### Bias controls for the Pass A self-test

The founder designed the interface, so ordinary self-testing measures recall,
not usability. These controls make the session worth running anyway.

1. **Predict before acting.** Before each click, say out loud what you expect
   to happen. A prediction that turns out wrong is a real finding even though
   you built the thing; a prediction that turns out right proves nothing.
2. **Do not read the source or the prototype docs on the day of the session.**
3. **Run the tasks in order and do not skip ahead**, including the tasks that
   feel obvious.
4. **Do not fix anything mid-session.** Note it and continue. Fixing biases
   the remaining tasks.
5. **Report every place you relied on knowledge the interface did not give
   you.** These are the highest-value observations available in Pass A,
   because an external participant would have failed there.
6. **Treat "I know what that means" as untested, not as passing.**

## Tasks

Each task lists the goal read to the participant, the shortest correct path,
and the comprehension probe asked immediately after. Probes are asked after
the task so that they cannot guide behavior during it.

### T1 — First capture without coaching

**Goal read aloud:** "You have just remembered that on Friday morning you need
to send Sarah the Acme homepage draft. Get that into Slipwell."

**Shortest path:** open capture, enter the thought, create the proposal.

**Probe:** Where is that now? Is it saved? Has anything been created yet?

**Covers:** SLIP-005 criterion 1 capture, spec 17.5 first capture, spec 7.2.

### T2 — Correcting a wrong route

**Goal read aloud:** "Slipwell has guessed some details about that note. Make
sure what gets saved is actually correct, then save it."

**Shortest path:** inspect the proposal, resolve the ambiguous Sarah, accept.

**Probe:** What would have been saved if you had accepted immediately? What
happened to the words you originally wrote?

**Covers:** criterion 1 route correction, spec 7.3, 7.4.

### T3 — Selecting Top 3

**Goal read aloud:** "Decide what you are actually going to protect time for
today."

**Shortest path:** on Today, add the newly filed task to the focus list.

**Probe:** Who chose these three? Could Slipwell have chosen for you? How many
can there be?

**Covers:** criterion 1 Top 3, spec 7.5.

### T4 — Creating a monthly retainer

**Goal read aloud:** "You have just signed Acme for ongoing monthly marketing
work. Every month you owe them a performance report and a content calendar.
Set that up."

**Shortest path:** open Retainers, review or edit the templates, create.

**Probe:** What happens next month? If you change a template in October, what
happens to September?

**Covers:** criterion 1 retainer creation, spec 7.8.

### T5 — Rollover and carryover

**Goal read aloud:** "July is over. Close it out."

**Shortest path:** resolve both unfinished deliverables explicitly, close the
cycle.

**Probe:** How many copies of the July campaign handoff exist now, and where
is each one? What happened to the strategy call? Could anything have been
lost?

**Covers:** criterion 1 rollover, spec 17.5 understanding a carryover, 7.8.

### T6 — Explaining a slipping signal

**Goal read aloud:** "Slipwell thinks something needs your attention. Work out
what it wants and decide what to do about it."

**Shortest path:** open Slipping, read one card, take any of the five actions.

**Probe:** Why did this appear? Is it overdue? What did you change by acting
on it? What would make it come back?

**Covers:** criterion 1 slipping explanation, spec 17.5, 7.9.

### T7 — Finding a known client task, boundary probe

Spec 17.5 also asks participants to find a known note or client task. The
prototype has no Search, Notes, or Tasks implementation, so this cannot be
tested as a task. Instead ask: "If you wanted to find something you saved
three weeks ago, where would you go?" and record the destination the
participant names. Record the result as a navigation-model observation, not as
a pass or fail.

## What to record

Record these per task, by hand. Pass A records outcome, comprehension, and
notes only; timing is not worth capturing when the participant already knows
the interface. Pass B should add timing and detours, because with external
participants those become meaningful.

| Field | Definition | Passes |
|---|---|---|
| Outcome | Unaided, assisted, or failed | A and B |
| Comprehension | Probe answered correctly, partially, or incorrectly | A and B |
| Notes | Verbatim quotes and observed confusion | A and B |
| Time on task | Goal finished being read, to task completion | B |
| Detours | Steps taken beyond the shortest path | B |
| Hesitations | Visible pauses of roughly 3 seconds or more | B |

A detour is only an error if the participant did not intend it, so pair the
count with what they said at the time.

Do not rely on stated preference. A participant saying "this is nice" while
wandering for 90 seconds is a failing task.

## Severity rubric

Rate each distinct problem once, on the worst instance observed.

| Level | Name | Definition | Action |
|---|---|---|---|
| 4 | Catastrophic | Participant cannot complete a core flow, or completes it while believing something false about their data | Fix before any further testing |
| 3 | Major | Completed only with assistance, or a trust invariant is misunderstood — for example believing a carryover duplicated work, or believing a slipping signal changed a due date | Fix before the beta contract is frozen |
| 2 | Minor | Completed unaided but with repeated hesitation or detours | Fix if cheap, otherwise log for M2 |
| 1 | Cosmetic | Noticed and remarked upon, no effect on completion | Log only |
| 0 | Not a problem | — | — |

**"High-severity usability failure" in SLIP-005 criterion 4 means level 3 or
4.** Those must be resolved in the prototype before the decision record is
frozen. Levels 1 and 2 are recorded in the decision record as accepted debt
with a target milestone.

Any misunderstanding of a domain invariant is at least level 3, regardless of
task completion time. The invariants that matter here are: nothing is filed
until the user accepts; the original capture is preserved; rollover never
deletes or silently duplicates; a slipping signal never changes priority, due
date, or status.

## Consent and data handling, Pass B

- Obtain recorded verbal consent before capturing screen or audio, and state
  that the participant can stop at any time.
- The prototype holds no real data, so participants must use the seeded
  synthetic content. Ask participants not to enter real client names; if one
  appears, redact it in the exported log before committing anything.
- Session exports are stored under `docs/research/sessions/` with participant
  identifiers of the form `P01`, never names or employers.
- Recordings live outside the repository and are deleted within 90 days of the
  decision record being frozen.
- Never commit a raw recording, a real client name, or a participant's contact
  details.

## Analysis and exit

1. Aggregate the per-task table across participants.
2. A task fails overall when fewer than 70 percent of participants complete it
   unaided, or when any level 3 or 4 problem is open against it.
3. Fix every level 3 and 4 problem in the prototype and re-run only the
   affected tasks.
4. Record the frozen navigation, terminology, confirmation defaults, and
   deferred scope in the decision record.
5. Record any acceptance criterion that was not satisfied as an explicit
   exception rather than marking it complete.
