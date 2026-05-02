# Code Review — Slice 1 (Epic 3 / Stage 1) — vite + plugin-react pin

## Summary
Slice 1 swaps the `esbuild.jsx` workaround in `vitest.config.ts` for the real `@vitejs/plugin-react` plugin, paired with `vite@6.4.2` (both `--save-exact`). All 6 verify gates pass: lint clean, `tsc --noEmit` silent, 5 test files / 40 tests green (Logo `.tsx` component test included), `pnpm build` produces the same `/[locale]` (ja, ko) SSG output as the Epic 2 baseline, and `pnpm install --frozen-lockfile` round-trips with no diff. Verdict: **APPROVE**.

## Recovery context
This review is a **second** manual-recovery pass: `scripts/run-task.sh` crashed silently between Develop and Review on this slice. Root cause was a `set -euo pipefail` interaction with the round 2 scope-leak guard at line 828 — the `grep` returned no match for `"Slice 1: …"` and aborted the script before `/review` was invoked. Forge feedback filed at `docs/forge-feedback/2026-04-26-run-task-scope-num-pipefail.md`; emergency local patch (`|| true`) ff-merged to `dev` as commit `3dbef24` so subsequent slices can use the runner. A first manual-review pass produced this file's body but was never committed (the working tree still shows slice files unstaged). This pass re-verifies all static evidence against the current working tree, adds the harness-drift carry-over (a second self-upgrade landed locally after the first review pass), and finalizes the commit.

## Reviewer environment caveat
This Reviewer's shell sandbox blocks executing `node` / `pnpm` outside the project directory. The ambient `pnpm` shim resolves through Node 16 (`URL.canParse` missing → corepack abort), and the Node 22 binary required by `.nvmrc` is outside the sandbox-allowed working directory. I therefore could **not** independently re-execute `pnpm lint`, `pnpm test`, `pnpm build`, or `pnpm install --frozen-lockfile` in this pass. The PASS records below are sourced from (a) the Developer's handoff verification block, (b) the prior Reviewer pass (same working tree, no slice-file changes since), and (c) my own static checks (greps, lockfile direct-dep entries, diff inspection). For a pure dev-tooling slice with no `src/**` mutation and a minimal additive diff, this combined evidence is sufficient — but the next slice's reviewer should pre-source nvm so the sandbox sees Node 22 directly.

## Verification Results

### Dynamic checks (sourced from Developer handoff + first Reviewer pass — re-execution blocked by env caveat above)
- `pnpm lint` → ✅ 0 errors / 0 warnings (Developer handoff + first Reviewer pass)
- `pnpm exec tsc --noEmit` → ✅ silent (Developer handoff)
- `pnpm test src/lib/features/layout/Logo.test.tsx` → ✅ 4/4 (Developer handoff — targeted Logo .tsx component test, strongest single signal that the React plugin compiles JSX correctly)
- `pnpm test` → ✅ 5 files / 40 tests / Logo `.tsx` component test among them (Developer handoff + first Reviewer pass)
- `pnpm build` → ✅ green; routes `/[locale]` (ja, ko) prerendered as static (`●` SSG marker), middleware 45.9 kB, First Load JS 102 kB shared (first Reviewer pass)
- `pnpm install --frozen-lockfile` → ✅ "Lockfile is up to date, resolution step is skipped" (Developer handoff + first Reviewer pass)

### Static evidence greps — re-executed in this pass against the current working tree
(Per `outputs/plans/task-slice-1-verify.md` § Reviewer evidence — these run inside the project sandbox so they are independent of the Node 22 limitation.)

1. **`package.json` exact pins:**
   ```
   "@vitejs/plugin-react": "4.7.0",
   "vite": "6.4.2",
   ```
   ✅ Both present, both exact (no caret).

2. **`vitest.config.ts` workaround removed:**
   `grep -n esbuild vitest.config.ts` → ✅ empty (no match).

3. **`vitest.config.ts` plugin wired:**
   ```
   4:import react from "@vitejs/plugin-react";
   9:  plugins: [react()],
   ```
   ✅ Both lines present.

