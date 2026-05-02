# Verification Plan

## Task
Slice 3 (Epic 2 / Stage 2) — Restaurants read repository

## Completion Criteria
- [ ] `src/lib/models/restaurant.ts` ships the zod `RestaurantSchema` + derived `Restaurant` (and `RestaurantStatus`, `PriceRange`) types matching the migrated schema columns.
- [ ] `src/lib/repositories/restaurants.ts` exposes `listApproved(client, filters)` and `getById(client, id)` returning typed values, using **type-only** import of `SupabaseClient` (no runtime `@supabase/supabase-js` import).
- [ ] `src/lib/repositories/restaurants.test.ts` ships 8 cases (per plan §Acceptance Criteria) plus the source-text boundary invariant; all pass.
- [ ] Filter semantics: ON-state (`isSolo:true`) → `eq('is_solo_default', true)`; OFF-state drops it; the `eq('status','approved')` guard is unconditional.
- [ ] Public read path is RLS-aware: empty `data` is a happy path; PostgrestError throws `RestaurantRepositoryError`; zod-rejected rows throw fast.
- [ ] `pnpm lint` / `pnpm exec tsc --noEmit` / `pnpm test` / `pnpm build` all green.
- [ ] No file modified outside the three new ones (plus this slice's plan/verify/handoff/archive artifacts).

## Automated Checks
Run in order. Stop on first failure.

### Static / file-shape checks (pre-build)
1. **File presence:** `test -f src/lib/models/restaurant.ts && test -f src/lib/repositories/restaurants.ts && test -f src/lib/repositories/restaurants.test.ts` exits 0.
2. **No runtime `@supabase/supabase-js` import in repository:**
   - `grep -nE "from\s+['\"]@supabase/supabase-js['\"]" src/lib/repositories/restaurants.ts` — every match line must contain `import type`.
   - `grep -cE "^import\s+\{" src/lib/repositories/restaurants.ts | xargs -I{} test {} -ge 1` (sanity — at least one runtime import exists, e.g. for the model + zod-derived types).
3. **No supabase factory import in repository** (caller-supplies-client invariant):
   - `grep -E "from\s+['\"]@/lib/supabase/(server|browser|admin)['\"]" src/lib/repositories/restaurants.ts | wc -l` == 0.
4. **`Restaurant` model imported by the repository** (single source of truth):
   - `grep -cE "from\s+['\"]@/lib/models/restaurant['\"]" src/lib/repositories/restaurants.ts` ≥ 1.
5. **Test does not hit a real network or DB:**
   - `grep -nE "createSupabaseServerClient|createSupabaseBrowserClient|createSupabaseAdminClient|process\.env\.NEXT_PUBLIC_SUPABASE_URL|@supabase/(ssr|supabase-js)['\"]" src/lib/repositories/restaurants.test.ts` returns no matches outside `import type`. (Tests build inline mocks; they MUST NOT pull factories.)
6. **Source-text boundary invariant test exists in the spec:**
   - `grep -nE "@supabase/supabase-js" src/lib/repositories/restaurants.test.ts` returns at least one match (the assertion target). Manual read confirms the test reads `restaurants.ts` and asserts no non-`import type` line.

### Toolchain
7. **Lint:** `pnpm lint` → 0 errors / 0 warnings. ESLint must accept the `import type` syntax (already supported by `eslint-config-next`).
8. **Type check:** `pnpm exec tsc --noEmit` → silent.
9. **Targeted test:** `pnpm test src/lib/repositories/restaurants.test.ts` → 8 + 1 = 9 cases pass (8 behavioural + 1 source-text invariant). Adjust to the actual count the Developer ships; the plan budgets ≥8 behavioural cases.
10. **Full test suite:** `pnpm test` → at least **18 passing** (10 prior — 6 env smoke + 4 Logo — plus this slice's 8 behavioural + 1 invariant = 19; allow ≥18 to absorb minor case-count drift).
11. **Build:** `pnpm build` → green; locale routes prerender; no SSR errors. The new files are unused at this stage but compiled.
12. **Format (advisory):** `pnpm exec prettier --check src/lib/models src/lib/repositories` — clean. If `.prettierignore` covers these paths, treat as N/A.

### Behavioural assertions (validated via the test suite, but listed here so the Reviewer can spot-check the test names against acceptance criteria)
The test file should contain identifiable cases for:
- a) `listApproved` default-on chain composition: `('status','approved')` + `('is_solo_default', true)` only.
- b) `listApproved` all-off chain composition: `('status','approved')` only.
- c) `listApproved` all-on chain composition: 4 `.eq` calls in order.
- d) `listApproved` empty-data is a happy path (returns `[]`, doesn't throw).
- e) `listApproved` PostgrestError → `RestaurantRepositoryError` with `cause`.
- f) `listApproved` malformed-row → `ZodError`.
- g) `getById` happy path with `eq('status','approved')` + `eq('id', uuid)` + `maybeSingle()`.
- h) `getById` null when `maybeSingle()` resolves `{ data: null, error: null }`.
- i) Source-text boundary invariant.

## Live Verification (UI/API tasks)
**N/A — pure logic + unit-tested repository.** No UI, no API route, no dev-server interaction. Epic 3 owns the end-to-end visual proof (pins on Naver map driven by `listApproved`).

> Optional manual smoke (Reviewer's discretion, not required for APPROVE):
> wire a one-off Server Component playground page (`src/app/[locale]/_dev/restaurants/page.tsx`) that calls `listApproved(await createSupabaseServerClient(), { isSolo:true, hasJpMenu:false, isLateNight:false })` and renders `JSON.stringify(rows)`. Run `pnpm dev`, hit `/ja/_dev/restaurants`, expect ~16 rows (20 seeded minus the 4 group-only ones). **DELETE the playground before commit** if used. The slice's commit MUST NOT contain `_dev/` artifacts.

## Quality Criteria (design/creative tasks)
N/A — backend / data slice.

## Constraints
- Do NOT modify Slice 1's migration to make the schema fit the model. The model follows the schema, not the other way around.
- Do NOT modify `src/lib/supabase/{browser,server,admin}.ts` to "help" the repository. The repository takes a client argument; factories stay untouched.
- Do NOT introduce `@vitejs/plugin-react`, `@supabase/supabase-js` runtime imports in the repository, or any deep relative `../../` imports — use `@/` aliasing.
- Do NOT introduce a Database typegen step (`supabase gen types typescript`) here — that's a future Epic-2 extension.
- Do NOT touch `package.json` / `pnpm-lock.yaml` (zod is already installed from Slice 1).
- Do NOT touch `vitest.config.ts`. Current config (`environment: 'jsdom'`, `esbuild.jsx: 'automatic'`, alias `@`) suffices.
- Do NOT add component tests for restaurants — Stage 2 is data-only.
- Do NOT touch handoff files OTHER than `handoff/task-slice-2.md` (per the user's command-args). Specifically: leave `handoff/latest.md` and `handoff/task-slice-3.md` untouched.

## Rollback Point
- Revert target: `git revert <slice-3-commit>` deletes the three new files.
- Safe to keep: Slice 1 (`8388728`) + Slice 2 (`7b5f9b0`) artifacts; supabase migration & seed are untouched here.
- If only the test file misbehaves: `git checkout HEAD~1 -- src/lib/repositories/restaurants.test.ts` while leaving the production code in place is acceptable for a hot patch (Reviewer's call).

## Report
After verification, record:
- What changed:
- What passed:
- What failed:
- What needs human confirmation:
- Confidence level: HIGH / MEDIUM / LOW
