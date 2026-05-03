# Session Handoff

## Current State
- Task: Harness Bootstrap (Task 0)
- Phase: Done — harness template customised for honbabseoul; testing stack confirmed (Vitest + Playwright)
- Date: 2026-04-25

## Last Action
- Restored the template from `/Users/mero/Dev/13.claude/templates/claude-code-harness-template` (prior contents had been wiped by a propagation error) and filled all project-specific placeholders based on the spec.
- Verdict: N/A (bootstrap, not a Task through the 3-role workflow)
- Commit: none (no commits yet — Reviewer has not run)

## Files Changed
- `docs/project-plan.md` — spec written verbatim, template placeholders removed
- `CLAUDE.md` — stack, commands, architecture, conventions filled for Next.js 15 + Supabase + pnpm; multi-repo comment block removed
- `context/about-me.md` — project description, tech stack, constraints (ja/ko dual locale, Naver Maps web-only, UGC approval flow, --hb-* token system)
- `templates/role-planner.md`, `role-developer.md`, `role-reviewer.md` — project name, `pnpm` commands, architecture/security checks
- `.claude/rules/local/frontend-honbabseoul.md` — design system (--hb-*), Tailwind token discipline, i18n, Naver Maps rules
- `.claude/rules/local/api-honbabseoul.md` — repository layer, Supabase key scopes, UGC pending/approved flow
- `.claude/rules/local/gotchas-honbabseoul.md` — RLS silent empties, SSR-incompatible SDK, token discipline, i18n caveats
- `.claude/hooks/post-edit-check.sh` — BLOCK service-role key, `createClient(...service_role)`, `nmap://`; WARN console.log, TODO, supabase-js direct import, raw Tailwind palette utilities
- `.claude/hooks/post-edit-test.sh` — enabled for Vitest co-location (SRC_DIR=src, TEST_DIR=src, TEST_CMD=`pnpm test`); test-file detection switched from directory-based to extension-based (`*.test|spec.*`); Playwright E2E specs under `e2e/` are explicitly skipped (they need a dev server)
- `outputs/plans/roadmap.md` — NEW 4-epic MVP roadmap with slice-level decomposition; Planner uses this as the source for per-epic plans
- `scripts/run-epics.sh` — NEW batch runner that chains `scripts/run-epic.sh` for epics 1→2→3→4; stops on first failure, writes `/tmp/honbabseoul-run/epics-batch-status`, supports `--from N` and `--dry-run`
- `.claude/commands/epics.md` — NEW `/epics` slash command (sonnet model) that launches the batch in background + CronCreate progress monitor every ~45s
- `.claude/settings.json` — extended `permissions.allow` with the batch-run patterns (scripts, pnpm, extra git subcommands, `/tmp/honbabseoul-run/` reads). Manifest marks this file as `[seed]`, so it is project-owned and survives harness upgrades.
- `.gitignore` — added `.claude/settings.local.json`, `.env`, `.env.local`, `.env.*.local`
- `handoff/latest.md` — this file

## Verification Status
- Lint: N/A (no code yet)
- Test: N/A (no code yet; Vitest + Playwright will be wired in Task 1 scaffolding)
- Live: N/A
- `grep -R "{{" .` (excluding .git / node_modules): 97 lines across 9 files, all intentional. Breakdown: `PlaceholderGuide.md` / `README.md` / `setup.sh` / `scripts/run-task.sh` / `scripts/harness-report.sh` (the harness tooling that documents or manipulates placeholders), `docs/blog/2026-04-0{3,4}.md` (historical blog posts whose subject IS the placeholder system), `.claude/rules/local/frontend-honbabseoul.md` (JSX `style={{…}}` example), and this handoff file (mentions the check).
- `bash -n` on both hooks: PASS
- Template imported from `/Users/mero/Dev/13.claude/templates/claude-code-harness-template` (via `cp -R`, excluding template's own `.git`)
- Removed `outputs/plans/harness-v5-reinforcement-plan.md` (632-line leftover from the harness template's own development — would have confused the Task 1 Planner)

## Next Step
- Roadmap drafted: `outputs/plans/roadmap.md` — 4 epics (scaffolding → data → read path → write path), each pre-sketched at slice level.
- **Preferred entrypoint**: `/epics` — runs the whole MVP (epics 1→2→3→4) unattended. Batch-run permissions are already in `.claude/settings.json`; no prep step needed before the first run.
- **Alternative**: per-epic control with `/plan Epic 1` → `/develop` → `/review` (or `/epic 1` for a single-epic background run).
- The 4 Open Questions that previously blocked Epic 2 onward are all **resolved** (2026-04-25). See `context/decision-log.md` and the "Resolved decisions" section in `outputs/plans/roadmap.md`. Summary: geo fallback = 서울시청 + toast; price_range = enum low/mid/high (`₩/₩₩/₩₩₩`); photo = ≤2MB jpg/png, 1 image; `is_solo_default=false` = confirmed "2인 이상 전용".

## Outstanding external prep (user-owned)
- **Git remote**: `https://github.com/0xMegg/honbabseoul` (empty — ready). On request, this session will run `git remote add origin ... && git add -A && git commit -m "chore: initial harness + roadmap" && git push -u origin main`.
- **Supabase project**: needs `SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY` + Reference ID, and a public bucket `restaurant-photos`. Blocks Epic 2 onward.
- **Naver Maps**: needs `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID` (NCP Web Dynamic Map application with `localhost:3000` + `*.vercel.app` whitelisted). Blocks Epic 3 onward.

## Carry Over / Open Items (user decisions pending)
- **Next.js version lock**: harness assumes 15 (current stable). Confirm or bump to 16 before scaffolding.
- **shadcn/ui**: not adopted now. Revisit after the first two screens exist — the current Tailwind + `--hb-*` token approach may be enough.
- **Logo SVG**: fixed graphic `혼밥서울 / ホンバプソウル` — original asset needs to be provided.
- **Supabase project** creation + API keys, **Naver Maps** client-id — environment provisioning, not code.

## Plan & Review Locations
- Plan: (none yet)
- Verify: (none yet)
- Review: (none yet)
