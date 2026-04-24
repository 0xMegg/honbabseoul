# Project Contract

## Project
- Name: honbabseoul
- Type: Web App (mobile-first, Japanese-primary)
- Stack: Next.js 15 (App Router), React 19, TypeScript (strict), Tailwind CSS + CSS variable tokens (--hb-*), next-intl, Supabase (Postgres + RLS + Storage + Auth), Naver Maps JS SDK, pnpm, Vercel

## Build & Test Commands
- Install: `pnpm install`
- Dev/Run: `pnpm dev`
- Build: `pnpm build`
- Lint/Analyze: `pnpm lint`
- Format: `pnpm format`
- Test all (unit + component): `pnpm test`
- Test single: `pnpm test <file>`  (Vitest; e.g. `pnpm test src/lib/filters.test.ts`)
- Test watch: `pnpm test:watch`
- Test E2E: `pnpm test:e2e`  (Playwright)

## Folder Boundaries
- Source code: `src/`
- Tests (unit + component): co-located in `src/` as `*.test.ts` / `*.test.tsx` next to the module under test (Vitest)
- Tests (E2E): `e2e/*.spec.ts` (Playwright, runs against `pnpm dev`)
- Do NOT modify: `.env`, `.env.local`, `.next/`, `pnpm-lock.yaml`, `supabase/migrations/`, `next.config.*`, `.vercel/`, `playwright-report/`, `test-results/`

## Architecture
- Feature-first: `src/app/[locale]/…` route segments + `src/lib/features/*` + `src/lib/repositories/*`
- State management: React local state + Server Components for server state; no global store yet
- Routing: Next.js App Router (file-based), next-intl locale-prefixed routes `/[locale]/...` (ja default, ko parallel)
- Data access: Supabase SDK wrapped in `src/lib/repositories/*`; UI components and Server Components must not import `@supabase/supabase-js` directly

## Coding Conventions
- Language: TypeScript (`strict: true`, `noUncheckedIndexedAccess: true`)
- Naming: `camelCase` for vars/functions, `PascalCase` for components/types, `SCREAMING_SNAKE` for env keys
- File naming: `kebab-case` for routes/utilities, `PascalCase.tsx` for React components
- Imports: absolute via `@/` alias (tsconfig paths); no deep `../../` imports
- Error handling: Supabase calls return `{ data, error }` — branch both at repository boundary; throw typed errors upward; surface user-facing errors through the JA/KO message map (never raw PostgREST text)

## Work Protocol
1. Read the relevant code before modifying
2. Keep changes feature-local first
3. Run lint/analyze after every change
4. Run tests if they exist for the changed area
5. Make the smallest change that completes the task
6. Update `handoff/latest.md` with what changed and what's next

## Restrictions
- Never commit secrets, API keys, or .env files
- Never run `rm -rf` on project directories
- Never force push to main/master
- Never add dependencies without stating the reason
- Never do repo-wide refactor without explicit request

## References
- `context/` — project background, working rules, decision log
- `context/access-policy.md` — AI tool access policy (allowed / approval / blocked)
- `context/mcp-policy.md` — MCP & external integration policy
- `handoff/latest.md` — current state and task queue (read at every session start)
- `docs/plugin-guide.md` — plugin structure, security checklist, deployment strategy
- `docs/epic-guide.md` — epic decomposition, parallel stage execution, failure recovery
- `templates/evaluation.md` — task evaluation metrics (fill after each task)
- `supabase/schema.sql` — data schema (source of truth), once created under `supabase/` alongside migrations

## Self-Improvement (Optional — activate by setting harvest/config.json enabled: true)
- `harvest/config.json` — harvest pipeline configuration
- `context/harvest-policy.md` — auto-apply vs manual approval policy
- `/harvest` — run full pipeline
- `/harvest scan` — collection only
- `/harvest validate <description>` — manual input validation (Phase 2-5)
- `/harvest add <description>` — alias for /harvest validate
- `/harvest judge` — baseline measurement + autoresearch
- `/harvest status` — check current status

## 3-Role Workflow
- `/plan` — Planner: read-only, writes plans to `outputs/plans/`
- `/develop` — Developer: implements + verifies, does NOT commit
- `/review` — Reviewer: reviews, commits + pushes on APPROVE
- Tasks modifying 3+ files → Planner must produce a plan first

## Rules (auto-applied)
- `.claude/rules/base/*.md` — harness-owned rules (api, frontend, testing, git, gotchas). Upgraded automatically by `upgrade-harness.sh`.
- `.claude/rules/local/*.md` — project-specific rules (upgrade-safe; never overwritten). Add project learnings here (e.g., `gotchas-<project>.md`).
Claude reads both directories on every session.
