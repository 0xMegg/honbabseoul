# Work Plan

## Task
Slice 2 (Epic 2 / Stage 1 / Slice 2) — Seed data

## Goal
Ship `supabase/seed.sql` with **20** hand-curated approved restaurant rows distributed across Hongdae / Myeongdong / Gangnam: bilingual `name_ja/name_ko` + `address_ja/address_ko`, plausible lat/lng inside each neighbourhood window, mixed `price_range`, varied `has_jp_menu` / `is_late_night` flags, and **≥3** rows where `is_solo_default = false` so the OFF-filter case has visible behaviour. After applying it on top of Slice 1's schema, `select count(*) from restaurants where status='approved'` = 20 and `select count(*) from restaurants where is_solo_default = false` ≥ 3.

## Context
- **Epic / Stage / Slice:** Epic 2 / Stage 1 / Slice 2. Stage 1 is **sequential**: Slice 2 strictly depends on Slice 1 (`supabase/migrations/0001_restaurants.sql` + RLS) being applied to `$DATABASE_URL` before this seed can run. The seed file itself can be authored without DB access — application is what's gated.
- **Related plan:** `outputs/plans/epic-2-plan.md` (Slice 2 spec, Stage 1).
- **Roadmap:** `outputs/plans/roadmap.md` lines 111–115 (Slice 2.1.2).
- **Related decisions** (`context/decision-log.md`, 2026-04-25):
  - `price_range` enum is `'low' | 'mid' | 'high'` rendered `₩ / ₩₩ / ₩₩₩`.
  - `is_solo_default = false` strictly means **verified 2인 이상 전용** (e.g. 무한리필 / 전골 / 샤브샤브 / 곱창전골 / 대구탕). Unverified rows do NOT enter the public seed.
  - Photo upload constraints (≤2MB, jpeg/png) — UGC concern. Seed rows set `photo_url = NULL` (no fake photos).
  - Geo fallback (Seoul City Hall) — UI-side; doesn't affect seed shape.
- **Related local rules:**
  - `.claude/rules/local/api-honbabseoul.md` — Public Read Path: only `status='approved'` rows are public. Seed is approved-only.
  - `.claude/rules/local/api-honbabseoul.md` — `naver_url` host allow-list `{ map.naver.com, naver.me }` MUST hold for every row.
  - `.claude/rules/local/gotchas-honbabseoul.md` — RLS silent-empty trap; verifier probes both anon and service-role to prove rows exist + are visible.
  - `.claude/rules/local/frontend-honbabseoul.md` — bilingual data uses paired `*_ja` / `*_ko` columns; null fallback is `name_ja ?? name_ko`. Seed populates BOTH.
- **Schema dependency (Slice 1 surface this slice consumes):**
  - Table: `restaurants`. Columns (per Epic 2 plan + roadmap): `id` (uuid pk), `name_ja`, `name_ko`, `address_ja`, `address_ko`, `latitude` (double precision), `longitude` (double precision), `price_range` (enum), `status` (enum, default `'pending'`), `is_solo_default` (boolean, default `true`), `has_jp_menu` (boolean), `is_late_night` (boolean), `naver_url` (text), `photo_url` (text, nullable), `created_at` (timestamptz, default `now()`), `updated_at` (timestamptz, default `now()`).
  - Enums: `restaurant_status ∈ {pending, approved, rejected}`, `price_range ∈ {low, mid, high}`.
  - RLS: anon SELECT allowed only when `status='approved'`. Anon INSERT downgrades to `pending`. Seed is applied as service-role (bypasses RLS), so `INSERT ... VALUES ('approved', …)` lands as `approved`.
- **Carry-overs from previous Reviewer Handoff** (`handoff/task-slice-1.md`) — none of the open carry-overs are this slice's concern, but flagged for visibility:
  - Logo SVG — already shipped at `2e27e39`.
  - Storage bucket sanity — Epic 4 / Slice 4 territory.
  - service_role key rotation — pre-deployment, separate task.
  - `DATABASE_URL` in `.env.local` — required for live verification step. Confirmed by user before slice run.

