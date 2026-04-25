# Review — Slice 2 (Epic 2 / Stage 1 / Slice 2): Seed data

## Scope of this review
- Single new file: `supabase/seed.sql` (224 lines).
- Verify plan: `outputs/plans/task-slice-2-verify.md` (steps 1–11 = static, 12–20 = live).
- Live verification (steps 12–20) is gated by Slice 1 being applied to a real Supabase database; per the verify plan's own escape clause, those steps may be DEFERRED and recorded as Carry Over when the Slice 1 migration has not yet landed in the running DB.

## Verification Results

### Static checks (verify plan §1–11)

| # | Check | Result |
|---|-------|--------|
| 1 | `supabase/seed.sql` exists | PASS |
| 2 | Disclaimer header present (`fake / curated / not for production`) | PASS — line 4: `-- CURATED FAKE DATA — NOT FOR PRODUCTION` |
| 3 | Value tuples = 20 | PASS — Grep on `^\s*\(` → 20 |
| 4 | Status invariant: `'approved'` only, no `'pending'` / `'rejected'` | PASS — 25 `'approved'` matches (20 in tuples + 5 in trailing comment), 0 `'pending'/'rejected'` |
| 5 | `-- group-only` annotations ≥3 | PASS — 4 annotations at lines 55 (무한리필 고기집), 108 (전골 전문), 115 (샤브샤브 코스), 147 (곱창전골) |
| 6 | Naver URL host allow-list | PASS — all 20 URLs are `https://map.naver.com/p/entry/place/...` |
| 7 | Lat/lng smoke (37.4–37.6, 126.9–127.1) | PASS — lat range observed: 37.4965–37.5655; lng range observed: 126.9210–127.0340. All within Seoul box. |
| 8 | `photo_url = NULL` for every row | PASS — 20 `NULL` literals (one per tuple) |
| 9 | `ON CONFLICT (id) DO NOTHING` clause present | PASS — line 181 (and a copy in trailing rollback comment) |
| 10 | `pnpm lint` / `tsc --noEmit` / `pnpm test` / `pnpm build` green | PASS — lint: 0 errors/warnings; tsc: silent; vitest: 10/10 pass; build: success (1 SSG route, no errors) |
| 11 | Harness preservation (no diff under `.claude/`, `templates/`, `scripts/`, `context/`, `docs/` from this slice) | PASS — Slice 2's working-tree contribution is `supabase/seed.sql` only; the harness paths shown by `git diff main..HEAD` come from prior commits (forge sync, role-developer template), not from this slice |

### Distribution audit (cross-checked against plan §Acceptance Criteria)

Manually walked the 20 tuples (rows numbered top-to-bottom in file):

| Bucket | Count | Threshold | Result |
|---|---|---|---|
| Hongdae (마포구 / 麻浦区) | 7 | ≥6 | PASS |
| Myeongdong (중구 / 中区) | 7 | ≥6 | PASS |
| Gangnam (강남구 / 江南区) | 6 | ≥6 | PASS |
| `price_range='low'` | 7 | ≥4 | PASS |
| `price_range='mid'` | 8 | ≥4 | PASS |
| `price_range='high'` | 5 | ≥4 | PASS |
| `has_jp_menu=true` | 16 | ≥10 | PASS |
| `is_late_night=true` | 6 | ≥4 | PASS |
| `is_solo_default=false` | 4 | ≥3 | PASS |
| Lat in correct neighbourhood window | 20/20 | 20/20 | PASS — Hongdae lats 37.5505–37.5590 (window 37.5500–37.5600), Myeongdong lats 37.5602–37.5655 (window 37.5600–37.5660), Gangnam lats 37.4965–37.5160 (window 37.4950–37.5180) |
| Lng in correct neighbourhood window | 20/20 | 20/20 | PASS — Hongdae lngs 126.9210–126.9270 (window 126.9200–126.9280), Myeongdong lngs 126.9802–126.9870 (window 126.9800–126.9880), Gangnam lngs 127.0255–127.0340 (window 127.0250–127.0350) |
| Unique UUID id literals | 20 distinct | 20 | PASS — 7 `f47ac10b-…` + 7 `c56a4180-…` + 6 `9b1deb4d-…` |

