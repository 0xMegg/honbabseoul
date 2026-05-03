# Verification Plan

## Task
Slice 1 (Epic 3 / Stage 1) — vite + plugin-react pin

## Completion Criteria
Coordinates so both model and human see the same finish line.

- [ ] `package.json` `devDependencies` contains `"vite"` (exact `6.x.y`, no caret prefix) and `"@vitejs/plugin-react"` (exact `4.x.y`, no caret).
- [ ] `pnpm-lock.yaml` records `vite@6.x.y` and `@vitejs/plugin-react@4.x.y` as direct dev dependencies (i.e. they appear under the project's `devDependencies` resolution block, not only as transitive nodes under `vitest`).
- [ ] `vitest.config.ts` contains `import react from "@vitejs/plugin-react"` and `plugins: [react()]` inside `defineConfig`.
- [ ] `vitest.config.ts` no longer contains the string `esbuild` anywhere, and the 5-line NOTE comment about plugin-react being intentionally NOT loaded is removed.
- [ ] All 5 existing test files run (no silent skip / drop), with the same total assertion count as the pre-slice baseline.
- [ ] Existing `pnpm build` output is unchanged (same `/[locale]` (ja, ko) prerender + chunk count, allowing for hash differences).
- [ ] No file outside the slice's declared `Files to modify` list has been edited.

## Automated Checks
Run in order. Stop on first failure.
1. **Lint:** `pnpm lint` — must report 0 errors, 0 warnings.
2. **Type check (manual companion to lint):** `pnpm exec tsc --noEmit` — must run silent. Catches `@vitejs/plugin-react` import-resolution errors that ESLint would not surface.
3. **Targeted test (component, the one that exercises plugin-react):** `pnpm test src/lib/features/layout/Logo.test.tsx` — must pass. This is the Logo `.tsx` component test; it is the strongest single signal that the React plugin is wired correctly.
4. **Full test:** `pnpm test` — all 5 test files run. Tally the total test count and confirm it matches the pre-slice baseline (per Epic 2's last `pnpm test` log).
5. **Build:** `pnpm build` — green; route output for `/`, `/ja`, `/ko` matches Epic 2 baseline (route shape + presence; chunk hashes may differ).
6. **Lockfile sanity:** `pnpm install --frozen-lockfile` — must succeed without modifying `pnpm-lock.yaml`. Proves the developer's lockfile is internally consistent and matches `package.json`.
7. **Plugin presence diff (informational, not a gate):** `grep -E "^(import react|  *plugins:)" vitest.config.ts` should print exactly two lines (`import react from "@vitejs/plugin-react";` and `plugins: [react()],`).

## Live Verification (UI/API tasks)
N/A — pure dev-tooling change. No runtime UI or API surface is affected. The Reviewer **may** spot-start `pnpm dev` and load `http://localhost:3000/ja` to sanity-check that Next/React still render normally (this rules out a transient `node_modules` corruption from the `pnpm add`), but this is courtesy verification, not a gate.

## Quality Criteria (design/creative tasks)
N/A — config / dependency change. No design surface.

## Constraints
- Do NOT modify any test under `src/**/*.test.{ts,tsx}` to make the suite pass. If a test fails after the plugin swap, the cause is plugin/vite incompatibility — fix the dependency pin or roll back, never mutate the test.
- Do NOT add `vite.config.ts` (separate from `vitest.config.ts`) — Vite is being declared as a Vitest dependency only; the project does not need a standalone Vite build config (Next.js owns the prod build).
- Do NOT touch protected files: `.env`, `.env.local`, `.next/**`, `next.config.*`, `supabase/migrations/**`, `playwright-report/**`, `test-results/**`, `.vercel/**`.
- Do NOT change `vitest` itself (no version bump). Stay on `vitest@3.2.4`.
- Do NOT switch to `@vitejs/plugin-react-swc` mid-slice; the plan calls for the Babel-based plugin.
- Slice is not complete until **all** automated checks (1-6) pass.

## Verification Evidence to Capture (Reviewer)
The Reviewer should paste these greps + their output into the review file as evidence:

1. **`package.json` exact pins:**
   ```
   grep -E '"vite"|"@vitejs/plugin-react"' package.json
   ```
   Expected: two lines, both with exact versions (e.g. `"vite": "6.0.7"`, `"@vitejs/plugin-react": "4.4.1"`), neither with a `^` prefix.

2. **`vitest.config.ts` workaround removed:**
   ```
   grep -n esbuild vitest.config.ts
   ```
   Expected: empty (no match).

3. **`vitest.config.ts` plugin wired:**
   ```
   grep -nE "import react|plugins:" vitest.config.ts
   ```
   Expected: two lines, the import and the `plugins: [react()]` entry.

4. **Lockfile direct-dep entries:**
   ```
   grep -E "^  '@vitejs/plugin-react@|^  vite@" pnpm-lock.yaml | head -5
   ```
   Expected: vite and plugin-react both present at the pinned versions; vite no longer ONLY at the transitively-pulled `7.3.2`.

5. **Test count parity:**
   Compare `pnpm test` output's `Tests` line against the Epic 2 baseline (the last full-suite log). Document the count.

## Rollback Point
- **Revert target:** the slice commit (Reviewer-created on the `task/slice-1` branch). `git revert <slice-1-commit>` is sufficient — the change is additive (new dev deps + config swap) and touches no `src/**` code.
- **Manual revert (uncommitted):** `git checkout -- vitest.config.ts package.json pnpm-lock.yaml && pnpm install` restores the pre-slice state. The esbuild-jsx workaround returns; existing tests pass.
- **Safe to keep:** nothing else in this slice is independently useful — the dev-dep additions only matter once `vitest.config.ts` references `react()`.

## Report
After verification, record:
- What changed: the dev-deps pinned + the vitest config swap (1-2 sentences).
- What passed: list automated checks 1-6 with PASS/FAIL.
- What failed: any check that did not pass + the exact error output.
- What needs human confirmation: confirm the operator is comfortable with `--save-exact` pin-then-bump-via-Planner discipline (no passive caret bumps).
- Confidence level: HIGH / MEDIUM / LOW.
