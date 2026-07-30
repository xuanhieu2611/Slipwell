# SLIP-005 expert audit, Pass A

An inspection of the SLIP-003 and SLIP-004 prototypes against the
specification's interaction, accessibility, and responsive requirements,
performed before any session so that participant time is not spent
rediscovering defects that inspection can find for free.

Severity uses the rubric in
[the test plan](./slip-005-usability-test-plan.md). High severity means level
3 or 4, which SLIP-005 requires to be resolved in the prototype.

This audit does not replace the sessions. Inspection finds violations of known
rules; it cannot find misunderstandings, and it is performed by the same
people who built the thing.

## Resolved

### A1 — The capture dialog did not trap focus. Severity 3

`role="dialog" aria-modal="true"` was declared but not implemented. Focus
escaped to the page behind the modal on the very first Tab press, confirmed by
a failing test before the fix. A keyboard or screen-reader user could operate
background controls while a modal claimed to be blocking them, and would have
no reliable way back into the dialog.

Violates specification 8.4, which names focus order in the capture and review
dialogs specifically, and WCAG 2.2 SC 2.4.3.

Fixed by cycling Tab and Shift+Tab within the dialog and moving initial focus
into it when no control autofocuses. Covered by
`tests/slip-005-accessibility.spec.ts`.

### A2 — Focus was not restored when the dialog closed. Severity 3

Closing capture dropped focus to `<body>`, so a keyboard user was returned to
the top of the document and had to traverse the entire page to get back to
where they were.

The fix was not the obvious one. Reading `document.activeElement` when the
dialog mounts returns the autofocused textarea, because React applies
`autoFocus` during commit, before passive effects run. The dialog now tracks
the last element focused outside any dialog and returns focus there on close.

Violates specification 8.4. Covered by test.

### A3 — Escape discarded an in-progress capture. Severity 3

Specification 8.2 requires Escape to close transient capture *without
discarding already submitted input*. Pressing Escape and reopening produced an
empty field, silently destroying whatever had been typed.

This is worse than an inconvenience given the product's first principle. A
capture tool that can lose a thought between keystroke and save undermines the
trust the beta is supposed to establish.

The draft now survives until the capture is actually filed. Covered by test.

### A4 — Form fields triggered iOS Safari zoom. Severity 3

`.field-control` computed to 12.8 px. iOS Safari zooms the viewport when a
focused control is below 16 px and does not restore the zoom on blur, so the
first tap into any field in the proposal editor, the retainer form, or the
rollover selects would leave a mobile user zoomed in and panning.

This affected most of the flows SLIP-005 exists to validate, on the primary
target device. Suppressing it via `maximum-scale` would violate WCAG 2.2 SC
1.4.4, so the floor was raised to 16 px instead. Covered by a test that asserts
the computed font size of each proposal control.

Detailed in
[the browser constraints analysis](./slip-005-browser-voice-and-mobile-constraints.md).

### A5 — `100vh` under the iOS dynamic toolbar. Severity 2

The shell and the capture dialog sized themselves with `100vh`, which on iOS
Safari resolves to the viewport with toolbars retracted. The dialog's primary
action could sit beneath the visible area while the toolbar was expanded.
Changed to `dvh`.

### A6 — One capture appeared in two contradictory states. Severity 3

After filing, Review still listed the same capture under "Needs attention"
while also showing it under "Recently filed", and the navigation badge stayed
at 2. A participant asked the T2 probe — "has anything been created yet?" —
could reasonably conclude that accepting a proposal duplicates the record, or
that it did not work at all.

That is a misunderstanding of a trust invariant, which the rubric puts at
level 3 regardless of task completion. The filed capture now leaves the
attention queue, and returns if the filing is undone.

### A7 — Prototype could not demonstrate microphone denial. Severity 3

The specification requires typed capture to remain available when the
microphone is denied or unsupported, and the browser-constraints analysis
shows denial is close to irreversible in-page on iOS. The prototype had no way
to reach that state, so the invariant could be asserted but not observed.

The voice tab now has an explicit prototype control that simulates a blocked
microphone and produces the denial state the beta must ship: what failed, what
still works, how to re-enable it, and a single action back to typing with
input preserved. Covered by test.

## Open and deliberately not fixed

These are recorded rather than resolved, because fixing them would expand
beyond SLIP-005 into implementation issues. Each is noted for how it should be
interpreted during analysis.

### B1 — Decorative controls that do nothing. Severity 2

The "Confirm" button on the high-confidence Review card, the numbered
completion circles in Top 3, the Top 3 overflow menu, and the profile buttons
render as interactive but have no handler.

None sits on the shortest path of any task, so this should not cause failures,
but participants will click them. **Do not treat a click on a dead control as
a product-level error** unless the participant's commentary shows they
expected a specific outcome. Record what they expected; that is the useful
signal.

### B2 — Icon buttons below the touch-target minimum. Severity 2

`.icon-button` is 40 px against a 44 px requirement in specification 8.4. The
mobile navigation and primary buttons already meet it. Affects the dialog
close button and the Top 3 overflow control. Should be corrected when the
production shell is built in
[SLIP-014](https://github.com/xuanhieu2611/Slipwell/issues/14).

### B3 — Decorative badge announced by screen readers. Severity 1

The "3" preceding the "Your focus" heading was presentational and announced as
part of the heading region. Corrected during Pass A with `aria-hidden="true"`.

### B4 — Retainer templates can be added but not removed. Severity 1

Only relevant if a participant adds one by mistake during T4.

### B5 — Tasks, Projects, People, and Notes are placeholders

Deliberate and clearly labelled as a prototype boundary. This is why the
findability item from specification 17.5 is an observation probe rather than a
task. Do not record it as a failure.

## What inspection cannot tell us

Every finding above is a rule violation. None of them tells us whether:

- a first-time user understands that nothing is filed until they accept;
- "slipping" reads as meaningfully different from "overdue";
- a carryover is understood as one linked item rather than a duplicate;
- the retainer template model is understood before the second cycle exists;
- "Top 3" is understood as the user's choice rather than the system's.

Those are the questions the sessions exist to answer, and they are exactly the
questions a self-test answers weakly.

The founder walkthrough answered two of them, both negatively: the retainer
model and the authorship of Top 3 were *both* misunderstood by the person who
specified them. See [the Pass A findings](./slip-005-pass-a-findings.md) for
F1 and F2 and the fixes they produced. The rest stay open until Pass B.
