import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { RestaurantSchema, type Restaurant } from "@/lib/models/restaurant";
import type { RestaurantFilters } from "@/lib/repositories/restaurants";

type SeedRestaurant = Omit<Restaurant, "created_at" | "updated_at">;

const SEED_SQL_PATH = resolve(process.cwd(), "supabase/seed.sql");
const FIXED_TIMESTAMP = "2026-01-01T00:00:00Z";

describe("seed data read-path acceptance", () => {
  const rows = parseSeedRestaurants(readFileSync(SEED_SQL_PATH, "utf8"));

  it("keeps the curated public seed set at the expected MVP size", () => {
    expect(rows).toHaveLength(20);
    expect(rows.filter((row) => row.status === "approved")).toHaveLength(20);
  });

  it("keeps every seed row parseable by the public restaurant model", () => {
    for (const row of rows) {
      expect(() =>
        RestaurantSchema.parse({
          ...row,
          created_at: FIXED_TIMESTAMP,
          updated_at: FIXED_TIMESTAMP,
        }),
      ).not.toThrow();
    }
  });

  it("keeps every approved seed row usable by the map and detail read path", () => {
    for (const row of rows) {
      expect(row.name_ja, `${row.id} name_ja`).toBeTruthy();
      expect(row.name_ko, `${row.id} name_ko`).toBeTruthy();
      expect(row.address_ja, `${row.id} address_ja`).toBeTruthy();
      expect(row.address_ko, `${row.id} address_ko`).toBeTruthy();
      expect(row.latitude, `${row.id} latitude`).not.toBeNull();
      expect(row.longitude, `${row.id} longitude`).not.toBeNull();
      expect(row.naver_url, `${row.id} naver_url`).toMatch(
        /^https:\/\/map\.naver\.com\/p\/entry\/place\/\d+$/,
      );
    }
  });

  it("matches the product filter acceptance counts used by the map read path", () => {
    expect(countRows(rows, { isSolo: false, hasJpMenu: false, isLateNight: false })).toBe(20);
    expect(countRows(rows, { isSolo: true, hasJpMenu: false, isLateNight: false })).toBe(16);
    expect(countRows(rows, { isSolo: true, hasJpMenu: true, isLateNight: false })).toBe(15);
    expect(countRows(rows, { isSolo: true, hasJpMenu: false, isLateNight: true })).toBe(4);
    expect(countRows(rows, { isSolo: true, hasJpMenu: true, isLateNight: true })).toBe(4);
  });
});

function countRows(rows: SeedRestaurant[], filters: RestaurantFilters): number {
  return rows.filter((row) => {
    if (row.status !== "approved") return false;
    if (filters.isSolo && !row.is_solo_default) return false;
    if (filters.hasJpMenu && !row.has_jp_menu) return false;
    if (filters.isLateNight && !row.is_late_night) return false;
    return true;
  }).length;
}

function parseSeedRestaurants(seedSql: string): SeedRestaurant[] {
  const valuesSql = seedSql.match(/VALUES\s*([\s\S]*?)\nON CONFLICT/i)?.[1];
  if (!valuesSql) throw new Error("Could not find seed VALUES block.");

  return splitTuples(valuesSql).map((tuple) => {
    const fields = splitTopLevelCommas(tuple).map(parseSqlLiteral);
    if (fields.length !== 14) {
      throw new Error(`Expected 14 restaurant fields, received ${fields.length}.`);
    }

    const [
      id,
      name_ja,
      name_ko,
      address_ja,
      address_ko,
      latitude,
      longitude,
      price_range,
      status,
      is_solo_default,
      has_jp_menu,
      is_late_night,
      naver_url,
      photo_url,
    ] = fields;

    return {
      id: stringValue(id),
      name_ja: nullableString(name_ja),
      name_ko: nullableString(name_ko),
      address_ja: nullableString(address_ja),
      address_ko: nullableString(address_ko),
      latitude: nullableNumber(latitude),
      longitude: nullableNumber(longitude),
      price_range: nullablePriceRange(price_range),
      status: restaurantStatus(status),
      is_solo_default: booleanValue(is_solo_default),
      has_jp_menu: booleanValue(has_jp_menu),
      is_late_night: booleanValue(is_late_night),
      naver_url: nullableString(naver_url),
      photo_url: nullableString(photo_url),
    };
  });
}

function splitTuples(valuesSql: string): string[] {
  const tuples: string[] = [];
  let depth = 0;
  let inString = false;
  let start = -1;

  for (let index = 0; index < valuesSql.length; index += 1) {
    const char = valuesSql[index];
    const next = valuesSql[index + 1];

    if (char === "'" && inString && next === "'") {
      index += 1;
      continue;
    }
    if (char === "'") {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (char === "(") {
      if (depth === 0) start = index + 1;
      depth += 1;
      continue;
    }
    if (char === ")") {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        tuples.push(valuesSql.slice(start, index));
        start = -1;
      }
    }
  }

  return tuples;
}

function splitTopLevelCommas(tuple: string): string[] {
  const fields: string[] = [];
  let inString = false;
  let start = 0;

  for (let index = 0; index < tuple.length; index += 1) {
    const char = tuple[index];
    const next = tuple[index + 1];

    if (char === "'" && inString && next === "'") {
      index += 1;
      continue;
    }
    if (char === "'") {
      inString = !inString;
      continue;
    }
    if (!inString && char === ",") {
      fields.push(tuple.slice(start, index).trim());
      start = index + 1;
    }
  }

  fields.push(tuple.slice(start).trim());
  return fields;
}

function parseSqlLiteral(value: string): string | number | boolean | null {
  const withoutComment = value.replace(/--.*$/m, "").trim();
  if (/^null$/i.test(withoutComment)) return null;
  if (/^true$/i.test(withoutComment)) return true;
  if (/^false$/i.test(withoutComment)) return false;
  if (/^-?\d+(\.\d+)?$/.test(withoutComment)) return Number(withoutComment);
  if (withoutComment.startsWith("'") && withoutComment.endsWith("'")) {
    return withoutComment.slice(1, -1).replaceAll("''", "'");
  }
  throw new Error(`Unsupported SQL literal: ${value}`);
}

function stringValue(value: unknown): string {
  if (typeof value !== "string") throw new Error(`Expected string, received ${String(value)}.`);
  return value;
}

function nullableString(value: unknown): string | null {
  if (value === null || typeof value === "string") return value;
  throw new Error(`Expected nullable string, received ${String(value)}.`);
}

function nullableNumber(value: unknown): number | null {
  if (value === null || typeof value === "number") return value;
  throw new Error(`Expected nullable number, received ${String(value)}.`);
}

function booleanValue(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  throw new Error(`Expected boolean, received ${String(value)}.`);
}

function nullablePriceRange(value: unknown): SeedRestaurant["price_range"] {
  if (value === null || value === "low" || value === "mid" || value === "high") return value;
  throw new Error(`Expected price_range, received ${String(value)}.`);
}

function restaurantStatus(value: unknown): SeedRestaurant["status"] {
  if (value === "pending" || value === "approved" || value === "rejected") return value;
  throw new Error(`Expected restaurant_status, received ${String(value)}.`);
}
