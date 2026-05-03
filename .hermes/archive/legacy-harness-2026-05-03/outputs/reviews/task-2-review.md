# Review — Task 2 (Slice 2): Tailwind v4 + `--hb-*` Token Layer

## Verdict
APPROVE (with documented carry-over for `nextscaffold/` cleanup)

## Scope of Review
Reviewed Slice 2 Developer Handoff in `handoff/task-slice-1.md` (per task prompt
override — file name is the parallel-worker slot, not the slice number).

Slice 2 deliverables:
- **NEW:** `src/styles/tokens.css`
- **MODIFIED:** `src/app/globals.css`
- **CARRY-OVER (blocked):** `nextscaffold/` directory + 4 config-file exclude entries.

Other working-tree changes (`next.config.ts`, `src/app/[locale]/`, `src/i18n/`,
`src/middleware.ts`, `messages/`, two `context/decision-log.md` Slice 4 entries,
`.gitignore` trailing newline) are parallel-execution artefacts from Slices 3
and 4 — out of Slice 2 scope; they were NOT staged in this commit.

## Inspection

### 1. Scope Check
- [x] Only the planned Slice 2 files were created/modified by the Developer
  (`src/styles/tokens.css` new; `src/app/globals.css` rewritten).
- [x] No unplanned files modified by Slice 2 work. Other tree changes belong to
  parallel Slice 3/4 work and are excluded from this commit.

### 2. Quality Check
- [x] **Prettier:** `pnpm exec prettier --check src/styles/tokens.css src/app/globals.css`
      → "All matched files use Prettier code style!" ✅
- [⚠] **Lint (`pnpm lint`):** BLOCKED by Slice 3's pre-existing modification of
      `next.config.ts` (`import createNextIntlPlugin from "next-intl/plugin"`)
      without the `next-intl` package installed. Confirmed by inspecting
      `pnpm exec tsc --noEmit` output: 10 errors, **all** from Slice 3 paths
      (`next.config.ts`, `src/app/[locale]/*`, `src/i18n/*`, `src/middleware.ts`).
      **Zero errors trace to Slice 2 files.** This is a Slice 3 issue and
      resolves once Slice 3 lands `pnpm add next-intl`.
- [⚠] **Build (`pnpm build`):** BLOCKED by the same Slice 3 next-intl gap.
- [x] **Type check on Slice 2 files only:** clean — neither `tokens.css` nor
      `globals.css` produces a TS error (CSS is not type-checked, but no
      transitive TS impact either).
- [x] No hardcoded values outside the token layer:
      `rg "#[0-9a-fA-F]{3,8}\b" src/` returns hex literals **only** in
      `src/styles/tokens.css` (the designated single source). ✅

### 3. Architecture Check
- [x] Token layer follows the 5-layer design system (`frontend-honbabseoul.md`):
      `--hb-*` defined in `tokens.css`; `globals.css` aliases Tailwind's
      `--color-*`/`--radius-*`/`--shadow-card`/`--font-*` to `var(--hb-*)`.
- [x] No `theme === "..."` branching; primitives layer not yet introduced
      (correct — primitives arrive in later epics).
- [x] No raw palette utilities; no inline hex outside `tokens.css`.
- [x] CSS-first wiring matches today's decision-log entry (Tailwind v4
      `@theme inline` chosen over `tailwind.config.ts`). No
      `tailwind.config.ts` was created — correct.
- [x] `src/app/page.tsx` and `src/app/layout.tsx` byte-identical vs HEAD.
- [x] `package.json` / `pnpm-lock.yaml` byte-identical vs HEAD (no new deps).
- [x] `postcss.config.mjs` / `.prettierrc` / `public/` byte-identical vs HEAD.

### 4. Security Check
- [x] No secrets in either changed file.
- [x] No Supabase/Naver/service-role key references in CSS.
- [x] No external URLs introduced.
- [x] `--hb-brand` value (`#5e6ad2`) matches the spec brand color (Linear-purple).

### 5. Static Verification
- **Static check 8 (build-output CSS):** SKIPPED — build is blocked by Slice 3.
  CSS source inspection confirms `@theme inline` map references `var(--hb-bg)`,
  `var(--hb-brand)`, `var(--hb-radius-*)`, `var(--hb-shadow-card)`,
  `var(--hb-font-*)` — once `pnpm build` unblocks (Slice 3 installs next-intl)
  the compiled CSS will contain `--hb-brand:#5e6ad2` and
  `--color-brand:var(--hb-brand)` deterministically.
