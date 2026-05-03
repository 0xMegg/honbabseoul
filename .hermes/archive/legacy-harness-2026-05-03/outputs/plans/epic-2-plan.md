# Epic Plan

## Epic
Epic 2 — Data layer & repositories

## Goal
A real Supabase project carries the `restaurants` table with `status` enum + RLS policies, ~20 seed rows across three Seoul neighborhoods, and three typed repository functions (`listApproved`, `getById`, `submitPending`) covered by Vitest. After this epic, every downstream UI slice (Epic 3 map, Epic 4 UGC form) can build on a stable data shape with no DB-shape drift.

## Context
- **User need:** all of Epic 3/4 is gated on the data shape being final. RLS isolation is the safety floor for everything UGC.
- **Decisions already locked** (`context/decision-log.md`, 2026-04-25):
  - `price_range` enum `'low' | 'mid' | 'high'` rendered `₩ / ₩₩ / ₩₩₩`.
  - `is_solo_default = false` means **verified 2인 이상 전용** (NOT "unverified").
  - Photo: `≤2MB`, `image/jpeg|png`, 1 image max — bucket already exists (`restaurant-photos`, public).
  - Geo fallback (Seoul City Hall) — UI-side, doesn't bind data shape.
- **Migration strategy:** **β `DATABASE_URL` direct-psql**. The user pastes the Supabase connection string into `.env.local` once; thereafter every slice that needs migration adoption just shells out to psql or `pnpm dlx supabase db push --db-url=$DATABASE_URL`. No browser OAuth, fully unattended.
- **Dependencies:** `.env.local` already carries `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PROJECT_REF`, `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID`. **Adds:** `DATABASE_URL`. Already-installed npm deps from Epic 1: `@supabase/supabase-js`, `@supabase/ssr`, `server-only`. **Adds:** `zod` (request + DB-row validation), `@supabase/supabase-js` already covers the rest.

## Pre-flight (must hold before Stage 1)
- [ ] User has set `DATABASE_URL=postgresql://postgres.iosqakynywnrwxrexrfh:<pwd>@<host>:<port>/postgres` in `.env.local` (use Supabase Dashboard → Settings → Database → Connection string → URI; the pooler "Transaction" mode is fine).
- [ ] `psql --version` succeeds locally (ships with macOS dev tools / homebrew). If absent, `brew install libpq && brew link --force libpq`.
- [ ] Storage bucket `restaurant-photos` exists and is public (sanity-check via Slice 4 indirectly).

## Stages & Slices

### Stage 1 — Schema, RLS, seed (sequential — schema files are linear)

#### Slice 1: Schema migration + RLS policies
- **What:** Create `supabase/migrations/0001_restaurants.sql` defining the `restaurant_status` and `price_range` enums, the `restaurants` table with all columns from the roadmap (`name_ja/ko`, `address_ja/ko`, `latitude`, `longitude`, `price_range`, `status`, `is_solo_default`, `has_jp_menu`, `is_late_night`, `naver_url`, `photo_url`, `created_at`, `updated_at`, primary key id), and RLS:
  - `enable row level security` on `restaurants`.
  - Anon `SELECT` only when `status = 'approved'`.
  - Anon `INSERT` allowed but the policy forces `status = 'pending'` (regardless of what the client sends).
  - Anon `UPDATE` / `DELETE` denied.
  - Service-role bypasses RLS implicitly.
- Apply with: `psql "$DATABASE_URL" -f supabase/migrations/0001_restaurants.sql` (or `pnpm dlx supabase db push --db-url=$DATABASE_URL` once `supabase/config.toml` exists).
- **Files:** `supabase/migrations/0001_restaurants.sql`, `supabase/config.toml` (minimal `project_id` + `db.major_version` so the CLI does not complain), `package.json` (add `db:push`, `db:reset` scripts that wrap psql/supabase).
- **Depends on:** (none — pre-flight covers it)
- **Done when:** `psql "$DATABASE_URL" -c "select count(*) from restaurants"` returns 0; anon role hitting the same query (via curl with anon key) returns the empty array; anon insert with `status:'approved'` is silently downgraded to `pending` (verified by inspecting the inserted row).

#### Slice 2: Seed data
- **What:** Compose `supabase/seed.sql` with ~20 hand-curated approved restaurants across Hongdae / Myeongdong / Gangnam, each with realistic bilingual names + addresses, plausible lat/lng, `price_range` mix, varied `has_jp_menu` / `is_late_night` flags, and ≥3 rows where `is_solo_default = false` (so the OFF-filter case has visible behavior). NO live business data — this is curated dev seed; mark obviously-fake rows in a comment.
- Apply with: `psql "$DATABASE_URL" -f supabase/seed.sql`.
- **Files:** `supabase/seed.sql`
- **Depends on:** Slice 1
- **Done when:** `select count(*) from restaurants where status='approved'` returns 20; `select count(*) where is_solo_default=false` returns ≥3.

### Stage 2 — Repository layer (parallel, disjoint files)

