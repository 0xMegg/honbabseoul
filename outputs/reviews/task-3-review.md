# Review — Task 3 (Epic 1 / Stage 2 / Slice 3): next-intl locale skeleton

- **Date:** 2026-04-25
- **Branch:** `epic/20260425-133941`
- **HEAD at review start:** `97afa96` (Stage 1 / Slice 1 final)
- **Plan:** `outputs/plans/task-3-plan.md`
- **Verify:** `outputs/plans/task-3-verify.md`
- **Handoff (in lieu of latest):** `handoff/task-slice-2.md`
- **Verdict:** REQUEST_CHANGES

## Summary

Slice 3's Developer phase **did not complete**. The next-intl glue files
(`src/i18n/routing.ts`, `src/i18n/request.ts`, `src/middleware.ts`,
`messages/{ja,ko}.json`, `src/app/[locale]/{layout,page}.tsx`) exist on
disk and `next.config.ts` was wrapped with `createNextIntlPlugin`, but
**two mandatory steps from the plan were skipped**:

1. `pnpm add next-intl@^4` — Phase B step 4. `package.json#dependencies`
   still shows only `react`, `react-dom`, `next`. `pnpm-lock.yaml` has
   zero `next-intl` references (`grep -c next-intl pnpm-lock.yaml` → 0).
2. `git rm src/app/page.tsx` — Phase E step 13. The Slice 1 placeholder
   still exists with the `"honbabseoul — coming soon"` body.

In addition, `handoff/task-slice-2.md` still reads
`Phase: Plan → ready for Develop` — no `### Developer Handoff` section
exists, mirroring Slice 4's REQUEST_CHANGES situation
(`handoff/task-slice-3.md`).

The downstream consequence is that **every automated check the verify
plan demands fails on the same root cause** (`Cannot find module
'next-intl/...'`):

- `pnpm lint` → `MODULE_NOT_FOUND: 'next-intl/plugin'` (next config load)
- `pnpm exec tsc --noEmit` → 10 TS2307 errors across `next.config.ts`,
  `src/app/[locale]/{layout,page}.tsx`, `src/i18n/{routing,request}.ts`,
  `src/middleware.ts`.
- `pnpm build` → not run; would fail at config load with the same error.
- Live verification (`/`, `/ja`, `/ko` curl trio) → not run; dev server
  cannot start.

## Verdict Justification

Per `templates/role-reviewer.md` § "Verdict Criteria":
> 1 or more Critical issues → REQUEST_CHANGES

This slice has **3 Critical issues** (see below). REQUEST_CHANGES is the
only valid verdict, and the Reviewer commit-rules forbid commit/push
under REQUEST_CHANGES.

## Inspection Checklist

### 1. Scope Check
- [x] Files modified that the plan owns: `next.config.ts` (plugin wrap
      diff is exactly the 3-line addition specified by the plan).
- [x] Files created that the plan owns:
      `src/i18n/routing.ts`, `src/i18n/request.ts`, `src/middleware.ts`,
      `messages/ja.json`, `messages/ko.json`,
      `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx`.
- [ ] **`src/app/page.tsx` deletion missing** (plan Phase E step 13).
- [ ] **`package.json`/`pnpm-lock.yaml` not modified** (plan Phase B
      step 4 — `pnpm add next-intl@^4`).
