# Verification Plan

## Task
Task 1 (Epic 1 / Stage 1 / Slice 1) — Next.js 15 + TypeScript + lint/format baseline + all package.json scripts

## Completion Criteria
Coordinates so both model and human see the same finish line.
- [ ] `pnpm install` succeeds end-to-end on a clean clone.
- [ ] `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm format` all exit 0.
- [ ] `pnpm dev` serves `/` and renders the placeholder text "honbabseoul — coming soon".
- [ ] `package.json` declares **exactly** these 8 scripts, in this order: `dev`, `build`, `start`, `lint`, `format`, `test`, `test:watch`, `test:e2e`.
- [ ] `tsconfig.json` has both `"strict": true` and `"noUncheckedIndexedAccess": true`.
- [ ] All harness files (CLAUDE.md, PlaceholderGuide.md, README.md, DRYRUN-NOTES.md, setup.sh, `.harness-manifest`, `.mcp.json.example`, `.env.local.example`, `.nvmrc`, and the `.claude/ context/ docs/ handoff/ outputs/ scripts/ skills/ templates/` directories) are byte-identical to their state on commit `4c514e4`.
- [ ] No `vitest` or `@playwright/test` install yet — `pnpm test` and `pnpm test:e2e` are deferred to Slice 5/6.

## Automated Checks
Run in order. Stop on first failure.
1. **Install:** `pnpm install` (must finish without peer-dep errors and produce a deterministic `pnpm-lock.yaml`).
2. **Lint/Analyze:** `pnpm lint` (Next.js ESLint preset on the placeholder app — expect 0 errors, 0 warnings).
3. **Type check:** `pnpm exec tsc --noEmit` (strict mode + `noUncheckedIndexedAccess` enabled).
4. **Format check:** `pnpm exec prettier --check .` (every file Prettier knows about is already formatted; harness directories excluded by `.prettierignore`).
5. **Targeted test (changed area):** N/A — Vitest is not installed in this slice. Skip.
6. **Full test suite:** N/A — same reason. Skip.
7. **Build:** `pnpm build` (Next 15 production build of the placeholder; expect a single static route `/` and no warnings about server/client boundaries).
8. **E2E:** N/A — Playwright is not installed in this slice. Skip.

### Harness preservation check (mandatory — Reviewer-blocking)
9. `git diff 4c514e4 -- CLAUDE.md PlaceholderGuide.md README.md DRYRUN-NOTES.md setup.sh .harness-manifest .mcp.json.example .env.local.example .nvmrc` → must return empty.
10. `git diff 4c514e4 -- .claude/ context/ docs/ outputs/plans/roadmap.md outputs/plans/epic-1-plan.md scripts/ skills/ templates/` → must return empty (the only `outputs/` files touched in Slice 1 are the new `task-1-plan.md`, `task-1-verify.md`, and the archived handoff in `outputs/archive/`; none of those appear in the diff against `4c514e4` because they were created after that commit).
11. `git diff 4c514e4 -- handoff/latest.md` → expected to be non-empty (Planner overwrites; Developer overwrites again; Reviewer overwrites finally).

### Package.json scripts shape check
12. `node -e "const p = require('./package.json'); const want = ['dev','build','start','lint','format','test','test:watch','test:e2e']; const got = Object.keys(p.scripts); console.log(JSON.stringify(got)); if (got.length !== want.length || want.some((k,i) => got[i] !== k)) { console.error('SCRIPT MISMATCH', { want, got }); process.exit(1); }"`
    Must print `["dev","build","start","lint","format","test","test:watch","test:e2e"]` and exit 0.

### tsconfig hardening check
13. `node -e "const t = require('./tsconfig.json'); const o = t.compilerOptions || {}; if (!o.strict) { console.error('strict missing'); process.exit(1); } if (!o.noUncheckedIndexedAccess) { console.error('noUncheckedIndexedAccess missing'); process.exit(1); }"`
    Must exit 0.

## Live Verification (UI/API tasks)
Reviewer verifies against a running app to catch runtime bugs invisible in static review.

1. **Start dev server:** `pnpm dev` (Reviewer runs with `run_in_background: true`; kills with the matching shell PID before marking done).
2. **Happy path:**
   - [ ] `curl -s http://localhost:3000/ | grep -q "honbabseoul — coming soon"` exits 0.
   - [ ] Server logs show no compilation errors and no "missing module" warnings.
3. **Edge cases:**
   - [ ] `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/nonexistent` returns `404`.
   - [ ] `curl -sI http://localhost:3000/` includes `Content-Type: text/html`.
4. **API endpoints:** N/A — no API routes in this slice.

## Quality Criteria (design/creative tasks)
N/A — pure scaffolding/config task. Visual design lands in Slice 2 (token layer) onward.

## Constraints
- Do NOT modify tests to make them pass (no tests yet anyway).
- Do NOT touch protected files: every entry in `task-1-plan.md` "Files NOT to touch" list. Hard-fail the verdict if `git status --porcelain` includes any of them.
- Do NOT install `vitest`, `@playwright/test`, `next-intl`, `@supabase/supabase-js`, or any feature-layer dep yet — those belong to later slices.
- Do NOT pre-create `tailwind.config.ts` (Slice 2 owns it) or `vitest.config.ts` / `playwright.config.ts` (Slice 5 / 6).
- Task is not complete until live verification passes.

## Rollback Point
- **Revert target:** branch `epic/20260425-133941` is fully revertible to `4c514e4` via `git restore --staged --worktree . && git clean -fd` (after dry-running `git clean -fdn`). The pre-Slice-1 commit is `4c514e4 chore: pre-flight prep for Epic 1`.
- **Safe to keep:** harness files (none of them were modified by this slice; verify via the diff in step 9–10).

## Report
After verification, record:
- **What changed:** scaffold output + 8-script `package.json` + tsconfig hardening + Prettier config + harness-preserving `.gitignore` + placeholder `src/app/page.tsx`.
- **What passed:** lint / tsc / build / prettier --check / live curl / harness-preservation diff. (All MUST pass.)
- **What failed:** record exact error output, do not paraphrase.
- **What needs human confirmation:** confirm the actual ESLint config filename (`eslint.config.mjs` vs `.eslintrc.json`) the scaffold produced — record in handoff so Slice 2/3 reviewers know what to expect.
- **Confidence level:** HIGH if every automated step is green AND the harness diff is empty AND `curl /` shows the placeholder text. MEDIUM if any single check needed retry. LOW if the scaffold required `--force`.
