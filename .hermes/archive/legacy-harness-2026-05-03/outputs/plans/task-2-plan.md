# Work Plan

## Task
Task 2 (Epic 1 / Stage 2 / Slice 2) — Tailwind v4 + `--hb-*` token layer

## Goal
Establish the project's design-system token layer so every color, radius, shadow, and font in `src/` flows through `--hb-*` CSS variables that Tailwind v4 utilities (`bg-brand`, `rounded-md`, `shadow-card`, `font-sans`, `font-mono`) resolve from. After this slice no UI code carries raw palette literals or hardcoded radii — locking in the spec design-system contract before any product UI work begins. Also drop the `nextscaffold/` artefacts carried over from Slice 1.

## Context
- Stage: Stage 2 of Epic 1 (parallel-eligible — but executed first in our serialised rollout).
- Related plan files: `outputs/plans/epic-1-plan.md` (Slice 2 spec), `outputs/plans/task-1-plan.md` (Slice 1 baseline).
- Related rules: `.claude/rules/local/frontend-honbabseoul.md` (token policy), `.claude/rules/local/gotchas-honbabseoul.md` (design-token gotchas).
- Decision-log entries (2026-04-25): tech-stack version lock; **new entry today** "Tailwind v4 token wiring mechanism (CSS @theme vs tailwind.config.ts)" — Chosen = CSS-first `@theme inline`.
- Carry-overs from Slice 1 Reviewer (must land in this slice):
  1. Remove `nextscaffold/` directory (Reviewer's `rm -rf` was blocked by session permission policy; Developer retries with current sandbox).
  2. Drop the four `nextscaffold` exclude entries: `tsconfig.json:28`, `eslint.config.mjs:21`, `.prettierignore:23-24`, `.gitignore:56-57`.
- Dependencies: Slice 1 ✅ committed at `e1c6308`.
- Slice 1 carry-over deferred (NOT in this slice): logo SVG (Slice 3 territory); Supabase keys (Epic 2); Naver Maps client ID (Epic 3); shadcn/ui decision (post-Epic-1); `!.env.local.example` negation in `.gitignore` (optional polish — defer).

## Pre-Start Greps Reflected
- `bg-(red|blue|...)` / `#[0-9a-f]{3,6}` / `rounded-\[` / `shadow-\[` in `src/` → only matches are scaffold artefacts in `src/app/globals.css` (`#ffffff`, `#171717`, `#0a0a0a`, `#ededed`). All four are inside the file this slice rewrites. **Result:** zero literal hex left in `src/` after this slice.
- `nextscaffold` across config/ignore files → 4 hits enumerated above. **Result:** all 4 dropped in this slice.
- New public symbols introduced: `--hb-*` tokens (consumed by Tailwind via `@theme inline`); no new TS exports yet (primitives layer arrives in Stage 3+ of later epics).

## Approach
1. **Cleanup carry-over (no functional change):**
   - Delete `nextscaffold/` directory at the project root.
   - Edit `tsconfig.json` → drop `"nextscaffold"` from `exclude`, leaving `["node_modules"]`.
   - Edit `eslint.config.mjs` → drop `"nextscaffold/**"` from the `ignores` array.
   - Edit `.prettierignore` → drop the `# Temp scaffold directory…` comment block + `nextscaffold/` line (last 2 lines).
   - Edit `.gitignore` → drop the `# Temp scaffold directory…` comment block + `nextscaffold/` line (last 3 lines).
2. **Token file:** Create `src/styles/tokens.css` with one `:root { … }` block defining:
   - **Color:** `--hb-bg`, `--hb-text`, `--hb-text-invert`, `--hb-brand` (`#5e6ad2` Linear-purple), `--hb-brand-hover` (slightly darker), `--hb-success`, `--hb-danger`.
   - **Radius:** `--hb-radius-sm` (4px), `--hb-radius-md` (8px), `--hb-radius-lg` (16px).
   - **Shadow:** `--hb-shadow-card` (subtle 1px, 3px-blur, low-alpha — Linear/Notion-like).
   - **Typography:** `--hb-font-sans`, `--hb-font-mono` (each composes the existing `--font-geist-sans` / `--font-geist-mono` set by `next/font` in `layout.tsx`, with system-font fallbacks).
   - Each line a single declaration; comment groups by category.
3. **Wire Tailwind v4 utilities:** Rewrite `src/app/globals.css` to:
   - Top-of-file `@import "tailwindcss";` (already present).
   - New `@import "../styles/tokens.css";`.
   - Replace the existing `@theme inline { … }` body with a v4 alias map:
     - `--color-bg`, `--color-text`, `--color-text-invert`, `--color-brand`, `--color-brand-hover`, `--color-success`, `--color-danger` → `var(--hb-…)`.
     - `--radius-sm/md/lg` → `var(--hb-radius-…)`.
     - `--shadow-card` → `var(--hb-shadow-card)`.
     - `--font-sans`, `--font-mono` → `var(--hb-font-…)`.
   - `body { background: var(--hb-bg); color: var(--hb-text); font-family: var(--hb-font-sans); }`.
   - **Drop** the scaffold's `--background`/`--foreground` light-dark literals and the `prefers-color-scheme: dark` media block — dark/alt themes will arrive via `[data-theme="…"]` overrides per the frontend rule, not via `prefers-color-scheme`.
4. **Do NOT touch:**
   - `src/app/page.tsx` (epic plan: "Do not modify Slice 1's `src/app/page.tsx`").
   - `src/app/layout.tsx` (still owns `next/font` `--font-geist-*` setup; tokens compose those via fallback).
   - `package.json` / `pnpm-lock.yaml` (no new deps).
   - `tailwind.config.ts` — **deliberately not created** (v4 idiom; see decision-log).
   - `postcss.config.mjs` — already correct (`@tailwindcss/postcss`).
   - All harness directories.
5. **Verify** per `outputs/plans/task-2-verify.md` (lint, types, prettier, build, build-output CSS contains `--hb-brand:#5e6ad2`, dev server boot — CSS inspection compensates for any blocked HTTP probing).

## Scope
### Files to modify
- `src/app/globals.css` — rewrite (rolls up tokens import + `@theme inline` map + body defaults).
- `tsconfig.json` — drop `"nextscaffold"` from `exclude`.
- `eslint.config.mjs` — drop `"nextscaffold/**"` from `ignores`.
- `.prettierignore` — drop `nextscaffold/` block.
- `.gitignore` — drop `nextscaffold/` block.

### Files to create
- `src/styles/tokens.css` — `--hb-*` `:root` definitions.

### Filesystem deletions
- `nextscaffold/` directory (recursive).

### Files NOT to touch
- `src/app/page.tsx`, `src/app/layout.tsx`.
- `package.json`, `pnpm-lock.yaml`.
- `next.config.ts`, `next-env.d.ts`, `postcss.config.mjs`, `.prettierrc`.
- `public/*.svg`.
- All harness directories: `.claude/`, `context/` (except the one decision-log entry already added by Planner), `docs/`, `handoff/` (planner writes the slice handoff only), `outputs/` (planner writes plan/verify only), `scripts/`, `skills/`, `templates/`, plus `CLAUDE.md`, `PlaceholderGuide.md`, `README.md`, `DRYRUN-NOTES.md`, `setup.sh`, `.harness-manifest`, `.mcp.json.example`, `.env.local`, `.env.local.example`, `.nvmrc`.

## Acceptance Criteria
- [ ] `src/styles/tokens.css` exists with all listed `--hb-*` tokens (color, radius, shadow, typography); `--hb-brand` value is `#5e6ad2`.
- [ ] `src/app/globals.css` imports `tailwindcss` then `../styles/tokens.css`, exposes the `@theme inline` alias map, and body uses `var(--hb-*)` only (no raw hex).
- [ ] `nextscaffold/` directory absent from working tree.
- [ ] All four `nextscaffold` exclude entries removed (`tsconfig.json`, `eslint.config.mjs`, `.prettierignore`, `.gitignore`).
- [ ] No raw hex literals remain in `src/` (greppable: `rg "#[0-9a-fA-F]{3,8}\b" src/` → empty).
- [ ] `pnpm lint` — 0 errors / 0 warnings.
- [ ] `pnpm exec tsc --noEmit` — silent exit.
- [ ] `pnpm exec prettier --check .` — passes.
- [ ] `pnpm build` — succeeds; static prerender of `/` still works.
- [ ] `.next/static/css/*.css` contains both `--hb-brand:#5e6ad2` AND `--color-brand:var(--hb-brand)` (proof the token + Tailwind alias landed).
- [ ] `src/app/page.tsx` and `src/app/layout.tsx` byte-identical to commit `e1c6308`.
- [ ] Harness directories byte-identical (verified via `git diff --stat e1c6308 -- :^src :^outputs :^context :^handoff :^.claude :^node_modules` returning only the expected token/cleanup lines).

## Risks & Open Questions
- **Permission policy may again block `rm -rf nextscaffold/`.** If so, the Developer reports the block in the handoff and the cleanup carries over a third time — the rest of the slice still proceeds (it is independent). Do **not** request a `--dangerouslyDisableSandbox` bypass.
- **Tailwind v4 behaviour with `@theme inline` referencing `var(--hb-*)`:** v4 docs guarantee this works; if a build error appears, fall back to non-inline `@theme { … }` (without `inline`). The difference is whether utilities embed the variable reference or its computed value at build time — both produce a working `bg-brand`.
- **`var()` font fallback chain:** `--hb-font-sans: var(--font-geist-sans, ui-sans-serif, system-ui, sans-serif);` — confirms the comma-list as the single fallback expression; if linting flags it, split into a CSS `@supports` test or accept a plain fallback (`var(--font-geist-sans, sans-serif)`).
- **`curl localhost` may stay blocked.** Verification compensates by inspecting build-output CSS (deterministic).
- **Logo SVG** is NOT in scope (epic plan owns it in Slice 3).

## Rollback Plan
Single-commit rollback via `git revert <slice-2-commit>` restores Slice 1 state (`e1c6308`). All changes are confined to:
- New file `src/styles/tokens.css` (delete on revert).
- `src/app/globals.css` (revert content).
- Four ignore-list lines (re-add).
- `nextscaffold/` directory deletion is the only filesystem action git cannot redo automatically — but it was gitignored, so `git revert` ignores it. The re-creation is unnecessary; the carry-over already concluded its purpose.

No external systems touched; no migrations; no dependency churn.
