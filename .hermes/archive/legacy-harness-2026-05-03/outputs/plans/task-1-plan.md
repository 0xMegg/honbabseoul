# Work Plan

## Task
Task 1 (Epic 1 / Stage 1 / Slice 1) — Next.js 15 + TypeScript + lint/format baseline + all package.json scripts

## Goal
A fresh Next.js 15 (App Router, React 19, strict TypeScript) project is scaffolded into the repo root, ESLint and Prettier are configured and green, and `package.json` already declares **all 8 scripts** (`dev`, `build`, `start`, `lint`, `format`, `test`, `test:watch`, `test:e2e`) so later slices add the backing tools without ever editing `scripts.*`. The placeholder `/` page renders "coming soon" and `pnpm install && pnpm lint && pnpm build` are all green. All harness files survive untouched.

## Context
- **Related files (read-only — must NOT be modified by this task):**
  - `CLAUDE.md`, `PlaceholderGuide.md`, `README.md`, `DRYRUN-NOTES.md`, `setup.sh`, `.harness-manifest`, `.mcp.json.example`, `.env.local`, `.env.local.example`, `.nvmrc`
  - Whole directories: `.claude/`, `context/`, `docs/`, `handoff/`, `outputs/`, `scripts/`, `skills/`, `templates/`
- **Related plan / decisions:** `outputs/plans/epic-1-plan.md` (Slice 1, lines 26–30); `context/decision-log.md` (2026-04-25 — Epic 1 tech stack versions; 2026-04-25 — Scaffolding command).
- **Dependencies:** none. Node 22.17.0 is pinned by `.nvmrc`; pnpm 10 is on PATH (verified — `pnpm --version` → 10.33.2).
- **Stage:** Epic 1 / Stage 1 (sequential, owns `package.json`). Stage 2/3/4 must NOT modify `package.json#scripts` again — install backing tools via `pnpm add -D` only.

## Pre-Start Context (do not relitigate)
- **Scaffolding command** (canonical, from decision-log):
  `pnpm dlx create-next-app@15 . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack --use-pnpm`
  - `.` = scaffold into current directory.
  - `--no-turbopack` = keep bundler choice open for Epic 5.
  - `--use-pnpm` = locks pnpm in the generated lockfile.
  - This will conflict with existing `.gitignore` (and only `.gitignore` — no other product files exist yet). Strategy: **back up `.gitignore` to `/tmp/honbabseoul-gitignore.bak` before running scaffold, then merge harness-only entries back in afterwards** (see Approach §3 + §6 below).
- **Pre-Start grep for new symbol introductions:** N/A — this slice introduces no new code-level symbols; only config files and a single placeholder page.
- **Pre-Start grep for literal → token migration:** N/A — Slice 2 owns the token layer; this slice does not write any color/radius/shadow literals (the placeholder page is plain text only).
- **Pre-Start grep for shared/core change:** N/A — `package.json#scripts` is touched in this slice only; later slices touch `dependencies` / `devDependencies` only (additive `pnpm add -D`, serialized by Stage separation).

## Approach