## Approach
1. **Create** `supabase/seed.sql` as a deterministic, idempotent script with a header comment block:
   - File purpose, generation date (2026-04-25), explicit "CURATED FAKE DATA — not for production" disclaimer.
   - Dependency note: must be applied AFTER `supabase/migrations/0001_restaurants.sql`.
   - Idempotency note: uses explicit UUID v4 ids + `ON CONFLICT (id) DO NOTHING`, safe to re-run, leaves UGC `pending` rows untouched.
2. **Use a single multi-row `INSERT INTO restaurants (...) VALUES (...), (...), ...;`** statement (not 20 separate INSERTs) for compactness. End with `ON CONFLICT (id) DO NOTHING;`.
3. **Pre-generate 20 stable UUIDs** (literal hex strings, hand-rolled; same value across reruns). Group them by area in row order so the file reads top→bottom Hongdae → Myeongdong → Gangnam. Add an inline `--` comment at each area boundary.
4. **Distribute 20 rows** as ~7 Hongdae / ~7 Myeongdong / ~6 Gangnam (each area ≥6).
5. **Fictional names** — clearly non-trademarked (e.g. `ホンデひとり食堂 / 홍대혼밥식당`, `明洞ぼっちラーメン / 명동혼밥라멘`, `江南ソロ焼肉 / 강남솔로구이`). Avoid resemblance to any known chain. Aim for evocative-but-fake.
6. **Bilingual addresses** follow `<gu>, <dong>, <street + 번지>` in each language:
   - Hongdae rows → `address_ko like '%마포구%'`, `address_ja like '%麻浦区%'`.
   - Myeongdong rows → `address_ko like '%중구%'`, `address_ja like '%中区%'`.
   - Gangnam rows → `address_ko like '%강남구%'`, `address_ja like '%江南区%'`.
