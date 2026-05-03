# Honbabseoul State

## Source Provenance

- Legacy handoff before Hermes adoption: `.hermes/archive/legacy-harness-2026-05-03/handoff/latest.md`.
- Git branch and HEAD checked during migration.
- Project context: `context/about-me.md`.

## Current State

- Date: 2026-05-03
- Branch: `harness/hermes-core-cutover-20260503`
- Baseline checked during Hermes adoption: `216e9c6`
- Hermes adoption changed operating-layer files only; no runtime source files changed.
- Epic 3 / Slice 2 generated remote Supabase types and connected them to the Supabase client type surface.
- UGC form entry is committed on `/ja` and `/ko`.
- UGC cleanup for query robustness and feedback accessibility is implemented pending final review/commit.

## Active Carry-Over

- UGC invalid form input preservation remains deferred as a separate UX task.
- Prior old-harness planning pass is treated as stale/deferred source material, not active implementation.

## Next Product Work

Close UGC cleanup, then plan the next product slice with Claude-first workflow.

## Open Project Gates

- Rotate `SUPABASE_SERVICE_ROLE_KEY` before Epic 5 / production deployment.
- `reason` column remains deferred to Epic 5 / Slice 1.1.
- Logo SVG placeholder remains.
- Optional housekeeping: prune merged local branches and address Next.js workspace-root warning.