### Phase A — Pre-flight safety
1. `git status` — confirm clean tree on `epic/20260425-133941`. If dirty, stop.
2. **Back up the existing `.gitignore` and `.env.local.example` outside the working tree:**
   `cp .gitignore /tmp/honbabseoul-gitignore.harness.bak`
   (No other product files exist yet, so this is the only conflict to manage. `.env.local`, `.env.local.example`, and `.nvmrc` are not in `create-next-app`'s output paths, but verify with `ls` afterwards.)

### Phase B — Run the scaffold
3. Execute the canonical scaffolding command:
   `pnpm dlx create-next-app@15 . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack --use-pnpm`
   - The CLI may prompt about overwriting `.gitignore` — answer "yes" (we restore harness lines after).
   - The CLI may prompt about turbopack — already disabled by flag, but if it asks again pick **No**.
   - If the CLI refuses to scaffold into a non-empty directory, re-run with `--force` (acceptable here because we have backups + git).

### Phase C — Tighten and configure
4. **`tsconfig.json`** — open the generated file and ensure these compiler options exist (add if missing, do not remove existing entries from create-next-app):
   - `"strict": true`
   - `"noUncheckedIndexedAccess": true`
   - `"forceConsistentCasingInFileNames": true`
   (create-next-app already sets `"strict": true`; the only addition we MUST make is `noUncheckedIndexedAccess`.)
5. **Prettier** — create `.prettierrc` with project-wide formatting rules:
   ```json
   {
     "semi": true,
     "singleQuote": false,
     "trailingComma": "all",
     "printWidth": 100,
     "tabWidth": 2,
     "endOfLine": "lf"
   }
   ```
   And `.prettierignore` listing build/test artifacts:
   ```
   .next
   node_modules
   pnpm-lock.yaml
   playwright-report
   test-results
   coverage
   ```
6. **`.gitignore`** — the scaffold-generated file is the new base. **Append** (idempotent, do not duplicate) the harness-required entries that survived in `/tmp/honbabseoul-gitignore.harness.bak`:
   ```
   # Per-machine Claude Code permission overrides
   .claude/settings.local.json
   # Parallel epic worktree scratch (HARVEST_PARALLEL_WORKTREE=1)
   .harvest-wt/
   # Playwright artifacts (also covered by Prettier ignore)
   playwright-report/
   test-results/
   # Vercel local config
   .vercel/
   # macOS
   .DS_Store
   *.log
   ```
   Verify the scaffold-generated entries already cover `.next/`, `node_modules/`, `.env*.local`, `.env`. If the scaffold's `.env*` block does not match `.env` and `.env.*.local` exactly, add the missing line — never delete what create-next-app produced.
7. **ESLint** — keep whatever the scaffold generated (Next 15 uses ESLint v9 flat config at `eslint.config.mjs`; **if the scaffold generates `.eslintrc.json` instead, leave that alone — do not convert formats**). Confirm `pnpm lint` passes on the bare scaffold. If `.eslintrc.json` is on the Slice 1 file list but `eslint.config.mjs` is what create-next-app actually generates, the verify step records `eslint.config.mjs` instead — see "Files to modify" below.
8. **`package.json` scripts** — open `package.json` and replace the `scripts` block with **exactly these 8 entries**, in this order:
   ```json
   "scripts": {
     "dev": "next dev",
     "build": "next build",
     "start": "next start",
     "lint": "next lint",
     "format": "prettier --write .",
     "test": "vitest run",
     "test:watch": "vitest",
     "test:e2e": "playwright test"
   }
   ```
   - `vitest` and `playwright` are not installed yet — that is intentional. The scripts are inert strings until Slice 5/6 adds the binaries. `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm format` MUST work right now because their tools are part of the scaffold + Prettier install.
   - Run `pnpm add -D prettier` so `pnpm format` resolves immediately.

### Phase D — Placeholder page
9. **`src/app/page.tsx`** — replace the create-next-app default landing with a minimal "coming soon" placeholder so `pnpm build` succeeds and the page is bilingual-neutral (Slice 3 will replace this with a `[locale]` redirect):
   ```tsx
   export default function Home() {
     return (
       <main className="flex min-h-screen items-center justify-center p-8 text-center">
         <h1 className="text-2xl font-semibold">honbabseoul — coming soon</h1>
       </main>
     );
   }
   ```
   - **No color tokens / no `--hb-*` references yet** — Slice 2 owns the token layer. Plain Tailwind utilities here are acceptable because they map to spacing / typography only (no palette).
10. **`src/app/layout.tsx`** — leave the create-next-app default in place (it imports `globals.css` and sets `lang="en"`). Slice 3 replaces this with `[locale]/layout.tsx` and removes `src/app/page.tsx` then.
11. **`next.config.ts`** — leave the scaffold default (empty config object) untouched.

### Phase E — Verify
12. Run the verification plan in `outputs/plans/task-1-verify.md`. All commands must pass before handoff.

## Scope

### Files to modify (canonical list, owned by Slice 1)
- `package.json` — created by scaffold + scripts block + `prettier` devDep
- `pnpm-lock.yaml` — created/updated by scaffold + `pnpm add -D prettier`
- `tsconfig.json` — created by scaffold + add `noUncheckedIndexedAccess: true`
- `next.config.ts` — created by scaffold (untouched)
- `eslint.config.mjs` *or* `.eslintrc.json` — whichever create-next-app@15 generates (record actual filename in handoff)
- `.prettierrc` — NEW
- `.prettierignore` — NEW
- `.gitignore` — scaffold writes it; we append harness-only entries
- `src/app/page.tsx` — replaced with "coming soon" placeholder
- `src/app/layout.tsx` — created by scaffold (untouched)
- `src/app/globals.css` — created by scaffold (untouched; Slice 2 will rewrite)
- `public/*` — scaffold default assets (untouched)

### Files NOT to touch (HARD GUARD — Reviewer rejects on violation)
- `CLAUDE.md`, `PlaceholderGuide.md`, `README.md`, `DRYRUN-NOTES.md`, `setup.sh`, `.harness-manifest`, `.mcp.json.example`, `.env.local`, `.env.local.example`, `.nvmrc`
- Directories: `.claude/`, `context/`, `docs/`, `handoff/` (Reviewer overwrites this), `outputs/`, `scripts/`, `skills/`, `templates/`
- `messages/`, `src/styles/`, `src/i18n.ts`, `src/middleware.ts`, `src/app/[locale]/**`, `src/lib/**` — owned by later slices
- `vitest.config.ts`, `playwright.config.ts`, `e2e/**`, `src/test/**` — owned by Slice 5 / Slice 6

## Acceptance Criteria
- [ ] `pnpm install` succeeds with no peer-dependency errors.
- [ ] `pnpm lint` exits 0 on the scaffolded codebase.
- [ ] `pnpm exec tsc --noEmit` exits 0 (strict + `noUncheckedIndexedAccess` honored).
- [ ] `pnpm build` produces `.next/` with no errors and emits the placeholder page route.
- [ ] `pnpm dev` serves `/` and the placeholder text "honbabseoul — coming soon" is visible.
- [ ] `pnpm format` exits 0 (Prettier finds no changes after running once — repo is already formatted).
- [ ] `package.json` declares **exactly** the 8 scripts listed in Phase C step 8, in that order.
- [ ] `tsconfig.json` contains `"strict": true` AND `"noUncheckedIndexedAccess": true`.
- [ ] `.gitignore` contains every harness-required entry (see Phase C step 6) AND every scaffold-generated entry (no regressions).
- [ ] All harness files (the "Files NOT to touch" list) are byte-identical to their state on commit `4c514e4`. Verify with `git diff 4c514e4 -- CLAUDE.md PlaceholderGuide.md README.md setup.sh .harness-manifest .mcp.json.example .env.local.example .nvmrc` returning empty.
- [ ] Lint/analyze passes (covered above).
- [ ] Tests pass — N/A (no Vitest yet; Slice 5 introduces the runner).

## Risks & Open Questions

### Risks
- **Risk 1 — `.gitignore` clobber:** create-next-app overwrites the existing `.gitignore`. Mitigation: backup to `/tmp` before scaffold, append harness lines after. Reviewer must diff-check the final file against both sources.
- **Risk 2 — ESLint config format mismatch:** Roadmap and earlier epic plan list `.eslintrc.json`, but create-next-app@15 generates `eslint.config.mjs` (flat config). Mitigation: accept whatever the tool generates; record the actual filename in the handoff. Both formats are first-class for ESLint v9.
- **Risk 3 — Tailwind v4 internals change in Slice 2:** create-next-app@15 generates Tailwind v4 with `@import "tailwindcss"` in `globals.css` and no `tailwind.config.ts` (v4 is config-less by default). Slice 2 will need to **add** a config file to wire `--hb-*` tokens. Slice 1 leaves `globals.css` and any `postcss.config.mjs` exactly as scaffolded. **Do not pre-create `tailwind.config.ts` here** — Slice 2 owns it.
- **Risk 4 — `pnpm format` failing on first run because pre-existing harness files have inconsistent line endings:** `.prettierignore` excludes nothing under `templates/`, `docs/`, `outputs/`, etc. Mitigation: `.prettierignore` MUST list all harness directories so prettier never touches them. **Updated `.prettierignore` content** (supersedes Phase C step 5):
  ```
  .next
  node_modules
  pnpm-lock.yaml
  playwright-report
  test-results
  coverage
  # Harness-owned (Slice 1 must not format these)
  .claude/
  context/
  docs/
  handoff/
  outputs/
  scripts/
  skills/
  templates/
  CLAUDE.md
  PlaceholderGuide.md
  README.md
  DRYRUN-NOTES.md
  ```
- **Risk 5 — `pnpm dlx create-next-app` network availability:** offline / npm registry hiccup will fail the scaffold mid-way. Mitigation: if it fails, re-run; if it persistently fails, abort the slice with a clear failure note (do not partially scaffold).

### Open Questions
None. The roadmap-level "Next.js version lock" question (carry-over from Task 0) is resolved by the decision-log: Next 15.

## Rollback Plan
If the scaffold goes sideways:
1. `git restore --staged --worktree .` to drop unstaged scaffold output.
2. `git clean -fd` to remove untracked files (e.g., `node_modules/`, `.next/`, scaffold-generated source files). **WARNING:** this deletes anything not committed; verify with `git clean -fdn` (dry run) first.
3. Restore the harness `.gitignore` from `/tmp/honbabseoul-gitignore.harness.bak`.
4. Branch state returns to commit `4c514e4` (`chore: pre-flight prep for Epic 1`).
No external systems are touched, no Supabase/Naver state changes, and no commits land before Reviewer APPROVE — so rollback is purely local.
