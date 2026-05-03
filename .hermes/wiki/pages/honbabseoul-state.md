# Honbabseoul State

## Source Provenance

- Legacy handoff before Hermes adoption: `.hermes/archive/legacy-harness-2026-05-03/handoff/latest.md`.
- Git branch and HEAD checked during migration.
- Project context: `context/about-me.md`.
- Reason persistence decision and migration: `context/decision-log.md`, `supabase/migrations/0002_submission_reason.sql`.

## Current State

- Date: 2026-05-04
- Branch: `dev`
- Baseline checked during Hermes adoption: `216e9c6`
- Hermes adoption changed operating-layer files only; no runtime source files changed.
- Epic 3 / Slice 2 generated remote Supabase types and connected them to the Supabase client type surface.
- UGC form entry is committed on `/ja` and `/ko`.
- UGC cleanup for query robustness and feedback accessibility is committed.
- Epic 5 / Slice 1.1 reason persistence is implemented, committed, merged to `dev`, and applied to the configured `DATABASE_URL` DB.
- Supabase admin key env is prepared for `SUPABASE_SECRET_KEY` with legacy fallback; local `.env.local` has `SUPABASE_SECRET_KEY` and verified Supabase REST access.
- Supabase public key env is prepared for `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` with legacy fallback; local `.env.local` has the publishable key and verified public RLS read access.
- Vercel project envs are migrated to the new Supabase keys and a redeploy smoke passed.
- Draft PR #5 was closed after the GitHub connector failed to mark the draft ready because of a connector GraphQL field mismatch.
- Non-draft PR #6 was opened and merged into `dev`: https://github.com/0xMegg/honbabseoul/pull/6
- Vercel `dev` deployment `dpl_2WxujWtYG31JEcmm1bcPxU16pN6p` reached `READY`; smoke for `https://honbabseoul-inaopeoep-meggs-projects.vercel.app/ja` returned HTTP 200 with the current UGC form.

## Active Carry-Over

- UGC invalid form input preservation remains deferred as a separate UX task.
- Prior old-harness planning pass is treated as stale/deferred source material, not active implementation.

## Next Product Work

Decide whether to disable Supabase legacy JWT keys. This requires explicit approval before execution.

## Open Project Gates

- Disable legacy JWT keys only after deployed-branch verification and explicit approval.
- Logo SVG placeholder remains.
- Optional housekeeping: prune merged local branches and address Next.js workspace-root warning.
