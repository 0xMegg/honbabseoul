# Verification Plan

## Task
Slice 4 (Epic 2 / Stage 2 / Slice 4) — Submissions repository + Storage helper

## Completion Criteria
- [ ] `src/lib/models/submission.ts`, `src/lib/repositories/submissions.ts`, `src/lib/repositories/submissions.test.ts`, `src/lib/supabase/storage.ts`, `src/lib/supabase/storage.test.ts` ship.
- [ ] `submitPending` validates with zod (`.strict()`), maps camelCase input → snake_case insert columns, omits `status` from the INSERT, sets `name_ko = null`, and is `import "server-only"` guarded.
- [ ] `uploadPhoto` enforces ≤2MB and `image/jpeg|png` BEFORE the network call, generates a `{yyyy}/{mm}/{uuid}.ext` storage path that never embeds the user-supplied filename, and returns the public URL.
- [ ] Naver URL host allow-list is `{ map.naver.com, naver.me }` exact-match — proven by both an accept and a suffix-injection reject test.
- [ ] No file modified outside this slice's declared file list. Slice 3's files (`src/lib/models/restaurant.ts`, `src/lib/repositories/restaurants.ts`, `src/lib/repositories/restaurants.test.ts`) are NOT touched.

## Automated Checks
Run in order. Stop on first failure.

### Static checks (no DB / no live Supabase needed)
1. **File presence** — all five files exist:
   - `test -f src/lib/models/submission.ts`
   - `test -f src/lib/repositories/submissions.ts`
   - `test -f src/lib/repositories/submissions.test.ts`
   - `test -f src/lib/supabase/storage.ts`
   - `test -f src/lib/supabase/storage.test.ts`
2. **Server-only guard on the repo:**
   - `head -3 src/lib/repositories/submissions.ts | grep -E "^import \"server-only\";?$"` returns 1 line.
3. **No direct `@supabase/supabase-js` import in this slice's new files:**
   - `grep -rE "from \"@supabase/supabase-js\"" src/lib/repositories/submissions.ts src/lib/supabase/storage.ts` returns 0 lines (admin.ts is the only authorised consumer; not changed in this slice).
4. **No raw `@supabase/ssr` import in storage.ts** (must go through the wrapped browser factory):
   - `grep -E "from \"@supabase/(ssr|supabase-js)\"" src/lib/supabase/storage.ts` returns 0 lines.
5. **Naver host allow-list is exact-match (suffix-injection guard exists):**
   - `grep -E "endsWith\(['\"]naver" src/lib/models/submission.ts` returns 0 lines (no loose suffix matching).
   - `grep -E "NAVER_URL_HOSTS|map\.naver\.com|naver\.me" src/lib/models/submission.ts` returns ≥3 lines.
6. **`status` is omitted from the INSERT row:**
   - `grep -E "status:" src/lib/repositories/submissions.ts` returns 0 lines (defensive omission per plan §Approach.2.3).
7. **`name_ko: null` explicit:**
   - `grep -E "name_ko:\s*null" src/lib/repositories/submissions.ts` returns ≥1 line.
8. **Photo size + MIME constants are imported from the model (no duplicated literals):**
   - `grep -E "MAX_PHOTO_BYTES|ALLOWED_PHOTO_MIME" src/lib/supabase/storage.ts` returns ≥2 lines.
   - `grep -E "MAX_PHOTO_BYTES|ALLOWED_PHOTO_MIME" src/lib/models/submission.ts` returns ≥2 lines.
   - The literal `2 * 1024 * 1024` appears at most once across both files combined: `grep -c "2 \* 1024 \* 1024" src/lib/models/submission.ts src/lib/supabase/storage.ts | awk -F: '{ s+=$2 } END { exit (s>1) ? 1 : 0 }'`.
9. **Slice 3 files untouched:**
   - `git diff --name-only main..HEAD -- src/lib/models/restaurant.ts src/lib/repositories/restaurants.ts src/lib/repositories/restaurants.test.ts` returns no entries.
10. **Harness preservation:**
    - `git diff --name-only main..HEAD -- .claude/ templates/ scripts/ context/ docs/` returns no entries.
11. **Lint:** `pnpm lint` → 0 errors / 0 warnings.
12. **Type check:** `pnpm exec tsc --noEmit` → silent exit.
13. **Targeted tests (Slice 4 surface):**
    - `pnpm test src/lib/repositories/submissions.test.ts` — all assertions green; case count ≥11.
    - `pnpm test src/lib/supabase/storage.test.ts` — all assertions green; case count ≥9.
14. **Full Vitest run:** `pnpm test` — every test green. Expected total = prior 10 (Logo + env) + 11 submissions + 9 storage = **30** at minimum (Slice 3 may add more if it lands first; Reviewer reconciles by reading the Vitest summary, not pinning a hard number).
15. **Build:** `pnpm build` — succeeds; no new prerendered routes (this slice has no UI surface).

