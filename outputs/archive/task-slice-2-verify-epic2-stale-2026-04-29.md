# Verification Plan

## Task
Slice 2 (Epic 2 / Stage 1 / Slice 2) — Seed data

## Completion Criteria
- [ ] `supabase/seed.sql` ships with 20 `status='approved'` restaurant rows across Hongdae / Myeongdong / Gangnam.
- [ ] ≥3 rows have `is_solo_default=false` (verified 2인 이상 전용; each annotated with a `-- group-only` inline comment).
- [ ] Idempotent reapply: running the seed twice does not duplicate rows.
- [ ] All decisions from `context/decision-log.md` (price_range enum, is_solo_default semantics, photo policy = NULL) are honoured.
- [ ] No source files outside `supabase/seed.sql` modified.

## Automated Checks
Run in order. Stop on first failure.

### Static checks (no DB needed — runnable even if Slice 1 has not been applied)
1. **File presence:** `test -f supabase/seed.sql` exits 0.
2. **Disclaimer header:** `head -20 supabase/seed.sql | grep -i "fake\|curated\|not for production"` returns ≥1 line.
3. **Row count = 20:** in the multi-row INSERT, count value tuples on their own line:
   `awk 'BEGIN{p=0} /^INSERT INTO restaurants/{p=1} p && /^\s*\(/{n++} /;[[:space:]]*$/{p=0} END{print n}' supabase/seed.sql` → `20`.
4. **Status invariant:** every tuple uses `'approved'`; no `'pending'` / `'rejected'` literals appear.
   - `grep -cE "'approved'" supabase/seed.sql` ≥ 20.
   - `grep -cE "'pending'|'rejected'" supabase/seed.sql` == 0.
5. **`is_solo_default=false` count:** `grep -cE "--\s*group-only" supabase/seed.sql` ≥ 3 (annotation invariant from the plan).
6. **Naver URL allow-list:** every URL host is `map.naver.com` or `naver.me`:
   - `grep -oE "https://[^'\"]+" supabase/seed.sql | grep -vE "^https://(map\.naver\.com|naver\.me)/" | wc -l` == 0.
7. **Lat/lng inside Seoul box (smoke):** every numeric latitude in 37.4–37.6, every longitude in 126.9–127.1:
   - `grep -oE "37\.[0-9]+" supabase/seed.sql | awk '{ if ($1 < 37.4 || $1 > 37.6) print "OUT:", $1 }'` produces no `OUT:` lines.
   - `grep -oE "12[67]\.[0-9]+" supabase/seed.sql | awk '{ if ($1 < 126.9 || $1 > 127.1) print "OUT:", $1 }'` produces no `OUT:` lines.
8. **Photo column = NULL:** `grep -cE "[Nn][Uu][Ll][Ll]" supabase/seed.sql` ≥ 20 (one per row; allow extra NULLs in comments).
9. **Idempotency clause present:** `grep -E "ON CONFLICT \(id\) DO NOTHING" supabase/seed.sql` returns ≥1 hit.
10. **Project verification (must remain green; slice doesn't touch JS/TS):**
    - `pnpm lint` → 0 errors / 0 warnings.
    - `pnpm exec tsc --noEmit` → silent.
    - `pnpm test` → 10 vitest tests pass (Logo + env smoke).
    - `pnpm build` → succeeds.
11. **Harness preservation:** `git diff --name-only main..HEAD -- .claude/ templates/ scripts/ context/ docs/` returns no entries (slice does not touch harness).

### Live checks (require Slice 1 migration applied + `DATABASE_URL` set in `.env.local`)
> If Slice 1 has not been applied yet at review time, mark these as DEFERRED and proceed to APPROVE based on static checks alone, recording the deferred items as Carry Over for the Reviewer of Slice 1 (or for a follow-up Slice 2 verification pass).

12. **Apply migration if not yet applied:** `psql "$DATABASE_URL" -f supabase/migrations/0001_restaurants.sql` — exits 0 (Slice 1 must guarantee idempotency).
13. **Apply seed:** `psql "$DATABASE_URL" -f supabase/seed.sql` — exits 0.
14. **Approved row count:** `psql "$DATABASE_URL" -c "select count(*) from restaurants where status='approved';"` returns `20`.
15. **`is_solo_default=false` count:** `psql "$DATABASE_URL" -c "select count(*) from restaurants where status='approved' and is_solo_default=false;"` returns ≥3.
16. **Area distribution (KO substring):**
    - `psql "$DATABASE_URL" -c "select count(*) from restaurants where address_ko like '%마포구%';"` ≥6.
    - `psql "$DATABASE_URL" -c "select count(*) from restaurants where address_ko like '%중구%';"` ≥6.
    - `psql "$DATABASE_URL" -c "select count(*) from restaurants where address_ko like '%강남구%';"` ≥6.
17. **`price_range` distribution:** `psql "$DATABASE_URL" -c "select price_range, count(*) from restaurants where status='approved' group by price_range;"` shows each of `low` / `mid` / `high` ≥4.
18. **Filter visibility flags:**
    - `psql "$DATABASE_URL" -c "select count(*) from restaurants where status='approved' and has_jp_menu=true;"` ≥10.
    - `psql "$DATABASE_URL" -c "select count(*) from restaurants where status='approved' and is_late_night=true;"` ≥4.
19. **Anon RLS — visibility (proves the read path will work for the public map):**
    `curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/restaurants?select=id&status=eq.approved" -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"` — JSON array length == 20.
20. **Idempotency:** rerun step 13. Step 14's count is still exactly 20 (no duplicates).

## Live Verification (UI/API tasks)
N/A — pure SQL data slice; no UI surface yet. Epic 3 picks up the visual verification end (pins on the Naver map).

## Quality Criteria (design/creative tasks)
N/A — data slice, not design.

## Constraints
- Do NOT modify Slice 1's migration to make verification pass.
- Do NOT modify any file under `src/**`.
- Do NOT add a `pnpm` dependency.
- Do NOT seed `pending` or `rejected` rows.
- Do NOT include real-business names, addresses, or real Naver place ids.
- Do NOT touch `.env.local`, `.env.local.example`.

## Rollback Point
- Revert target: `git revert <slice-2-commit>` → deletes `supabase/seed.sql`.
- Safe to keep: Slice 1's migration + `supabase/config.toml`.
- DB cleanup if seed was applied: copy the 20 explicit UUIDs from the file footer and run
  `psql "$DATABASE_URL" -c "delete from restaurants where id in ('<uuid1>', …, '<uuid20>');"`.

## Report
After verification, record:
- What changed:
- What passed:
- What failed:
- What needs human confirmation:
- Confidence level: HIGH / MEDIUM / LOW
