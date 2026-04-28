# Work Plan

## Task
Slice 1 (Epic 3 / Stage 1) — vite + plugin-react pin

## Goal
Replace the temporary `esbuild.jsx: "automatic"` workaround in `vitest.config.ts` with the real `@vitejs/plugin-react` plugin, loaded against a pinned `vite ^6` + `@vitejs/plugin-react ^4` pair. After this slice, all 5 existing test files (1 component test under `src/lib/features/layout/Logo.test.tsx`, 4 unit tests under `src/lib/`) compile and run via the official React plugin (no esbuild fallback), and `vitest.config.ts` no longer carries the explanatory NOTE comment about the workaround. Lays the foundation for Epic 4's heavy `.tsx` component tests (`MapClient`, `FilterBar`, `RestaurantPins`, `BottomSheet`, `RestaurantDetail`).

## Context
- **Related files:**
  - `vitest.config.ts` — currently carries `esbuild: { jsx: "automatic" }` (lines 13-15) plus a 5-line NOTE comment (lines 7-11) explaining why `@vitejs/plugin-react` is intentionally NOT loaded yet.
  - `package.json` — must gain two new `devDependencies` entries with `--save-exact` pinning.
  - `pnpm-lock.yaml` — auto-updated by `pnpm install` after the `pnpm add` step.
  - `src/test/setup.ts` — read-only reference; not modified by this slice.
  - Existing test files (must continue to pass — verified by `Glob src/**/*.test.{ts,tsx}` returning exactly these 5):
    - `src/lib/env.test.ts`
    - `src/lib/features/layout/Logo.test.tsx`
    - `src/lib/repositories/restaurants.test.ts`
    - `src/lib/repositories/submissions.test.ts`
    - `src/lib/supabase/storage.test.ts`
