# Verification Plan

## Task
Task 4 (Epic 1 / Stage 2 / Slice 4) — Supabase client factories + typed env

## Completion Criteria
Coordinates so both model and human see the same finish line.
- [ ] `src/lib/env.ts`, `src/lib/supabase/browser.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts` exist with the contents specified in `task-4-plan.md` Phases C–F.
- [ ] `package.json#dependencies` contains `@supabase/supabase-js`, `@supabase/ssr`, `server-only` (and the Slice 1 baseline `react`, `react-dom`, `next`).
- [ ] `pnpm install`, `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build` all exit 0.
- [ ] The build-time guard demo (Phase G step 8) was performed and the failure recorded; the scratch file `src/app/_scratch-admin-guard.tsx` is REMOVED before handoff (verify with `ls src/app/_scratch-admin-guard.tsx` returning "No such file").
- [ ] `git diff e1c6308 -- <files-not-to-touch>` returns empty (every protected file is unchanged).
- [ ] No `*.test.ts` under `src/lib/` (tests belong to Slice 5).

## Automated Checks
Run in order. Stop on first failure.
1. **Install:** `pnpm install` — must finish with no peer-dep errors. Confirms the three new deps resolve cleanly.
2. **Lint/Analyze:** `pnpm lint` — expect 0 errors / 0 warnings on the new modules.
3. **Type check:** `pnpm exec tsc --noEmit` — strict + `noUncheckedIndexedAccess` honored. Every `process.env[X]` access must be narrowed.
4. **Format check:** `pnpm exec prettier --check src/lib/env.ts src/lib/supabase/browser.ts src/lib/supabase/server.ts src/lib/supabase/admin.ts` — Developer ran `pnpm format` once; this confirms the files came back already-formatted.
5. **Targeted test (changed area):** N/A — Vitest is not installed yet (Slice 5). Skip.
6. **Full test suite:** N/A — same reason. Skip.
7. **Build (guard demo):** Recreate the scratch file `src/app/_scratch-admin-guard.tsx` exactly as specified in `task-4-plan.md` Phase G step 8, run `pnpm build`, and confirm the build FAILS with a `server-only`-related error (Next.js will say something like `You're importing a component that needs "server-only". That only works in a Server Component which is not supported in the pages/ directory.` or `'server-only' cannot be imported from a Client Component module`). **Record the exact error string** in the verification report. Then DELETE the scratch file: `rm src/app/_scratch-admin-guard.tsx`.
8. **Build (clean):** `pnpm build` — must succeed after the scratch file is gone. Expected output: 4/4 pages prerendered (same as Slice 1's baseline; Slice 4 adds no routes).
9. **E2E:** N/A — Playwright is not installed yet (Slice 6). Skip.

### Harness preservation check (mandatory — Reviewer-blocking)
10. `git diff e1c6308 -- CLAUDE.md PlaceholderGuide.md README.md DRYRUN-NOTES.md setup.sh .harness-manifest .mcp.json.example .env.local.example .nvmrc` → must return empty.
11. `git diff e1c6308 -- .claude/ docs/ outputs/plans/roadmap.md outputs/plans/epic-1-plan.md outputs/plans/task-1-plan.md outputs/plans/task-1-verify.md scripts/ skills/ templates/` → must return empty. (The Planner-added `outputs/plans/task-4-plan.md`, `outputs/plans/task-4-verify.md`, the slice-3 handoff update, and the appended `context/decision-log.md` line are EXPECTED diffs — they are NOT in this list.)
12. `git diff e1c6308 -- tsconfig.json eslint.config.mjs .prettierignore .gitignore` → must return empty. (Slice 4 must NOT touch the four files Slice 1 left dirty with `nextscaffold` references — that is Slice 2's carry-over.)
13. `git diff e1c6308 -- src/app/ src/styles/ messages/ src/i18n.ts src/middleware.ts tailwind.config.ts postcss.config.mjs` → must return empty. (None of those paths exist or are owned by Slice 4 — the diff confirms the parallel slice did not stomp another slice's territory. `src/app/_scratch-admin-guard.tsx` MUST also be absent at handoff.)

### Scratch-file absence check (mandatory)
14. `test ! -e src/app/_scratch-admin-guard.tsx && echo OK` — must print `OK`.

### Package shape checks
15. `node -e "const p = require('./package.json'); const want = ['@supabase/supabase-js','@supabase/ssr','server-only']; const got = Object.keys(p.dependencies); for (const w of want) { if (!got.includes(w)) { console.error('MISSING DEP', w); process.exit(1); } } console.log('deps OK', got);"` — must exit 0.
16. `node -e "const p = require('./package.json'); const want = ['dev','build','start','lint','format','test','test:watch','test:e2e']; const got = Object.keys(p.scripts); if (got.length !== want.length || want.some((k,i) => got[i] !== k)) { console.error('SCRIPT MISMATCH', { want, got }); process.exit(1); }"` — Slice 1's invariant; this slice did NOT change scripts.

### Server-only static guard check
17. `grep -nF 'import "server-only"' src/lib/supabase/admin.ts` — must print line 1 (the very first line of the file).
18. `grep -nF '"use client"' src/lib/supabase/` — must return no matches (`exit 1` from grep is fine; the assertion is "no client directives anywhere under `src/lib/supabase/`").

### Env-narrowing check
19. `grep -nF 'as string' src/lib/env.ts` — must return no matches (no type assertions; every narrow is via explicit branch).
20. `grep -nF 'process.env' src/lib/` — must show ONLY references inside `src/lib/env.ts`. Other modules import `publicEnv` / `getServiceRoleKey` from `@/lib/env`; they do not read `process.env` directly.

## Live Verification (UI/API tasks)
N/A — pure library/config slice. No new UI route, no new API route.

If the Reviewer wants extra confidence the import graph behaves at runtime, an OPTIONAL probe is to:
1. `pnpm dev` (background).
2. Confirm the placeholder route still renders ("honbabseoul — coming soon" at `/`) — this proves the new modules did not break the existing build/serve pipeline.
3. Kill the dev server.

This is optional; the build pass in Step 8 is sufficient evidence.

## Quality Criteria (design/creative tasks)
N/A — pure library/config slice. No visual surface.

## Constraints
- Do NOT modify tests to make them pass (no tests exist yet anyway).
- Do NOT touch protected files: every entry in `task-4-plan.md` "Files NOT to touch" list. Hard-fail the verdict if `git status --porcelain` includes any of them.
- Do NOT install `next-intl`, Tailwind tokens, Vitest, or Playwright in this slice — those belong to Slice 3 / 2 / 5 / 6 respectively.
- Do NOT add a `"use client"` directive to any file under `src/lib/supabase/`.
- Do NOT add `as` type assertions in `src/lib/env.ts` — narrow via explicit branches only.
- Do NOT commit `src/app/_scratch-admin-guard.tsx` — it is a verification-only artefact.
- Task is not complete until the build-time guard demo (Phase G) is performed AND the scratch file is removed.

## Rollback Point
- **Revert target:** branch `epic/20260425-133941` (or its parallel-slice worktree) is fully revertible to `e1c6308` via:
  ```
  git restore --staged --worktree src/lib/ package.json pnpm-lock.yaml
  git clean -fd src/lib/
  rm -f src/app/_scratch-admin-guard.tsx
  git restore context/decision-log.md  # if Planner appended a decision-log entry
  pnpm install
  ```
- **Safe to keep:** harness files (none modified by this slice; verify via the diffs in steps 10–13).

## Report
After verification, record:
- **What changed:** three new client factories under `src/lib/supabase/`, one typed-env module at `src/lib/env.ts`, three new dependencies in `package.json`, one decision-log entry in `context/decision-log.md`.
- **What passed:** install / lint / tsc / build (clean) / build (guard-error demo) / harness-preservation diffs / package-shape checks / server-only / env-narrowing greps. (All MUST pass.)
- **What failed:** record exact error output verbatim.
- **What needs human confirmation:** confirm the resolved versions of `@supabase/supabase-js`, `@supabase/ssr`, `server-only` from `pnpm-lock.yaml` (record in the handoff so Epic 2 reviewers know the floor).
- **Confidence level:** HIGH if every automated step is green AND the guard-error demo produced the expected failure AND the scratch file is gone. MEDIUM if any single check needed retry. LOW if the guard demo did NOT produce a build error (would mean the server-only import isn't doing its job — STOP and reconcile).