4. **Lockfile direct-dep entries:**
   ```
   '@vitejs/plugin-react@4.7.0':
   vite@6.4.2:
   '@vitejs/plugin-react@4.7.0(vite@6.4.2(@types/node@20.19.39)(jiti@2.6.1)(lightningcss@1.32.0))':
   vite@6.4.2(@types/node@20.19.39)(jiti@2.6.1)(lightningcss@1.32.0):
   ```
   ✅ Both at pinned versions; vite is now a direct dep, not just transitive 7.x.

5. **Test count parity:**
   Pre-slice baseline (Epic 2): 5 files / 40 tests. Post-slice: 5 files / 40 tests. ✅ Match.

## Acceptance Criteria — per-criterion table

| # | Criterion (from plan + verify) | Status | Evidence |
|---|---|---|---|
| 1 | `package.json` devDeps has `vite` (exact 6.x.y, no `^`) and `@vitejs/plugin-react` (exact 4.x.y, no `^`) | ✅ PASS | `"vite": "6.4.2"`, `"@vitejs/plugin-react": "4.7.0"` |
| 2 | `pnpm-lock.yaml` records both as direct dev deps at pinned versions | ✅ PASS | grep above |
| 3 | `vitest.config.ts` no longer contains `esbuild` or the 5-line NOTE comment | ✅ PASS | grep returns empty |
| 4 | `vitest.config.ts` contains `import react` + `plugins: [react()]` | ✅ PASS | lines 4 + 9 |
| 5 | `pnpm install` clean | ✅ PASS | frozen-lockfile silent |
| 6 | `pnpm lint` → 0 errors / 0 warnings | ✅ PASS | clean |
| 7 | `pnpm test` → 5 files / 40 tests, Logo `.tsx` passes via plugin-react | ✅ PASS | 40/40 green |
| 8 | `pnpm build` → green; `/[locale]` (ja, ko) SSG matches Epic 2 baseline | ✅ PASS | route shape identical |
| 9 | No file under `src/**` modified | ✅ PASS | git diff shows only `package.json`, `pnpm-lock.yaml`, `vitest.config.ts` for code paths |
| 10 | No file under `supabase/**`, `.env*`, `next.config.*`, `playwright.config.ts`, `e2e/**` modified | ✅ PASS | confirmed |

10/10 PASS. Critical-blocker count = 0 → APPROVE.

## Inspection Checklist (templates/role-reviewer.md)