- **Related issues / Epic plan:** `outputs/plans/epic-3-plan.md` § Stage 1 (Slice 1).
- **Dependencies:** none (Stage 1, single-slice — runs first).
- **Stage:** Epic 3 / Stage 1 (sequential; precedes Stage 2's parallel slices because Slice 2 + Slice 3 both run `pnpm test` / `pnpm build` against the new plugin).
- **Why pin `vite@^6` and not let it stay at the transitively-installed `vite@7.3.2`:** the existing NOTE comment in `vitest.config.ts` (lines 7-11) explicitly records that `@vitejs/plugin-react@4.x` does NOT support `vite@7.x` cleanly at time of writing, hence the workaround. The fix is to declare both as direct devDependencies and pin to the compatible pair `vite@^6` + `@vitejs/plugin-react@^4`. `vitest@3.2.4`'s peer-dependency range is `vite ^5.0.0 || ^6.0.0 || ^7.0.0-0` (per `pnpm-lock.yaml:1338`), so `vite ^6` satisfies vitest's requirement.
- **`--save-exact` rationale:** the epic plan (line 31) specifies `--save-exact` so the resulting `package.json` records exact pinned versions (e.g. `"vite": "6.x.y"`) rather than caret ranges. This protects the plugin/vite pairing from a future passive minor bump that could re-trigger the same incompatibility.

## Approach
1. Install dependencies as exact versions (Install-Before-Import rule — forge `7f96dd4`):
   ```
   pnpm add -D vite@^6 @vitejs/plugin-react@^4 --save-exact
   ```
   This adds two entries under `devDependencies` in `package.json` with no caret prefix and updates `pnpm-lock.yaml`.
2. Edit `vitest.config.ts`:
   - Add a new top-level import after the existing `defineConfig` import: `import react from "@vitejs/plugin-react";`
   - Delete the 5-line NOTE comment (currently lines 7-11) entirely — the workaround is gone, the comment no longer reflects reality.
   - Delete the `esbuild: { jsx: "automatic" }` block (currently lines 13-15) entirely.
   - Add `plugins: [react()],` as the first key inside `defineConfig({ ... })` (before the `test:` key).
   - Keep all other config keys (`test`, `resolve.alias`) and the `here` / `path.dirname(fileURLToPath(...))` setup intact.
3. Run `pnpm install` to confirm the lockfile is internally consistent (no peer-dep warnings beyond the pre-existing ones).
4. Run `pnpm lint && pnpm test && pnpm build` to confirm the existing test suite + Next build still pass with the real React plugin.
5. (Optional spot-check, Developer's discretion) — `pnpm test src/lib/features/layout/Logo.test.tsx` to specifically prove the `.tsx` component test compiles via plugin-react and not the removed esbuild fallback.

## Scope
- **Files to modify:**
  - `package.json` — append `vite` + `@vitejs/plugin-react` to `devDependencies` (exact versions, no caret).
  - `pnpm-lock.yaml` — auto-rewritten by `pnpm install`.
  - `vitest.config.ts` — replace the esbuild-jsx workaround with `import react from "@vitejs/plugin-react"` + `plugins: [react()]`, delete the NOTE comment.
- **Files NOT to touch:**
  - `src/test/setup.ts` (no changes needed; jest-dom + RTL cleanup already wired up).
  - Any test file under `src/**/*.test.{ts,tsx}` — the goal is _zero_ test changes; if any test breaks, the cause is a plugin-pair mismatch, not the test, and rolling back is safer than mutating tests.
  - `next.config.*`, `tsconfig.json`, `eslint.config.*` — out of scope.
  - `playwright.config.ts` and anything under `e2e/` — Vitest-only change.
  - `.env`, `.env.local`, `.env.local.example` — no env-var changes.
  - `supabase/migrations/**` — protected by CLAUDE.md.

## Acceptance Criteria
- [ ] `package.json` `devDependencies` contains `"vite": "6.x.y"` and `"@vitejs/plugin-react": "4.x.y"` (no `^` because `--save-exact`); both keys present.
- [ ] `pnpm-lock.yaml` records `vite@6.x.y` and `@vitejs/plugin-react@4.x.y` as direct dev dependencies (not just transitive).
- [ ] `vitest.config.ts` no longer contains the substring `esbuild` or the 5-line NOTE comment about plugin-react.
- [ ] `vitest.config.ts` contains `import react from "@vitejs/plugin-react"` and `plugins: [react()]` inside `defineConfig`.
- [ ] `pnpm install` runs to a clean state (no missing dependency errors; peer warnings, if any, must be a strict subset of the pre-slice baseline).
- [ ] `pnpm lint` → 0 errors, 0 warnings (matches Epic 2 baseline).
- [ ] `pnpm test` → all 5 existing test files run; total assertion count matches the pre-slice baseline (no silent skips). Component test `Logo.test.tsx` passes via plugin-react.
- [ ] `pnpm build` → green; same `/[locale]` (ja, ko) prerender output as Epic 2.
- [ ] No file under `src/**` is modified.
- [ ] No file under `supabase/**`, `.env*`, `next.config.*`, `playwright.config.ts`, or `e2e/**` is modified.

## Risks & Open Questions
- **Risk: `vite@^6` pulls a vite version that's too old for `vitest@3.2.4`.** Mitigation: `pnpm-lock.yaml:1338` shows `vitest@3.2.4` peer-deps `vite ^5.0.0 || ^6.0.0 || ^7.0.0-0`. `^6` is in-range. If `pnpm install` surfaces a peer warning that wasn't present before, treat it as a hard signal — rollback and reassess. Do NOT downgrade vitest to silence the warning.
- **Risk: `@vitejs/plugin-react@^4` minor bumps break against `vite@^6` minor bumps.** Mitigation: `--save-exact` pins both to a single tested pair. Future bumps go through a deliberate Planner-ratified slice.
- **Risk: SWC vs Babel — `@vitejs/plugin-react@4.x` uses Babel, not SWC.** Mitigation: this is fine for tests (compile speed is not a constraint inside vitest); we are NOT switching to `@vitejs/plugin-react-swc`. Do not "optimize" by switching mid-slice.
- **Risk: Removing the NOTE comment loses the historical rationale.** Mitigation: the rationale is captured in `outputs/plans/epic-3-plan.md` and (post-Slice-4) in `context/decision-log.md` via Slice 2's `**Affects: Epic-3 / Slice-2**` entry. Removing the comment is intentional — once the workaround is gone, leaving stale "we used to do X" prose in a config file is a future-confuser.
- **Open question: should `vite` itself be added or only `@vitejs/plugin-react`?** Resolved by epic plan line 31 — both are pinned together with `--save-exact` so the compatible pair survives future installs. Adding `@vitejs/plugin-react` alone would let vite drift to a transitive 7.x and re-break the plugin.
- **Open question: does this change anything for Playwright e2e?** No — Playwright runs against `pnpm dev` (Next.js + React) and is unaffected by the Vitest plugin choice. `pnpm test:e2e` is not part of this slice's acceptance gate but should remain green (sanity-check at Reviewer time).

## Rollback Plan
If `pnpm test` or `pnpm build` fails after the change and a quick fix is not obvious:
1. `git checkout -- vitest.config.ts package.json pnpm-lock.yaml` — restores the esbuild-jsx workaround and removes the new dev deps.
2. `pnpm install` — reverts node_modules to the pre-slice state.
3. `pnpm test && pnpm build` — confirms baseline restored.
4. Re-plan: the failure mode determines next steps (e.g. if `vite@6` is too restrictive, try `vite@^7` paired with `@vitejs/plugin-react@^4.4.0` which added vite 7 support — but that requires a Planner-ratified spec change, not a Developer judgment call).

If the slice is committed and merged before the failure surfaces (regression caught by Slice 2 / 3): `git revert <slice-1-commit>` is safe — the change is purely additive (new dev deps + config swap). All Epic 1/2 code stays compatible because nothing in `src/` imports vite or plugin-react directly.