7. **Lat/lng plausibility** (each row's coords MUST land in the area window):
   - Hongdae: lat ∈ [37.5500, 37.5600], lng ∈ [126.9200, 126.9280].
   - Myeongdong: lat ∈ [37.5600, 37.5660], lng ∈ [126.9800, 126.9880].
   - Gangnam: lat ∈ [37.4950, 37.5180], lng ∈ [127.0250, 127.0350].
8. **`is_solo_default = false` rows (≥3, target 4)** — pick concepts that semantically justify "2인 이상 전용":
   - 무한리필 고기집, 전골 전문, 샤브샤브 코스, 곱창전골, 대구탕 큰솥. Spread across the 3 areas (e.g. 1 Hongdae + 2 Myeongdong + 1 Gangnam).
   - Add a `-- group-only` inline comment on each such row so the Reviewer can grep them by intent.
9. **`price_range` distribution** — target `low ≥ 6`, `mid ≥ 7`, `high ≥ 4` (sum = 20-ish, allowing one swap). Each bucket ≥ 4. Cheap rows tend to be Hongdae (student area), high rows tend to be Gangnam, Myeongdong split.
10. **`has_jp_menu`** — true for ≥10 rows (Myeongdong-heavy, since the user persona is JP tourists). False for the rest.
11. **`is_late_night`** — true for ≥4 rows, distributed across all three areas. The "true" rows skew Hongdae (party district) and Gangnam (business district).
12. **`naver_url`** — `https://map.naver.com/p/entry/place/<8-digit numeric>` for each row. The numeric ids are placeholder (not real). Add the disclaimer in the file header. Every URL host MUST be `map.naver.com` (or `naver.me` for short links — keep it consistent with `map.naver.com` for the seed).
13. **`status = 'approved'`, `photo_url = NULL`** for every row. Do NOT seed pending or rejected rows; do NOT invent photo URLs.
14. **`created_at` / `updated_at`** — omit from the INSERT column list so the schema defaults (`now()`) apply.
15. **End-of-file comment** — list the 4 verification queries the Reviewer will run, copy-paste ready.

## Scope
- Files to create: `supabase/seed.sql`
- Files to modify: (none)
- Files NOT to touch:
  - `supabase/migrations/0001_restaurants.sql` (Slice 1 territory — must already exist before Develop applies the seed)
  - `supabase/config.toml` (Slice 1 territory)
  - `package.json` (Slice 1 added `db:push` / `db:reset`; Slice 2 doesn't add scripts)
  - `pnpm-lock.yaml`, `node_modules/**` (no new deps in this slice)
  - Anything under `src/**`, `e2e/**`, `messages/**` (Stage 2 + later epics)
  - `.env.local`, `.env.local.example` (operator-owned)
  - Harness directories: `.claude/`, `templates/`, `scripts/`, `context/`, `docs/`

## Acceptance Criteria
- [ ] `supabase/seed.sql` exists; ≤300 lines, well-formed PostgreSQL.
- [ ] Exactly **20** value tuples in the INSERT statement.
- [ ] Every value tuple sets `status = 'approved'`. No `'pending'` / `'rejected'` literals appear.
- [ ] **≥3** rows have `is_solo_default = false`; each is annotated with a `-- group-only` inline comment that names a concrete group-only concept.
- [ ] Hongdae ≥6 rows, Myeongdong ≥6 rows, Gangnam ≥6 rows (verified by `address_ko` / `address_ja` substring).
- [ ] `price_range` distribution: each of `'low' | 'mid' | 'high'` appears ≥4 times.
- [ ] `has_jp_menu = true` in ≥10 rows; `is_late_night = true` in ≥4 rows.
- [ ] Every `naver_url` matches `^https://(map\.naver\.com|naver\.me)/.*$`.
- [ ] Every `latitude` / `longitude` falls in its declared area window.
- [ ] Every row uses `photo_url = NULL`.
- [ ] Every row has explicit UUID id literal; the file ends with `ON CONFLICT (id) DO NOTHING;`.
- [ ] `pnpm lint && pnpm exec tsc --noEmit && pnpm test && pnpm build` — all green (slice doesn't touch JS/TS, so these should pass unchanged from `2f87ff7`).
- [ ] No real-business names, addresses, or naver place ids; header disclaimer present.

## Risks & Open Questions
- **Slice 1 prerequisite (HARD).** The seed cannot apply to a DB without Slice 1's migration. If Slice 1 is not yet committed when Develop starts, options:
  1. Develop authors `seed.sql` standalone (file-only) and runs the static-grep portion of the verify plan; the live-DB portion is deferred to the Reviewer or to a follow-up after Slice 1 lands.
  2. Develop refuses and waits — the Stage 1 sequential rule justifies pausing.
  Plan recommends (1): the seed file is the deliverable; static checks suffice for APPROVE if live verification is blocked by Slice 1 not yet being applied. Reviewer gets the final call.
- **Column-shape drift vs Slice 1.** This plan assumes the columns + enums declared in `outputs/plans/epic-2-plan.md`. If Slice 1 lands with different column names/types (e.g. `lat` instead of `latitude`), Slice 2 must follow Slice 1's actual shape — Developer reads `supabase/migrations/0001_restaurants.sql` first, before writing the seed.
- **Idempotency vs UGC isolation.** `ON CONFLICT (id) DO NOTHING` over `TRUNCATE`: re-runs don't duplicate AND don't blow away pending UGC. Trade-off: changing seed-row content later requires a deliberate `UPDATE` or manual delete + reseed (acceptable in MVP).
- **No real photos.** All `photo_url = NULL`. Epic 3's bottom-sheet UI must already handle the null case; if it cannot, that's an Epic 3 bug, not a Slice 2 concern.
- **Coordinate plausibility.** Coords are picked from neighbourhood windows; not surveyed against any external source. Pins should look "in the right neighbourhood" on Naver but are NOT real addresses. The header disclaimer covers this.

## Rollback Plan
- Pure additive — `git revert <slice-2-commit>` deletes `supabase/seed.sql`.
- DB cleanup if applied: `psql "$DATABASE_URL" -c "delete from restaurants where id in ('<uuid1>', …, '<uuid20>');"` — explicit ids make targeted cleanup unambiguous, and they'll appear in the file footer comment for ease of copy-paste.
