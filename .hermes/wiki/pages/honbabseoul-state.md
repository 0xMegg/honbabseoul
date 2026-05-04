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
- Supabase legacy JWT keys are disabled and confirmed `enabled: false`.
- UGC submission writes now use the server-only Supabase admin client because publishable-key REST inserts no longer satisfy the old `to anon` RLS insert policy after legacy JWT disablement.
- Vercel env now includes `NEXT_PUBLIC_SUPABASE_URL` for production/preview/development after deployed submission verification found the runtime URL env was missing.
- Vercel deployment `dpl_CBreYYS6RGRKzEBTRYLKdAwV4FM8` for commit `219fc63` is READY and verified: `/ja` HTML smoke passed, browser submission returned `submission=success`, the smoke row inserted as `pending`, and cleanup was verified.
- PR #7 UGC invalid form input preservation follow-up is merged into `dev`.
- PR #8 Hermes Claude CLI policy adoption docs-only cleanup is merged into `dev`.
- PR #9 Epic 4 / Slice 4.1.1 Naver Maps client wrapper is merged into `dev`.
- PR #10 Epic 4 / Slice 4.1.2 map page shell is merged into `dev`.
- PR #11 Epic 4 / Slice 4.2.1 filter state + chip UI is merged into `dev`.
- PR #12 Epic 4 / Slice 4.2.2 restaurant pin layer is merged into `dev`.
- Epic 4 / Slice 4.3.1 bottom sheet detail is implemented locally and awaiting PR landing.

## Active Carry-Over

- Prior old-harness planning pass is treated as stale/deferred source material, not active implementation.

## Next Product Work

Land Epic 4 / Slice 4.3.1, then reassess Epic 4 read-path acceptance gaps.

## Open Project Gates

- Supabase legacy JWT migration is complete and verified on deployed `dev`.
- Logo SVG placeholder remains.
- Optional housekeeping: prune merged local branches and address Next.js workspace-root warning.
