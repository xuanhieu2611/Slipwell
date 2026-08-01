import { expect, test } from "@playwright/test";

test("the session-expiry sign-in path offers the configured OAuth providers", async ({
  page,
}) => {
  await page.goto("/sign-in?reason=session-expired");

  await expect(
    page.getByText("Your session ended. Sign in again to continue."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue with Apple" }),
  ).toBeVisible();
});

test("an OAuth callback without a code returns to a safe sign-in error", async ({
  page,
}) => {
  await page.goto("/auth/callback?next=https://untrusted.example");

  await expect(page).toHaveURL(/\/sign-in\?reason=callback-error$/);
});
