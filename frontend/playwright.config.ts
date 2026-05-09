import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config — minimal smoke setup. Spins up `next dev` automatically
 * and runs against http://localhost:3000.
 *
 * Run locally:
 *   npx playwright install chromium     # one time
 *   npm run test:e2e
 *
 * Backend is NOT started by this config — smoke tests check public/static
 * routes only (landing, login form render). Full-flow tests that need the
 * API live in a separate stage planned for Week 4 phase 3.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
