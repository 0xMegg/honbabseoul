# Honbabseoul Hermes Next

Status: Active handoff pointer for fresh sessions. Keep this file short.

## Current Goal

Use Hermes as the active operating layer for honbabseoul. The legacy harness artifacts remain as source material, not active workflow authority.

## Current State

- Branch: `harness/hermes-core-cutover-20260503`
- Baseline checked during migration: `216e9c6`
- Hermes cutover is active and accepted.
- Epic 3 / Slice 2 generated remote Supabase types, added `pnpm db:types`, connected the `Database` type to Supabase clients and the public restaurant repository, and passed verification.
- UGC submission form is committed and reachable on `/ja` and `/ko`, backed by a Server Action that calls `submitPending`.
- UGC cleanup for query robustness, feedback live-region roles, and price-range intent is committed.
- Epic 5 / Slice 1.1 reason persistence is implemented locally and applied to the configured `DATABASE_URL` DB via `0002_submission_reason.sql`; final commit is pending.
- Supabase admin key env is prepared for new `SUPABASE_SECRET_KEY` with legacy `SUPABASE_SERVICE_ROLE_KEY` fallback; local `.env.local` now has `SUPABASE_SECRET_KEY` and verified REST access.

## Next Action

Finish production Supabase key rotation: migrate deployed envs to `SUPABASE_SECRET_KEY`, then migrate public clients to publishable key before disabling legacy JWT keys.

Candidate next work:

1. Commit the admin-key env preparation if review stays clear.
2. Update deployed server environments with `SUPABASE_SECRET_KEY`.
3. Migrate public clients from legacy anon JWT to publishable key before disabling legacy JWT keys.

## Open Gates

- Deployed Supabase elevated key rotation before production deployment: local env is migrated, but deployment envs still need `SUPABASE_SECRET_KEY`.
- Legacy JWT key disablement is blocked until public clients are migrated from legacy anon JWT to publishable key because Supabase disables legacy anon/service_role together.
- Logo SVG placeholder remains.
- Optional housekeeping: prune merged local branches and address Next.js workspace-root warning.
- `pnpm db:types` needs Supabase CLI login token access; sandboxed runs without token access can fail and truncate the generated file because shell redirection opens the output first.

## Verification Defaults

- `pnpm lint`
- `pnpm test`
- `pnpm build` when runtime or Next.js config behavior changes
- `pnpm test:e2e` when user-facing flows, routing, maps, or UGC submission change
