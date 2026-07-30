# DR-0001 — Private-beta interaction contract

- **Status:** Accepted, provisional in the places marked below
- **Date:** 2026-07-30
- **Issue:** [SLIP-005](https://github.com/xuanhieu2611/Slipwell/issues/5)
- **Supersedes:** nothing
- **Evidence:** [Pass A findings](../research/slip-005-pass-a-findings.md),
  [expert audit](../research/slip-005-expert-audit.md),
  [browser and mobile constraints](../research/slip-005-browser-voice-and-mobile-constraints.md)

This record freezes the interaction decisions that
[SLIP-006](https://github.com/xuanhieu2611/Slipwell/issues/6) and
[SLIP-014](https://github.com/xuanhieu2611/Slipwell/issues/14) need in order to
start, so that foundation work is not blocked waiting on external participants.

**What "provisional" means here.** Pass A had one participant, and that
participant designed the interface. It can prove a flow is reachable and can
catch a comprehension failure when one happens, but it cannot show that a
stranger understands a label. Decisions below are marked **frozen** when the
evidence supports them or when they are scope judgments that do not need
participant evidence, and **provisional** when they are asserted on reasoning
alone and Pass B must confirm them. A provisional decision is still binding on
implementation; it just carries a known revision risk.

---

## 1. Beta navigation — frozen, one part provisional

**Decision.** Seven primary destinations, in this order:

`Today · Review · Slipping · Tasks · Projects · Retainers · Notes`

Mobile keeps its four-item bar plus the centre capture control:
`Today · Retainers · [Capture] · Slipping · Review`.

Capture is a persistent action on every surface, not a destination. **Search and
Settings are utility surfaces, not content destinations**: Search lives in the
top bar and on a keyboard shortcut, Settings lives under the account menu.
Specification 8.1 previously listed them alongside content destinations, and
also predated Retainers and Slipping entirely; it is updated to match this
record.

### Retainers stays a top-level destination, separate from Projects

A retainer *is* a project in the domain model — the specification calls it a
first-class monthly recurring project, and nothing here changes that. The
question was only whether it deserves its own navigation entry, and it does,
for two reasons.

First, it is the differentiator under test. Locked beta decision 2 says native
retainer workflows must prove more valuable than generic recurring tasks, and
Pass A found the retainer story was *under*-communicated, not over-exposed:
the founder read the surface as a monthly reminder. Filing the one
differentiating surface inside a generic Projects list would make it invisible
at exactly the moment a prospect decides whether this is another task app.

Second, the two surfaces answer different questions. Projects answers "what am
I working on". Retainers answers "what do I owe this client this month, and can
this month close". The second has a cycle-close ritual with a hard gate on
unresolved deliverables; Projects has no equivalent, and forcing both into one
list would either bury the gate or impose it on work that does not need it.

**Revisit after the beta** if telemetry shows users reach retainers mostly
through Projects, or if the Retainers destination goes unvisited between cycle
boundaries.

### People is removed from primary navigation — provisional

Locked beta decisions already make People lightweight contextual records with
no contact-book sync and no automatic merges. A top-level People destination
contradicts that: it implies a CRM, invites import and dedupe expectations that
the beta explicitly excludes, and spends a navigation slot on a surface with no
workflow behind it.

Person pages still exist and stay reachable from any record that mentions the
person, and later from search. Only the navigation entry is gone.

This is provisional because it is an argument from scope, not from evidence.
Pass A's navigation probe returned no signal either way. Pass B must check that
nobody goes hunting for a People destination, and the T7 boundary probe should
record where participants expect to find a person.

### Eight was one too many

Seven is not a magic number; the reduction is a consequence of the People
decision. The reorder is deliberate though: Today, Review, and Slipping are the
three attention surfaces a user should touch daily, and Slipping previously sat
sixth, below four library destinations. Putting the second differentiator below
the fold of the sidebar worked against the product's own thesis.

---

## 2. Terminology — mostly frozen

### Survives as user-facing vocabulary

| Term | Status | Reasoning |
|---|---|---|
| Today | Frozen | Unambiguous, matches every competitor's meaning. |
| Capture | Frozen | The verb the product is organised around. |
| Review | Frozen | Understood in Pass A without hesitation. |
| Slipping | Frozen | The only term with positive comprehension evidence. |
| Retainer | Frozen | The audience's own commercial word for the arrangement. |
| Cycle | Frozen, with a rule | Always qualified on first mention. |
| Carryover | Frozen, with a rule | Always paired with a copy count and a link direction. |
| Proposal | **Provisional** | Retained for a specific reason, see below. |

### Retired from the interface: "Top 3"

**"Top 3" stays a domain and specification term. It does not appear in the
interface.** The user-facing word is **focus**: "Your focus", "Add to my focus",
"In your focus".

This one is settled by the prototype rather than by opinion. The interface had
*already* drifted — the section heading said "Your focus" while two controls
said "Add to Top 3", and nobody noticed the split until the walkthrough forced
a reading of the screen. Two words for one concept in a single viewport is a
defect regardless of which word wins.

"Focus" wins because it is what the section is for, it works as a verb and a
noun, and it does not encode the limit in the name. The limit of three is a
rule the interface enforces and states; it does not need to be in the label.
The `Top 3` term remains correct in `slipwell-specification.md`, in the domain
model, and in the API surface.

### "Cycle" and "carryover" keep a usage rule, not just a word

Pass A showed the words were not the problem; the model was. So:

- Never render a bare "Cycle" as a heading, column, or filter. Always name it:
  "the September cycle", "current cycle", "cycle history".
- Never render "Carried over" without stating how many copies exist and which
  one is the original. The interface now says "Copy 1 of 1 · links back to the
  July original, which stays in July" rather than leaving the reader to infer
  provenance from two cards sitting next to each other.

### "Proposal" is kept, with low confidence

Keeping it is a judgment call and Pass B decides it. The reason to keep it is
that the product now has two distinct concepts that plain words would collapse:

- a **proposal** is Slipwell's interpretation of a capture, which the user must
  accept before anything is created;
- a **suggestion** is a recommendation to put an existing record into today's
  focus, which the user may decline with nothing else taking the slot.

Calling both of them "suggestions" would erase the difference between "nothing
exists yet" and "this already exists, and I am proposing you prioritise it".
That difference is a trust invariant. If Pass B shows "proposal" reads as
jargon, replace it with a phrase that preserves the distinction, not with
"suggestion".

---

## 3. Confirmation defaults — frozen for the beta, with a graduation path

**Decision. A proposal never files itself. The user explicitly accepts, at any
confidence level, for the whole of the private beta. Auto-file remains off, and
becomes available only as an explicit opt-in after the measured criteria below
are met.**

This confirms the locked beta decision, and it declines the alternative that
was raised during the walkthrough: auto-file high-confidence proposals and rely
on undo. That alternative is right about the problem and wrong about the fix,
and both halves are worth recording.

The founder raised the alternative, reviewed the reasoning below, and confirmed
this decision on 2026-07-30. Record that as a considered choice rather than an
unexamined default, so it is not silently reopened later.

### Why not auto-file with undo, yet

1. **Undo only protects a user who notices.** Auto-file's failure mode is
   silent. The errors that matter here — wrong person, wrong project, a date
   read as next Friday instead of this one — are precisely the ones you do not
   catch on a glance, and undo expires against a mistake nobody saw.
2. **There is no data to set a threshold with.** The 88 percent confidence in
   the prototype is a hardcoded constant. A real auto-file gate needs a
   measured, per-field, accept-without-edit rate, and that number does not
   exist until beta users generate it. Shipping auto-file first would mean
   choosing the threshold by feel on the one decision where feel is worthless.
3. **The costs are asymmetric.** An unnecessary confirmation costs one
   keystroke. A silent misfile costs a missed client promise, which is the
   exact failure the product sells against. Trading the cheap error for the
   expensive one is a bad trade even if the expensive one is rarer.
4. **Beta scale does not create the pain that auto-file solves.** Confirmation
   fatigue is a volume problem. Ten to fifty users filing a handful of captures
   a day are not drowning.

### The underlying complaint is legitimate, and is fixed differently

Confirming a proposal that is already correct *is* busywork, and the answer is
to make accepting nearly free rather than to remove the accept:

- `Enter` accepts from anywhere in the proposal dialog; `Escape` closes without
  discarding the draft, which already holds.
- The dialog leads with a single line stating what will be created, so a
  correct proposal is confirmed with a glance rather than a read.
- Only ambiguous or low-confidence fields are visually flagged. Fields that are
  confidently right are not styled as though they need attention.

The target is that accepting a correct proposal costs one keystroke and under
two seconds. If it still feels like friction at that cost, the problem is the
interaction, not the existence of the confirmation.

### Graduation criteria for opt-in auto-file

Auto-file may be offered — never defaulted on — when **all** of the following
hold for that individual user:

1. at least 200 accepted proposals;
2. at least 95 percent of the most recent 100 accepted with no field edited;
3. per-field accuracy of at least 98 percent for date, project, and person;
4. the proposal creates a Task or a Note; updates, merges, links to ambiguous
   people, and anything destructive always require review regardless of
   confidence;
5. auto-filed records appear in a distinct band in Review for 24 hours with
   one-tap undo, and are marked as auto-filed in their activity history
   permanently;
6. the user opted in explicitly and can turn it off in one step.

Recording these now is the point: it converts "auto-file later, maybe" into a
measurable condition that the accepted-proposal instrumentation in M2 can be
built to answer.

---

## 4. Launch identity — confirmed, provisional pending SLIP-002

**Decision. Creator-consultants with recurring client work remain the launch
audience. Freelancers with retainers remain the secondary comparison segment.**

This is provisional by construction:
[SLIP-002](https://github.com/xuanhieu2611/Slipwell/issues/2) interviews are the
evidence that decides it, and they have not happened. What follows is the
reasoning that justifies proceeding rather than blocking.

### Willingness to pay is not the risk

The segment buys tools with business money, not personal money. The pain has a
direct dollar value: a retainer worth one to five thousand a month is put at
risk by a forgotten deliverable, so a subscription in the fifteen to thirty
dollar range is a rounding error against the thing it protects. Segments that
sell services are also easier to charge than segments that consume content,
because they are already used to paying for tools that touch client delivery.

### Reach is the risk

"Creator-consultant" is a description, not an identity. Nobody puts it in a
bio, searches for it, or gathers in a place named after it. That makes both
paid acquisition and participant recruiting harder than the segment's economics
would suggest — and the fact that SLIP-002 has not run yet is itself the first
piece of evidence about how hard the segment is to enumerate.

The resolution is to separate two things that are being conflated:

- the **product audience**, which decides what gets built, stays
  creator-consultants with recurring client work;
- the **acquisition proxy**, which decides where to look for them, should be
  defined as *people who publicly sell monthly retainers* — findable in
  agency-of-one communities, in people posting retainer pricing publicly, and
  among buyers of client-work templates for other tools.

Recruiting for SLIP-002 should use the proxy. The specification should keep the
audience.

### The honest caveat

Whether this monetises depends far more on retention than on segment choice. If
the capture habit forms and slipping prevents at least one real mistake per
user per month, several adjacent segments would also pay. If it does not, no
segment will, and picking a different one first would only delay finding that
out. The beta's job is to test the habit, and that is what the criteria in
[SLIP-001](https://github.com/xuanhieu2611/Slipwell/issues/1) and the stop
criteria in specification section 20 exist to measure.

**Do not treat this section as settling the launch identity.** It authorises
building against it. SLIP-002 confirms or revises it, and this record is
superseded if it revises it.

---

## 5. Deferred scope and accepted debt

### Deferred to Pass B, tracked as an exception on SLIP-005

Two acceptance criteria cannot be satisfied without external participants and
are recorded as explicit exceptions rather than being marked complete:

- at least 10 target users attempting the six flows without coaching;
- completion time, errors, hesitation, and qualitative feedback recorded across
  those participants.

Everything in this record that depends on them is marked provisional above.

### Accepted debt, with a target

| Item | Severity | Target |
|---|---|---|
| Icon buttons at 40 px against a 44 px minimum | 2 | [SLIP-014](https://github.com/xuanhieu2611/Slipwell/issues/14) |
| Decorative controls with no handler in the prototype | 2 | Resolved by real implementation, M2 |
| Retainer templates can be added but not removed | 1 | M3 |
| Prior-cycle labels in the prototype are seeded as July and June regardless of the chosen first cycle | 1 | Prototype only, not carried into implementation |

### Explicitly out of scope for the beta, unchanged

The exclusions in `AGENTS.md` stand and are not reopened by this record: no
native clients, no browser extensions, no team workspaces, no email ingestion,
no calendar write-back, no custom databases, no invoicing, and no general AI
chat before retrieval, authorization, and citations are proven.

---

## Consequences

- SLIP-006 and SLIP-014 may proceed against seven destinations in the order
  above, with People as a contextual route rather than a navigation entry.
- Implementation uses "focus" in the interface and `Top 3` in the domain layer;
  a mismatch between the two is a defect, not a style preference.
- The capture flow ships with an explicit accept, and the accepted-proposal
  instrumentation built in M2 must be able to answer the six graduation
  criteria in section 3.
- Pass B re-tests the People removal, the terminology in section 2, the
  retainer model now that the F1 fix landed, and the slipping value question.
