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
- 2026-04-25 — Logo SVG component (`2e27e39`): `src/lib/features/layout/Logo.tsx` + 4 vitest invariants. Bilingual brand mark (혼밥서울 / ホンバプソウル), `--hb-*` token-backed `tone` prop, `viewBox="200 64"`. `vitest.config.ts` got `esbuild.jsx: 'automatic'` so component tests compile without @vitejs/plugin-react. Test count: 6 → 10 passing.
- 2026-04-25 — Epic 2 plan drafted (`87606ff`): `outputs/plans/epic-2-plan.md`. 4 slices in 2 stages, β migration path (`DATABASE_URL` direct-psql), zod for runtime validation. Awaits user pasting `DATABASE_URL` into `.env.local` before Stage 1 starts.

## Awaiting from user (Epic 2 entry blockers)
1. **`DATABASE_URL` in `.env.local`** — Supabase Dashboard → Settings → Database → Connection string → URI tab → copy whole string into `.env.local` as `DATABASE_URL=…`. After paste, just message **"DATABASE_URL 넣었어"** — do NOT paste the URL into chat (same exposure model as service_role).
2. **`psql` availability** — `which psql` in a terminal. If absent: `brew install libpq && brew link --force libpq`.

Once both are confirmed, `/epic 2` (or hybrid Option B) can launch.
