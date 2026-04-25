import { expect, test } from "@playwright/test";

/**
 * Epic 1 Slice 6 — smoke spec.
 *
 * Asserts that the bilingual locale routing established in Slice 3 is
 * actually reachable end-to-end. Failure here means next-intl middleware
 * regressed or the app router crashed at boot — both are urgent.
 */
test.describe("locale smoke", () => {
  test("/ja renders the Japanese greeting", async ({ page }) => {
    await page.goto("/ja");
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toHaveText("혼밥서울へようこそ");
  });

  test("/ko renders the Korean greeting", async ({ page }) => {
    await page.goto("/ko");
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toHaveText("혼밥서울에 오신 것을 환영합니다");
  });

  test("/ redirects to /ja by default", async ({ page }) => {
    const response = await page.goto("/");
    expect(response).not.toBeNull();
    expect(page.url()).toMatch(/\/ja\/?$/);
  });
});
