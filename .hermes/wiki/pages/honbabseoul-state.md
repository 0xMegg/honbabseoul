# Honbabseoul State

## Source Provenance

- Legacy handoff before Hermes adoption: `handoff/latest.md`.
- Git branch and HEAD checked during migration.
- Project context: `context/about-me.md`.

## Current State

- Date: 2026-05-03
- Branch: `dev`
- Baseline checked during Hermes adoption: `216e9c6`
- Hermes adoption changed operating-layer files only; no runtime source files changed.

## Active Carry-Over

- Epic 3 / Slice 2 — Supabase types autogen is not started under Hermes.
- Prior old-harness planning pass is treated as stale/deferred source material, not active implementation.

## Next Product Work

Re-plan Epic 3 / Slice 2 under Hermes:

1. Generate Supabase types.
2. Add `db:types` if still needed.
3. Append the decision-log entry.
4. Run the relevant verification.

## Open Project Gates

- Rotate `SUPABASE_SERVICE_ROLE_KEY` before Epic 5 / production deployment.
- `reason` column remains deferred to Epic 5 / Slice 1.1.
- Logo SVG placeholder remains.
- Optional housekeeping: prune merged local branches, address Next.js workspace-root warning, and reword the Tailwind doc sample that scans `bg-[var(--hb-*)]` as a class.