### Live checks (verify plan §12–20) — DEFERRED

Slice 1's migration (`supabase/migrations/0001_restaurants.sql`) has not been applied to the configured `$DATABASE_URL`. Per the verify plan's explicit escape clause:
> If Slice 1 has not been applied yet at review time, mark these as DEFERRED and proceed to APPROVE based on static checks alone, recording the deferred items as Carry Over.

So §12–20 are DEFERRED and recorded as carry-over below. They become a follow-up verification pass once Slice 1 lands.

### Architecture / Security / API rules

- `.claude/rules/local/api-honbabseoul.md` § Public Read Path — only `status='approved'` rows seeded. PASS.
- `.claude/rules/local/api-honbabseoul.md` § naver_url allow-list — all rows match `map.naver.com`. PASS.
- `.claude/rules/local/frontend-honbabseoul.md` § paired bilingual columns — every row sets both `name_ja`/`name_ko` and `address_ja`/`address_ko`. PASS.
- `context/decision-log.md` (2026-04-25) § price_range enum — only `low`/`mid`/`high` literals appear. PASS.
- `context/decision-log.md` § is_solo_default semantics — the 4 `false` rows are concretely group-only concepts (무한리필 고기집, 전골, 샤브샤브, 곱창전골). PASS.
- `context/decision-log.md` § photo policy — every row has `photo_url = NULL`. PASS.
- No secrets, no service-role key, no env mutation. PASS.

## Observations (non-blocking)

- Slice 1 deliverables (`supabase/migrations/0001_restaurants.sql`, `supabase/migrations/0001_restaurants.sql.down`, `supabase/config.toml`) and several other unrelated working-tree changes (`.env.local.example`, `package.json`, `pnpm-lock.yaml`, `scripts/db-preflight.sh`, etc.) sit uncommitted alongside this slice's deliverable. They are NOT part of Slice 2's scope and will NOT be staged in this slice's commit. Slice 1's commit is the right place to land them — flagged so the next reviewer / Slice 1 wrap-up does not assume they were absorbed here.
- The seed file is well-commented, idempotent, and ships its own copy-paste rollback block (lines 201–223). Operationally pleasant.

## Issues Found

- **None Critical.**
- **None Important.**
- **Minor:** none worth recording.

## Carry over to next Task

- **Live verification (verify plan §12–20)** — must run after Slice 1's migration is applied to `$DATABASE_URL`:
  1. `psql "$DATABASE_URL" -f supabase/migrations/0001_restaurants.sql`
  2. `psql "$DATABASE_URL" -f supabase/seed.sql`
  3. Confirm: `select count(*) from restaurants where status='approved'` == 20.
  4. Confirm: `select count(*) from restaurants where is_solo_default=false` ≥ 3 (expected 4).
  5. Confirm price_range distribution shows each of `low`/`mid`/`high` ≥ 4 (expected low:7, mid:8, high:5).
  6. Confirm `has_jp_menu=true` ≥ 10 (expected 16) and `is_late_night=true` ≥ 4 (expected 6).
  7. Confirm anon RLS visibility via `curl … apikey=$NEXT_PUBLIC_SUPABASE_ANON_KEY` returns 20 rows.
  8. Re-apply seed (idempotency): row count unchanged.
- **Slice 1 commit hygiene** — the Slice 1 author should land `supabase/migrations/`, `supabase/config.toml`, and any related `package.json` / `pnpm-lock.yaml` / `.env.local.example` / `scripts/db-preflight.sh` changes under their own slice commit (not absorbed into this slice).
- Existing carry-overs from prior handoff still open: Logo SVG (already shipped at `2e27e39`); Storage bucket validation (Epic 4 / Slice 4); service_role key rotation; shadcn/ui adoption decision after first two product screens.

## Verdict
APPROVE — all static acceptance criteria met; live verification properly deferred per the verify plan's own escape clause; one Important-grade carry-over (live re-verification after Slice 1 lands) and zero Critical/Important issues.

<!-- FINAL_VERDICT: APPROVE -->
