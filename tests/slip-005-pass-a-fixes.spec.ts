import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

// Regression cover for the comprehension failures found in the Pass A
// walkthrough. See docs/research/slip-005-pass-a-findings.md.

async function fileTheSeededCapture(page: Page) {
  await page.getByRole("button", { name: "Capture", exact: true }).click();
  await page
    .getByRole("textbox", { name: "What do you want to capture?" })
    .fill("Send Sarah the Acme homepage draft.");
  await page.getByRole("button", { name: "Create proposal" }).click();
  await page.getByRole("button", { name: "Accept & file" }).click();
}

async function createTheSeededRetainer(page: Page) {
  const nav = page.getByRole("navigation", { name: "Primary navigation" });
  await nav.getByRole("button", { name: "Retainers" }).click();
  await page.getByRole("button", { name: "Create monthly retainer" }).click();
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto("/");
});

// F2. Top 3 was read as system-chosen. Every item must carry its own
// authorship, because a section-level "chosen by you" label was not believed.
test("every focus item states that the user chose it", async ({ page }) => {
  const focus = page.getByRole("region", { name: "Your focus" });

  await expect(focus.getByText(/2 of 3 chosen by you/)).toBeVisible();
  await expect(
    focus.getByText(
      "Slipwell can suggest. It never puts anything here for you.",
    ),
  ).toBeVisible();
  await expect(focus.getByText(/^You added this at /)).toHaveCount(2);
});

// F2. A suggestion must be visibly outside the list, explain itself, and be
// refusable without something else taking the slot.
test("a focus suggestion is refusable and never fills the slot on its own", async ({
  page,
}) => {
  await fileTheSeededCapture(page);

  const suggestion = page.getByRole("group", {
    name: "Send Sarah the Acme homepage draft",
  });
  await expect(suggestion.getByText("Suggested · not added")).toBeVisible();
  await expect(suggestion.getByText(/Suggested because/)).toBeVisible();

  // Still two chosen items: the suggestion is not counted as one.
  const focus = page.getByRole("region", { name: "Your focus" });
  await expect(focus.getByText(/2 of 3 chosen by you/)).toBeVisible();

  await suggestion.getByRole("button", { name: "Not today" }).click();
  await expect(page.getByText("Suggested · not added")).toHaveCount(0);
  await expect(focus.getByText(/2 of 3 chosen by you/)).toBeVisible();
  await expect(focus.getByText(/Slot left open/)).toBeVisible();
});

test("accepting a suggestion adds it with the user named as its author", async ({
  page,
}) => {
  await fileTheSeededCapture(page);

  await page.getByRole("button", { name: "Add to my focus" }).click();

  const focus = page.getByRole("region", { name: "Your focus" });
  await expect(focus.getByText(/3 of 3 chosen by you/)).toBeVisible();
  await expect(focus.getByText(/^You added this at /)).toHaveCount(3);
  await expect(page.getByText("Suggested · not added")).toHaveCount(0);
});

// F1. The retainer read as a monthly reminder because the surface never said
// what the next cycle does.
test("the retainer states what the next cycle will generate", async ({
  page,
}) => {
  await createTheSeededRetainer(page);

  const nextCycle = page.getByRole("region", {
    name: /Slipwell opens the September cycle/,
  });
  await expect(nextCycle).toBeVisible();
  await expect(nextCycle.getByText(/On September 1/)).toBeVisible();
  await expect(
    nextCycle.getByText(/will create 2 deliverables from your templates/),
  ).toBeVisible();
  await expect(nextCycle.getByText(/generated exactly once/)).toBeVisible();
  await expect(nextCycle.getByText("Not a monthly reminder")).toBeVisible();
});

// F1. Retainer invariant: template edits affect future cycles, never history.
test("editing a template changes future cycles and leaves the current one alone", async ({
  page,
}) => {
  await createTheSeededRetainer(page);

  const currentCycle = page
    .getByRole("article")
    .filter({ hasText: "Current cycle" });
  await expect(
    currentCycle.getByText("Monthly performance report"),
  ).toBeVisible();

  await page.getByRole("button", { name: "Edit templates" }).click();
  await page
    .getByRole("textbox", { name: "Edit deliverable 1 name" })
    .fill("Quarterly performance report");
  await page.getByRole("button", { name: "Save for future cycles" }).click();

  await expect(
    page.getByText(
      /September and every later cycle will use them\. August was already generated/,
    ),
  ).toBeVisible();

  const nextCycle = page.getByRole("region", {
    name: /Slipwell opens the September cycle/,
  });
  await expect(
    nextCycle.getByText("Quarterly performance report"),
  ).toBeVisible();

  // History must not be rewritten by a forward-looking edit.
  await expect(
    currentCycle.getByText("Monthly performance report"),
  ).toBeVisible();
  await expect(
    currentCycle.getByText("Quarterly performance report"),
  ).toHaveCount(0);
});

// F4. A carryover is one linked copy, and the original never moves.
test("a carryover states its copy count and where the original stayed", async ({
  page,
}) => {
  await createTheSeededRetainer(page);

  await page
    .getByLabel("Resolution for July campaign handoff")
    .selectOption("carry");
  await page
    .getByLabel("Resolution for July strategy call")
    .selectOption("cancel");
  await page.getByRole("button", { name: /Close July/ }).click();

  await expect(
    page.getByText(/1 linked carryover created, one copy each/),
  ).toBeVisible();

  const currentCycle = page
    .getByRole("article")
    .filter({ hasText: "Current cycle" });
  await expect(currentCycle.getByText(/Copy 1 of 1/)).toBeVisible();

  const priorCycle = page
    .getByRole("article")
    .filter({ hasText: "Prior cycle" });
  await expect(
    priorCycle.getByText(/Stays here in July\. One linked copy/),
  ).toBeVisible();
});

// F3. An unbuilt destination must read as a boundary, not as lost work.
test("the Tasks placeholder names what belongs there and where a filed task is", async ({
  page,
}) => {
  await fileTheSeededCapture(page);

  const nav = page.getByRole("navigation", { name: "Primary navigation" });
  await nav.getByRole("button", { name: "Tasks" }).click();

  await expect(page.getByText(/Every task you have filed/)).toBeVisible();
  await expect(
    page.getByText(/empty because it is not built yet/),
  ).toBeVisible();
  await expect(page.getByText(/was filed and is safe/)).toBeVisible();
});
