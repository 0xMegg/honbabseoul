# honbabseoul — Improvement Roadmap (2026-04-26)

> Companion to `docs/forge-feedback/2026-04-26-epic2-cleanup-lessons.md`.
> The forge feedback covers harness-side fixes (apply to all projects).
> This document covers honbabseoul-specific improvements layered onto Epic 3 / 4 / 5 entry.

---

## TL;DR
Epic 1 + Epic 2 closed cleanly (with a strict cleanup pass for Slice 1). The MVP is structurally sound but several reinforcements are due before the heavy product work in Epic 3-4 and the production push in Epic 5. Items below are sorted by **when to land them**, not by raw priority — so the next session can pick the next "Epic 3 entry" item without scanning everything.

Each row carries an effort estimate and a clear acceptance criterion.

---

## 🟡 Epic 3 entry — pre-flight before next epic

These are best done before `/epic 3` because Epic 3 introduces React components + live data and these reinforcements pay off immediately.

| # | Item | Why now | Effort | Acceptance |
|---|---|---|---|---|
| **A** | Pin `vite + @vitejs/plugin-react` to a compatible pair | Component tests are partially disabled in vitest.config.ts because plugin-react v6 + vite v7 are incompatible. Epic 3 begins shipping `.tsx` heavy code. | 30 min | `pnpm add -D vite@^6 @vitejs/plugin-react@^4 --save-exact`; remove the `esbuild.jsx: 'automatic'` workaround from `vitest.config.ts`; component tests still pass (40 → 40+) |
| **B** | Generate `src/lib/supabase/types.gen.ts` from live schema | Schema-runtime drift risk. Right now `restaurants.ts` and `submission.ts` zod schemas are hand-rolled to mirror the migration; a future schema change will silently desync. | 30 min | `pnpm dlx supabase gen types typescript --project-id iosqakynywnrwxrexrfh > src/lib/supabase/types.gen.ts`; commit the generated file; add `pnpm db:types` script that regenerates on demand; document in `decision-log.md` that hand-rolled zod schemas remain the runtime gate but the generated types backstop the static side |
| **C** | Introduce `*.int.test.ts` integration test category | Vitest currently mocks Supabase; Playwright covers UI. The "repository function actually contracts with the live RLS-enabled DB" gap is what bit Slice 1 cleanup. | ~1 hour, can ride on Epic 3 Slice 1 | Add `vitest.config.ts` `test.include` for `*.int.test.ts` running against `DATABASE_URL`; first integration test is `listApproved` actually hitting RLS and confirming pending rows are hidden |
| **D** | Add `**Affects:**` frontmatter to decision-log entries | The log already has 9 entries. Future Planners need to grep relevant decisions; current free-form makes that brittle. | 15 min | Each entry gains `**Affects:** Epic-N / Slice-X`; new template captured at top of `context/decision-log.md` |

---

## 🟢 Pre-production — before Epic 4 ships UGC writes / before any deploy

Items that protect production data and the deployment pipeline. Land before any user-facing endpoint accepts input.

| # | Item | Why | Effort | Acceptance |
|---|---|---|---|---|
| **E** | Rotate `SUPABASE_SERVICE_ROLE_KEY` | The original was visible in chat history during onboarding. Standing carry-over from the bootstrap session. | 5 min | Reset via Supabase Dashboard; new value pasted into local `.env.local` only (NOT to chat); decision-log entry confirms rotation date |
| **F** | GitHub branch protection on `main` and `dev` | Local hooks block direct commits; remote does not. Anyone with push could bypass. | 10 min | GitHub Settings → Branches → "Require pull request before merging" + "Require status checks (CI)" on both branches |
| **G** | Minimal CI workflow (`.github/workflows/ci.yml`) | Right now lint/test/build/e2e only run locally. PR review needs a green check before merge. | ~1 hour | Job runs `pnpm lint` + `pnpm exec tsc --noEmit` + `pnpm test` + `pnpm build` + `pnpm test:e2e` (with chromium cache restore) on every PR; the workflow file itself is < 80 lines |
| **H** | Vercel preview deployments | Mobile-first design needs real-device verification per PR. Manual `pnpm dev` on laptop is not equivalent. | 15 min (mostly Vercel UI) | Connect Vercel project to GitHub repo; per-PR URL `https://honbabseoul-pr-N.vercel.app` reachable on mobile |
| **I** | Storage bucket policy (`restaurant-photos`) | Slice 4 client validates MIME/size, but a determined client can bypass. Bucket-level constraints are the canonical defense. | 20 min | `restaurant-photos` bucket: `file_size_limit: 2097152` (2MB), `allowed_mime_types: ['image/jpeg','image/png']`; verify via service-role REST; document in decision-log |

---

## 🔵 Long-term / Post-MVP — after Epic 5 polish

