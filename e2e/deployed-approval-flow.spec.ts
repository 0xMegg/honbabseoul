import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const RUN_APPROVAL_SMOKE = process.env.RUN_DEPLOYED_APPROVAL_SMOKE === "true";

test.describe("deployed approval flow smoke", () => {
  test.skip(
    !RUN_APPROVAL_SMOKE,
    "Set RUN_DEPLOYED_APPROVAL_SMOKE=true with deployed and Supabase envs.",
  );
  test.skip(!process.env.DEPLOYED_BASE_URL, "Set DEPLOYED_BASE_URL to smoke a deployment.");
  test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL, "Set NEXT_PUBLIC_SUPABASE_URL.");
  test.skip(
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    "Set a Supabase public key to verify approved-row visibility.",
  );
  test.skip(
    !process.env.SUPABASE_SECRET_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY,
    "Set SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY for admin approval and cleanup.",
  );

  const smokeName = `Codex approval smoke ${Date.now()}`;

  test.afterEach(async () => {
    await createAdminClient().from("restaurants").delete().eq("name_ja", smokeName);
  });

  test("submits pending, approves it through admin client, then exposes it publicly", async ({
    page,
  }) => {
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
    await page.locator('select[name="priceRange"]').selectOption("mid");
    await page.locator('textarea[name="reason"]').fill("Codex deployed approval smoke");

    await page.getByRole("button", { name: "投稿する" }).click();

    await expect(page).toHaveURL(/\/ja\?submission=success$/);

    const admin = createAdminClient();
    const { data: pending, error: pendingError } = await admin
      .from("restaurants")
      .select("id, status")
      .eq("name_ja", smokeName)
      .single();

    expect(pendingError).toBeNull();
    expect(pending?.status).toBe("pending");

    const publicClient = createPublicClient();
    const { data: hiddenRows, error: hiddenError } = await publicClient
      .from("restaurants")
      .select("id, status")
      .eq("id", pending!.id);

    expect(hiddenError).toBeNull();
    expect(hiddenRows).toEqual([]);

    const { data: approved, error: approvalError } = await admin
      .from("restaurants")
      .update({
        address_ja: "ソウル特別市 中区 世宗大路 110",
        address_ko: "서울특별시 중구 세종대로 110",
        latitude: 37.5666,
        longitude: 126.9784,
        name_ko: "코덱스 승인 스모크",
        status: "approved",
      })
      .eq("id", pending!.id)
      .select("id, status")
      .single();

    expect(approvalError).toBeNull();
    expect(approved?.status).toBe("approved");

    const { data: publicRow, error: publicError } = await publicClient
      .from("restaurants")
      .select("id, status, name_ja, name_ko, latitude, longitude")
      .eq("id", pending!.id)
      .single();

    expect(publicError).toBeNull();
    expect(publicRow).toMatchObject({
      id: pending!.id,
      latitude: 37.5666,
      longitude: 126.9784,
      name_ja: smokeName,
      name_ko: "코덱스 승인 스모크",
      status: "approved",
    });
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