#### Slice 3: Restaurants read repository
- **What:** Add `src/lib/models/restaurant.ts` with the typed `Restaurant` row shape + zod schema for runtime validation of rows fetched from Supabase (defensive — if the table drifts, fetch fails fast in dev). Add `src/lib/repositories/restaurants.ts` exposing:
  - `listApproved({ isSolo, hasJpMenu, isLateNight }: Filters): Promise<Restaurant[]>` — server-client-aware (uses `createSupabaseServerClient()` when run server-side, browser when called from a `"use client"` module). Always filters `status='approved'`. `isSolo=true` (the default chip state) translates to `is_solo_default=true OR is_solo_default IS NULL` (we strictly want solo-friendly OR un-flagged-yet, NOT `=true` only). When `isSolo=false`, the filter is dropped (spec §3 OFF semantics).
  - `getById(id: string): Promise<Restaurant | null>` — same RLS rules; returns null on RLS-hidden or genuinely missing rows (spec §6).
- Vitest with mocked Supabase client (do NOT hit the real DB in unit tests — use a per-test `vi.fn()` replacement that returns hand-crafted `{ data, error }` tuples). Cover: default ON case, all filters off, every-filter-on, error branch (PostgrestError shape), zod schema rejecting a malformed row.
- **Files:** `src/lib/models/restaurant.ts`, `src/lib/repositories/restaurants.ts`, `src/lib/repositories/restaurants.test.ts`
- **Depends on:** Stage 1 (schema must exist for the runtime types to make sense; tests are mocked so DB doesn't have to be reachable)
- **Done when:** `pnpm test src/lib/repositories/restaurants.test.ts` green; the file does NOT import `@supabase/supabase-js` directly (must go through `src/lib/supabase/server.ts` or `browser.ts`).

#### Slice 4: Submissions repository + Storage helper
- **What:** Add `src/lib/models/submission.ts` (zod schema for the 6 required UGC fields per spec §5: `name`, `naver_url`, `is_solo`, `has_jp_menu`, `is_late_night`, `reason`; plus optional `photoUrl`). Add `src/lib/repositories/submissions.ts` exposing:
  - `submitPending(input: SubmissionInput): Promise<{ id: string }>` — validates with zod; rejects `naver_url` if its host is not in `{ map.naver.com, naver.me }` (spec invariant). Uses the **server** client (so RLS pending-only insert applies); the slice's tests mock the client to avoid hitting the DB.
- Add `src/lib/supabase/storage.ts` with `uploadPhoto(file: File): Promise<string>` — client-side direct upload to `restaurant-photos` bucket, validates MIME (`image/jpeg|png`) + size (`≤2MB`) before upload, returns the public URL. Vitest with `File`/`Blob` polyfills (jsdom) for the validation paths; mocked Supabase storage client for the upload happy path.
- **Files:** `src/lib/models/submission.ts`, `src/lib/repositories/submissions.ts`, `src/lib/repositories/submissions.test.ts`, `src/lib/supabase/storage.ts`
- **Depends on:** Stage 1 (schema)
- **Done when:** `pnpm test src/lib/repositories/submissions.test.ts` + `src/lib/supabase/storage.test.ts` green; rejects on missing field, non-Naver URL, oversized photo, wrong MIME; the happy path returns the new id.

## Slicing Principles
- Stage 1 slices are sequential: seed depends on the schema existing.
- Stage 2 slices are parallel-safe: their files do not overlap (different model/repo/storage paths). The `pnpm add zod` happens in Slice 1 (added once), so neither Slice 3 nor Slice 4 mutates `package.json` after that.
- The **Install Before Import** rule (forge `7f96dd4`) applies — Slice 1 runs `pnpm add zod` before any zod import.

## Epic Acceptance Criteria
- [ ] All 4 slices reviewed and committed.
- [ ] Migration applied: `psql "$DATABASE_URL" -c "\dt restaurants"` shows the table; `\d+ restaurants` shows enums + columns; `select count(*) from restaurants where status='approved'` returns ≥20.
- [ ] RLS verified: anon-key curl `GET /rest/v1/restaurants?select=*` returns only approved rows; anon insert with `status:'approved'` lands as `pending`.
- [ ] `pnpm lint && pnpm test && pnpm build && pnpm test:e2e` all green.
- [ ] No file under `src/app/**` or `src/lib/features/**` imports `@supabase/supabase-js` directly — only `src/lib/supabase/*` and `src/lib/repositories/*` may.

## Open Questions
- Should Slice 3 paginate (`limit` param)? MVP map view rendering ~20 pins doesn't need it; **deferred** until Epic 3 reveals a perf signal.
- Multilingual full-text search? **Out of scope** for MVP (spec doesn't ask).

## Rollback Strategy
- Stage 1 is reversible via `psql "$DATABASE_URL" -f supabase/migrations/0001_restaurants.sql.down` (we ship the down migration alongside the up).
- Stage 2 slices are pure code under `src/lib/` — `git revert` is safe.
- Bucket `restaurant-photos` is left alone (operator-owned).