- [x] No protected files touched: `git diff e1c6308 -- src/app/layout.tsx
      tsconfig.json eslint.config.mjs .prettierignore .prettierrc` is
      empty. (Slice 2's territory `src/app/globals.css` + `src/styles/`
      is dirty in the working tree but is not Slice 3's responsibility.)

### 2. Quality Check
- [ ] **`pnpm lint`** — FAIL. Stack trace below (Critical #1).
- [ ] **`pnpm exec tsc --noEmit`** — FAIL. 10 errors, all `Cannot find
      module 'next-intl/...'` (Critical #1 root cause).
- [ ] **`pnpm build`** — not run (would fail at config load identically).
- [ ] **`pnpm test`** / **`pnpm test:e2e`** — N/A (Vitest = Slice 5;
      Playwright = Slice 6).
- [x] No hardcoded values (only `"ja"`/`"ko"` literals are inside
      `src/i18n/routing.ts`, the single source of truth — verified by
      grep).

### 3. Architecture Check
- [x] Routing under `src/app/[locale]/...` — present.
- [x] Default locale `ja`, parallel `ko` — `routing.ts` matches.
- [x] No raw locale strings outside `routing.ts`
      (`grep -rEn '"(ja|ko)"' src/` → only `routing.ts`).
- [x] Greeting strings flow through `useTranslations("common")` /
      `t("hello")` — no inline JA/KO literals in `[locale]/page.tsx`.
- [x] `messages/ja.json` and `messages/ko.json` share the key shape
      `{ "common": { "hello": "..." } }` — verified by direct read.
- [x] Per-locale Hangul brand mark `혼밥서울` is preserved in BOTH
      message files (`혼밥서울へようこそ`, `혼밥서울에 오신 것을 환영합니다`)
      — matches the logo policy in
      `.claude/rules/local/frontend-honbabseoul.md`.
- [x] `src/app/layout.tsx` byte-identical to `e1c6308`
      (`git diff e1c6308 -- src/app/layout.tsx` → empty). The
      `<html lang="en">` carry-over is correctly deferred per plan
      Risk 3.
- [x] `src/i18n/request.ts` uses `hasLocale(routing.locales, requested)`
      to narrow the locale type — strict + `noUncheckedIndexedAccess`
      compatible (would type-check cleanly once the package resolves).
- [x] `[locale]/layout.tsx` correctly types `params: Promise<{ locale:
      string }>` (Next 15 form) and awaits before reading.
- [x] No `<html>`/`<body>` in the locale layout (root layout owns those)
      — matches plan step 10.

### 4. Security Check
- [x] No secrets, no env keys, no service-role usage in this slice.
- [x] Middleware matcher excludes `/api`, `/_next`, `/_vercel`, and
      paths with file extensions (the next-intl recommended pattern).

### 5. Live Verification (UI/API)
- [ ] **Skipped** — dev server cannot start until `next-intl` is
      installed (Critical #1). Re-attempt after the package install.

## Issues Found

### Critical

1. **`next-intl` package never installed** (plan Phase B step 4).
   `package.json#dependencies` shows only `react@19.1.0`,
   `react-dom@19.1.0`, `next@15.5.15`. `pnpm-lock.yaml` has zero
   `next-intl` references. Every consuming file —
   `next.config.ts`, `src/i18n/routing.ts`, `src/i18n/request.ts`,
   `src/middleware.ts`, `src/app/[locale]/layout.tsx`,
   `src/app/[locale]/page.tsx` — fails module resolution. **Fix:**
   `pnpm add next-intl@^4`. Verify acceptance criterion
   `package.json#dependencies` contains `"next-intl": "^4..."`.

   Captured error from `pnpm lint`:
   ```
   Error: Cannot find module 'next-intl/plugin'
   Require stack:
   - /Users/mero/Dev/13.claude/workouts/honbabseoul/next.config.compiled.js
   ...
   code: 'MODULE_NOT_FOUND'
   ```

   Captured errors from `pnpm exec tsc --noEmit` (10 total):
   ```
   next.config.ts(2,34): TS2307: Cannot find module 'next-intl/plugin'
   src/app/[locale]/layout.tsx(1,51): TS2307: Cannot find module 'next-intl'
   src/app/[locale]/layout.tsx(2,34): TS2307: Cannot find module 'next-intl/server'
   src/app/[locale]/page.tsx(1,33): TS2307: Cannot find module 'next-intl'
   src/i18n/request.ts(1,34): TS2307: Cannot find module 'next-intl/server'
   src/i18n/request.ts(2,27): TS2307: Cannot find module 'next-intl'
   src/i18n/routing.ts(1,31): TS2307: Cannot find module 'next-intl/routing'
   src/middleware.ts(1,30): TS2307: Cannot find module 'next-intl/middleware'
   src/app/[locale]/layout.tsx(7,31): TS7006: Parameter 'locale' implicitly has an 'any' type.
   src/i18n/request.ts(5,42): TS7031: Binding element 'requestLocale' implicitly has an 'any' type.
   ```
   The two `TS7006`/`TS7031` errors are downstream side-effects of the
   missing module type declarations — they will resolve once `next-intl`
   is installed.

2. **`src/app/page.tsx` not deleted** (plan Phase E step 13;
   acceptance criterion `test ! -e src/app/page.tsx`). The Slice 1
   placeholder still exists with body
   `<h1>honbabseoul — coming soon</h1>`. **Fix:** `git rm
   src/app/page.tsx`. Without this, when the next-intl middleware
   redirects `/` → `/ja`, two route candidates compete (`app/page.tsx`
   for `/` and the rewritten `/ja` route under `app/[locale]/page.tsx`),
   producing build-time conflict warnings or wrong content. The plan
   explicitly notes "the middleware now owns `/`".

3. **No `### Developer Handoff` section in `handoff/task-slice-2.md`**
   (the orchestrator-designated handoff for this slice). The Reviewer
   role's "Workflow → Start" step requires reading the Developer
   Handoff section to confirm the Developer phase ran and to record
   what was done. The handoff still reads `Phase: Plan → ready for
   Develop` (Planner state). **Fix:** Developer must append a
   `### Developer Handoff — Slice 3` section after rerunning the slice,
   capturing the resolved `next-intl` version from `pnpm-lock.yaml`,
   confirmation of `src/app/page.tsx` deletion, the `pnpm build` static
   marker (`○`) for `/ja`/`/ko`, and the live curl trio output.

### Important

(none — additional issues will surface only after the Critical blockers
are unblocked and verification can complete.)

### Minor

1. `src/app/[locale]/page.tsx` does not call `setRequestLocale(locale)`.
   Plan Risk 4 anticipates this — the layout's `setRequestLocale` is
   sufficient when the page uses `useTranslations`, but if `pnpm build`
   later shows `ƒ Dynamic` for `/[locale]` (instead of `○ Static`), the
   page must add `setRequestLocale(locale)` too. Track in the
   Developer's rerun: capture the build output's per-route marker.

2. `messages/ja.json` and `messages/ko.json` are tiny (≤ 5 lines each).
   When a future slice adds keys, ensure both files stay in lockstep —
   `useTranslations` typing at build time will surface any drift, but a
   parity test would harden it earlier. Out of scope here.

## Stage 2 Cross-Slice Observations (informational)

The orchestrator's parallel batch left the working tree carrying
fragments from all three Stage 2 slices:
- **Slice 2** (Tailwind tokens) finished its file edits
  (`src/styles/tokens.css`, `src/app/globals.css`) but reported BLOCKED
  in `handoff/task-slice-1.md` because Slice 3's incomplete next-intl
  install poisoned every shared lint/typecheck/build run.
- **Slice 3** (this slice) — REQUEST_CHANGES per above.
- **Slice 4** (Supabase) — REQUEST_CHANGES already recorded in
  `handoff/task-slice-3.md` (Developer phase did not run; no
  `src/lib/`, no `@supabase/supabase-js` install).

Two of three Stage 2 slices share the same root cause: the Developer
phase was skipped. Stage 2 cannot integrate until Slice 3 + Slice 4
Developer phases complete and Slice 2's `pnpm lint`/`pnpm build` re-run
green on the merged tree.

## Acceptance Criteria — per-criterion table

| # | Criterion (from plan) | Status | Evidence |
|---|---|---|---|
| 1 | `pnpm install` succeeds; `next-intl` in dependencies | **FAIL** | `package.json#dependencies` lists only `react`, `react-dom`, `next`. `grep -c next-intl pnpm-lock.yaml` → 0. |
| 2 | `pnpm lint` exits 0 (0 warnings) | **FAIL** | `MODULE_NOT_FOUND: 'next-intl/plugin'` |
| 3 | `pnpm exec tsc --noEmit` exits 0 | **FAIL** | 10 errors, all `next-intl` resolution |
| 4 | `pnpm build` succeeds with `/ja`+`/ko` static | **NOT RUN** | Would fail at config load |
| 5 | `pnpm dev`: `/` → 30x `/ja`; `/ja` JA greeting; `/ko` KO greeting | **NOT RUN** | Dev server cannot start |
| 6 | `src/app/page.tsx` does NOT exist | **FAIL** | File present with Slice 1 placeholder body |
| 7 | `src/app/layout.tsx` byte-identical to `e1c6308` | **PASS** | `git diff e1c6308 -- src/app/layout.tsx` empty |
| 8 | All harness files unchanged | **PASS** | No harness paths in `git status` |
| 9 | No raw `"ja"`/`"ko"` outside `routing.ts` | **PASS** | grep returns only `src/i18n/routing.ts:4-5` |
| 10 | `messages/{ja,ko}.json` same key shape | **PASS** | Both files have only `common.hello` |
| 11 | Lint passes | **FAIL** | (duplicate of #2) |
| 12 | Tests pass | **N/A** | Vitest = Slice 5 |

5 PASS / 1 N/A / 4 FAIL / 2 NOT RUN. Critical-blocker count = 3 → REQUEST_CHANGES.

## What Needs to Happen Next

The Developer rerun should be tightly scoped:

1. From the working tree as-is (do **not** discard the existing next-intl
   glue files), run `pnpm add next-intl@^4`.
2. `git rm src/app/page.tsx`.
3. Re-run the verification plan (`outputs/plans/task-3-verify.md`)
   automated checks 1-7 + harness checks 9-11 + parallel-overlap checks
   12-13 + file-existence checks 14-19 + the live `curl` trio (or its
   build-output compensation if `curl` is still session-blocked).
4. Append `### Developer Handoff — Slice 3` to `handoff/task-slice-2.md`
   capturing:
   - Resolved `next-intl` version from `pnpm-lock.yaml`.
   - Confirmation of `src/app/page.tsx` deletion (`git ls-files
     src/app/page.tsx` → empty).
   - `pnpm build` per-route marker (`○ Static` expected for
     `/[locale]`).
   - Live curl trio output (or the static-HTML compensation).
5. Re-invoke `/review` for Slice 3.

The plan and verify documents do not need any changes — they correctly
specify the work; the issue is execution, not specification.

## Files I Touched (Reviewer-only)

- **NEW:** `outputs/reviews/task-3-review.md` (this file).
- **MODIFIED:** `handoff/task-slice-2.md` (Reviewer Handoff section
  appended).
- (No code, no `package.json`, no `pnpm-lock.yaml` — REQUEST_CHANGES
  must not commit/push.)

<!-- FINAL_VERDICT: REQUEST_CHANGES -->
