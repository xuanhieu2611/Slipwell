import { expect, test } from "@playwright/test";

test("denied microphone permission falls back to typing without losing input", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto("/");

  await page.getByRole("button", { name: "Capture something" }).click();
  await page
    .getByRole("textbox")
    .fill("Remind me Friday morning to send Sarah the Acme homepage draft.");

  await page.getByRole("tab", { name: "Voice" }).click();
  await page
    .getByRole("button", { name: /simulate blocked microphone/i })
    .click();

  await expect(
    page.getByText("Slipwell cannot reach your microphone"),
  ).toBeVisible();
  await expect(page.getByText(/site settings/i)).toBeVisible();

  await page.getByRole("button", { name: "Continue by typing" }).click();

  // The capture flow must remain completable, and nothing already written may
  // be discarded by the permission failure.
  await expect(page.getByRole("textbox")).toHaveValue(
    "Remind me Friday morning to send Sarah the Acme homepage draft.",
  );
  await page.getByRole("button", { name: "Create proposal" }).click();
  await expect(
    page.getByRole("heading", { name: "Does this look right?" }),
  ).toBeVisible();
});

test("interactive controls stay at 16px so iOS Safari does not zoom on focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto("/");

  await page.getByRole("button", { name: "Capture something" }).click();
  await page.getByRole("textbox").fill("Send Sarah the Acme homepage draft.");
  await page.getByRole("button", { name: "Create proposal" }).click();
  await expect(
    page.getByRole("heading", { name: "Does this look right?" }),
  ).toBeVisible();

  for (const label of ["Destination", "Date", "Project", "Person"]) {
    const fontSize = await page
      .getByLabel(label)
      .evaluate((element) =>
        Number.parseFloat(window.getComputedStyle(element).fontSize),
      );
    expect(fontSize, `${label} must not trigger iOS focus zoom`).toBeGreaterThanOrEqual(16);
  }
});

// A filed capture must not remain in the attention queue, or Review shows one
// capture in two contradictory states.
test("filing removes a capture from Review and undo restores it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");

  await page.getByRole("button", { name: "Capture", exact: true }).click();
  await page
    .getByRole("textbox", { name: "What do you want to capture?" })
    .fill("Send Sarah the Acme homepage draft.");
  await page.getByRole("button", { name: "Create proposal" }).click();
  await page.getByRole("button", { name: "Accept & file" }).click();

  const nav = page.getByRole("navigation", { name: "Primary navigation" });
  await expect(nav.getByRole("button", { name: /Review/ })).toContainText("1");

  // Today's teaser must track the badge; a stale "ambiguous person" summary
  // reintroduces the trust confusion the A6 fix addressed.
  await nav.getByRole("button", { name: /Today/ }).click();
  const reviewTeaser = page.getByRole("button", { name: /Review needs you/ });
  await expect(reviewTeaser).toContainText("1");
  await expect(reviewTeaser).toContainText("One capture failure needs a retry.");
  await expect(reviewTeaser).not.toContainText("ambiguous person");

  await nav.getByRole("button", { name: /Review/ }).click();

  await expect(page.getByText("Ambiguous person")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Recently filed" }),
  ).toBeVisible();

  await page
    .getByLabel("Recently filed")
    .getByRole("button", { name: "Undo" })
    .click();
  await expect(page.getByText("Ambiguous person")).toBeVisible();
  await expect(nav.getByRole("button", { name: /Review/ })).toContainText("2");
});
