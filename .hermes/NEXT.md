# Honbabseoul Hermes Next

Status: Active handoff pointer for fresh sessions. Keep this file short.

## Current Goal

Use Hermes as the active operating layer for honbabseoul. The legacy harness artifacts remain as source material, not active workflow authority.

## Current State

- Branch: `dev`
- Baseline checked during migration: `216e9c6`
- Hermes cutover is active and accepted.
- Epic 3 / Slice 2 generated remote Supabase types, added `pnpm db:types`, connected the `Database` type to Supabase clients and the public restaurant repository, and passed verification.
- UGC submission form is committed and reachable on `/ja` and `/ko`, backed by a Server Action that calls `submitPending`.
- UGC cleanup for query robustness, feedback live-region roles, and price-range intent is committed.
- Epic 5 / Slice 1.1 reason persistence is implemented, committed, merged to `dev`, and applied to the configured `DATABASE_URL` DB via `0002_submission_reason.sql`.
- Supabase admin key env is prepared for new `SUPABASE_SECRET_KEY` with legacy `SUPABASE_SERVICE_ROLE_KEY` fallback; local `.env.local` now has `SUPABASE_SECRET_KEY` and verified REST access.
- Supabase public client env is prepared for `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` with legacy anon fallback; local `.env.local` now has the publishable key and verified public RLS read access.
- Vercel `honbabseoul` project now has `SUPABASE_SECRET_KEY` for production/preview and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for production/preview/development; redeploy smoke passed on `https://honbabseoul-4v0m1124i-meggs-projects.vercel.app/ja`.
- Draft PR #5 was closed after the GitHub connector failed to mark it ready because of a connector GraphQL field mismatch.
- Non-draft PR #6 was opened and merged into `dev`: https://github.com/0xMegg/honbabseoul/pull/6
- Vercel `dev` deployment `dpl_2WxujWtYG31JEcmm1bcPxU16pN6p` reached `READY`; smoke for `https://honbabseoul-inaopeoep-meggs-projects.vercel.app/ja` returned HTTP 200 with the current UGC form.
- Supabase legacy JWT keys were disabled through the Management API and confirmed `enabled: false`.
- Legacy disable verification found that publishable-key REST reads still pass, but unauthenticated REST inserts no longer satisfy the old `to anon` insert policy without a JWT role. `submitPending` now uses the server-only Supabase admin client so the Server Action write path works with `SUPABASE_SECRET_KEY`.
- Vercel deployment `dpl_AcENcSCQ6W65U7bbN5pxaXGv9Z2P` for commit `b38f2f3` reached `READY`, but deployed form submission returned HTTP 500 because `NEXT_PUBLIC_SUPABASE_URL` was missing from Vercel runtime env.
- Added Vercel env `NEXT_PUBLIC_SUPABASE_URL` for production/preview/development.
- Vercel deployment `dpl_CBreYYS6RGRKzEBTRYLKdAwV4FM8` for commit `219fc63` reached `READY`.
- Final protected-deployment smoke passed on `https://honbabseoul-mu25phxbt-meggs-projects.vercel.app/ja`: HTML contained the Japanese home/form surface, browser submission returned POST 303 and `submission=success`, the smoke row was inserted as `pending`, and the smoke row cleanup was verified.
- PR #7 UGC invalid form input preservation follow-up was reviewed, passed checks, and merged into `dev`: https://github.com/0xMegg/honbabseoul/pull/7
- PR #8 Hermes Claude CLI policy adoption docs-only cleanup was reviewed, passed checks, and merged into `dev`: https://github.com/0xMegg/honbabseoul/pull/8
- PR #9 Epic 4 / Slice 4.1.1 Naver Maps client wrapper was reviewed, passed checks, and merged into `dev`: https://github.com/0xMegg/honbabseoul/pull/9
- Epic 4 / Slice 4.1.2 map page shell is implemented locally on branch `codex/map-page-shell`, reviewed by Claude with `NO REQUIRED FIXES`, and verified with Vitest, Playwright, build, browser smoke, and CLS 0.

## Next Action

Land Epic 4 / Slice 4.1.2 map page shell, then continue Epic 4 / Slice 4.2.1 filter state + chip UI.

Candidate next work:

1. Push `codex/map-page-shell` and open/merge a PR after checks pass.
2. Continue Epic 4 / Slice 4.2.1 filter state + chip UI.
3. Keep optional housekeeping separate unless it blocks product work.

## Open Gates

- Legacy JWT keys are disabled in Supabase.
- Supabase legacy JWT migration is complete and verified on deployed `dev`.
- Epic 4 / Slice 4.1.2 map page shell is not yet landed on `dev`.
- Logo SVG placeholder remains.
- Optional housekeeping: prune merged local branches and address Next.js workspace-root warning.
- `pnpm db:types` needs Supabase CLI login token access; sandboxed runs without token access can fail and truncate the generated file because shell redirection opens the output first.

## Verification Defaults

- `pnpm lint`
- `pnpm test`
- `pnpm build` when runtime or Next.js config behavior changes
- `pnpm test:e2e` when user-facing flows, routing, maps, or UGC submission change
