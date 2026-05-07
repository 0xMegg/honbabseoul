import { expect, type Page, test } from "@playwright/test";

test.describe("deployed read path smoke", () => {
  test.skip(!process.env.DEPLOYED_BASE_URL, "Set DEPLOYED_BASE_URL to smoke a deployment.");

  test("renders the map, filters, marker detail, and route transitions on /ja", async ({
    page,
  }) => {
    if (process.env.VERCEL_SHARE_URL) {
      await page.goto(process.env.VERCEL_SHARE_URL);
    }

    await page.goto("/ja");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("혼밥서울へようこそ");
    await expect(page.getByLabel("ソウルの一人ごはんマップ")).toBeVisible();
    await expect(page.getByText(/件を表示中/)).toBeVisible();
    await expect(page.getByText("Application error")).toHaveCount(0);
    await expect(page.getByText("地図を読み込めませんでした。")).toHaveCount(0);

    await expect(
      page.locator('[data-hb-cluster="true"], [data-hb-marker="true"]').first(),
    ).toBeVisible({
      timeout: 20_000,
    });

    const firstCluster = page.locator('[data-hb-cluster="true"]').first();
    if ((await firstCluster.count()) > 0) {
      await expect(firstCluster).toBeVisible({ timeout: 20_000 });
      await clickVisibleMapElement(page, '[data-hb-cluster="true"]');
    }

    const firstMarker = page.locator('[data-hb-marker="true"]').first();
    await expect(firstMarker).toBeVisible({ timeout: 20_000 });
    await clickVisibleMapElement(page, '[data-hb-marker="true"]');

    const detail = page.getByRole("dialog", { name: "お店の詳細" });
    await expect(detail).toBeVisible();
    await expect(detail.getByRole("img", { name: /代表写真|写真準備中/ })).toBeVisible();
    await expect(detail.getByRole("heading")).toBeVisible();
    await expect(detail.getByText("価格帯")).toBeVisible();

    await page.getByRole("button", { name: "閉じる" }).click();
    await expect(detail).toHaveCount(0);

    await page.getByRole("button", { name: "日本語メニューあり" }).click();

    await expect(page).toHaveURL(/\/ja\?solo=1&jp=1&late=0$/);
    await expect(page.getByRole("button", { name: "日本語メニューあり" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByText(/件を表示中/)).toBeVisible();
    await expect(page.getByText("Application error")).toHaveCount(0);
  });
});

async function clickVisibleMapElement(page: Page, selector: string) {
  const markerHandle = await page.waitForFunction((targetSelector) => {
    const markers = Array.from(document.querySelectorAll<HTMLElement>(targetSelector));
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    for (const marker of markers) {
      const rect = marker.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      if (x >= 0 && x <= viewportWidth && y >= 0 && y <= viewportHeight) {
        return { x, y };
      }
    }

    return null;
  }, selector);
  const marker = await markerHandle.jsonValue();

  if (!marker) throw new Error(`No ${selector} is clickable in the current viewport.`);

  await page.mouse.click(marker.x, marker.y);
}
