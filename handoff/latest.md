# Session Handoff

## Current State
- Task: **Epic 1 — COMPLETE + post-cleanup done**. Dev branch ready for Epic 2 entry.
- Phase: All Epic 1 stages green; nextscaffold leftovers and `.env.local.example` gitignore robustness handled.
- Date: 2026-04-25
- Branch: `dev` (HEAD `0c7e444`, pushed to origin). `epic/20260425-133941` deleted from local + origin (fully merged into dev).

## Epic 1 — slice statuses

| Slice | What it delivered | Commit |
|---|---|---|
| Slice 1 | Next.js 15 + TS strict + ESLint flat + Prettier + 8 package.json scripts | `97afa96` |
| Slice 2 | Tailwind v4 wired to `--hb-*` token layer (`tokens.css` + `@theme inline`) | `6ba6cbf` |
| Slice 3 | next-intl 4 locale skeleton (ja default + ko, middleware redirect, messages/) | `d6ad1d0` |
| Slice 4 | Supabase factories: env / browser / server (cookies-aware) / admin (`server-only` guard) | `d6ad1d0` |
| Slice 5 | Vitest 3 + jsdom + smoke test on `requireEnv` (6 assertions) | `18c4640` |
| Slice 6 | Playwright with Pixel 7 chromium emulation + locale smoke spec (3 tests) | `1b6c774` |

## Verification at `1b6c774`
- `pnpm lint` → 0 errors / 0 warnings.
- `pnpm test` → 6 vitest tests passed.
- `pnpm exec tsc --noEmit` → silent (clean).
- `pnpm build` → `/[locale]` (ja, ko) prerendered + middleware 45.4 kB.
- `pnpm test:e2e` → 3 Playwright tests passed (locale smoke).

All Epic 1 acceptance criteria from `outputs/plans/epic-1-plan.md` met.

## Mid-epic harness sync
`eb26a22` pulled the three forge fixes (`d78bdcb` → `7f96dd4`) surgically:
- `scripts/run-epic.sh` — bash 3.2 compat (`declare -A` removed).
- `scripts/run-task.sh` — `DEVELOP_NOOP` guard (catches silent develop-phase failures).
- `templates/role-developer.md` — "Install Before Import" section merged.

[managed]-classified files we had customised (hooks, role-{planner,reviewer}.md, verify.md, commands/task.md) were intentionally NOT overwritten. See `docs/forge-feedback/2026-04-25-bash3-noop-install.md` for the original incident report and patch.

## Next Step — Epic 2 entry
**Epic 2 — Data layer & repositories** is the next chunk. Before launching:

### Pre-flight (must resolve)
1. **Migration application strategy** — pick one of:
   - α) Supabase CLI link (`supabase link --project-ref iosqakynywnrwxrexrfh`) → browser OAuth, can't be automated overnight.
   - β) `DATABASE_URL` direct-psql (recommended for unattended runs) → user fetches the connection string from Supabase Dashboard → Settings → Database → Connection string (URI), pastes into `.env.local`, slice runs `pnpm dlx supabase db push --db-url=$DATABASE_URL` or raw psql.
   - γ) Manual paste into Supabase Studio SQL Editor (one-shot, no automation).
2. **Storage bucket sanity** — anon `bucket list` returned `[]` during the onboarding smoke. Verify `restaurant-photos` actually exists + is public via service-role check, or create it.
3. **Logo SVG** — Epic 3 Stage 1 needs it; collecting now removes a future blocker.
4. **service_role key rotation** — recommended before any work that goes near a real Supabase write path. The original key was exposed in chat during onboarding.

### Recommended Epic 2 launch
- Re-confirm `outputs/plans/roadmap.md` Epic 2 sketch matches reality (decisions in `context/decision-log.md` resolved 4 open questions on 2026-04-25 — price_range enum, photo limits, geo fallback, "혼밥 가능" OFF semantics).
- Start with `/plan Epic 2` to expand the sketch into `outputs/plans/epic-2-plan.md`. Hybrid execution (Option B) remains a viable fallback if any slice's Developer phase silently fails — though the harness now has the `DEVELOP_NOOP` guard from forge `7f96dd4` which catches that mode at the source.

