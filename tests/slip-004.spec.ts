import { expect, test } from "@playwright/test";

test("monthly retainer creation preserves explicit rollover provenance", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");

  await page
    .getByRole("navigation", { name: "Primary navigation" })
    .getByRole("button", { name: "Retainers" })
    .click();

  await expect(
    page.getByRole("heading", { name: "Create a retainer." }),
  ).toBeVisible();
  await expect(page.getByLabel("Retainer name")).toHaveValue(
    "Acme monthly marketing",
  );
  await expect(page.getByLabel("Deliverable 1 name")).toHaveValue(
    "Monthly performance report",
  );
  await expect(page.getByLabel("Deliverable 2 name")).toHaveValue(
    "Next month content calendar",
  );

  await page.getByRole("button", { name: "Create monthly retainer" }).click();

  await expect(
    page.getByRole("heading", { name: "Acme monthly marketing" }),
  ).toBeVisible();
  await expect(page.getByText("Complete", { exact: true })).toBeVisible();
  await expect(page.getByText("Incomplete", { exact: true })).toHaveCount(2);
  await expect(page.getByText("Skipped", { exact: true })).toBeVisible();

  const closeCycle = page.getByRole("button", {
    name: "Close July & apply rollover",
  });
  await expect(closeCycle).toBeDisabled();

  await page
    .getByLabel("Resolution for July campaign handoff")
    .selectOption("carry");
  await expect(closeCycle).toBeDisabled();
  await page
    .getByLabel("Resolution for July strategy call")
    .selectOption("overdue");
  await expect(closeCycle).toBeEnabled();
  await closeCycle.click();

  await expect(
    page.getByText("July closed with every unfinished item accounted for."),
  ).toBeVisible();
  await expect(page.getByText("Carried over", { exact: true })).toHaveCount(2);

  const augustCycle = page
    .getByRole("article")
    .filter({ hasText: "August 2026" });
  const julyCycle = page.getByRole("article").filter({ hasText: "July 2026" });
  await expect(
    augustCycle.getByText("July campaign handoff", { exact: true }),
  ).toHaveCount(1);
  await expect(
    julyCycle.getByText("July campaign handoff", { exact: true }),
  ).toHaveCount(1);
  await expect(
    julyCycle.getByText("Retained overdue in July", { exact: true }),
  ).toBeVisible();
});

test("slipping examples explain evidence and support every response path", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");

  await page
    .getByRole("navigation", { name: "Primary navigation" })
    .getByRole("button", { name: "Slipping" })
    .click();

  await expect(
    page.getByRole("heading", { name: "Slipping, not overdue." }),
  ).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(4);
  await expect(page.getByText("SLIP-TASK-STALE")).toBeVisible();
  await expect(page.getByText("SLIP-PROJECT-INACTIVE")).toBeVisible();
  await expect(page.getByText("SLIP-PROJECT-NEXT")).toBeVisible();
  await expect(page.getByText("SLIP-RETAINER-DUE")).toBeVisible();
  await expect(page.getByText("Threshold", { exact: true })).toHaveCount(4);
  await expect(
    page.getByText("Last qualifying attention", { exact: true }),
  ).toHaveCount(4);
  await expect(page.getByText("Elapsed breach", { exact: true })).toHaveCount(
    4,
  );
  await expect(
    page.getByText("Available actions", { exact: true }),
  ).toHaveCount(4);

  await page
    .getByRole("button", {
      name: "Schedule task for Draft August newsletter",
    })
    .click();
  await expect(
    page.getByText(
      "Schedule task recorded as qualifying attention. Signal resolved.",
    ),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "Snooze Northstar brand refresh" })
    .click();
  await expect(
    page.getByText(
      "Snoozed until Monday, August 3. It will not regenerate before then.",
    ),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "Dismiss Studio website refresh" })
    .click();
  await expect(
    page.getByText("Dismissed with reason: rule too aggressive."),
  ).toBeVisible();

  await page
    .getByRole("button", {
      name: "Change cadence Acme August performance report",
    })
    .click();
  await expect(page.getByText("14 days · Custom cadence")).toBeVisible();
  await page
    .getByRole("button", { name: "Pause Acme August performance report" })
    .click();
  await expect(
    page.getByText(
      "Paused intentionally. Inactivity signals will not regenerate.",
    ),
  ).toBeVisible();
});

test("retainer and slipping workflows remain reachable at 320px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto("/");

  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("button", { name: "Retainers" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Create a retainer." }),
  ).toBeVisible();

  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("button", { name: "Slipping" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Slipping, not overdue." }),
  ).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});
