# Honbabseoul Hermes Next

Status: Active handoff pointer for fresh sessions. Keep this file short.

## Current Goal

Use Hermes as the active operating layer for honbabseoul. The legacy harness artifacts remain as source material, not active workflow authority.

## Current State

- Branch: `harness/hermes-core-cutover-20260503`
- Baseline checked during migration: `216e9c6`
- Hermes cutover is active and accepted.
- Epic 3 / Slice 2 generated remote Supabase types, added `pnpm db:types`, connected the `Database` type to Supabase clients and the public restaurant repository, and passed verification.

## Next Action

Pause before runtime/product behavior changes. Next product slice should be chosen by the user after reviewing the current diff.

Candidate next work:

1. Decide whether to commit Epic 3 / Slice 2 as-is.
2. Choose the next runtime slice for map/detail/UGC behavior.
3. Re-check open gates before Epic 5 or production deployment.

## Open Gates

- `SUPABASE_SERVICE_ROLE_KEY` rotation before Epic 5 / production deployment.
- `reason` column deferred to Epic 5 / Slice 1.1.
- Logo SVG placeholder remains.
- Optional housekeeping: prune merged local branches and address Next.js workspace-root warning.
- `pnpm db:types` needs Supabase CLI login token access; sandboxed runs without token access can fail and truncate the generated file because shell redirection opens the output first.

## Verification Defaults

- `pnpm lint`
- `pnpm test`
- `pnpm build` when runtime or Next.js config behavior changes
- `pnpm test:e2e` when user-facing flows, routing, maps, or UGC submission change
