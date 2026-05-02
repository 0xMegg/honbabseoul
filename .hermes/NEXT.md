# Honbabseoul Hermes Next

Status: Active handoff pointer for fresh sessions. Keep this file short.

## Current Goal

Use Hermes as the active operating layer for honbabseoul. The legacy harness artifacts remain as source material, not active workflow authority.

## Current State

- Branch: `dev`
- Baseline checked during migration: `216e9c6`
- Last legacy handoff: Epic 3 / Slice 2 — Supabase types autogen was deferred and not started under the old harness.
- Source implementation was not changed during Hermes adoption.

## Next Action

After this migration, re-plan Epic 3 / Slice 2 under Hermes from scratch:

1. Generate Supabase types.
2. Add a `db:types` script if still needed.
3. Record the Supabase generated types decision.
4. Run the relevant verification.

## Open Gates

- `SUPABASE_SERVICE_ROLE_KEY` rotation before Epic 5 / production deployment.
- `reason` column deferred to Epic 5 / Slice 1.1.
- Logo SVG placeholder remains.
- Optional housekeeping: prune merged local branches, address Next.js workspace-root warning, and reword the Tailwind doc sample that scans `bg-[var(--hb-*)]` as a class.

## Verification Defaults

- `pnpm lint`
- `pnpm test`
- `pnpm build` when runtime or Next.js config behavior changes
- `pnpm test:e2e` when user-facing flows, routing, maps, or UGC submission change
