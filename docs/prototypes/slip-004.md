# SLIP-004 retainer rollover and slipping prototype

This extends the disposable browser prototype from SLIP-003. It validates
Slipwell's differentiating retainer and attention-risk interactions with mock
client-side state. It does not implement persistence, scheduled cycle
generation, concurrency controls, analytics, or the production slipping
engine.

The incomplete SLIP-002 research dependency was explicitly waived by the
founder for this prototype. SLIP-005 should still test these interactions with
target users before the private-beta interaction contract is frozen.

## Retainer rollover scenario

1. Open **Retainers** and create “Acme monthly marketing.”
2. Review its two monthly deliverable templates and their expected start/due
   offsets.
3. Observe the completed and incomplete July work plus the skipped June cycle.
4. Try to close July. The close action remains disabled until every unfinished
   deliverable has an explicit resolution.
5. Carry “July campaign handoff” forward and keep “July strategy call” overdue
   in July.
6. Close the cycle and verify:
   - the original handoff remains in July;
   - exactly one linked carryover appears in August;
   - the strategy call remains visibly overdue in July;
   - template-generated August work remains distinguishable from carryover.

## Slipping scenario

Open **Slipping** to compare four deterministic examples:

- stale open task;
- inactive project;
- project missing a next action;
- retainer deliverable inside its due-risk window.

Every example exposes its rule, threshold, last qualifying attention, elapsed
breach, severity, and available actions. Exercise **Act**, **Snooze**,
**Dismiss**, **Change cadence**, and **Pause** across the cards. Each response
leaves a visible outcome and states that a signal does not silently change the
underlying priority, date, or status.

## Acceptance coverage

| SLIP-004 criterion | Prototype evidence |
|---|---|
| Create a monthly retainer with deliverable templates | Retainer form captures client, first cycle, monthly template names, and start/due offsets |
| Show complete, incomplete, skipped, and carried-over states | July, June, and post-rollover August cycle cards expose all four states |
| Never silently delete or duplicate unfinished work | July cannot close before explicit resolutions; source and one linked destination copy remain visible |
| Show all four slipping examples | Seeded cards cover task stale, project inactivity, missing next action, and retainer due risk |
| Explain every signal | Each card shows rule ID/reason, threshold, last qualifying attention, elapsed breach, severity, and actions |
| Support act, snooze, dismiss, cadence, and pause | Every signal card exposes all five paths with visible lifecycle outcomes |

## Running locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Quality checks:

```bash
npm run lint
npm run typecheck
npm run build
npm test
```
