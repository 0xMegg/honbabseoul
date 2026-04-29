# Work Plan

## Task
Slice 3 (Epic 2 / Stage 2) — Restaurants read repository

## Goal
Ship a typed, RLS-aware **read** path for the public map: `src/lib/models/restaurant.ts` (zod schema + `Restaurant` type derived via `z.infer`), `src/lib/repositories/restaurants.ts` exposing `listApproved(client, filters)` and `getById(client, id)`, and `src/lib/repositories/restaurants.test.ts` covering filter combinations, RLS-empty and PostgrestError branches, and zod row-validation rejection. After this slice, Epic 3 can consume `listApproved` from a Server Component (or a `"use client"` map shell) without ever touching `@supabase/supabase-js` directly.

## Context
- **Epic / Stage / Slice:** Epic 2 / Stage 2 / Slice 3. Stage 2 slices run **in parallel** with Slice 4; their files do not overlap (`src/lib/repositories/restaurants.*` for this slice vs `src/lib/repositories/submissions.*` + `src/lib/supabase/storage.ts` for Slice 4). Stage 1 (schema + seed) is committed (`8388728` + `7b5f9b0`); the schema shape is the source of truth this slice models.
- **Plan source:** `outputs/plans/epic-2-plan.md` Stage 2 / Slice 3 (lines 49–56); roadmap `outputs/plans/roadmap.md` Slice 2.2.1 (lines 117–123).
- **Schema this slice models** (`supabase/migrations/0001_restaurants.sql`):
  - Columns + types: `id uuid pk`, `name_ja text`, `name_ko text`, `address_ja text`, `address_ko text`, `latitude double precision`, `longitude double precision`, `price_range price_range`, `status restaurant_status not null default 'pending'`, `is_solo_default boolean not null default true`, `has_jp_menu boolean not null default false`, `is_late_night boolean not null default false`, `naver_url text`, `photo_url text`, `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()`.
  - Enums: `restaurant_status ∈ {pending, approved, rejected}`, `price_range ∈ {low, mid, high}` (nullable in the column — no `not null` on `price_range`).
  - RLS guards: anon SELECT only sees `status='approved'`; service-role bypasses. Trigger silently downgrades anon INSERT status to `'pending'` (irrelevant to this read-only slice but informs the test for the empty-array branch).
- **Decisions to honour** (`context/decision-log.md`, 2026-04-25):
  - `price_range` enum `'low' | 'mid' | 'high'` — zod `enum` not `string`.
  - `is_solo_default = false` strictly means **verified 2인 이상 전용** (NOT "unverified"). Therefore the ON-state filter is the simple `is_solo_default = true`. The Epic 2 plan's wording "is_solo_default=true OR is_solo_default IS NULL" assumed a nullable column; the migration locked it as `not null default true`, so the IS-NULL branch is dead code. We implement the simpler, schema-correct `eq('is_solo_default', true)` and record the deviation in §Risks.
  - `is_solo_default = false` (the OFF-filter case) drops the `is_solo_default` filter entirely (spec §3 — "show 2인 이상 전용도").
- **Rules to follow exactly:**
  - `.claude/rules/local/api-honbabseoul.md` § Repository Layer — "All database access lives in `src/lib/repositories/*`. UI imports functions, not `createClient`."
  - `.claude/rules/local/api-honbabseoul.md` § Public Read Path — "must only read `status = 'approved'` restaurants" + "Default public filter is also `is_solo_default = true` (spec §3)".
  - `.claude/rules/local/api-honbabseoul.md` § Keys & Clients — "Separate factory functions: `createServerClient()` vs `createBrowserClient()` vs `createAdminClient()`. Do not pass `any` client instance across the client/server boundary."
  - `.claude/rules/local/gotchas-honbabseoul.md` § "RLS returns empty arrays silently" — `{ error: null, data: [] }` is a real outcome, distinct from a network/PostgREST failure. Tests must cover both.
  - `.claude/rules/local/gotchas-honbabseoul.md` § "UGC status default is `pending`, not `approved`" — public queries MUST filter `.eq("status", "approved")` at the repository AND the policy enforces it as a second guard.
  - `.claude/rules/base/api.md` § "Use parameterized queries; wrap external calls in try/catch with meaningful error messages; separate user-facing errors from debug logs."
  - `.claude/rules/base/git.md` § commit format: `feat: Slice 3 — restaurants read repository` (Reviewer-only step).
