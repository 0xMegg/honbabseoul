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

## Next Action

Decide whether to disable Supabase legacy JWT keys. This is production-impacting and requires explicit approval before execution.

Candidate next work:

1. Get explicit approval for legacy JWT key disablement.
2. Disable Supabase legacy JWT keys through the Management API.
3. Verify `/ja` on the deployed `dev` Vercel deployment and a direct Supabase read/write path after disablement.

## Open Gates

- Legacy JWT key disablement is blocked on explicit approval because it is production-impacting.
- Legacy JWT keys are currently enabled in Supabase.
- Logo SVG placeholder remains.
- Optional housekeeping: prune merged local branches and address Next.js workspace-root warning.
- `pnpm db:types` needs Supabase CLI login token access; sandboxed runs without token access can fail and truncate the generated file because shell redirection opens the output first.

## Verification Defaults

- `pnpm lint`
- `pnpm test`
- `pnpm build` when runtime or Next.js config behavior changes
- `pnpm test:e2e` when user-facing flows, routing, maps, or UGC submission change
