# SLIP-003 interaction prototype

This is a coded, disposable prototype for testing Slipwell's browser
Capture → Review → Today loop. It intentionally uses mock state and does not
provide production persistence, authentication, microphone access,
transcription, AI routing, or Supabase integration.

## Primary usability scenario

1. Capture: “Remind me Friday morning to send Sarah the Acme homepage draft.”
2. Observe that the original source and cleaned text remain separate.
3. Review the proposed destination, confidence, date, project, and person.
4. Resolve the intentionally ambiguous Sarah match.
5. Accept the proposal and find the new task on Today.
6. Add it to Top 3.
7. Undo the filing and verify that the source remains represented in Review.

The Review screen also contains a recoverable transcription failure. Voice
capture is simulated so the interaction can be tested without browser
permissions or a transcription provider.

## Acceptance coverage

| SLIP-003 criterion | Prototype evidence |
|---|---|
| Typed and simulated voice capture on desktop and mobile browser layouts | Capture dialog has Type and Voice modes; Playwright exercises desktop and 320 px layouts |
| Original, cleaned text, destination, confidence, and extracted context are distinct | Proposal editor presents separate source and cleaned panels plus editable structured fields |
| Record type, date, project, and person can be corrected | All four fields are editable before acceptance |
| Accepted work appears in Today and can be selected for Top 3 | Acceptance returns to Today with an explicit Add to Top 3 action |
| Failure, ambiguity, and Undo are represented | Review contains an ambiguous person, retryable transcription failure, and reversible filing |
| No native app or Watch dependency | The prototype is a browser-only responsive Next.js application |

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
npx playwright install chromium
npm test
```
