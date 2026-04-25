import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config — Epic 1 Slice 6.
 *
 * MVP scope is mobile-first chromium only. Firefox / webkit will be added
 * in a follow-up slice once we have visual regression baselines.
 *
 * Browser binaries: relies on the system cache at
 * ~/Library/Caches/ms-playwright/ — already pre-downloaded during Epic 1
 * preparation, so `pnpm exec playwright install` should be a no-op.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
  },
  projects: [
    {
      // Pixel 7 is a chromium-based mobile device profile. We avoid
      // iPhone-* profiles because they pin the webkit engine, which is
      // not in our pre-downloaded browser cache (only chromium is).
      // Webkit visual parity will land in a follow-up slice if needed.
      name: "chromium-mobile",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
