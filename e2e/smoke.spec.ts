import { expect, test } from "@playwright/test";

/**
 * Epic 1 Slice 6 — smoke spec.
 *
 * Asserts that bilingual locale routing and the UGC entry button are
 * reachable end-to-end. Failure here means next-intl middleware, app router,
 * or the first submission surface regressed.
 */
test.describe("locale smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("https://oapi.map.naver.com/openapi/v3/maps.js**", async (route) => {
      await route.fulfill({
        contentType: "application/javascript",
        body: "window.naver = { maps: {} };",
      });
    });
  });

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

  test("invalid submission preserves entered form values", async ({ page }) => {
    await page.goto("/ja");

    await page.locator('input[name="name"]').fill("弘大ひとり食堂");
    await page.locator('input[name="naverUrl"]').fill("https://map.kakao.com/bad-url");
    await page.locator('input[name="isSolo"][value="true"]').check();
    await page.locator('input[name="hasJpMenu"][value="false"]').check();
    await page.locator('input[name="isLateNight"][value="true"]').check();
    await page.locator('select[name="priceRange"]').selectOption("mid");
    await page.locator('textarea[name="reason"]').fill("カウンター席がありそう");

    await page.getByRole("button", { name: "投稿する" }).click();

    await expect(page).toHaveURL(/\/ja\?submission=invalid$/);
    await expect(page.locator("main").getByRole("alert")).toHaveText(
      "入力内容を確認してください。",
    );
    await expect(page.locator('input[name="name"]')).toHaveValue("弘大ひとり食堂");
    await expect(page.locator('input[name="naverUrl"]')).toHaveValue(
      "https://map.kakao.com/bad-url",
    );
    await expect(page.locator('input[name="isSolo"][value="true"]')).toBeChecked();
    await expect(page.locator('input[name="hasJpMenu"][value="false"]')).toBeChecked();
    await expect(page.locator('input[name="isLateNight"][value="true"]')).toBeChecked();
    await expect(page.locator('select[name="priceRange"]')).toHaveValue("mid");
    await expect(page.locator('textarea[name="reason"]')).toHaveValue(
      "カウンター席がありそう",
    );
  });

  test("query form values are ignored without flash state", async ({ page }) => {
    const query = new URLSearchParams({
      submission: "invalid",
      name: "test-name",
      naverUrl: "https://example.invalid/bad-url",
      isSolo: "true",
      hasJpMenu: "false",
      isLateNight: "true",
      priceRange: "mid",
      reason: "test reason",
    });

    await page.goto(`/ja?${query.toString()}`);

    await expect(page.locator('input[name="name"]')).toHaveValue("");
    await expect(page.locator('input[name="naverUrl"]')).toHaveValue("");
    await expect(page.locator('input[name="isSolo"]:checked')).toHaveCount(0);
    await expect(page.locator('input[name="hasJpMenu"]:checked')).toHaveCount(0);
    await expect(page.locator('input[name="isLateNight"]:checked')).toHaveCount(0);
    await expect(page.locator('select[name="priceRange"]')).toHaveValue("");
    await expect(page.locator('textarea[name="reason"]')).toHaveValue("");
  });

  test("map auth failure shows a fallback and filter transitions stay stable", async ({ page }) => {
    await page.goto("/ja");

    await expect(page.getByText("地図を読み込めませんでした。")).toBeVisible();

    await page.getByRole("button", { name: "日本語メニューあり" }).click();

    await expect(page).toHaveURL(/\/ja\?solo=1&jp=1&late=0$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("혼밥서울へようこそ");
    await expect(page.getByRole("button", { name: "日本語メニューあり" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByText("地図を読み込めませんでした。")).toBeVisible();
    await expect(page.getByText("Application error")).toHaveCount(0);
  });
});