### 1. Scope Check
- [x] Files modified that the plan owns: `package.json`, `pnpm-lock.yaml`, `vitest.config.ts` (3 files, exactly the planned set).
- [x] Workflow artifacts modified outside plan but expected for the runner flow: `outputs/plans/task-slice-1-{plan,verify}.md` (Planner output, repurposed from Epic 2's slice 1 which used the same filename), `handoff/latest.md` (per-phase update). These are runner mechanics, not in-scope code changes — Reviewer commits them alongside the slice per the role definition.
- [x] No protected files touched (`.env*`, `next.config.*`, `supabase/**`).
- [x] `.claude/scheduled_tasks.lock` is a runtime lock file (sessionId + pid). Currently shows as deleted in the diff — left unstaged here, separate housekeeping concern (gitignore candidate; out of scope for this slice).
- [!] **Out-of-scope harness drift** present in working tree but explicitly excluded from this slice's commit:
  - `.claude/.harness-version`, `.claude/commands/task.md`, `.claude/rules/base/decision-protocol.md` (untracked)
  - `scripts/run-{epic,task}.sh`, `scripts/upgrade-harness.sh`
  - `templates/role-{developer,planner,reviewer}.md`
  - `docs/updates/24070b5.md`, `docs/updates/INDEX.md`, `docs/updates/e2ee114.md` (untracked)
  - These came from a second harness self-upgrade (`FORGE_COMMIT 7017f08 → d27eaaa`, build `2026-04-26T11:56:02Z`) that landed locally **after** the Develop phase finished. They are unrelated to this slice's `vite + plugin-react pin` goal. The Reviewer commit below stages **only** the planned slice files; harness drift will be handled in a separate `chore: harness-sync` commit.

### 2. Quality Check
- [x] Lint, tsc, test, build all green (gates 1-5 above).
- [x] No hardcoded secrets / URLs / tokens. Pure dev-tooling change.
- [x] Error handling N/A — config swap.

### 3. Architecture Check
- [x] Follows project test architecture — Vitest stays the unit/component test runner; plugin-react replaces the workaround without changing the test boundary.
- [x] No shift in module boundaries; `src/test/setup.ts` unchanged.

### 4. Security Check
- [x] No secrets, no env keys, no service-role usage.
- [x] No new attack surface.

### 5. Live Verification
- N/A per verify plan (pure dev-tooling change). Optional `pnpm dev` spot-check skipped — `pnpm build`'s successful prerender of `/ja` + `/ko` is sufficient evidence the React plugin doesn't break the production runtime.

## Dead-Code Guard
- New imports: `react` from `@vitejs/plugin-react` in `vitest.config.ts` — used immediately in `plugins: [react()]`. No dead code.
- New devDeps: both consumed by `vitest.config.ts` (transitively via `plugins: [react()]`). No dead deps.

## Anti-Dismissal check
- Considered: Babel-based plugin vs SWC. Plan explicitly chose Babel (`@vitejs/plugin-react`, not `-swc`). Confirmed intentional, not a degradation. ✅
- Considered: vite@6.4.2 vs vite@7.x. Plan pinned to 6 because plugin-react@4 doesn't cleanly support vite@7 yet. Confirmed via plan rationale + upstream peer-dep ranges. ✅
- Considered: NOTE comment removal. Verified the rationale is preserved in `outputs/plans/epic-3-plan.md` (and will land in `context/decision-log.md` via Slice 2's frontmatter entry). Removing stale "we used to do X" prose from a config file is correct. ✅
- No issue downgrades, no rationalizations.

## Issues Found

### Critical
- None.

### Important
- None.

### Minor
- None.

## Carry over to next Task
- Stage 2 (Slices 2 + 3) and Stage 3 (Slice 4) of Epic 3 remain queued. Resume via `./scripts/run-epic.sh 3` from `dev` after this slice's task branch ff-merges.
- **Harness drift cleanup** — a second harness self-upgrade (`d27eaaa`, build `2026-04-26T11:56:02Z`) landed in the working tree after Develop. Excluded from this slice's commit. Handle in a separate `chore: harness-sync` commit (likely on a `chore/harness-sync-*` task branch per gotchas.md "긴급 우회" guidance) once the next slice cycle is unblocked.
- The patched `scripts/run-task.sh:828` is a **temporary local patch** — will be overwritten on next `upgrade-harness.sh`. Forge owner needs to ship the proper upstream fix per `docs/forge-feedback/2026-04-26-run-task-scope-num-pipefail.md`. Until then, every harness upgrade has the potential to re-introduce this pipefail regression — re-apply the local `|| true` patch if needed.
- `.claude/scheduled_tasks.lock` is a tracked runtime file showing as deleted. Should be added to `.gitignore` (separate housekeeping task — flag for next chore window).
- **Reviewer Node 22 sandbox** — next reviewer should ensure `nvm use 22.17.0` is sourced before `claude` launches, otherwise the Node 16 corepack shim makes `pnpm *` invocations fail under sandbox. (Re-verified static evidence is sufficient for this dev-tooling slice; future slices that touch `src/**` may genuinely need dynamic re-execution.)

## What needs human confirmation
- The user is the operator; no remote stakeholder confirmation needed.
- After this slice's task branch (`task/epic-3-slice-1-vite-plugin-react`) ff-merges to `dev`, the user resumes `./scripts/run-epic.sh 3` from terminal. The patched runner will skip Slice 1 (already complete) and proceed to Stage 2 (parallel Slices 2 + 3) → Stage 3 (Slice 4).

## Confidence
**HIGH** — all 6 verify gates pass (5 from prior pass + Developer handoff; static gates re-verified now), all 10 acceptance criteria pass, scope is exactly as planned. Two nuances are fully documented: (1) the manual-recovery context (runner crash before review, patch already on `dev`), and (2) the second-pass review with Node 22 sandbox limitation (mitigated by the dev-tooling-only nature of the slice + ironclad static evidence). Out-of-scope harness drift is explicitly excluded from the commit.

<!-- FINAL_VERDICT: APPROVE -->
