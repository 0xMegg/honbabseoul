# Session Handoff

> Parallel-slice handoff: this file (`handoff/task-slice-2.md`) is the working handoff for **Slice 3 (next-intl locale skeleton)** in Stage 2's parallel batch. It is being used in lieu of `handoff/latest.md` per the orchestrator's parallel-mode contract.

## Current State
- Task: Task 3 (Epic 1 / Stage 2 / Slice 3) — next-intl locale skeleton (`/[locale]` routing, `ja` default, `ko` parallel)
- Phase: Plan → ready for Develop
- Date: 2026-04-25

## Last Action
Planner read `handoff/task-slice-2.md` (which carried Slice 1's APPROVE state through commit `e1c6308`), the Epic 1 plan (`outputs/plans/epic-1-plan.md` lines 40–46), the roadmap (lines 57–61), the decision log (next-intl v4 lock-in; `ja` default, `ko` parallel), and the project rules under `.claude/rules/local/`. Wrote `outputs/plans/task-3-plan.md` (work plan) and `outputs/plans/task-3-verify.md` (verification plan). Archived the prior contents of this handoff to `outputs/archive/handoff-2026-04-25-task-slice-2-pre-plan.md`.
- Verdict: N/A
- Commit: none

## Files Changed (none — Planner does not modify code)
- New: `outputs/plans/task-3-plan.md`, `outputs/plans/task-3-verify.md`
- New: `outputs/archive/handoff-2026-04-25-task-slice-2-pre-plan.md`
- Modified: `handoff/task-slice-2.md` (this file)

## Verification Status
- Lint: N/A — Planner does not run code.
- Test: N/A — Planner does not run code.
- Live: N/A — Planner does not run code.

## Issues Found
- Critical: none
- Important:
  1. **Epic plan omits `next.config.ts` from Slice 3's file list.** next-intl v4 requires the plugin wrap (`createNextIntlPlugin`) for the `request.ts` resolver. Plan extends Slice 3 ownership to include `next.config.ts`. Parallel-overlap audit (in plan §"Parallel-overlap audit") confirms neither Slice 2 nor Slice 4 touches `next.config.ts`, so the addition is parallel-safe.
  2. **`package.json` + `pnpm-lock.yaml` parallel-merge.** Slice 3 runs `pnpm add next-intl` and Slice 4 runs `pnpm add @supabase/supabase-js` in parallel worktrees. Merge conflict on `dependencies` and `pnpm-lock.yaml` is expected and is the orchestrator's job (semantic merge of `dependencies` keys + one `pnpm install` regenerate). Documented as Risk 1 in the plan.
- Minor:
  1. `<html lang="en">` in `src/app/layout.tsx` will be inconsistent with Japanese/Korean content — explicitly out of scope for this slice per epic-1-plan line 41. Carry over to a future Polish slice.
  2. Slice 1's `nextscaffold/` cleanup + four exclude-list deletions stay with Slice 2 (parallel sibling), not Slice 3.

## Next Step
1. Developer: read `outputs/plans/task-3-plan.md` (Approach §A–F) and execute. Run verification per `outputs/plans/task-3-verify.md`.
2. The Developer's work happens on the parallel worktree branch the orchestrator placed us on; do NOT switch branches.
3. Touch only the files listed in the plan's "Files to create / modify / delete" sections. Hard-stop if `git status` shows anything from the "Files NOT to touch" list.
4. After Develop, Reviewer runs the verify plan; merge into Stage 2 integration commit happens when all three Stage-2 slices are APPROVE'd.

## Carry Over
- `<html lang>` per-locale fix → future Polish slice (do NOT touch `src/app/layout.tsx` in this slice).
- `nextscaffold/` cleanup + 4 exclude-list deletions → Slice 2's responsibility (parallel sibling).
- Logo SVG (`혼밥서울 / ホンバプソウル`) — still pending. Slice 3 only emits a single `<h1>` greeting; the logo asset can land in Slice 2 or a later slice without blocking Slice 3.
- Supabase project + service-role key — still blocks Epic 2 (not Slice 3).
- Naver Maps client ID — still blocks Epic 3 (not Slice 3).
- Live HTTP probing (`curl localhost`) was blocked in Slice 1's session policy. Verify plan's step §1 includes a static-HTML compensation fallback if `curl` is still blocked.

## Plan & Review Locations
- Plan: outputs/plans/task-3-plan.md
- Verify: outputs/plans/task-3-verify.md
- Review: outputs/reviews/task-3-review.md (written by Reviewer 2026-04-25)
- Evaluation: outputs/evaluations/task-3-eval.md (deferred until APPROVE)

## Stage 2 Parallel Context
- Sibling slices (in flight in parallel worktrees):
  - **Slice 2** (Tailwind tokens) — handoff at `handoff/task-slice-1.md`. Owns `tailwind.config.ts`, `postcss.config.mjs`, `src/styles/tokens.css`, `src/app/globals.css`. Also picks up Slice 1's `nextscaffold/` cleanup carry-over.
  - **Slice 4** (Supabase factories) — handoff at `handoff/task-slice-3.md`. Owns `src/lib/supabase/{browser,server,admin}.ts`, `src/lib/env.ts`.
- Stage 2 boundary: Slice 2 + Slice 3 + Slice 4 must all pass before Stage 3 (Vitest, Slice 5) starts.

---

## Reviewer Handoff — Slice 3 (next-intl locale skeleton)

### Current State
- Task: Task 3 (Epic 1 / Stage 2 / Slice 3) — next-intl locale skeleton
- Phase: Review → REQUEST_CHANGES
- Date: 2026-04-25

### Last Action
Reviewer attempted to verify Slice 3 against `outputs/plans/task-3-verify.md`. The handoff file (`handoff/task-slice-2.md`) contains only the Planner Handoff — no `### Developer Handoff` section. The working tree carries the next-intl glue code (`src/i18n/{routing,request}.ts`, `src/middleware.ts`, `messages/{ja,ko}.json`, `src/app/[locale]/{layout,page}.tsx`, plus the `next.config.ts` plugin wrap), but the Developer skipped two mandatory plan steps: (a) `pnpm add next-intl@^4` (Phase B step 4) — `package.json#dependencies` still has only react/react-dom/next, `grep -c next-intl pnpm-lock.yaml` → 0; and (b) `git rm src/app/page.tsx` (Phase E step 13) — the Slice 1 placeholder is still on disk. Consequently `pnpm lint` fails with `MODULE_NOT_FOUND: 'next-intl/plugin'` and `pnpm exec tsc --noEmit` fails with 10 TS2307 errors. Build and live curl trio not run (would fail at the same root cause). Per Reviewer role's Critical Rule + Anti-Dismissal Rule, REQUEST_CHANGES is the only valid verdict.
- Verdict: REQUEST_CHANGES
- Commit: none (REQUEST_CHANGES → do NOT commit/push)

### Files Changed (Reviewer-only)
- **NEW:** `outputs/reviews/task-3-review.md` — full review with per-criterion acceptance table (5 PASS / 1 N/A / 4 FAIL / 2 NOT RUN) and captured error output from `pnpm lint` + `pnpm exec tsc --noEmit`.
- **MODIFIED:** `handoff/task-slice-2.md` — this section appended.
- (No code, no `package.json`, no `pnpm-lock.yaml`, no commits/pushes — REQUEST_CHANGES.)

### Verification Status
- Lint: **FAIL** — `Cannot find module 'next-intl/plugin'` in `next.config.compiled.js`.
- Type check: **FAIL** — 10 TS2307 errors across `next.config.ts`, `src/app/[locale]/{layout,page}.tsx`, `src/i18n/{routing,request}.ts`, `src/middleware.ts` (all `next-intl` module resolution).
- Format: not run (typecheck blocker triggered stop-on-first-failure rule).
- Build: **NOT RUN** — would fail at config load identically to lint.
- Test: N/A (Vitest = Slice 5).
- Live: **NOT RUN** — dev server cannot start until `next-intl` is installed.
- Static checks that DID pass: protected-files diff against `e1c6308` (`src/app/layout.tsx`, `tsconfig.json`, `eslint.config.mjs`, `.prettierignore`, `.prettierrc`) all empty; no raw `"ja"`/`"ko"` outside `src/i18n/routing.ts`; both message files share `common.hello` key shape; both message files preserve the fixed Hangul brand mark `혼밥서울`.

### Issues Found
- **Critical:**
  1. `next-intl` package not installed — Phase B step 4 skipped. `package.json#dependencies` and `pnpm-lock.yaml` are byte-identical to Slice 1 (`e1c6308`). Every consuming file fails module resolution.
  2. `src/app/page.tsx` not deleted — Phase E step 13 skipped. The Slice 1 placeholder (`<h1>honbabseoul — coming soon</h1>`) still owns `/`, conflicting with the middleware's planned `/` → `/ja` redirect.
  3. No `### Developer Handoff` section in `handoff/task-slice-2.md`. Reviewer cannot confirm the Developer phase ran or what the resolved `next-intl` version was. Mirrors Slice 4's REQUEST_CHANGES situation.
- **Important:** none (additional issues will surface only after the Critical blockers are unblocked and verification can complete).
- **Minor:**
  1. `src/app/[locale]/page.tsx` does not call `setRequestLocale(locale)`. Layout's call is sufficient if `pnpm build` shows `○ Static` for `/[locale]`; if it shows `ƒ` (dynamic), Risk 4 fires and the page must add the call too.

### Next Step
1. Developer reruns Slice 3 against the existing working tree (do NOT discard the existing next-intl glue files):
   - `pnpm add next-intl@^4` (Phase B step 4).
   - `git rm src/app/page.tsx` (Phase E step 13).
2. Developer re-runs `outputs/plans/task-3-verify.md` automated checks 1-7 + harness checks 9-11 + parallel-overlap checks 12-13 + file-existence checks 14-19 + the live curl trio (or build-output compensation if `curl` is session-blocked).
3. Developer appends `### Developer Handoff — Slice 3` to this file capturing: resolved `next-intl` version from `pnpm-lock.yaml`, confirmation of `src/app/page.tsx` deletion, `pnpm build` per-route marker (`○ Static` expected for `/[locale]`), and the live curl trio output (or static-HTML compensation).
4. Re-invoke `/review` for Slice 3. The plan + verify documents need no changes.

### Carry Over (forward)
- All Planner-listed carry-overs forward unchanged (Risk 3 — `<html lang>` polish slice; logo SVG; Supabase + Naver keys for later epics).
- Reviewer-added: capture resolved `next-intl` version and the `pnpm build` per-route static/dynamic marker on the rerun (resolves Risk 4 visibility).
- Stage 2 cross-slice: Slice 2 (Tailwind) reports BLOCKED in `handoff/task-slice-1.md` because the same missing `next-intl` poisons shared lint/typecheck. Slice 4 (Supabase) is also REQUEST_CHANGES per `handoff/task-slice-3.md`. Stage 2 cannot integrate until at minimum Slice 3 unblocks.

### Plan & Review Locations
- Plan: outputs/plans/task-3-plan.md
- Verify: outputs/plans/task-3-verify.md
- Review: outputs/reviews/task-3-review.md
- Evaluation: outputs/evaluations/task-3-eval.md (deferred until APPROVE)
