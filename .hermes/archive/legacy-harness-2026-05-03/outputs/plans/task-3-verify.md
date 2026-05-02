# Verification Plan

## Task
Task 3 (Epic 1 / Stage 2 / Slice 3) — next-intl locale skeleton

## Completion Criteria
Coordinates so both model and human see the same finish line.
- [ ] `pnpm install && pnpm lint && pnpm exec tsc --noEmit && pnpm build` all exit 0.
- [ ] `pnpm dev` →
  - `curl -sI http://localhost:3000/` returns a `30x` Location: `/ja`.
  - `curl -s http://localhost:3000/ja` HTML body contains `혼밥서울へようこそ`.
  - `curl -s http://localhost:3000/ko` HTML body contains `혼밥서울에 오신 것을 환영합니다`.
- [ ] `src/app/page.tsx` does NOT exist after this slice.
- [ ] `src/app/layout.tsx` is byte-identical to commit `e1c6308`.
- [ ] `package.json#dependencies` contains `next-intl` (version starts with `^4`).
- [ ] `next.config.ts` imports `createNextIntlPlugin` and exports `withNextIntl(nextConfig)`.
- [ ] All harness files (CLAUDE.md, PlaceholderGuide.md, README.md, DRYRUN-NOTES.md, setup.sh, `.harness-manifest`, `.mcp.json.example`, `.env.local.example`, `.nvmrc`, and the `.claude/ context/ docs/ outputs/<not-this-slice>/ scripts/ skills/ templates/` directories) byte-identical to commit `e1c6308`.
- [ ] No `vitest`/`@playwright/test`/`@supabase/supabase-js` install yet (those belong to Slice 4 / Slice 5 / Slice 6).

## Automated Checks
Run in order. Stop on first failure.