### Live checks (require Supabase reachable + bucket existence)
> If the bucket is missing or `INSERT` not allowed for anon, mark these as DEFERRED and add them to Carry Over for the Epic 4 UGC-form slice — they don't gate APPROVE for this slice's static contract.

16. **Bucket sanity (admin-side proof, runnable today):**
    - `set -a && . ./.env.local && set +a` (loads `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SUPABASE_URL`).
    - `curl -s "$NEXT_PUBLIC_SUPABASE_URL/storage/v1/bucket/restaurant-photos" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"` — JSON body has `"public": true` and `"name": "restaurant-photos"`.
17. **Anon-side `INSERT` capability probe (proves `uploadPhoto` will work in browser):**
    - Synthesise a 100-byte PNG locally:
      `printf '\x89PNG\r\n\x1a\n%s' "$(head -c 92 /dev/urandom)" > /tmp/probe.png`.
    - `curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/storage/v1/object/restaurant-photos/probe-2026-04-25.png" -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" -H "authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" -H "x-upsert: false" --data-binary @/tmp/probe.png -H "content-type: image/png"` — HTTP 200 / JSON `{ "Key": "restaurant-photos/probe-2026-04-25.png" }`.
    - Cleanup: `curl -s -X DELETE "$NEXT_PUBLIC_SUPABASE_URL/storage/v1/object/restaurant-photos/probe-2026-04-25.png" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"`.
18. **Anon-side `INSERT` policy on `restaurants` (proves `submitPending` will work end-to-end):**
    - `curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/restaurants" -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" -H "authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" -H "content-type: application/json" -H "prefer: return=representation" --data '{"name_ja":"VERIFY ROW — DELETE ME","naver_url":"https://map.naver.com/p/entry/place/00000001","is_solo_default":true,"has_jp_menu":false,"is_late_night":false,"status":"approved"}'`.
    - Returned JSON's `status` must be `"pending"` (the trigger silently downgraded). The `id` is the new row.
    - Cleanup: `psql "$DATABASE_URL" -c "delete from restaurants where naver_url = 'https://map.naver.com/p/entry/place/00000001';"`.
19. **No new prod-leaking dependencies:**
    - `git diff main..HEAD -- package.json | grep -E "^[+-].*:" | grep -v "^[+-]{3}"` returns no lines (no `dependencies`/`devDependencies` mutation in this slice).
    - `git diff main..HEAD -- pnpm-lock.yaml | wc -l` returns `0` (lockfile unchanged).

## Live Verification (UI/API tasks)
N/A — this slice ships repository + storage helpers, no UI surface. Epic 4 (UGC form) is the visual integration point.

If, against expectations, the Developer wires this into a `src/app/api/submissions/route.ts` route handler in this slice (NOT in scope per the Plan §Scope), the Reviewer must:
- Confirm the handler validates with zod at the boundary (do not trust the body).
- Confirm the handler returns 4xx with a typed error code, never an HTTP 500 for input issues.
- Confirm no PostgrestError shape leaks into the JSON response.

## Quality Criteria (design/creative tasks)
N/A — pure data-layer code, no design surface.

## Constraints
- Do NOT modify Slice 3 files (`src/lib/models/restaurant.ts`, `src/lib/repositories/restaurants.ts`, `src/lib/repositories/restaurants.test.ts`).
- Do NOT modify `src/lib/supabase/{admin,browser,server}.ts` or `src/lib/env.ts`.
- Do NOT modify `package.json`, `pnpm-lock.yaml`, `next.config.*`, `eslint.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`.
- Do NOT touch `.env.local`, `.env.local.example`.
- Do NOT add a `src/app/**` or `src/lib/features/**` change.
- Do NOT introduce a migration file in this slice (the `reason` gap is intentionally deferred per plan §Risks).
- Do NOT lower test coverage by deleting any existing test, or by mocking `submissionSchema` itself out of the path (mock the Supabase boundary, not the validator).

## Rollback Point
- Revert target: `git revert <slice-4-commit>` removes all five new files; no migrations or DB writes to roll back.
- Safe to keep:
  - All Stage 1 artifacts (`supabase/migrations/0001_*`, `supabase/seed.sql`).
  - All Slice 3 artifacts (`src/lib/models/restaurant.ts`, etc.) — disjoint by design.
- If the live curls in §16–18 mutated DB or storage state, the cleanup commands listed inline restore both.

## Report
After verification, record:
- What changed:
- What passed:
- What failed:
- What needs human confirmation:
- Confidence level: HIGH / MEDIUM / LOW
