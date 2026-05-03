import { expect, test } from "@playwright/test";

/**
 * Epic 1 Slice 6 — smoke spec.
 *
 * Asserts that bilingual locale routing and the UGC entry button are
 * reachable end-to-end. Failure here means next-intl middleware, app router,
 * or the first submission surface regressed.
 */
test.describe("locale smoke", () => {
  test("/ja renders the Japanese greeting", async ({ page }) => {
    await page.goto("/ja");
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toHaveText("혼밥서울へようこそ");
    await expect(page.getByRole("button", { name: "投稿する" })).toBeVisible();
  });

  test("/ko renders the Korean greeting", async ({ page }) => {
    await page.goto("/ko");
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toHaveText("혼밥서울에 오신 것을 환영합니다");
    await expect(page.getByRole("button", { name: "제보하기" })).toBeVisible();
  });

  test("/ redirects to /ja by default", async ({ page }) => {
    const response = await page.goto("/");
    expect(response).not.toBeNull();
    expect(page.url()).toMatch(/\/ja\/?$/);
  });

  test("submission query feedback uses the expected live-region roles", async ({ page }) => {
    const main = page.locator("main");

    await page.goto("/ja?submission=success");
    await expect(main.getByRole("status")).toHaveText(
      "投稿を受け付けました。確認後に掲載されます。",
    );

    await page.goto("/ja?submission=invalid");
    await expect(main.getByRole("alert")).toHaveText("入力内容を確認してください。");

    await page.goto("/ja?submission=garbage");
    await expect(main.getByRole("status")).toHaveCount(0);
    await expect(main.getByRole("alert")).toHaveCount(0);
  });
});
