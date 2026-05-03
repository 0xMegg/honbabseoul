# Verification Plan

## Task
Task 2 (Epic 1 / Stage 2 / Slice 2) — Tailwind v4 + `--hb-*` token layer

## Completion Criteria
- [ ] `src/styles/tokens.css` exists, defines every `--hb-*` token listed in `outputs/plans/task-2-plan.md` § Approach 2 (color set, radius set, shadow, fonts), with `--hb-brand: #5e6ad2`.
- [ ] `src/app/globals.css` imports `tailwindcss` and `../styles/tokens.css`; the `@theme inline` block aliases `--color-*`, `--radius-*`, `--shadow-card`, `--font-sans`, `--font-mono` to `var(--hb-*)` references; body styles use `var(--hb-*)` only.
- [ ] `nextscaffold/` directory absent from working tree.
- [ ] Four `nextscaffold` exclude entries removed (`tsconfig.json`, `eslint.config.mjs`, `.prettierignore`, `.gitignore`).
- [ ] `src/app/page.tsx` and `src/app/layout.tsx` unchanged from commit `e1c6308`.
- [ ] No new dependencies — `package.json` and `pnpm-lock.yaml` unchanged from commit `e1c6308`.
- [ ] No raw hex literals anywhere in `src/`.

## Automated Checks
Run in order. Stop on first failure.

1. **Lint:** `pnpm lint` → 0 errors / 0 warnings (informational `next lint` deprecation notice OK).
2. **Type check:** `pnpm exec tsc --noEmit` → silent exit (no output, exit 0).
3. **Format:** `pnpm exec prettier --check .` → "All matched files use Prettier code style!".
4. **Build:** `pnpm build` → succeeds; ` ƒ` route table shows `/` prerendered as static; no Tailwind plugin warnings.
5. **Targeted test:** N/A — Vitest not yet installed (Slice 5 owns it).
6. **Full test suite:** N/A — same.
7. **E2E:** N/A — Playwright not yet installed (Slice 6 owns it).

## Static Verification (compensates for blocked HTTP probing)
8. **Token + Tailwind alias landed in build output:**
   - `rg --no-heading "#5e6ad2" .next/static/css/` → at least one hit (proves `--hb-brand` value).
   - `rg --no-heading "\-\-hb-brand" .next/static/css/` → at least one hit.
   - `rg --no-heading "\-\-color-brand:\s*var\(--hb-brand\)" .next/static/css/` → at least one hit (proves the `@theme inline` alias).
9. **No regression hex literals:** `rg "#[0-9a-fA-F]{3,8}\b" src/` → empty (no raw hex outside `tokens.css`; `tokens.css` itself is allowed but is the single source).
10. **No `nextscaffold` references remain:** `rg --hidden --no-heading "nextscaffold" tsconfig.json eslint.config.mjs .prettierignore .gitignore` → empty.
11. **Filesystem cleanup:** `test ! -d nextscaffold && echo OK` → `OK`.
12. **Slice 1 protected files unchanged:** `git diff e1c6308 -- src/app/page.tsx src/app/layout.tsx package.json pnpm-lock.yaml next.config.ts postcss.config.mjs .prettierrc public/` → empty diff.
13. **Harness preserved:** `git diff --stat e1c6308 -- .claude/ context/decision-log.md docs/ scripts/ skills/ templates/ CLAUDE.md PlaceholderGuide.md README.md DRYRUN-NOTES.md setup.sh .harness-manifest .mcp.json.example .env.local.example .nvmrc` → only `context/decision-log.md` (one new entry added by Planner) appears; everything else empty.

## Live Verification
1. Start dev server: `pnpm dev` (`run_in_background: true`; record port; kill before marking done).
2. Happy path:
   - [ ] Server logs `Ready in <time>` with no Tailwind/PostCSS errors.
   - [ ] If `curl http://localhost:<port>/` is permitted: response 200; HTML body includes `honbabseoul — coming soon` (page.tsx is unchanged so this still renders).
   - [ ] If `curl` blocked: skip with note; rely on Step 8 build-output CSS proof.
3. Edge cases:
   - [ ] No console errors in the terminal during boot.
4. API endpoints: N/A — no API routes added in this slice.

If `curl localhost` is blocked, report `Live: PARTIAL — dev server boot OK, HTTP probe denied; build-output CSS inspection (Step 8) confirms tokens compiled.`

## Quality Criteria
N/A — pure plumbing/refactor; no creative output. Skip the design-rubric scoring.

## Constraints
- Do NOT modify tests to make them pass (no tests in scope yet).
- Do NOT touch `src/app/page.tsx`, `src/app/layout.tsx`, `package.json`, `pnpm-lock.yaml`, or any harness file.
- Do NOT introduce `tailwind.config.ts` (decision-log: v4 CSS-first).
- Do NOT request `--dangerouslyDisableSandbox` to force `rm -rf`. If `nextscaffold/` removal is blocked again, log it as carry-over and continue with the rest of the slice.
- Task is not complete until automated checks 1–4 + static checks 8–13 pass.

## Rollback Point
- Revert target: `git revert <slice-2-commit>`.
- Files restored: `src/app/globals.css`, `tsconfig.json`, `eslint.config.mjs`, `.prettierignore`, `.gitignore`.
- Files removed: `src/styles/tokens.css`, `src/styles/` (if empty).
- Safe to keep across revert: harness files (none touched), `nextscaffold/` removal does not need to be reversed.

## Report
After verification, record:
- What changed: [list of files + the `nextscaffold/` deletion]
- What passed: [Automated 1-4 + Static 8-13 + Live]
- What failed: [or "nothing"]
- What needs human confirmation: [e.g., visual brand color in browser, if HTTP probing remained blocked]
- Confidence level: HIGH / MEDIUM / LOW
