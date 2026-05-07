# Honbabseoul State

## Source Provenance

- Legacy handoff before Hermes adoption: `.hermes/archive/legacy-harness-2026-05-03/handoff/latest.md`.
- Git branch and HEAD checked during migration.
- Project context: `context/about-me.md`.
- Reason persistence decision and migration: `context/decision-log.md`, `supabase/migrations/0002_submission_reason.sql`.
- Deployed read-path and seed acceptance traces: `.hermes/logs/log.md`, `e2e/deployed-read-path.spec.ts`, `src/lib/repositories/seed-read-path.test.ts`, `supabase/seed.sql`.
- Next.js workspace-root warning housekeeping: `.hermes/logs/log.md`, `next.config.ts`.
- Restaurant detail media slot: `.hermes/logs/log.md`, `docs/project-plan.md`, `src/lib/features/detail/RestaurantDetail.tsx`.
- UGC photo upload wiring: `.hermes/logs/log.md`, `docs/project-plan.md`, `src/app/[locale]/actions.ts`, `src/lib/supabase/storage-server.ts`.
- Deployed UGC photo smoke gate: `.hermes/logs/log.md`, `e2e/deployed-ugc-photo.spec.ts`.
- Restaurant detail feature badges: `.hermes/logs/log.md`, `src/lib/features/detail/RestaurantDetail.tsx`.
- Preview deployment and UGC photo smoke: `.hermes/logs/log.md`.
- UGC submit enablement gate: `.hermes/logs/log.md`, `src/app/[locale]/SubmissionForm.tsx`, `src/app/[locale]/SubmissionForm.test.tsx`, `e2e/smoke.spec.ts`.
- Admin workflow and pending isolation gate: `.hermes/logs/log.md`, `docs/admin-workflow.md`, `e2e/deployed-ugc-photo.spec.ts`.
- Epic 5 audit artifact: `.hermes/logs/log.md`, `outputs/reviews/epic-5-audit.md`.
- Deployed approval-flow smoke gate: `.hermes/logs/log.md`, `e2e/deployed-approval-flow.spec.ts`, `outputs/reviews/epic-5-audit.md`.
- Metadata and OG polish: `.hermes/logs/log.md`, `src/app/layout.tsx`, `src/app/[locale]/layout.tsx`, `src/app/opengraph-image.tsx`, `src/middleware.ts`, `e2e/smoke.spec.ts`.
- Metadata preview deployment: `.hermes/logs/log.md`.
- Deployed metadata smoke: `.hermes/logs/log.md`, `e2e/smoke.spec.ts`.
- Web manifest polish: `.hermes/logs/log.md`, `src/app/manifest.ts`, `src/app/layout.tsx`, `e2e/smoke.spec.ts`.
- Manifest preview deployment and smoke: `.hermes/logs/log.md`.
- Robots and sitemap polish: `.hermes/logs/log.md`, `src/app/robots.ts`, `src/app/sitemap.ts`, `e2e/smoke.spec.ts`.
- Robots/sitemap preview deployment and smoke: `.hermes/logs/log.md`.
- Deployment documentation refresh: `.hermes/logs/log.md`, `docs/deployment.md`.
- README orientation refresh: `.hermes/logs/log.md`, `README.md`.
- Locale HTML lang and e2e server reuse hardening: `.hermes/logs/log.md`, `src/app/[locale]/HtmlLang.tsx`, `src/app/[locale]/layout.tsx`, `e2e/smoke.spec.ts`, `playwright.config.ts`.
- Locale lang preview deployment and smoke: `.hermes/logs/log.md`.
- Deployment trace refresh: `.hermes/logs/log.md`, `docs/deployment.md`.
- UGC duplicate submit guard: `.hermes/logs/log.md`, `src/app/[locale]/SubmissionForm.tsx`, `src/app/[locale]/SubmissionForm.test.tsx`.

## Current State