## Carry Over (open across multiple epics)
- Logo SVG (Epic 3 dependency).
- Supabase Storage bucket validation (Epic 4 dependency).
- service_role key rotation (pre-deployment).
- shadcn/ui adoption decision (after first two product screens).
- Component tests + compatible vite + plugin-react pair (Epic 2/3 will reintroduce).
- `brew install bash` on the user machine — defends future `/epic` parallel runs against the bash 3.2 race surface (forge fix already applied; this is belt-and-suspenders).

## Plan & Review Locations
- Roadmap: `outputs/plans/roadmap.md`
- Epic 1 plan: `outputs/plans/epic-1-plan.md`
- Decision log: `context/decision-log.md` (Epic 1 versions, open question resolutions, Tailwind v4 mechanism, Supabase ssr package, server-only enforcement)
- Forge feedback (incident report + patches): `docs/forge-feedback/2026-04-25-bash3-noop-install.md`
- Slice reviews from overnight runs: `outputs/reviews/task-{1..4}-review.md`
- Slices 3-6 hybrid completions: documented inline in their commits.

## Post-task activities
- 2026-04-25 — Slice 5 + Slice 6 hybrid completion (Vitest + Playwright). Epic ff-merged into newly created `dev` branch (commit `2ec7e42`), pushed to origin.
- 2026-04-25 — Post-Epic-1 cleanup (`0c7e444`): dropped 4 dead `nextscaffold` exclude entries, added `!.env.local.example` negation to .gitignore. Verification: lint/test/tsc/build all green.
- 2026-04-25 — `epic/20260425-133941` deleted from local and origin (fully merged into dev). Final branches: `main` (stable), `dev` (Epic 1 result + cleanup).

---

# (Legacy section below — Slice 1 review notes from the overnight run, kept for traceability.)

## Current State
- Task: Task 1 (Epic 1 / Stage 1 / Slice 1) — Next.js 15 + TypeScript + lint/format baseline + all package.json scripts
- Phase: Review → APPROVE
- Date: 2026-04-25

## Last Action
Reviewer ran the full verification plan (`outputs/plans/task-1-verify.md` steps 1–13 plus live dev-server boot). All automated checks green; harness preservation diff empty; build prerenders the placeholder route; dev server boots in 1.2s. Reviewer attempted to delete the temp `nextscaffold/` directory; the destructive action was denied by the session permission policy, so the temp dir remains in the working tree (gitignored — does NOT enter the commit). Cleanup is carried over for the next session to run manually.
- Verdict: APPROVE
- Commit: `e1c6308` on `epic/20260425-133941` (pushed to origin)

## Files Changed
### New (committed by Reviewer)
- `package.json`, `pnpm-lock.yaml` — Next 15.5.15 + React 19 + Tailwind v4 + ESLint 9 + Prettier 3; 8 canonical scripts in spec order.
- `tsconfig.json` — scaffold default + `strict: true` + `noUncheckedIndexedAccess: true` + `forceConsistentCasingInFileNames: true`.
- `next.config.ts`, `next-env.d.ts`, `postcss.config.mjs` — scaffold defaults.
- `eslint.config.mjs` — flat config (ESLint v9). Slices 2–8 should extend via `compat.extends()`, NOT a `.eslintrc.json`.
- `.prettierrc`, `.prettierignore` — project formatting + harness directories excluded.
- `.gitignore` — scaffold defaults + harness-required entries appended.
- `src/app/layout.tsx`, `src/app/globals.css` — scaffold defaults (Slice 2 will rewrite globals.css for `--hb-*` tokens; Slice 3 will move layout under `[locale]/`).
- `src/app/page.tsx` — "honbabseoul — coming soon" placeholder.
- `public/{file,globe,next,vercel,window}.svg` — scaffold default assets.
- `outputs/plans/task-1-plan.md`, `outputs/plans/task-1-verify.md` — Planner artifacts.
- `outputs/archive/handoff-2026-04-25-task0-bootstrap.md` — Planner archived previous handoff.
- `outputs/reviews/task-1-review.md` — this review.
- `outputs/evaluations/task-1-eval.md` — task evaluation.

