# SLIP-005 browser voice permission and mobile-browser constraints

This satisfies the SLIP-005 acceptance criterion that browser voice permission
and mobile-browser constraints are tested conceptually. The prototype
simulates microphone capture, so nothing here was measured against a live
transcription provider. Each constraint below is marked as **verified**
against a source or the repository, or **conceptual** where it is standard
platform behavior that the beta must design around but that Pass A did not
exercise.

The purpose is to decide what the beta must guarantee, not to design the
production capture pipeline. Implementation belongs to
[SLIP-015](https://github.com/xuanhieu2611/Slipwell/issues/15) onward.

## 1. Permission model

### The prototype cannot know the permission state in advance

**Verified.** `navigator.permissions.query({ name: "microphone" })` is
supported in Chrome 64+, Edge 79+, Safari 16+ on macOS and iOS, and Firefox
132+. Earlier Firefox rejects the call with a `TypeError` rather than
returning a state, so every call must be wrapped and an unsupported result
treated as unknown rather than denied. Safari additionally fires the
`PermissionStatus` `change` event unreliably, so the query result must not be
used as a live source of truth.

**Consequence for the beta:** treat the permission state as advisory only.
`getUserMedia` is the only authoritative answer. The interface must never
disable the voice control based on a query result, because a false "denied"
would remove a working capability.

### The prompt requires a genuine user gesture

**Conceptual.** Secure context is required: HTTPS, or `localhost` in
development. Safari additionally requires transient user activation, which is
consumed by intervening `await` calls. Requesting the microphone during page
load, during onboarding narration, or after an awaited network round trip will
fail on iOS without ever showing a prompt.

**Consequence for the beta:** `getUserMedia` must be called synchronously in
the handler for the record button. Do not pre-warm the microphone at app
start, and do not request permission during first-run onboarding.

### Denial is expensive and partly irreversible in-page

**Conceptual.** Once a user dismisses or denies the prompt, most browsers will
not re-prompt for that origin from script. Recovery requires the browser's own
site-settings interface, which differs per browser and is especially buried on
iOS. A denied prompt is therefore close to a permanent loss of voice capture
for that user unless they are walked through settings.

**Consequence for the beta:** prime before prompting. Show a short explanation
of why the microphone is needed, with an explicit "Use the microphone" action,
before the browser prompt appears. Never trigger the prompt as a side effect
of navigation. This is a decision to freeze in the interaction contract.

### Failure taxonomy the interface must handle

**Conceptual.** `getUserMedia` rejects with distinguishable `DOMException`
names, and they need materially different copy and recovery, not one generic
error.

| Error                  | Meaning                                               | Required response                                      |
| ---------------------- | ----------------------------------------------------- | ------------------------------------------------------ |
| `NotAllowedError`      | Denied or dismissed, or blocked by permissions policy | Fall back to typing in place; explain how to re-enable |
| `NotFoundError`        | No microphone present                                 | Fall back to typing; do not suggest settings           |
| `NotReadableError`     | Hardware held by another app, or OS-level block       | Offer retry; suggest closing other apps                |
| `OverconstrainedError` | Requested constraints unsatisfiable                   | Retry with `{ audio: true }` and no constraints        |
| `SecurityError`        | Insecure context                                      | Operational failure, not a user error                  |
| `AbortError`           | Hardware failed after acquisition                     | Offer retry; preserve any partial state                |

Dismissing a prompt and actively denying it are not reliably
distinguishable, so the recovery copy must be correct for both.

## 2. Recording format

**Verified.** Safari before 18.4 writes only `audio/mp4` with AAC, as
fragmented MP4. Safari 18.4+ also reports support for
`audio/webm;codecs=opus`, but there are reported duration-calculation and
playback problems with Safari-produced WebM, so `audio/mp4` remains the safer
preference where supported. Chromium defaults to `audio/webm;codecs=opus`.
Firefox writes WebM or Ogg with Opus.

**Verified.** WebKit encodes Opus in 2.5 ms frames where Chrome and Firefox
use 20 ms, and setting `audioBitsPerSecond` aggressively — 510 kbps is the
cited example — can produce a file one browser records and another cannot
play.

**Consequences for the beta:**

- Always feature-detect with `MediaRecorder.isTypeSupported` before
  constructing the recorder; never hardcode a container.
- The transcription provider interface must accept at least fragmented
  MP4/AAC and WebM/Opus, or the server must re-mux. This is a provider
  selection constraint, not just a client concern.
- Do not set custom bitrates without a cross-browser playback test.
- Store the negotiated MIME type alongside the audio, because the stored
  source is immutable evidence and must remain decodable later.

## 3. Mobile session and durability limits

**Conceptual.** On iOS Safari, recording stops when the tab is backgrounded or
the screen locks, and an incoming call tears down the stream. There is no
background capture on the mobile web. Acquiring the microphone also interrupts
other audio playback, which is a real cost for a creator listening to
something while working.

**Conceptual.** Background Sync is Chromium-only. iOS Safari cannot reliably
finish an upload after the user leaves the tab.

**Consequences for the beta, and they interact with locked domain invariants:**

- The spec requires the source to be saved durably before transcription
  starts. In the browser this means writing the audio blob and its idempotency
  key to IndexedDB _before_ attempting upload. `localStorage` is unsuitable
  for binary data and too small, which is already a locked invariant.
- The interface must not claim the capture is saved until durable server
  receipt. An iOS user who closes the tab mid-upload must find the capture
  still pending locally, not silently lost.
- Cap recording length with a visible countdown rather than allowing an
  unbounded recording that a backgrounding event will truncate without
  explanation.
- Treat an interrupted recording as a recoverable partial capture, never as a
  discard. This matches the existing "recoverable transcription failure" state
  the prototype already models in Review.

## 4. Mobile layout constraints, and two defects found in the prototype

Two of these were verifiable against the repository rather than conceptual,
and both are real defects rather than theoretical risks.

### Defect 1 — form fields trigger iOS zoom, severity 3

**Verified in the repository.** `.field-control` sets `font-size: 0.8rem`,
which is 12.8 px. iOS Safari zooms the viewport whenever a focused input has a
computed font size below 16 px, and it does not zoom back out on blur. The app
sets no viewport meta of its own, so Next.js emits the default
`width=device-width, initial-scale=1` and nothing suppresses the behavior.

This affects every field in the proposal editor, the retainer creation form,
and the rollover resolution selects — that is, the majority of the flows
SLIP-005 is meant to validate, on the primary target device.

Suppressing it with `maximum-scale=1` or `user-scalable=no` is not acceptable:
that violates WCAG 2.2 success criterion 1.4.4, which the beta is required to
meet. The correct fix is a 16 px minimum font size on interactive controls.

### Defect 2 — `100vh` under the iOS dynamic toolbar, severity 2

**Verified in the repository.** The shell uses `min-h-screen` and
`min-h-[calc(100vh-68px)]`, and the capture dialog uses `max-h-[96vh]` and
`max-h-[min(74vh,760px)]`. On iOS Safari, `100vh` resolves to the viewport
with the browser toolbars retracted, so a full-height element extends beneath
the visible area. In the capture dialog this can push the primary action
partly off screen while the toolbar is expanded.

The fix is the dynamic viewport unit `dvh`, which tracks the visible viewport.

### Constraints that already hold

**Verified in the repository.** The mobile navigation already respects
`env(safe-area-inset-bottom)`, the body enforces a 320 px minimum width,
`prefers-reduced-motion` is honored, and the 480 px breakpoint raises button
targets to the 44 px minimum. Playwright already exercises capture, retainer,
and slipping flows at 320 px.

### Remaining conceptual constraints

- The on-screen keyboard covers roughly half the viewport. Any primary action
  in a form must remain reachable while the keyboard is open, which is a
  scroll-container concern in the capture dialog specifically.
- Touch targets must be at least 44 by 44 points. The mobile navigation items
  are 52 px, but several small icon buttons sit at 40 px and should be audited
  against real touch rather than pointer emulation.
- Typed capture must remain fully available when the microphone is
  unsupported or denied. This is a locked beta invariant and, before the
  change described below, the prototype had no way to demonstrate it.

## 5. What the prototype now demonstrates

The voice tab includes an explicit prototype control that simulates a denied
microphone permission. It produces the denial state the beta must ship:

- an explanation of what was denied and what still works;
- the recovery path for re-enabling the permission in browser settings;
- a single action that returns the user to typed capture with anything they
  had already entered preserved.

This makes the "typed capture survives permission denial" invariant testable
in a session instead of asserted in a document. It remains a simulation; it
does not call `getUserMedia`.

## 6. Decisions this analysis feeds into the interaction contract

1. Typed capture is the default mode. Voice is opt-in on every surface.
2. The microphone is never requested during onboarding or page load, only from
   a direct press on a record control.
3. A priming explanation precedes the first browser prompt.
4. Permission denial degrades to typed capture in place, preserving input,
   and never blocks the capture flow.
5. Capture is not reported as saved until durable receipt, on every platform.
6. Recording length is capped and the cap is visible before recording starts.
7. Interactive controls use a minimum 16 px font size, and page-scale
   suppression is prohibited.
