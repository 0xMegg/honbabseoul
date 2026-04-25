# Review — Slice 3 (Epic 2 / Stage 2): Restaurants read repository

## Summary
Verdict: **APPROVE**.
Three new files (`src/lib/models/restaurant.ts`, `src/lib/repositories/restaurants.ts`, `src/lib/repositories/restaurants.test.ts`) ship a typed, RLS-aware read repository for the public restaurant list. Lint, type-check, the targeted test suite (9/9), the full suite (40/40 across Slice 3 + parallel Slice 4 work-in-progress), and `pnpm build` all pass. Static-text assertions confirm the runtime boundary against `@supabase/supabase-js` and the supabase factory layer. No deviations from the plan beyond the expected fixture-UUID adjustment Developer documented in the handoff.

## Context
- Plan: `outputs/plans/task-slice-3-plan.md`
- Verify plan: `outputs/plans/task-slice-3-verify.md`
- Developer handoff: `handoff/task-slice-2.md` (per task command-args)
- Working tree also contains parallel Slice 4 work (`src/lib/repositories/submissions.*`, `src/lib/supabase/storage.*`, `src/lib/models/submission.ts`, plus Slice 4 plan/verify/archive). Those are out of scope for this review and **excluded from this commit**.

## Inspection results

### 1. Scope check
- ✅ Files added match plan exactly: `src/lib/models/restaurant.ts`, `src/lib/repositories/restaurants.ts`, `src/lib/repositories/restaurants.test.ts`.
- ✅ No edits to `package.json`, `pnpm-lock.yaml`, `supabase/**`, `src/lib/supabase/{browser,server,admin}.ts`, `vitest.config.ts`, `src/app/**`, `messages/**`.
- ✅ Slice 4 files present in working tree are kept out of this commit (will land via Slice 4's review).

### 2. Quality check
- ✅ `pnpm lint` → `✔ No ESLint warnings or errors` (Next inferred-workspace warning is environmental, not Slice 3).
- ✅ `pnpm exec tsc --noEmit` → silent.
- ✅ `pnpm test src/lib/repositories/restaurants.test.ts` → **9/9** pass (875 ms).
- ✅ `pnpm test` → **40/40** pass (Slice 3's 9 + Slice 4 work-in-progress + 10 prior; full counts are healthy).
- ✅ `pnpm build` → green; locale routes prerender; no SSR errors. Pre-existing CSS-token Lightning warning is unrelated to this slice (predates Slice 1 — see `[var(--hb-*)]` hash-classes in `globals.css`).
- ✅ Supabase `{ data, error }` is branched in both `listApproved` and `getById`. Empty array (`error: null, data: []`) treated as a happy path; PostgrestError mapped to `RestaurantRepositoryError`; zod validation surfaces as `ZodError` (fail-fast).
- ✅ No hardcoded values: no colors/shadows/radii touched (logic-only slice). No env literals.

### 3. Architecture check
- ✅ Repository layer placement: `src/lib/repositories/restaurants.ts` is the only DB-accessor; it does **not** import `createClient` or any factory (`grep` confirms zero hits for `from "@/lib/supabase/(server|browser|admin)"`).
- ✅ `@supabase/supabase-js` import is **type-only** (`src/lib/repositories/restaurants.ts:23`). Verified by both grep and the in-suite source-text invariant test (`restaurants.test.ts:167`).
- ✅ Caller-supplies-client pattern is documented in the module header (lines 4–8) — explicit JSDoc covers Server Component vs `"use client"` map-shell call sites.
- ✅ Public read path: unconditional `.eq("status", "approved")` in both functions — second guard alongside RLS, per `api-honbabseoul.md` § Public Read Path.
- ✅ `is_solo_default` filter semantics correct: ON (`isSolo:true`) → `eq('is_solo_default', true)`; OFF drops the filter (spec §3 "show 2인 이상 전용도"). The IS-NULL deviation vs Epic 2 plan wording is documented in the module header (lines 17–22).
- ✅ Single source of truth for the `Restaurant` type: model imported into repository and into tests; no duplicate type literals.
- ✅ Naver Maps SDK / i18n / UGC `status='pending'` rules — N/A to this slice (logic-only). No regressions introduced.

### 4. Security check
- ✅ No secrets, no env reads, no key imports. Service-role key untouched (admin factory not imported anywhere in this slice).
- ✅ No `"use client"` boundary in this slice — repository is callable from either side, but never exports a service-role client.
- ✅ Tests do not hit a real network or DB; no factory imports; no `process.env.NEXT_PUBLIC_SUPABASE_URL` reads (verified by grep).
- ✅ The PostgrestError → `RestaurantRepositoryError` mapping prevents leaking raw PostgREST text to UI consumers (rule from `api-honbabseoul.md` § Repository Layer).

### 5. Live verification
- N/A — pure logic + unit-tested repository. No UI, no API route, no dev server. Matches verify-plan §"Live Verification" disposition. Optional `_dev/` playground was **not** authored (none should have been; commit must not contain it — confirmed via `ls src/app` shows no `_dev/`).

## Acceptance criteria pass-by-pass

| AC | Status | Note |
|---|---|---|
| Model file exists + exports `RestaurantSchema`, `Restaurant`, `RestaurantStatusSchema`, `RestaurantStatus`, `PriceRangeSchema`, `PriceRange` | ✅ | `src/lib/models/restaurant.ts:1-27` |
| Repository file exists + exports `listApproved`, `getById`, `RestaurantFilters`, `RestaurantRepositoryError`; sole `@supabase/supabase-js` import is `import type` | ✅ | `restaurants.ts:23` (type-only); `:38-72` (exports) |
| Repository does not import `createClient` / factories | ✅ | grep: 0 hits |
| Test (a) Default-on chain: `('status','approved')` + `('is_solo_default', true)` only | ✅ | `restaurants.test.ts:68-79` |
| Test (b) All-off chain: `('status','approved')` only | ✅ | `:81-89` |
| Test (c) All-on chain: 4 eq calls in order | ✅ | `:91-104` |
| Test (d) Empty data → `[]` (happy path) | ✅ | `:106-114` |
| Test (e) PostgrestError → `RestaurantRepositoryError` with `cause` | ✅ | `:116-131` |
| Test (f) Malformed row → `ZodError` | ✅ | `:133-139` |
| Test (g) `getById` happy path with `status` + `id` eq filters | ✅ | `:146-153` |
| Test (h) `getById` returns null for absent/RLS-hidden row | ✅ | `:155-159` |
| Source-text boundary invariant test | ✅ | `:167-179` |
| `pnpm lint` 0/0 | ✅ | |
| `pnpm exec tsc --noEmit` silent | ✅ | |
| `pnpm test` ≥18 (plan target) | ✅ | 40 actual (Slice 4 in-progress files lift the count) |
| `pnpm build` green | ✅ | |
| No file under `src/app/**`, `src/lib/features/**`, `src/middleware.ts`, `src/i18n*.ts` modified | ✅ | |

## Issues found
- **Critical:** none.
- **Important:** none.
- **Minor:** the verify plan's full-suite target was "≥18". The actual count is 40 because Slice 4 (parallel) files are also in the working tree. This is expected during parallel-stage execution and is not a Slice 3 regression — Slice 4 will commit those files separately.
- **Observation (non-blocking):** the `RestaurantRepositoryError` class re-declares a `cause` field manually rather than relying on ES2022 `Error.cause`. Functionally identical; if the project later targets ES2022 lib for `Error` natively, the explicit field can be dropped. Not worth changing now.

## Dead-code guard
- Public symbols introduced (`Restaurant`, `RestaurantSchema`, `RestaurantStatus(Schema)`, `PriceRange(Schema)`, `RestaurantFilters`, `RestaurantRepositoryError`, `listApproved`, `getById`) are exercised by `restaurants.test.ts`. Real call-sites land in Epic 3 (map page Server Component + bottom-sheet detail) — explicitly noted in the plan's Pre-Start Greps section under the "later Stage if they set it" Pre-Start Checklist clause. Acceptable per the dead-code rule.

## Long-running process hygiene
- No dev server, watcher, or tunnel started during review. Only short-lived `pnpm` commands.

## Carry over to next Task
- Live re-verification of Slice 1 + Slice 2 against `$DATABASE_URL` once migration + seed are applied — open at the Epic-2-acceptance level.
- Consider adopting `verbatimModuleSyntax` in `tsconfig.json` to enforce `import type` at the compiler level — currently the source-text invariant test is the substitute. (Epic-2-extension or Epic-3-prep.)
- Generate Database typegen (`supabase gen types typescript`) so `SupabaseClient<Database>` narrows `.from('restaurants')` columns — deferred per plan §Risks.
- Storage bucket `restaurant-photos` validation — Slice 4 territory.
- service_role key rotation — pre-deployment, separate task.
- shadcn/ui adoption decision — after first two product screens (Epic 3).

## Confidence
HIGH. Static-text invariants + behavioural unit tests + the full toolchain (lint, type-check, build) all pass; the slice is pure additive; rollback is a single revert.

<!-- FINAL_VERDICT: APPROVE -->