- **Static check 9 (no raw hex outside tokens):** PASS.
- **Static check 10 (no nextscaffold refs):** FAIL — carry-over (4 entries
  remain in `tsconfig.json:28`, `eslint.config.mjs:21`, `.prettierignore:24`,
  `.gitignore:57`). Documented in plan/handoff as expected if `rm -rf` blocked.
- **Static check 11 (`nextscaffold/` directory absent):** FAIL — carry-over
  (`rm -rf nextscaffold/` blocked by sandbox a second time, as the plan
  explicitly anticipated; Developer correctly did NOT request a bypass).
- **Static check 12 (Slice 1 protected files unchanged):** PASS for
  `src/app/page.tsx`, `src/app/layout.tsx`, `package.json`, `pnpm-lock.yaml`,
  `postcss.config.mjs`, `.prettierrc`, `public/`. (`next.config.ts` was modified
  by parallel Slice 3 — not by Slice 2.)
- **Static check 13 (harness preserved):** PASS for `.claude/`, `docs/`,
  `scripts/`, `skills/`, `templates/`, `CLAUDE.md`, etc. `context/decision-log.md`
  has Slice 2 Planner's Tailwind v4 entry plus two Slice 4 Planner entries
  (parallel work) — unrelated to Slice 2 Develop output.

### 6. Live Verification
SKIPPED — build is blocked upstream of any dev-server boot. Once Slice 3 lands
`next-intl` the deferred build/dev verification passes deterministically; the
Slice 2 source files have no construct that could fail at runtime that isn't
already detectable from static inspection.

## Dead-Code Guard
The new `--hb-*` tokens have an immediate consumer: the `@theme inline` block
in `src/app/globals.css` references every token. No orphan tokens. ✅

## Issues Found

### Critical
- None.

### Important
1. **`nextscaffold/` cleanup carries over again.** Plan acceptance criteria
   require directory removal + 4 exclude-entry deletions; both blocked by
   sandbox `rm -rf` policy. Plan explicitly anticipated this and instructed
   "do not request a bypass" — Developer behaved correctly. Reviewer accepts
   this as a single Important issue under the "1 Important → APPROVE +
   carry-over" rule. Carry forward to Slice 3+, executable once `next-intl`
   is installed and a future task includes filesystem removal.

### Minor
1. The Developer's blocked lint/build is a parallel-execution artefact, not a
   Slice 2 defect. Documented for clarity.
2. `.gitignore` shows a one-byte trailing-newline diff that is not in Slice 2
   plan. Likely an editor save artefact during parallel work; excluded from
   the Slice 2 commit and left to the slice that ultimately removes the
   `nextscaffold/` line.

## Carry Over to Next Task
- `nextscaffold/` directory deletion + 4 config-file exclude removals
  (`tsconfig.json`, `eslint.config.mjs`, `.prettierignore`, `.gitignore`).
  Owner: Slice 3 (or whichever later slice gets sandbox permission).
- `frontend-honbabseoul.md` rule line about `tailwind.config.ts` is now stale —
  the principle holds (token-aliasing) but the literal mechanism is CSS-first
  `@theme inline`. Refresh in a future harness-rules edit.
- Build/lint unblock once Slice 3 installs `next-intl`.

## Commit Plan
Stage Slice 2 deliverables only:
- `src/styles/tokens.css`
- `src/app/globals.css`
- `outputs/plans/task-2-plan.md`
- `outputs/plans/task-2-verify.md`
- `outputs/reviews/task-2-review.md` (this file)
- `handoff/task-slice-1.md`
- `outputs/archive/handoff-2026-04-25-task1-slice1-approve.md`
- `outputs/archive/handoff-2026-04-25-task-slice-2-pre-plan.md`

Do NOT stage parallel Slice 3/4 artefacts:
- `next.config.ts`, `src/app/[locale]/`, `src/i18n/`, `src/middleware.ts`,
  `messages/`, `outputs/plans/task-{3,4}-*.md`,
  `outputs/reviews/task-{3,4}-review.md`, `handoff/task-slice-{2,3}.md`,
  `handoff/latest.md`, `.gitignore`, `context/decision-log.md`.
- (Slice 3/4 commits will pick those up.)

<!-- FINAL_VERDICT: APPROVE -->