- **Dependencies (already shipped):** `zod ^4.3.6` (Slice 1 install), `@supabase/ssr` + `@supabase/supabase-js` (Epic 1 / Slice 4), `vitest@3` + `jsdom` (Epic 1 / Slice 5), `@/lib/supabase/{browser,server,admin}.ts` factories. **Adds:** none — this slice authors only TS source + a vitest spec.
- **Carry-overs from previous Reviewer Handoff** (`handoff/task-slice-2.md`):
  - Live re-verification of Slices 1 + 2 — **NOT this slice's concern**. Repository unit tests are mocked, so a non-applied DB does not block APPROVE here. The carry-over remains open at the Epic-2-acceptance level.
  - Storage bucket validation, service_role key rotation, shadcn/ui adoption — orthogonal, untouched.

## Pre-Start Greps Reflected
- **New public symbols introduced:** `Restaurant`, `RestaurantSchema`, `RestaurantFilters`, `listApproved`, `getById`. `grep -rE '\b(Restaurant|RestaurantSchema|RestaurantFilters|listApproved|getById)\b' src/` before this slice → **0 hits**. Consumers come in **Epic 3** (map page Server Component will call `listApproved`; bottom-sheet detail will call `getById`). They are in a later Epic, not this Stage — no in-Stage callers required for the symbol to be live (matches the Pre-Start Checklist's "later Stage if they set it" clause). The symbols are exercised in this slice by `restaurants.test.ts`, satisfying the "no dead-code at commit time" Reviewer gate.
- **`grep -rE 'from\s+.@supabase/supabase-js' src/` → 1 hit:** `src/lib/supabase/admin.ts:18` (allowed — the supabase factory layer is the intended boundary; `import "server-only"` keeps it server-bundle-only). After this slice: **still 1 hit** — the new repository module imports `SupabaseClient` as a **type-only** reference (`import type { … } from "@supabase/supabase-js"`), which TypeScript erases at emit, so it does not contribute a runtime require. We add a unit test that asserts the source file contains no `from "@supabase/supabase-js"` outside an `import type {…}` clause to enforce this at CI.
- **`grep -rE 'src/lib/(models|repositories)/' src/` → 0 hits** before this slice (the directories don't exist yet — Slice 3 introduces both). After this slice: 3 new files, no existing imports to retro-fit.
- **`grep -rn '\bzod\b' src/` → 0 hits** before this slice (Slice 1 installed zod but did not import it anywhere). After this slice: 2 new imports (model + test). Slice 4 adds its own zod imports under `src/lib/models/submission.ts` — separate file, no overlap.
- **Mock-or-DB:** `grep -rE '@/lib/supabase/(server|browser)' src/` finds the existing factories. Tests **do not** import them; tests construct an inline mock client.

## API contract (this slice)

### `src/lib/models/restaurant.ts`
```ts
import { z } from "zod";

export const RestaurantStatusSchema = z.enum(["pending", "approved", "rejected"]);
export const PriceRangeSchema      = z.enum(["low", "mid", "high"]);

export const RestaurantSchema = z.object({
  id:               z.string().uuid(),
  name_ja:          z.string().nullable(),
  name_ko:          z.string().nullable(),
  address_ja:       z.string().nullable(),
  address_ko:       z.string().nullable(),
  latitude:         z.number().nullable(),
  longitude:        z.number().nullable(),
  price_range:      PriceRangeSchema.nullable(),
  status:           RestaurantStatusSchema,
  is_solo_default:  z.boolean(),
  has_jp_menu:      z.boolean(),
  is_late_night:    z.boolean(),
  naver_url:        z.string().nullable(),
  photo_url:        z.string().nullable(),
  created_at:       z.string(),
  updated_at:       z.string(),
});

export type Restaurant       = z.infer<typeof RestaurantSchema>;
export type RestaurantStatus = z.infer<typeof RestaurantStatusSchema>;
export type PriceRange       = z.infer<typeof PriceRangeSchema>;
```

### `src/lib/repositories/restaurants.ts`
```ts
import type { SupabaseClient } from "@supabase/supabase-js";   // TYPE-ONLY
import {
  RestaurantSchema,
  type Restaurant,
} from "@/lib/models/restaurant";

export type RestaurantFilters = {
  /** "혼밥 가능" chip — default ON. true = only solo-friendly, false = drop the filter. */
  isSolo:      boolean;
  /** 日本語メニュー chip. true = only `has_jp_menu=true`, false = drop. */
  hasJpMenu:   boolean;
  /** 深夜営業 chip. true = only `is_late_night=true`, false = drop. */
  isLateNight: boolean;
};

export class RestaurantRepositoryError extends Error {
  readonly cause: unknown;
  constructor(message: string, cause: unknown) {
    super(message);
    this.name = "RestaurantRepositoryError";
    this.cause = cause;
  }
}

export async function listApproved(
  client: SupabaseClient,
  filters: RestaurantFilters,
): Promise<Restaurant[]> {
  let query = client.from("restaurants").select("*").eq("status", "approved");
  if (filters.isSolo)      query = query.eq("is_solo_default", true);
  if (filters.hasJpMenu)   query = query.eq("has_jp_menu",     true);
  if (filters.isLateNight) query = query.eq("is_late_night",   true);
  const { data, error } = await query;
  if (error) throw new RestaurantRepositoryError("listApproved failed", error);
  // RLS-hidden + genuine empty look identical here — both return [], both valid.
  return (data ?? []).map((row) => RestaurantSchema.parse(row));
}

export async function getById(
  client: SupabaseClient,
  id: string,
): Promise<Restaurant | null> {
  const { data, error } = await client
    .from("restaurants")
    .select("*")
    .eq("status", "approved")            // double guard: even if anon RLS were misconfigured
    .eq("id", id)
    .maybeSingle();
  if (error) throw new RestaurantRepositoryError("getById failed", error);
  return data ? RestaurantSchema.parse(data) : null;
}
```

### `src/lib/repositories/restaurants.test.ts`
- Builds an inline mock client whose `.from("restaurants")` returns a chainable thenable. The chain records every `.eq(col, val)` call so tests can assert filter composition.
- 9 assertions across 8 test cases (see §Acceptance Criteria for the list).
- No Supabase factory import; no real network; no env reads.

## Approach
Run as discrete phases. Verify each before proceeding.

### Phase A — Skeleton + types
1. Create `src/lib/models/` directory.
2. Author `src/lib/models/restaurant.ts` exactly as in §API contract. Header docstring explains the dual-purpose: the schema is the **runtime guard** at the repository boundary; the `Restaurant` type is the **compile-time guarantee** for callers.
3. Verify: `pnpm exec tsc --noEmit` — must remain silent.

### Phase B — Repository
4. Create `src/lib/repositories/` directory.
5. Author `src/lib/repositories/restaurants.ts` exactly as in §API contract.
   - **`import type { SupabaseClient } from "@supabase/supabase-js"`** — the `type` keyword is mandatory; without it, ESLint's `@typescript-eslint/consistent-type-imports` (or our own boundary check) would flag the file. Tests later assert this at the source-text level too.
   - Header docstring covers: who calls this (Server Components or `"use client"` map shell), what error shape they should expect (`RestaurantRepositoryError` carrying the original PostgrestError as `cause`), and the RLS reminder (anon SELECT already filters server-side; the `.eq("status", "approved")` is the second guard).
   - DO NOT export the Supabase client type or any `createClient` re-export.
6. Verify: `pnpm exec tsc --noEmit` — silent. `pnpm lint` — 0/0.

### Phase C — Tests
7. Author `src/lib/repositories/restaurants.test.ts` covering the 8 cases enumerated in §Acceptance Criteria. Use the mock-builder helper described below.
8. **Mock builder shape** (define inside the test file, not a shared util — keeps the test self-contained):
   ```ts
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
       // The PostgREST builder is a thenable — terminal awaits resolve here.
       then: (resolve: (v: StubResponse) => unknown) => Promise.resolve(response).then(resolve),
     };
     const fromMock = vi.fn(() => builder);
     return { client: { from: fromMock } as unknown as SupabaseClient, fromMock, builder };
   }
   ```
9. **Source-text invariant test** (anti-regression for the `@supabase/supabase-js` boundary): use `node:fs` to read `src/lib/repositories/restaurants.ts` and assert no `from "@supabase/supabase-js"` line exists outside an `import type` clause. Encodes the API rule as code. Path resolved via `import.meta.url`.
10. Verify: `pnpm test src/lib/repositories/restaurants.test.ts` — must pass all 8 cases.

### Phase D — Repo hygiene + global tests
11. `pnpm lint` — 0 errors / 0 warnings.
12. `pnpm exec tsc --noEmit` — silent.
13. `pnpm test` — full suite. Existing 10 tests (Logo + env smoke) plus this slice's 8 = **18 passing**.
14. `pnpm build` — green. The new files are tree-shaken into `/[locale]` only when Epic 3 wires a route; for now they are unused but compiled.
15. Optional `pnpm exec prettier --check src/lib/models src/lib/repositories` — formatting clean.

## Scope

### Files to create
- `src/lib/models/restaurant.ts` — typed `Restaurant` + zod schema (≤80 lines).
- `src/lib/repositories/restaurants.ts` — `listApproved` + `getById` + `RestaurantRepositoryError` (≤120 lines).
- `src/lib/repositories/restaurants.test.ts` — vitest with inline mock builder (~180 lines, 8 cases).

### Files NOT to touch
- `package.json`, `pnpm-lock.yaml` — zod already shipped in Slice 1; this slice adds no deps.
- `supabase/**` — schema + seed are Stage 1 territory; this slice MUST NOT modify the migration to "fit" the model. Drift goes the other way.
- `src/lib/supabase/{browser,server,admin}.ts` — factories already correct; do not refactor.
- `src/lib/env.ts`, `src/lib/env.test.ts` — orthogonal.
- `src/lib/features/**` — UI / Epic 3+ territory.
- `src/lib/repositories/submissions.*`, `src/lib/supabase/storage.ts`, `src/lib/models/submission.ts` — Slice 4 territory; running in parallel.
- `e2e/**`, `messages/**`, `src/app/**` — out of scope.
- Harness directories: `.claude/`, `templates/`, `scripts/`, `context/`, `docs/`.
- All handoff files OTHER than `handoff/task-slice-2.md` (per the user's command-args, all handoff reads/writes for this task go through `handoff/task-slice-2.md`).
- `vitest.config.ts` — current config (`environment: jsdom`, `esbuild.jsx: 'automatic'`) handles this slice without change. Do not introduce `@vitejs/plugin-react` here; that decision lives at the Epic level (carry-over).

## Acceptance Criteria
- [ ] `src/lib/models/restaurant.ts` exists; exports `RestaurantSchema`, `Restaurant`, `RestaurantStatusSchema`, `RestaurantStatus`, `PriceRangeSchema`, `PriceRange`.
- [ ] `src/lib/repositories/restaurants.ts` exists; exports `listApproved`, `getById`, `RestaurantFilters`, `RestaurantRepositoryError`. The file's only `from "@supabase/supabase-js"` is `import type`.
- [ ] `src/lib/repositories/restaurants.ts` does NOT import `createClient`, `createBrowserClient`, `createServerClient`, or `createSupabaseAdminClient` (the caller supplies the client).
- [ ] `src/lib/repositories/restaurants.test.ts` covers (one assertion per case where reasonable):
  1. **Default ON / default chip state** (`isSolo:true, hasJpMenu:false, isLateNight:false`) — the chain records exactly two `.eq` calls: `('status','approved')` AND `('is_solo_default', true)`. No other `.eq` calls.
  2. **All filters off** (`isSolo:false, hasJpMenu:false, isLateNight:false`) — chain records exactly one `.eq` call: `('status','approved')`. The `is_solo_default` filter is dropped (OFF semantics).
  3. **All filters on** (`isSolo:true, hasJpMenu:true, isLateNight:true`) — chain records four `.eq` calls in the documented order: `status`, `is_solo_default`, `has_jp_menu`, `is_late_night`.
  4. **Empty result is a happy path** — when the mock returns `{ data: [], error: null }` (RLS hid rows OR genuinely empty), `listApproved` resolves to `[]` (NOT throws).
  5. **PostgrestError surfaces as `RestaurantRepositoryError`** — when the mock returns `{ data: null, error: { code:'PGRST116', message:'…' } }`, `listApproved` rejects with `RestaurantRepositoryError`; `err.cause` is the original error object.
  6. **Zod rejects malformed row** — when the mock returns a row with `price_range: 'unreasonable'` (invalid enum), `listApproved` rejects with a `ZodError` (the schema fails fast in dev, satisfying the "if the table drifts, fetch fails fast" intent from the Epic 2 plan).
  7. **`getById` happy path** — returns the parsed `Restaurant` when `maybeSingle()` resolves with a valid row; chain includes `('status','approved')` AND `('id', <uuid>)`.
  8. **`getById` returns null when row absent** — when `maybeSingle()` resolves `{ data: null, error: null }` (row missing OR RLS-hidden), `getById` resolves to `null` (NOT throws).
- [ ] **Source-text boundary invariant** test inside the same file reads `src/lib/repositories/restaurants.ts` and asserts no `from "@supabase/supabase-js"` line exists that is not preceded by `import type` on the same line. Anti-regression for the API rule.
- [ ] `pnpm lint` → 0 errors / 0 warnings.
- [ ] `pnpm exec tsc --noEmit` → silent.
- [ ] `pnpm test` → **18 passing** (10 prior + 8 new).
- [ ] `pnpm build` → green.
- [ ] No file under `src/app/**`, `src/lib/features/**`, `src/middleware.ts`, or `src/i18n*.ts` modified.

## Risks & Open Questions
- **Schema drift vs Epic 2 plan wording (deviation, recorded).** The Epic 2 plan's filter spec includes `is_solo_default IS NULL` as a fallback. The migration column is `boolean not null default true`, so NULL is unreachable. We implement `eq('is_solo_default', true)` only. If a future migration loosens the constraint, the filter must grow back the OR-NULL clause. The repository docstring flags this so the Reviewer of any such migration sees the link.
- **Caller supplies the client (deviation, recorded).** The Epic 2 plan suggested the repository would internally pick `createSupabaseServerClient()` vs browser based on environment. We instead take an **explicit `client` parameter** because (a) it's trivially testable without environment shims, (b) it makes the server-vs-browser choice explicit at the call site, where the consequences are visible (Server Component reads cookies; client component shares the singleton), (c) it avoids a `await cookies()` Promise-mismatch in client-component callers. Epic 3's first call site will be a Server Component (`await listApproved(await createSupabaseServerClient(), filters)`); a `"use client"` shell would call `listApproved(createSupabaseBrowserClient(), filters)`. Documented in the repository module header.
- **Zod parse cost.** For 20 seed rows, parse latency is negligible (<1 ms). At 10K rows it would matter; at that scale, swap `parse` for `safeParse` with a tally and degrade gracefully. Not an MVP concern.
- **Type erasure of `import type`.** TypeScript with `verbatimModuleSyntax` would enforce this at compile; we don't currently have that flag. The source-text invariant test is the substitute. If the Reviewer prefers the compiler flag, that is a follow-up.
- **`SupabaseClient` generic narrowing.** `SupabaseClient<Database>` (with generated types) would give `.from('restaurants')` typed columns. We don't generate Database types yet (Epic 2 didn't add `supabase gen types typescript`). Repository takes the un-narrowed `SupabaseClient` for now; the zod parse downstream catches anything the type system would have missed. Adding `Database` type generation is a future Epic-2-extension or Epic-3-prep task.
- **Mock thenable correctness.** The PostgREST builder is a real PromiseLike; tests rely on a builder that exposes both `.maybeSingle()` and a `.then`. We define both shapes (with `.then` for the array path and `.maybeSingle()` for the single-row path). If `@supabase/supabase-js` evolves the builder API, the mock may diverge and cause confusing test failures — the source-text invariant test catches direct API drift; the runtime tests catch behavioural drift. Acceptable for MVP.

## Rollback Plan
- Pure additive — `git revert <slice-3-commit>` removes the three new files. No DB state, no migration, no env, no harness touched.
- Slice 4 (parallel) is unaffected — different paths under `src/lib/repositories/submissions.*` and `src/lib/supabase/storage.ts`.
- If a hot-fix is needed but full revert is too coarse: comment-out the offending test case (with TODO) and ship a follow-up; the repository functions themselves are pure logic and easy to patch.
