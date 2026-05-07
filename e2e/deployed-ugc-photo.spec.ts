import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const RUN_PHOTO_SMOKE = process.env.RUN_DEPLOYED_UGC_PHOTO_SMOKE === "true";
const BUCKET = "restaurant-photos";

test.describe("deployed UGC photo smoke", () => {
  test.skip(
    !RUN_PHOTO_SMOKE,
    "Set RUN_DEPLOYED_UGC_PHOTO_SMOKE=true with deployed and Supabase admin envs.",
  );
  test.skip(!process.env.DEPLOYED_BASE_URL, "Set DEPLOYED_BASE_URL to smoke a deployment.");
  test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL, "Set NEXT_PUBLIC_SUPABASE_URL for cleanup.");
  test.skip(
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    "Set a Supabase public key to verify pending-row isolation.",
  );
  test.skip(
    !process.env.SUPABASE_SECRET_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY,
    "Set SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY for cleanup.",
  );

  const smokeName = `Codex photo smoke ${Date.now()}`;
  let uploadedPhotoUrl: string | null = null;

  test.afterEach(async () => {
    const admin = createAdminClient();

    const { data: rows } = await admin
      .from("restaurants")
      .select("id, photo_url")
      .eq("name_ja", smokeName);

    const photoPaths = new Set<string>();
    for (const row of rows ?? []) {
      if (row.photo_url) {
        const path = storagePathFromPublicUrl(row.photo_url);
        if (path) photoPaths.add(path);
      }
    }
    if (uploadedPhotoUrl) {
      const path = storagePathFromPublicUrl(uploadedPhotoUrl);
      if (path) photoPaths.add(path);
    }

    if (photoPaths.size > 0) {
      await admin.storage.from(BUCKET).remove([...photoPaths]);
    }

    await admin.from("restaurants").delete().eq("name_ja", smokeName);
  });

  test("submits a pending restaurant with an uploaded photo and cleans it up", async ({ page }) => {
    if (process.env.VERCEL_SHARE_URL) {
      await page.goto(process.env.VERCEL_SHARE_URL);
    }

    await page.goto("/ja");

    await page.locator('input[name="name"]').fill(smokeName);
    await page
      .locator('input[name="naverUrl"]')
      .fill("https://map.naver.com/p/entry/place/12345678");
    await page.locator('input[name="isSolo"][value="true"]').check();
    await page.locator('input[name="hasJpMenu"][value="true"]').check();
    await page.locator('input[name="isLateNight"][value="false"]').check();
    await page.locator('select[name="priceRange"]').selectOption("low");
    await page.locator('textarea[name="reason"]').fill("Codex deployed photo upload smoke");
    await page.locator('input[name="photo"]').setInputFiles({
      name: "codex-smoke.png",
      mimeType: "image/png",
      buffer: tinyPng(),
    });

    await page.getByRole("button", { name: "投稿する" }).click();

    await expect(page).toHaveURL(/\/ja\?submission=success$/);
    await expect(page.locator("main").getByRole("status")).toHaveText(
      "投稿を受け付けました。確認後に掲載されます。",
    );

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("restaurants")
      .select("id, status, photo_url")
      .eq("name_ja", smokeName)
      .single();

    expect(error).toBeNull();
    expect(data?.status).toBe("pending");
    expect(data?.photo_url).toMatch(
      /^https:\/\/.+\/storage\/v1\/object\/public\/restaurant-photos\/\d{4}\/\d{2}\/.+\.png$/,
    );
    uploadedPhotoUrl = data?.photo_url ?? null;

    const publicClient = createPublicClient();
    const { data: publicRows, error: publicError } = await publicClient
      .from("restaurants")
      .select("id, status")
      .eq("name_ja", smokeName);

    expect(publicError).toBeNull();
    expect(publicRows).toEqual([]);
  });
});

function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );
}

function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );
}

function storagePathFromPublicUrl(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl);
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const index = url.pathname.indexOf(marker);
    return index >= 0 ? decodeURIComponent(url.pathname.slice(index + marker.length)) : null;
  } catch {
    return null;
  }
}

function tinyPng(): Buffer {
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/ax8p9kAAAAASUVORK5CYII=",
    "base64",
  );
}
