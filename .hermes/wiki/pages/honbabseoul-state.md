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
- UGC form entry is implemented on `/ja` and `/ko` pending user review/commit.

## Active Carry-Over

- Epic 3 / Slice 2 is implemented pending user review/commit.
- Prior old-harness planning pass is treated as stale/deferred source material, not active implementation.

## Next Product Work

Review the UGC form entry slice in the browser, then decide whether to commit or adjust copy/fields.

## Open Project Gates

- Rotate `SUPABASE_SERVICE_ROLE_KEY` before Epic 5 / production deployment.
- `reason` column remains deferred to Epic 5 / Slice 1.1.
- Logo SVG placeholder remains.
- Optional housekeeping: prune merged local branches and address Next.js workspace-root warning.
