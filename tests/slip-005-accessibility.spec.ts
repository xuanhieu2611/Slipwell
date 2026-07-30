import { expect, test } from "@playwright/test";

// Specification section 8.2 requires Esc to close transient capture without
// discarding already submitted input.
test("Escape preserves an in-progress capture draft", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");

  await page.getByRole("button", { name: "Capture", exact: true }).click();
  await page
    .getByRole("textbox", { name: "What do you want to capture?" })
    .fill("Remind me Friday to send the Acme invoice.");
  await page.keyboard.press("Escape");

  await expect(
    page.getByRole("dialog", { name: "Capture first. Sort it later." }),
  ).toHaveCount(0);

  await page.getByRole("button", { name: "Capture", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "What do you want to capture?" }),
  ).toHaveValue("Remind me Friday to send the Acme invoice.");
});

// Specification section 8.4 requires focus order and focus restoration to be
// tested in the capture and review dialogs.
test("capture dialog traps focus and restores it on close", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");

  const trigger = page.getByRole("button", { name: "Capture", exact: true });
  await trigger.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  // Tabbing all the way around must never land outside the modal.
  for (let index = 0; index < 12; index += 1) {
    await page.keyboard.press("Tab");
    const insideDialog = await page.evaluate(() => {
      const active = document.activeElement;
      const modal = document.querySelector('[role="dialog"]');
      return active !== null && modal !== null && modal.contains(active);
    });
    expect(insideDialog, `focus escaped the dialog on tab ${index + 1}`).toBe(
      true,
    );
  }

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
