import { test, expect } from "@playwright/test";

/**
 * Smoke tests — verify the public surface renders without a backend.
 * If these fail, the build or routing is broken; not a logic regression.
 */

test.describe("public routes render", () => {
  test("landing page shows hero", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    // The hero block always carries the product name somewhere.
    await expect(page.getByText(/turtask/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test("login page renders form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
    // password field
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("404 page is reachable", async ({ page }) => {
    const response = await page.goto("/this-route-definitely-does-not-exist");
    expect(response?.status()).toBe(404);
  });
});
