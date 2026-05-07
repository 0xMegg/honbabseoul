import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

// server-only throws at import time outside Next.js build pipeline — stub it.
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { submitPending } from "@/lib/repositories/submissions";
import {
  InvalidInputError,
  SubmissionDatabaseError,
} from "@/lib/models/submission";

const VALID_BASE = {
  name: "焼肉ホルモン 弘大",
  naverUrl: "https://map.naver.com/p/entry/place/12345678",
  isSolo: true,
  hasJpMenu: true,
  isLateNight: false,
  reason: "一人でカウンター席に座れる",
};

function buildMockClient(opts: {
  data?: { id: string } | null;
  error?: { code: string; message: string } | null;
}) {
  const single: Mock = vi.fn().mockResolvedValue({
    data: opts.data ?? { id: "uuid-abc-123" },
    error: opts.error ?? null,
  });
  const select: Mock = vi.fn().mockReturnValue({ single });
  const insert: Mock = vi.fn().mockReturnValue({ select });
  const from: Mock = vi.fn().mockReturnValue({ insert });
  const client = { from };
  (createSupabaseAdminClient as Mock).mockReturnValue(client);
  return { from, insert, select, single };
}

describe("submitPending", () => {
  beforeEach(() => {
    buildMockClient({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should reject when name is empty", async () => {
    const err = await submitPending({ ...VALID_BASE, name: "" }).catch(
      (e) => e
    );
    expect(err).toBeInstanceOf(InvalidInputError);
    expect((err as InvalidInputError).flatErrors.fieldErrors.name).toBeDefined();
  });

  it("should reject when naverUrl host is an unknown domain", async () => {
    const err = await submitPending({
      ...VALID_BASE,
      naverUrl: "https://map.kakao.com/p/entry/place/12345678",
    }).catch((e) => e);
    expect(err).toBeInstanceOf(InvalidInputError);
    expect(
      (err as InvalidInputError).flatErrors.fieldErrors.naverUrl
    ).toBeDefined();
  });

  it("should reject naverUrl that suffix-injects the allowed domain", async () => {
    const err = await submitPending({
      ...VALID_BASE,
      naverUrl: "https://evil.naver.com.attacker.tld/p/entry/place/123",
    }).catch((e) => e);
    expect(err).toBeInstanceOf(InvalidInputError);
    expect(
      (err as InvalidInputError).flatErrors.fieldErrors.naverUrl
    ).toBeDefined();
  });

  it("should accept a well-formed naver.me short link", async () => {
    const result = await submitPending({
      ...VALID_BASE,
      naverUrl: "https://naver.me/xyz123",
    });
    expect(result).toEqual({ id: "uuid-abc-123" });
  });

  it("should accept a map.naver.com canonical URL", async () => {
    const result = await submitPending({
      ...VALID_BASE,
      naverUrl: "https://map.naver.com/p/entry/place/12345678",
    });
    expect(result).toEqual({ id: "uuid-abc-123" });
  });

  it("should accept common Naver Place URLs copied from mobile and desktop", async () => {
    for (const naverUrl of [
      "https://m.place.naver.com/restaurant/12345678",
      "https://pcmap.place.naver.com/restaurant/12345678",
      "https://place.map.naver.com/restaurant/12345678",
    ]) {
      await expect(submitPending({ ...VALID_BASE, naverUrl })).resolves.toEqual({
        id: "uuid-abc-123",
      });
    }
  });

  it("should reject unknown extra keys (strict mode blocks status: approved)", async () => {
    const err = await submitPending({
      ...VALID_BASE,
      status: "approved",
    }).catch((e) => e);
    expect(err).toBeInstanceOf(InvalidInputError);
  });

  it("should map camelCase input fields to snake_case insert columns and omit status", async () => {
    const { insert } = buildMockClient({});
    await submitPending({
      ...VALID_BASE,
      priceRange: "mid",
      photoUrl: "https://example.com/photo.jpg",
    });
    expect(insert).toHaveBeenCalledOnce();
    const row = (insert as Mock).mock.calls[0]![0] as Record<string, unknown>;
    expect(row.name_ja).toBe(VALID_BASE.name);
    expect(row.name_ko).toBeNull();
    expect(row.naver_url).toBe(VALID_BASE.naverUrl);
    expect(row.is_solo_default).toBe(true);
    expect(row.has_jp_menu).toBe(true);
    expect(row.is_late_night).toBe(false);
    expect(row.price_range).toBe("mid");
    expect(row.photo_url).toBe("https://example.com/photo.jpg");
    expect(row.reason).toBe(VALID_BASE.reason);
    expect(Object.keys(row)).not.toContain("status");
  });

  it("should persist the reason field to the insert row", async () => {
    const { insert } = buildMockClient({});
    await submitPending({ ...VALID_BASE, reason: "とても良いお店です" });
    const row = (insert as Mock).mock.calls[0]![0] as Record<string, unknown>;
    expect(row.reason).toBe("とても良いお店です");
  });

  it("should forward photoUrl when provided", async () => {
    const { insert } = buildMockClient({});
    await submitPending({
      ...VALID_BASE,
      photoUrl: "https://cdn.example.com/img.jpg",
    });
    const row = (insert as Mock).mock.calls[0]![0] as Record<string, unknown>;
    expect(row.photo_url).toBe("https://cdn.example.com/img.jpg");
  });

  it("should set photo_url to null when photoUrl is absent", async () => {
    const { insert } = buildMockClient({});
    await submitPending({ ...VALID_BASE });
    const row = (insert as Mock).mock.calls[0]![0] as Record<string, unknown>;
    expect(row.photo_url).toBeNull();
  });

  it("should surface InvalidInputError (not raw zod) when validation fails", async () => {
    const err = await submitPending({}).catch((e) => e);
    expect(err).toBeInstanceOf(InvalidInputError);
    expect(err).not.toHaveProperty("issues");
  });

  it("should surface SubmissionDatabaseError with redacted message when supabase errors", async () => {
    buildMockClient({
      data: null,
      error: { code: "23502", message: "null value in column violates NOT NULL" },
    });
    const err = await submitPending({ ...VALID_BASE }).catch((e) => e);
    expect(err).toBeInstanceOf(SubmissionDatabaseError);
    expect((err as SubmissionDatabaseError).code).toBe("23502");
    expect((err as SubmissionDatabaseError).message).not.toContain("null value in column");
  });
});
