import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ZodError } from "zod";
import {
  RestaurantRepositoryError,
  getById,
  listApproved,
} from "@/lib/repositories/restaurants";

// ---------------------------------------------------------------------------
// Inline mock builder — keeps tests self-contained, no shared util needed.
// The PostgREST builder is a real PromiseLike; we implement both `.then`
// (for the array path where `await query` resolves the builder directly)
// and `.maybeSingle()` (for the single-row path in getById).
// ---------------------------------------------------------------------------
type StubResponse = { data: unknown; error: unknown };

function mockClient(response: StubResponse) {
  const eqCalls: Array<[string, unknown]> = [];
  const builder = {
    _eqCalls: eqCalls,
    select: vi.fn(() => builder),
    eq: vi.fn((col: string, val: unknown) => {
      eqCalls.push([col, val]);
      return builder;
    }),
    maybeSingle: vi.fn(async () => response),
    then: (resolve: (v: StubResponse) => unknown) =>
      Promise.resolve(response).then(resolve),
  };
  const fromMock = vi.fn(() => builder);
  return {
    client: { from: fromMock } as unknown as SupabaseClient,
    fromMock,
    builder,
  };
}

// ---------------------------------------------------------------------------
// Minimal valid row fixture — share across tests that need a parseable row.
// ---------------------------------------------------------------------------
const validRow = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  name_ja: "テスト食堂",
  name_ko: "테스트 식당",
  address_ja: null,
  address_ko: null,
  latitude: null,
  longitude: null,
  price_range: "mid",
  status: "approved",
  is_solo_default: true,
  has_jp_menu: false,
  is_late_night: false,
  naver_url: null,
  photo_url: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

// ---------------------------------------------------------------------------
// listApproved — filter composition
// ---------------------------------------------------------------------------
describe("listApproved", () => {
  it("should apply status + is_solo_default filters when isSolo is true (default chip state)", async () => {
    const { client, builder } = mockClient({ data: [], error: null });
    await listApproved(client, {
      isSolo: true,
      hasJpMenu: false,
      isLateNight: false,
    });
    expect(builder._eqCalls).toEqual([
      ["status", "approved"],
      ["is_solo_default", true],
    ]);
  });

  it("should apply only status filter when all filters are off", async () => {
    const { client, builder } = mockClient({ data: [], error: null });
    await listApproved(client, {
      isSolo: false,
      hasJpMenu: false,
      isLateNight: false,
    });
    expect(builder._eqCalls).toEqual([["status", "approved"]]);
  });

  it("should not select the private submission reason on the public read path", async () => {
    const { client, builder } = mockClient({ data: [], error: null });
    await listApproved(client, {
      isSolo: false,
      hasJpMenu: false,
      isLateNight: false,
    });
    const columns = builder.select.mock.calls[0]![0] as string;
    expect(columns.split(",")).not.toContain("reason");
  });

  it("should apply all four eq filters in order when all filters are on", async () => {
    const { client, builder } = mockClient({ data: [], error: null });
    await listApproved(client, {
      isSolo: true,
      hasJpMenu: true,
      isLateNight: true,
    });
    expect(builder._eqCalls).toEqual([
      ["status", "approved"],
      ["is_solo_default", true],
      ["has_jp_menu", true],
      ["is_late_night", true],
    ]);
  });

  it("should resolve to [] when RLS hides all rows (empty result is a happy path)", async () => {
    const { client } = mockClient({ data: [], error: null });
    const result = await listApproved(client, {
      isSolo: false,
      hasJpMenu: false,
      isLateNight: false,
    });
    expect(result).toEqual([]);
  });

  it("should throw RestaurantRepositoryError carrying the original cause when a PostgrestError occurs", async () => {
    const pgError = { code: "PGRST116", message: "not found" };
    const { client } = mockClient({ data: null, error: pgError });
    let caught: unknown;
    try {
      await listApproved(client, {
        isSolo: false,
        hasJpMenu: false,
        isLateNight: false,
      });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(RestaurantRepositoryError);
    expect((caught as RestaurantRepositoryError).cause).toBe(pgError);
  });

  it("should throw ZodError when the row contains an invalid enum value (schema drift guard)", async () => {
    const malformed = { ...validRow, price_range: "unreasonable" };
    const { client } = mockClient({ data: [malformed], error: null });
    await expect(
      listApproved(client, { isSolo: false, hasJpMenu: false, isLateNight: false }),
    ).rejects.toBeInstanceOf(ZodError);
  });
});

// ---------------------------------------------------------------------------
// getById
// ---------------------------------------------------------------------------
describe("getById", () => {
  it("should return a parsed Restaurant and include status + id eq filters when the row exists", async () => {
    const { client, builder } = mockClient({ data: validRow, error: null });
    const result = await getById(client, validRow.id);
    expect(result).not.toBeNull();
    expect(result?.id).toBe(validRow.id);
    expect(builder._eqCalls).toContainEqual(["status", "approved"]);
    expect(builder._eqCalls).toContainEqual(["id", validRow.id]);
  });

  it("should return null when the row is absent or RLS-hidden", async () => {
    const { client } = mockClient({ data: null, error: null });
    const result = await getById(client, "00000000-0000-0000-0000-000000000099");
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Source-text boundary invariant
// Asserts that restaurants.ts has no runtime import from @supabase/supabase-js.
// Encodes the API rule (api-honbabseoul.md §Keys & Clients) as an automated check.
// ---------------------------------------------------------------------------
it("should have no runtime import from @supabase/supabase-js (import type only)", () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const src = readFileSync(resolve(__dirname, "restaurants.ts"), "utf8");
  const violations = src
    .split("\n")
    .filter(
      (line) =>
        line.includes('from "@supabase/supabase-js"') &&
        !line.trimStart().startsWith("import type"),
    );
  expect(violations).toHaveLength(0);
});