1. **Install:** `pnpm install` — must finish without peer-dep errors. Lockfile must mention `next-intl`.
2. **Lint/Analyze:** `pnpm lint` — 0 errors, 0 warnings on the next-intl glue (matcher regex, `params: Promise<…>`, `await import` of JSON, etc.).
3. **Type check:** `pnpm exec tsc --noEmit` — strict + `noUncheckedIndexedAccess`. The `[locale]/layout.tsx` `params` typing as `Promise<{ locale: string }>` is the Next 15 form; `hasLocale(routing.locales, locale)` narrows the union, so `setRequestLocale(locale)` should compile.
4. **Format check:** `pnpm exec prettier --check .` — every JSON/TS/TSX file Prettier knows about must be already formatted. (Harness directories excluded by `.prettierignore`.)
5. **Targeted test (changed area):** N/A — Vitest is not installed yet (Slice 5).
6. **Full test suite:** N/A — same reason.
7. **Build:** `pnpm build` — production build must:
   - Show `/[locale]/page` (or `/ja` and `/ko`) prerendered as **static** routes (○ Static in Next.js 15 build output).
   - **NOT** show "Dynamic API" or "Forced dynamic" warnings on `/[locale]`. If it does, Risk 4 from the plan triggers — Developer adds `setRequestLocale(locale)` to `page.tsx` as well and re-runs.
   - Show middleware compiled (the build log includes `ƒ Middleware` size).
   - Show 4 prerendered HTML pages: `/`, `/_not-found`, `/ja`, `/ko` (or 3 — depends on next-intl's redirect handling; either is acceptable so long as both locale routes exist).
8. **E2E:** N/A — Playwright is in Slice 6.

### Harness preservation check (mandatory — Reviewer-blocking)
9. `git diff e1c6308 -- CLAUDE.md PlaceholderGuide.md README.md DRYRUN-NOTES.md setup.sh .harness-manifest .mcp.json.example .env.local.example .nvmrc` → must return empty.
10. `git diff e1c6308 -- .claude/ context/ docs/ outputs/plans/roadmap.md outputs/plans/epic-1-plan.md outputs/plans/task-1-plan.md outputs/plans/task-1-verify.md scripts/ skills/ templates/` → must return empty (the only `outputs/` files touched in Slice 3 are the new `task-3-plan.md`, `task-3-verify.md`, and the slice's handoff updates; none of those appear here).
11. `git diff e1c6308 -- src/app/layout.tsx tsconfig.json eslint.config.mjs .gitignore .prettierignore .prettierrc` → must return empty (Slice 3 does NOT own these — Slice 1/Slice 2 do).

### Parallel-overlap check (Stage 2 cross-slice)
12. `git diff e1c6308 -- src/app/globals.css src/styles/ tailwind.config.ts postcss.config.mjs` → expected to be **empty in Slice 3's commit/changeset** (Slice 2 owns these).
13. `git diff e1c6308 -- src/lib/` → expected to be **empty in Slice 3's commit/changeset** (Slice 4 owns).

### File-existence + shape checks
14. `test ! -e src/app/page.tsx` (deleted by this slice).
15. `test -e src/i18n/routing.ts && test -e src/i18n/request.ts && test -e src/middleware.ts && test -e messages/ja.json && test -e messages/ko.json && test -e src/app/[locale]/layout.tsx && test -e src/app/[locale]/page.tsx`.
16. **Locale-key parity:**
    `node -e "const ja = require('./messages/ja.json'); const ko = require('./messages/ko.json'); const ks = (o) => Object.keys(o).flatMap(k => typeof o[k]==='object' ? Object.keys(o[k]).map(c => k+'.'+c) : [k]).sort(); const a = ks(ja), b = ks(ko); if (a.length !== b.length || a.some((x,i) => x !== b[i])) { console.error('LOCALE KEY MISMATCH', { ja: a, ko: b }); process.exit(1); } console.log('locale keys parity OK:', a);"` — must print `locale keys parity OK: [ 'common.hello' ]` and exit 0.
17. **next-intl version pin:**
    `node -e "const p = require('./package.json'); const v = p.dependencies && p.dependencies['next-intl']; if (!v || !v.startsWith('^4')) { console.error('next-intl missing or wrong major:', v); process.exit(1); } console.log('next-intl', v);"` — must print `next-intl ^4.x.x` and exit 0.
18. **next.config plugin wrap:**
    `grep -E "createNextIntlPlugin" next.config.ts` — must match.
    `grep -E "export default withNextIntl" next.config.ts` — must match.
19. **No hard-coded locale strings outside `routing.ts`:**
    `grep -rEn '"(ja|ko)"' src/ --include='*.ts' --include='*.tsx' | grep -v 'src/i18n/routing.ts'` — should return only the dynamic-import path string in `request.ts` (`messages/${locale}.json`) which is templated, not literal. Any other hit is a code smell — the Developer should refactor to import from `@/i18n/routing`.

## Live Verification (UI/API tasks)
Reviewer verifies against a running app to catch runtime bugs invisible in static review.

1. **Start dev server:** `pnpm dev` (Reviewer runs with `run_in_background: true`; kills with the matching shell PID before marking done).
2. **Wait for ready signal:** server log includes `✓ Ready in …` (Next 15 wording).
3. **Happy path — Japanese:**
   - [ ] `curl -s http://localhost:3000/ja | grep -q "혼밥서울へようこそ"` exits 0.
   - [ ] Server logs show no compilation errors and no "missing module" warnings.
4. **Happy path — Korean:**
   - [ ] `curl -s http://localhost:3000/ko | grep -q "혼밥서울에 오신 것을 환영합니다"` exits 0.
5. **Root redirect:**
   - [ ] `curl -sI http://localhost:3000/` returns `HTTP/1.1 30x` AND `location: /ja` (or `Location: /ja`).
   - [ ] `curl -sL http://localhost:3000/ | grep -q "혼밥서울へようこそ"` exits 0 (after following the redirect lands on `/ja`).
6. **Locale isolation (no key leakage):**
   - [ ] `curl -s http://localhost:3000/ja | grep -q "혼밥서울에 오신 것을 환영합니다"` returns NON-zero exit (Korean string MUST NOT appear on `/ja`).
   - [ ] `curl -s http://localhost:3000/ko | grep -q "혼밥서울へようこそ"` returns NON-zero exit (Japanese string MUST NOT appear on `/ko`).
7. **404 for unknown locale:**
   - [ ] `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/en/` returns `404` (not in `routing.locales`).
8. **No "Forced dynamic" rendering:**
   - [ ] `pnpm build` log includes the static marker (`○`) for `/ja` and `/ko`. If it shows `ƒ` (dynamic) for those routes, Risk 4 from the plan triggers — Developer adds `setRequestLocale(locale)` to `page.tsx` as well.
9. **Static asset / favicon paths still serve:**
   - [ ] `curl -sI http://localhost:3000/file.svg` returns `200` (the matcher regex's `.*\\..*` exclusion lets static assets through).

> Note: if `curl` is blocked by session permission policy (as happened in Slice 1's review), the Reviewer compensates by:
> 1. Running `pnpm build` and reading the prerendered HTML directly from `.next/server/app/[locale]/page.html` (or equivalent) for both locales.
> 2. Reading the build log for the static marker on each locale route.
> 3. Reading the dev-server compile log for any error/warn lines.
> Document the `curl`-blocked status in the review report exactly as Slice 1 did.

## Quality Criteria (design/creative tasks)
N/A — pure routing/config task. The greeting is a single `<h1>` reused from Slice 1's placeholder layout.

## Constraints
- Do NOT modify tests to make them pass (no tests yet).
- Do NOT touch protected files: every entry in `task-3-plan.md` "Files NOT to touch" list. Hard-fail the verdict if `git status --porcelain` includes any of them in this slice's changeset.
- Do NOT install `vitest`, `@playwright/test`, `@supabase/supabase-js`, or any feature-layer dep — those belong to later slices.
- Do NOT pre-create Slice 2's token files (`src/styles/tokens.css`, `tailwind.config.ts`) — Slice 2 owns them.
- Do NOT pre-create Slice 4's Supabase factories or `src/lib/env.ts` — Slice 4 owns them.
- Do NOT modify `src/app/layout.tsx` to fix the `<html lang="en">` mismatch — that is a deliberate carry-over to a future Polish slice (per epic-1-plan line 41).
- Task is not complete until live verification passes.

## Rollback Point
- **Revert target:** branch's Slice 1 final commit `e1c6308` is the safe rollback target. `git restore --staged --worktree src/i18n src/app/[locale] messages src/middleware.ts next.config.ts package.json pnpm-lock.yaml && git clean -fd src/i18n src/app/[locale] messages && git checkout e1c6308 -- src/app/page.tsx && pnpm install` returns the slice fully.
- **Safe to keep:** harness files (none of them were modified by this slice; verify via diff in step 9–11).

## Report
After verification, record:
- **What changed:** 7 new files, 3 modified files, 1 deleted file. Locale routing is live; `/ja` + `/ko` render bilingual greeting; `/` redirects to `/ja`. `next.config.ts` now wraps with `createNextIntlPlugin`.
- **What passed:** install / lint / tsc / prettier --check / build (with both locales static) / harness-preservation diff / parallel-overlap diff / locale-key parity / next-intl version pin / no-hard-coded-locale grep / live curl trio (when permitted).
- **What failed:** record exact error output, do not paraphrase.
- **What needs human confirmation:**
  - Confirm whether `pnpm build` showed `/[locale]` as static (`○`) or dynamic (`ƒ`). Static is expected — dynamic means Risk 4 fired and the Developer should add `setRequestLocale` to the page as well as the layout.
  - Confirm whether `curl` was permitted in the session (Slice 1 had it blocked). If blocked, note the static-HTML compensation path in the report.
- **Confidence level:**
  - HIGH if every automated step + curl-trio + locale-isolation greps pass AND build shows static rendering.
  - MEDIUM if any single check needed retry, or if `curl` had to be compensated by static HTML reading.
  - LOW if the build went dynamic on `/[locale]` even after adding `setRequestLocale` to the page.
