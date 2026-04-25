# Session Handoff

## Current State (as of 2026-04-26 session close)
- **Epic 1 — DONE** (6 slices, ff-merged into dev)
- **Epic 2 — DONE** (4 slices + Slice 1 cleanup pass, ff-merged into dev)
- **Epic 3 — NOT STARTED** (sketch in `outputs/plans/roadmap.md`; first action of next session is `/plan Epic 3`)
- Branch: `dev` at `44f914c` (or whatever this session's final commit is — see `git log -1 dev`)
- Working tree: clean
- Local + remote in sync
- Live Supabase DB: `restaurants` table seeded with 20 approved rows; RLS verified (anon read approved-only, anon insert coerced to pending via trigger + WITH CHECK)

## How this session ended
Heavy session — onboarding + Epic 1 + Epic 2 + Epic 2 strict cleanup + retrospective. Two reports written for the next round:

- 📕 **`docs/forge-feedback/2026-04-26-epic2-cleanup-lessons.md`** — 4 forge fix candidates derived from the Epic 2 retrospective. Forge round 1 (3 fixes from `2026-04-25-bash3-noop-install.md`) is already merged + propagated to honbabseoul. This round 2 is **proposal only — no patches written yet**, awaiting forge owner's decision.
- 📗 **`docs/improvements/2026-04-26-priority-roadmap.md`** — honbabseoul-side improvements organised by when to land them (Epic 3 entry / pre-production / post-MVP / process). Each item has effort estimate + acceptance criterion.

The next session should read those two documents in full before deciding what to do next.

## Next session — first three actions

1. **Read** `docs/improvements/2026-04-26-priority-roadmap.md` — pick which 🟡 Epic 3 entry items (A, B, C, D) to land before launching Epic 3.
2. **Read** `docs/forge-feedback/2026-04-26-epic2-cleanup-lessons.md` — decide whether to ship round 2 of forge fixes now, defer, or reject specific patches.
3. **Decide Epic 3 launch mode** — full auto (`/epic 3` with the new forge fixes if applied) or hybrid (Option B from prior sessions, where the assistant authors slices directly).

## Critical context the next session must NOT re-derive

| Item | Where it lives |
|---|---|
| 9 design / scope decisions (locked, do NOT relitigate) | `context/decision-log.md` |
| Open questions resolved 2026-04-25 (geo fallback, price_range enum, photo limits, "혼밥 가능" OFF semantics, `is_solo_default NOT NULL`, `reason` deferred to Epic 4, Postgres major 17, Tailwind v4 `@theme inline`, Supabase `@supabase/ssr`, `import "server-only"`) | same file, dated entries |
| MVP roadmap with all 4 epics sketched | `outputs/plans/roadmap.md` |
| Spec source-of-truth | `docs/project-plan.md` |
| Epic 1 + 2 plans (executable history) | `outputs/plans/epic-1-plan.md` / `epic-2-plan.md` |
| Per-slice reviews | `outputs/reviews/task-{1..4}-review.md` (Epic 1) + `task-slice-{1..4}-review.md` (Epic 2) |
| Forge round 1 incident report + applied patches | `docs/forge-feedback/2026-04-25-*` |
| Local rules (apply every session) | `.claude/rules/local/{api,frontend,gotchas}-honbabseoul.md` |

## External state confirmed working

- `DATABASE_URL` (transaction pooler URI, password reset 2026-04-25) — psql works
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY` — REST + storage REST verified
- `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID` (`5xcs9i2c5v`) — SDK URL returns 200; URL whitelist set in NCP for `localhost:3000`, `*.vercel.app`
- Supabase Storage bucket `restaurant-photos` — exists, public, no MIME/size limit yet (deferred to roadmap item I)
- GitHub origin (`github.com/0xMegg/honbabseoul`) — `main` + `dev` branches synced, no PRs open
- Playwright chromium cache at `~/Library/Caches/ms-playwright/` (used by Pixel 7 mobile profile)

## Tooling state confirmed working

- Node `22.17.0` via `.nvmrc` + `nvm use`
- pnpm `10.33.2` via corepack
- psql `14.22` (Homebrew)
- Bash `3.2.57` (system) — forge round 1 fixed the `declare -A` incompat that this caused
- Claude CLI `2.1.118`
- All harness hooks (`pre-commit-branch-check`, `post-edit-*`) active

## Outstanding session-spanning carry-overs

- **`SUPABASE_SERVICE_ROLE_KEY` rotation** — the value visible in chat history is still live. Roadmap item E. **Required before Epic 4 ships UGC writes to a real environment.**
- **`reason` column missing from schema** — deferred to Epic 4's first slice (decision-log dated 2026-04-25). UGC submissions currently log `reason` length only, do not persist content.
- **Logo SVG** — `src/lib/features/layout/Logo.tsx` is a `<text>` placeholder rendering with system fonts. Roadmap item N. Real designer-supplied path SVG due in Epic 5 polish.

## Session metadata
- Branch flow used: dev ← task/{id} (with intermediate `epic/{ts}` for parallel runs)
- Forge version honbabseoul tracks: `4.0.0` / `7f96dd4` / built `2026-04-25T10:02:11Z`
- Forge source: `/Users/mero/Dev/13.claude/templates/harness-forge` (note: NOT `claude-code-harness-template` — that's the built output)
- Total commits on `dev`: see `git log --oneline dev | wc -l`

## Anti-patterns observed this session — do NOT repeat

1. **Editing the wrong forge** — early in this session the assistant edited `claude-code-harness-template/` (built output) instead of `harness-forge/` (source). User policy is now: assistant only touches honbabseoul + chat-driven artifacts. **Do not touch any path outside `/Users/mero/Dev/13.claude/workouts/honbabseoul/`** unless explicitly directed.
2. **Service-role / DATABASE_URL value pasted in chat** — happened twice during onboarding. Both were rotated. Future sessions: the user pastes secrets directly into `.env.local` and tells the assistant "values updated", never the literal strings.
3. **Trusting runner's "all approved" summary without spot-check** — Epic 2 runner mis-reported aggregate. Forge round 2 patch 3 addresses this; until that ships, the next session should `grep FINAL_VERDICT outputs/reviews/*.md` after every epic to verify.

---

## TL;DR for the next claude session

You're picking up after Epic 2 closed cleanly. Two retrospective reports await:
1. `docs/forge-feedback/2026-04-26-epic2-cleanup-lessons.md` (read for harness improvement decisions)
2. `docs/improvements/2026-04-26-priority-roadmap.md` (read to plan honbabseoul work)

Then the user decides the launch mode for Epic 3.

**Do not touch `harness-forge` or any other path outside this repo.** Do not paste secrets in chat. Do not bypass the protected-branch hooks (use task/{id} branches + ff-merge).