### NOT removed (cleanup deferred — `rm -rf` blocked)
- `nextscaffold/` — temp directory created when `create-next-app` refused a non-empty target. Files were promoted to project root by the Developer; the temp dir is gitignored so it does NOT enter the commit. Reviewer's `rm -rf nextscaffold` was denied by session permission policy. **Action for next session:** the user should manually `rm -rf nextscaffold` and then drop the four `nextscaffold` exclude entries from `tsconfig.json`, `eslint.config.mjs`, `.prettierignore`, and `.gitignore`.

### Untouched (verified empty diff vs `4c514e4`)
- `CLAUDE.md`, `PlaceholderGuide.md`, `README.md`, `DRYRUN-NOTES.md`, `setup.sh`, `.harness-manifest`, `.mcp.json.example`, `.env.local.example`, `.nvmrc`
- Whole directories: `.claude/`, `context/`, `docs/`, `outputs/plans/roadmap.md`, `outputs/plans/epic-1-plan.md`, `scripts/`, `skills/`, `templates/`

## Verification Status
- Lint: PASS (`pnpm lint` — 0 errors / 0 warnings; deprecation notice is informational)
- Type check: PASS (`pnpm exec tsc --noEmit` — silent exit)
- Format: PASS (`pnpm exec prettier --check .`)
- Build: PASS (`pnpm build` — `/` prerendered as static, 4/4 pages)
- Test: N/A (Vitest installed in Slice 5)
- Live: PARTIAL — dev server boots in 1.2s on :3010, but `curl`/`node http` was blocked by session permission policy. Compensated by the build's static prerender of `/` plus direct read of `src/app/page.tsx`.

## Issues Found
- Critical: none
- Important: none
- Minor:
  1. `.gitignore` line 34 is `.env*` (broader than `.env*.local`). Pre-existing tracked `.env.local.example` is unaffected, but a `!.env.local.example` negation would be more robust on fresh re-adds.
  2. Four `nextscaffold` exclude entries remain in `tsconfig.json`, `eslint.config.mjs`, `.prettierignore`, `.gitignore`. Now dead-but-harmless after the dir removal. Slice 2 should drop them.
  3. `next lint` deprecation notice (Next 16 will remove it). Out of scope; track for the Next.js bump.

## Next Step
1. Manually `rm -rf nextscaffold` (Reviewer's attempt was blocked by session permission policy).
2. Slice 2 (Tailwind config + `--hb-*` token layer + bilingual logo SVG). When Slice 2 edits `tailwind.config.ts`/`globals.css`/`eslint.config.mjs`, drop the four `nextscaffold` exclude entries listed above.

## Carry Over
- Manually delete `nextscaffold/` (next session, after permission allowance).
- Drop `nextscaffold` exclude entries from `tsconfig.json`, `eslint.config.mjs`, `.prettierignore`, `.gitignore` once the dir is gone.
- Optional: add `!.env.local.example` to `.gitignore` for fresh-clone robustness.
- Logo SVG (`혼밥서울 / ホンバプソウル`) — needed by Slice 3 onward.
- Supabase project + service-role key — blocks Epic 2.
- Naver Maps client ID — blocks Epic 3.
- shadcn/ui adoption decision — deferred until first two screens exist.
- Live HTTP probing during review is currently blocked by session permission policy — Reviewer relied on build prerender + dev-server boot. If future slices add API routes, sandbox needs a `curl localhost` allowance.

## Plan & Review Locations
- Plan: outputs/plans/task-1-plan.md
- Verify: outputs/plans/task-1-verify.md
- Review: outputs/reviews/task-1-review.md
- Evaluation: outputs/evaluations/task-1-eval.md

## Post-task activities
- 2026-04-25 — Pushed `epic/20260425-133941` to `origin` (commit `e1c6308`). PR creation deferred to user (`gh pr create --base dev --head epic/20260425-133941`).

## Stage 1 Results (parallel)
