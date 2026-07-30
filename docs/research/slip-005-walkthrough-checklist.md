# SLIP-005 walkthrough checklist

> **Completed 2026-07-30.** The answers recorded inline below were analysed in
> [the Pass A findings](./slip-005-pass-a-findings.md), which produced two
> severity 3 fixes, and the decisions in
> [DR-0001](../decisions/0001-private-beta-interaction-contract.md). Kept as the
> raw record of what was actually said. Reuse the same tasks for Pass B, from
> [the test plan](./slip-005-usability-test-plan.md), so results stay comparable.

Run `npm run dev` and open `http://localhost:3000`.

Work through the checks in order. For each one, tell me:

- **Result** — worked / worked but awkward / got stuck
- **Answer** — your reply to the question, in your own words
- **Anything odd** — anything you noticed, however small

You do not need to time anything or fill this file in. Reading the results
back to me is enough.

## Two rules that make this worth doing

You designed this, so you already know where everything is. That makes a
normal self-test almost worthless. These two habits convert it into real
evidence:

1. **Before each click, say what you expect to happen.** A wrong prediction is
   a genuine finding. A right one proves nothing.
2. **When you use knowledge the screen did not give you, say so.** Those are
   the exact spots where a stranger would have been stuck, and they are the
   most valuable thing a solo session can produce.

Do not fix anything while testing. Note it and keep going.

Some buttons are deliberately dead: the "Confirm" button on the second Review
card, the numbered circles in Top 3, and the overflow menus. If you click one
expecting something, tell me what you expected — that is useful. Do not
report them as bugs.

---

## Part 1 — The six core flows

### T1 · First capture

**Do:** You have just remembered that on Friday morning you need to send Sarah
the Acme homepage draft. Get that into Slipwell.

**Then answer:** Where is it now? Is it saved? Has anything been created yet?

My answer: I used voice feature, it was able to capture it and give me the proposal, it was able to find correct destination, project, date, confidence score, and even flag the person for me. In the review tab, i can see recently filed. In today tab, i can add that task for my focus. However, in the task tab, i don't see anything, i'm not sure if this is expected

### T2 · Correcting a wrong route

**Do:** Slipwell guessed some details. Make sure what gets saved is actually
correct, then save it.

**Then answer:** What would have been saved if you had accepted immediately?
What happened to the words you originally typed?

My answer: It cleaned up for me, date and time actually got transfer to due date

### T3 · Choosing Top 3

**Do:** Decide what you are actually going to protect time for today.

**Then answer:** Who chose these three? Could Slipwell have chosen for you?
How many can there be?

My answer: Slipwell chose the first 2, and i can chose the 3rd one. Only 3 can be there

### T4 · Creating a monthly retainer

**Do:** You just signed Acme for ongoing monthly marketing. Every month you owe
them a performance report and a content calendar. Set that up.

**Then answer:** What happens next month? If you change a template in October,
what happens to September?

My answer: I'm not quite sure here. But this is just a montly reminder right?

### T5 · Rollover and carryover

**Do:** July is over. Close it out.

**Then answer:** How many copies of the July campaign handoff exist now, and
where is each one? What happened to the strategy call? Could anything have
been lost?

My answer: two incomplete can get handoff to next month or just cancel

### T6 · Understanding a slipping signal

**Do:** Slipwell thinks something needs your attention. Work out what it wants
and decide what to do about it.

**Then answer:** Why did this appear? Is it overdue? What did acting on it
change? What would bring it back?

My answer: this section looks good

---

## Part 2 — Spot checks

### S1 · Microphone denial

Open capture, type a few words, switch to the **Voice** tab, then click
**Prototype · simulate blocked microphone**.

**Answer:** Is it clear what failed and what still works? Do you know how to
turn the microphone back on? After **Continue by typing**, is your text still
there?

My answer: yes, everything works as expected

### S2 · Keyboard only

Put your mouse away. Press `C` to open capture. Tab through it. Press `Escape`.

**Answer:** Could you reach everything? Did Tab ever escape the dialog onto the
page behind it? After Escape, where did focus land? Reopen capture — is your
draft still there?

My answer: Yes, everything works as expected

### S3 · Narrow screen

Set the browser to 320 px wide, or use device emulation on a phone preset.
Repeat T1 and T3.

**Answer:** Is anything cut off, overlapping, or unreachable? Is the bottom
navigation in the way?

My answer: everything looks good

### S4 · Navigation and findability

Look at the left navigation without clicking.

**Answer:** If you wanted to find something you saved three weeks ago, where
would you go? Does any label seem wrong or redundant? Tasks, Projects, People,
and Notes are intentionally unbuilt, so ignore that they are empty.

My answer: everything looks good

### S5 · The word "Slipping"

**Answer:** If you had never seen this product, what would you assume
"Slipping" means? Does it read as different from "overdue"? Is there a word
you would rather use?

My answer: slipping mean it has been slipped or left unattended

---

## Part 3 — Four judgement calls

These are not tasks. They are the decisions the interaction contract has to
freeze, and they need your answer rather than a measurement.

All four are now answered in
[DR-0001](../decisions/0001-private-beta-interaction-contract.md), sections 1
to 4. Note that section 3 declines the auto-file proposal recorded below and
explains why, so read that one before treating it as settled.

1. **Navigation.** Does the beta ship with all eight destinations, or fewer?
   Retainers currently sits alongside Projects — should it, or is a retainer  
    just a kind of project? My answer: i'm actually not sure, please recommend here
2. **Terminology.** Which of these survive as user-facing words: Slipping,
   Review, Top 3, Retainer, Cycle, Carryover, Proposal? My answer: agian, please suggest here for me
3. **Confirmation defaults.** Should a high-confidence proposal still require
   an explicit accept, or may it file itself with an undo? The locked beta decision is that auto-file stays off — confirm or change it. My answer: I think we should auto added, then just show the review, if user don't like it, they can undo, or they can fix it? Do you agree here
4. **Launch identity.** Does creator-consultant hold as the launch audience?
   Note that this properly depends on
   [SLIP-002](https://github.com/xuanhieu2611/Slipwell/issues/2) interviews, so a provisional answer is fine and will be recorded as provisional. My answer: what do you think here? My goal is trying actually make money from the app, do you think this launch audience is good enough to monetize and to get attention?

---

## What I fixed before you started

So you do not waste time rediscovering them. Details are in the
[expert audit](./slip-005-expert-audit.md).

- The capture dialog claimed to be modal but never trapped focus; Tab escaped
  to the page behind it on the first press.
- Closing the dialog dropped focus to the top of the document.
- Escape silently destroyed whatever you had typed.
- Every form field was 12.8 px, which makes iOS Safari zoom in on first tap
  and never zoom back out.
- After filing, Review showed the same capture as both needing attention and
  already filed, with the badge stuck at 2.
- There was no way to reach the microphone-denied state, so S1 above did not
  previously exist.