- Date: 2026-05-06
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
- PR #13 Epic 4 / Slice 4.3.1 bottom sheet detail is merged into `dev`.
- PR #14 read-path stability fix is merged into `dev`.
- PR #15 instant marker detail is merged into `dev`.
- PR #16 marker UX polish is merged into `dev`.
- Post-merge headless audit on local `dev` found read-path regressions not covered by the existing smoke suite: Naver Maps local auth fails for `http://localhost:3000/ja`, map constructors stay unavailable, the map container can remain empty without the user-facing error label, and filter chip client transition can crash after URL replacement.
- Local read-path stability fixes now prevent the broken localhost Naver SDK state from crashing the app: localhost SDK loading is disabled by default, the map error fallback is visible, filter chips wait for hydration before accepting clicks, and E2E covers fallback + filter transition stability.
- Real Naver Maps local verification now passes when localhost SDK loading is intentionally enabled and the NCP whitelist is configured.
- Instant marker detail removes marker-to-detail browser re-fetching and renders detail from the current server-provided restaurant list.
- Marker UX polish adds custom marker content, selected marker state, and visible result count.
- Merged PR branch refs were pruned locally and remotely on 2026-05-04 after confirming PR #1-#16 merge state; `snapshot/pre-hermes-cutover-20260503` remains as an archive pointer.
- Vercel `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID` is configured for production, development, and `dev` preview; redeploy `dpl_G9SwTGkXVyXGCcPBhbFDttRuv1u7` owns the `dev` branch preview alias.
- Verification gap diagnosis is logged: future user-facing product work must include real headless workflow coverage, external SDK success/failure checks, route transition checks, and remote smoke data cleanup.
- Deployed full read-path smoke is automated behind `DEPLOYED_BASE_URL`; protected Vercel previews can use `VERCEL_SHARE_URL`.
- Seed-data/read-path acceptance is automated against `supabase/seed.sql`, including public model compatibility, map/detail field completeness, Naver URL shape, and expected UI filter counts.
- Marker clustering/overlap handling is implemented with branded count clusters and expanded offset individual markers on cluster click.
- Logo placeholder is replaced by a path-based bilingual SVG mark; the accessible title still exposes both scripts.
- Next.js workspace-root warning housekeeping is complete: `outputFileTracingRoot` and `turbopack.root` are pinned to this project root.
- Restaurant detail now renders a media slot: safe `photo_url` values show as images, missing photos show a branded placeholder, and deployed read-path smoke covers the slot.
- UGC photo upload wiring is implemented with an optional JPEG/PNG form file, server-only Supabase Storage upload, and `submitPending.photoUrl` persistence.
- Deployed UGC photo smoke is automated behind `RUN_DEPLOYED_UGC_PHOTO_SMOKE=true`; routine e2e skips it by default, and actual preview execution has passed with cleanup verified.
- Restaurant detail shows compact positive feature badges for solo-friendly, Japanese menu, and late-night attributes.
- Preview deployment `https://honbabseoul-o40fswnli-meggs-projects.vercel.app` is READY, deployed UGC photo smoke passed, and cleanup was verified. Deployed read-path smoke on that random preview URL hit Naver Maps fallback because the hostname is not whitelisted.
- UGC submit enablement gate is implemented: required text fields plus required boolean radio groups must be complete before submit is enabled, and preserved invalid/error flash values still restore the form.
- Supabase-dashboard admin workflow is documented, and deployed UGC photo smoke now also verifies that the created pending row is hidden from the public Supabase client.
- Epic 5 audit is recorded as `PASS` with `Blocker: 0`; manual Supabase-dashboard approval and public map visibility on the Naver-whitelisted `dev` preview were completed on 2026-05-07.
- Deployed approval-flow smoke is automated and has passed: a temporary row was submitted, hidden while pending, approved through the admin client, visible to the public client, and cleaned up.
- Metadata/OG polish is implemented and covered by e2e with production-oriented root metadata, JA/KO route metadata, generated Open Graph image, and middleware exclusion for `/opengraph-image`.
- Preview deployment `https://honbabseoul-207oftxw7-meggs-projects.vercel.app` is READY after metadata/OG polish. Deployment ID: `dpl_3SZoAHcZkXYV4z3cJ5WH4JkQY1Bs`.
- Protected share URL was created for the metadata preview, and deployed metadata smoke passed against that preview.
- Web manifest polish is implemented and covered by e2e: manifest route, manifest link, theme-color meta, and key manifest fields.
- Manifest preview deployment `https://honbabseoul-401eqjsvw-meggs-projects.vercel.app` is READY, and deployed metadata/manifest smoke passed against its protected preview share URL.
- Robots/sitemap polish is implemented and covered by e2e for `/robots.txt`, `/sitemap.xml`, content types, sitemap link, and `/ja` plus `/ko` canonical URLs.
- Robots/sitemap preview deployment `https://honbabseoul-27ilt14gk-meggs-projects.vercel.app` is READY, and deployed metadata/manifest/robots/sitemap smoke passed against its protected preview share URL.
- Deployment documentation is refreshed with current Vercel envs, protected-preview smoke flow, latest preview trace, and the completed Epic 5 manual production gate.
- README is refreshed with current product surface, verification commands, and operations document links.
- Locale HTML lang is corrected after hydration for `/ja` and `/ko`, and Playwright local server reuse is disabled so e2e does not silently exercise another app on port 3000.
- Locale lang preview deployment `https://honbabseoul-qp30yxjgw-meggs-projects.vercel.app` is READY, and deployed `/ja`, `/ko`, lang, and metadata/discoverability smoke passed against its protected preview share URL.
- Deployment document Current Preview Trace now points to the latest verified locale-lang preview and its smoke scope.
- UGC duplicate submit guard is implemented locally: the submission form disables its submit button immediately after submit while preserving required-field gating, and local lint/test/e2e verification passed.
- The current product/admin readiness bundle is packaged in local branch `codex/product-admin-readiness` as `Package product admin readiness bundle`.
- Draft PR #17 is open against `dev`, checks are green, and merge state is clean.
- PR #17 preview redeploy is READY after adding branch-scoped `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID`; protected `/ja` returns HTTP 200 and deployed metadata/discoverability smoke passed.
- PR #17 full deployed read-path smoke remains blocked by the Naver hostname whitelist because the PR branch alias renders the expected map fallback instead of Naver markers.

## Active Carry-Over

- Prior old-harness planning pass is treated as stale/deferred source material, not active implementation.

## Next Product Work

Decide whether to mark PR #17 ready or first run full Naver read-path smoke on a Naver-whitelisted host after merge/redeploy.

## Open Project Gates

- Supabase legacy JWT migration is complete and verified on deployed `dev`.
