import { expect, test } from "@playwright/test";

const captureSource =
  "Remind me Friday morning to send Sarah the Acme homepage draft.";

test("typed capture can be corrected, filed to Today, focused, and undone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Good morning." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Capture", exact: true })
    .first()
    .click();

  await page
    .getByRole("textbox", { name: "What do you want to capture?" })
    .fill(captureSource);
  await page.getByRole("button", { name: "Create proposal" }).click();

  await expect(
    page.getByRole("heading", { name: "Making sense of it" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Does this look right?" }),
  ).toBeVisible();

  await expect(page.getByText(`“${captureSource}”`)).toBeVisible();
  await expect(page.getByText("88% confident")).toBeVisible();
  await expect(page.getByText("Which Sarah did you mean?")).toBeVisible();

  await page.getByLabel("Destination").selectOption("Note");
  await page.getByLabel("Destination").selectOption("Task");
  await page.getByLabel("Date").fill("2026-08-03");
  await page.getByLabel("Project").selectOption("Acme monthly marketing");
  await page.getByLabel("Person").selectOption("Sarah Martinez");
  await page.getByRole("button", { name: "Accept & file" }).click();

  await expect(page.getByText("Task filed and added to Today.")).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Send Sarah the Acme homepage draft",
    }),
  ).toBeVisible();
  await expect(page.getByText(/Acme monthly marketing/)).toBeVisible();
  await expect(page.getByText(/Sarah Martinez/)).toBeVisible();

  await page.getByRole("button", { name: "Add to my focus" }).click();
  await expect(page.getByText("3 of 3 chosen by you · full")).toBeVisible();
  await expect(
    page
      .getByRole("listitem")
      .filter({ hasText: "Send Sarah the Acme homepage draft" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Undo" }).click();
  await expect(
    page.getByText("Filing undone. The source remains in Review."),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Send Sarah the Acme homepage draft",
    }),
  ).toHaveCount(0);
});

test("simulated voice capture works at the 320px minimum width", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto("/");

  await page.getByRole("button", { name: "Capture something" }).click();
  await page.getByRole("tab", { name: "Voice" }).click();
  await page.getByRole("button", { name: "Start simulated recording" }).click();

  await expect(page.getByText("Simulated recording")).toBeVisible();
  await page.getByRole("button", { name: "Finish recording" }).click();
  await expect(page.getByText("Voice capture ready")).toBeVisible();

  await page.getByRole("button", { name: "Create proposal" }).click();
  await expect(
    page.getByRole("heading", { name: "Does this look right?" }),
  ).toBeVisible();
  await expect(page.getByText(/Voice capture:/)).toBeVisible();
  await expect(page.getByLabel("Person")).toBeVisible();
});

test("Review represents ambiguity, retryable failure, and recovery", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Primary navigation" })
    .getByRole("button", { name: /Review/ })
    .click();

  await expect(
    page.getByRole("heading", { name: "Needs attention" }),
  ).toBeVisible();
  await expect(page.getByText("Ambiguous person")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Failed" })).toBeVisible();
  await expect(page.getByText("Transcription unavailable")).toBeVisible();
  await expect(
    page.getByText(/original audio is still attached/i),
  ).toBeVisible();

  await page.getByRole("button", { name: "Retry" }).click();
  await expect(
    page.getByRole("heading", { name: "Making sense of it" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Does this look right?" }),
  ).toBeVisible();
  await expect(page.getByText(/Recovered voice capture:/)).toBeVisible();
});

test("keyboard capture opens and Escape closes without filing", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("body").press("KeyC");
  await expect(
    page.getByRole("heading", { name: "Capture first. Sort it later." }),
  ).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("heading", { name: "Capture first. Sort it later." }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Good morning." }),
  ).toBeVisible();
});