| # | Item | Why | Effort | Notes |
|---|---|---|---|---|
| **J** | i18n literal lint (`eslint-plugin-i18next` or custom rule) | Inline 한글 / 일본어 literal in `.tsx` is a bug per `frontend-honbabseoul.md`, but currently only humans catch it. | ~2 hours | Tune the rule to allow `messages/*.json` and approved data tokens; expect false positives on first run, prune iteratively |
| **K** | Performance budget (Vercel Speed Insights + Playwright Lighthouse) | Map page (Epic 3) is the heaviest in the MVP. Without a budget, regression is silent. | ~1 hour | LCP < 2.5s on mobile, CLS < 0.1, JS bundle < 200kB gzipped on `/[locale]` |
| **L** | Error monitoring (Sentry or PostHog) | UGC submission failures are silent today. | ~1 hour | Sentry SDK installed (or PostHog with errors); sourcemaps uploaded on build; DSN in `.env.local.example` |
| **M** | Admin UI (`/[locale]/admin`) | Operator currently approves UGC via Supabase Studio. Mistake-prone (wrong row, wrong status). | ~1 day | Service-role-gated route (NOT anon); list of `pending` rows; one-click approve/reject; audit trail; Slack/Email notification optional |
| **N** | Logo: replace `<text>` SVG with path-converted SVG | Current logo renders system fonts; depends on user device fonts being installed. Path-converted SVG is locale-agnostic AND device-agnostic. | external (designer) | Receives the path SVG, drops it into `src/lib/features/layout/Logo.tsx` replacing `<text>` blocks |

---

## 🟣 Process — pick up whenever convenient

| # | Item | Why | Effort |
|---|---|---|---|
| **O** | `.github/PULL_REQUEST_TEMPLATE.md` | Reviewer checklist auto-populates each PR. | 15 min |
| **P** | `pnpm dlx changelogen` for automated CHANGELOG.md | Conventional commits are mostly used; one command turns them into a release log. | 15 min |
| **Q** | `docs/runbook.md` | Operator-facing manual: how to approve UGC, how to reset DB password, how to handle a Naver Maps key incident, how to rotate keys. Currently scattered across decision-log + handoff. | ~30 min |
| **R** | `pnpm exec tsc --noEmit` in pre-commit hook | Lint runs in post-edit hooks; type check should run too before commits land on task branches. | 10 min |

---

## Suggested sequencing

```
Pre-Epic-3 entry        : A, B, D  (90 min total)
                          C        (lands inside Epic 3 Slice 1)

Mid Epic 3              : (no improvements; focus on the epic itself)

Pre-Epic-4 entry        : E, I    (25 min)

Mid Epic 4              : F, G, H (~1.5 hours, ideally before any UGC submission can hit a real DB)

Post Epic 4 / Epic 5    : J, K, L, M (Epic 5 itself is a "polish" epic — these are its candidate slices)

Whenever                : O, P, Q, R, N (parallelisable, no blockers)
```

---

## Where to find things (next-session quick map)

| Topic | Path |
|---|---|
| This roadmap | `docs/improvements/2026-04-26-priority-roadmap.md` |
| Forge feedback (4 fix candidates for harness) | `docs/forge-feedback/2026-04-26-epic2-cleanup-lessons.md` |
| Previous forge feedback (3 fixes already merged) | `docs/forge-feedback/2026-04-25-bash3-noop-install.md` + `2026-04-25-patch.diff` |
| Decision log (locked decisions) | `context/decision-log.md` |
| Project plan / spec | `docs/project-plan.md` |
| MVP roadmap (4 epics) | `outputs/plans/roadmap.md` |
| Epic 1 plan | `outputs/plans/epic-1-plan.md` |
| Epic 2 plan | `outputs/plans/epic-2-plan.md` |
| Epic 3 plan | (not yet written — first task of next session is `/plan Epic 3`) |
| Per-slice reviews (Epic 1) | `outputs/reviews/task-{1..4}-review.md` |
| Per-slice reviews (Epic 2) | `outputs/reviews/task-slice-{1..4}-review.md` |
| Live DB reachability + RLS smoke (manual) | use `psql "$DATABASE_URL"` — `db:verify` / `db:smoke` scripts removed in cleanup |

---

## What's already healthy (don't re-improve)

- Branch hygiene: protected `main`/`dev` via local hooks, `task/{id}` flow, ff-merge model, epic branches deleted post-merge.
- Test discipline: 40 unit tests + 3 e2e all green; coverage spans env, repos, Logo, locale routing.
- Token system: `--hb-*` discipline holds; no hex literals leaked into components.
- Decision log: 9 entries, every Epic 2 deviation captured.
- i18n structure: `messages/{ja,ko}.json` + next-intl middleware solid; `Logo.tsx` correctly renders both scripts in a single SVG.
- Repository pattern: UI never imports `@supabase/supabase-js` directly.
- Server-only guard: `admin.ts` carries `import "server-only"`.
- RLS: defense-in-depth restored after cleanup; trigger + WITH CHECK both active and verified empirically.

---

## Open questions for the next session

These are items the next session's first action should resolve before doing anything else:

1. **Epic 3 plan** — `/plan Epic 3` to expand the roadmap.md sketch into `outputs/plans/epic-3-plan.md`. Or a hybrid where I draft and the user reviews.
2. **Forge feedback approval** — does the user (forge owner) want all 4 fixes from `2026-04-26-epic2-cleanup-lessons.md`, or just a subset?
3. **Scope of pre-flight** — A, B, D before Epic 3? Or skip A (pin) and use the current esbuild jsx workaround through Epic 3?
