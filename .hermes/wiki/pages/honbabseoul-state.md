# Honbabseoul State

## Source Provenance

- Legacy handoff before Hermes adoption: `.hermes/archive/legacy-harness-2026-05-03/handoff/latest.md`.
- Git branch and HEAD checked during migration.
- Project context: `context/about-me.md`.
- Reason persistence decision and migration: `context/decision-log.md`, `supabase/migrations/0002_submission_reason.sql`.

## Current State

- Date: 2026-05-04
- Branch: `harness/hermes-core-cutover-20260503`
- Baseline checked during Hermes adoption: `216e9c6`
- Hermes adoption changed operating-layer files only; no runtime source files changed.
- Epic 3 / Slice 2 generated remote Supabase types and connected them to the Supabase client type surface.
- UGC form entry is committed on `/ja` and `/ko`.
- UGC cleanup for query robustness and feedback accessibility is committed.
- Epic 5 / Slice 1.1 reason persistence is implemented locally and applied to the configured `DATABASE_URL` DB; final commit is pending.
- Supabase admin key env is prepared for `SUPABASE_SECRET_KEY` with legacy fallback; local `.env.local` has `SUPABASE_SECRET_KEY` and verified Supabase REST access.
- Supabase public key env is prepared for `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` with legacy fallback; local `.env.local` has the publishable key and verified public RLS read access.
- Vercel project envs are migrated to the new Supabase keys and a redeploy smoke passed.

## Active Carry-Over

- UGC invalid form input preservation remains deferred as a separate UX task.
- Prior old-harness planning pass is treated as stale/deferred source material, not active implementation.

## Next Product Work

Decide whether to disable Supabase legacy JWT keys, then plan the next product slice with Claude-first workflow.

## Open Project Gates

- Disable legacy JWT keys only after deployed verification and explicit approval.
- Logo SVG placeholder remains.
- Optional housekeeping: prune merged local branches and address Next.js workspace-root warning.
