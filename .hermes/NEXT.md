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
- PR #10 Epic 4 / Slice 4.1.2 map page shell was reviewed, passed checks, and merged into `dev`: https://github.com/0xMegg/honbabseoul/pull/10
- PR #11 Epic 4 / Slice 4.2.1 filter state + chip UI was reviewed, passed checks, and merged into `dev`: https://github.com/0xMegg/honbabseoul/pull/11
- PR #12 Epic 4 / Slice 4.2.2 restaurant pin layer was reviewed, passed checks, and merged into `dev`: https://github.com/0xMegg/honbabseoul/pull/12
- PR #13 Epic 4 / Slice 4.3.1 bottom sheet detail was reviewed, passed checks, and merged into `dev`: https://github.com/0xMegg/honbabseoul/pull/13
- PR #14 read-path stability fix was reviewed, passed checks, and merged into `dev`: https://github.com/0xMegg/honbabseoul/pull/14
- PR #15 instant marker detail was reviewed, passed checks, and merged into `dev`: https://github.com/0xMegg/honbabseoul/pull/15
- PR #16 marker UX polish was reviewed, passed checks, and merged into `dev`: https://github.com/0xMegg/honbabseoul/pull/16
- Local read-path stability fixes are implemented: localhost Naver SDK loading is disabled by default unless `NEXT_PUBLIC_NAVER_MAPS_ALLOW_LOCALHOST=true`, map auth/constructor failure now shows the map error fallback, filter chips are disabled until hydration, and headless coverage now asserts fallback + filter transition stability.
- Merged PR branch refs were pruned locally and remotely on 2026-05-04 after confirming PR #1-#16 merge state; `snapshot/pre-hermes-cutover-20260503` was preserved as an archive pointer.
- Vercel `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID` was added for production, development, and `dev` preview after the branch preview showed a server-side exception; redeploy `dpl_G9SwTGkXVyXGCcPBhbFDttRuv1u7` reached `READY` and owns `https://honbabseoul-git-dev-meggs-projects.vercel.app`.
- Verification gap diagnosis is recorded in `.hermes/logs/log.md`; future user-facing tasks need real headless workflow coverage, not only unit/shallow smoke checks.
- Deployed full read-path smoke coverage is added behind `DEPLOYED_BASE_URL`; protected Vercel previews can use `VERCEL_SHARE_URL` to set the temporary auth cookie before testing `/ja`.
- Protected `dev` preview full read-path smoke passed on 2026-05-04: Japanese page, map surface, result count, custom marker, marker-to-bottom-sheet detail, close, and filter route transition.
- Seed-data/read-path acceptance is automated against `supabase/seed.sql`: 20 approved rows, 16 default solo-friendly rows, 15 solo+Japanese-menu rows, 4 solo+late-night rows, and 4 rows with all UI filters on.
- Marker clustering/overlap handling is implemented: close coordinates render as a branded count cluster, cluster click expands into offset individual markers, and marker-to-bottom-sheet selection remains intact.
- Logo placeholder is replaced with fixed SVG path outlines for the bilingual mark; visible glyphs no longer depend on device fonts.
- Next.js workspace-root warning housekeeping is complete: `outputFileTracingRoot` and `turbopack.root` are pinned to the project root, and lint/build/dev-start verification passed.
- Restaurant detail now has a media slot: safe `photo_url` values render as images, missing photos render a branded placeholder, and deployed read-path smoke asserts the media slot.
- UGC photo upload wiring is implemented: optional JPEG/PNG form file uploads through a server-only Supabase Storage helper, then persists the returned public URL via `submitPending.photoUrl`.
- Deployed UGC photo smoke gate is added behind `RUN_DEPLOYED_UGC_PHOTO_SMOKE=true`; it verifies deployed photo submission and cleans up the storage object plus pending smoke row.
- Restaurant detail now shows compact positive feature badges for solo-friendly, Japanese menu, and late-night attributes.
- Preview deployment `https://honbabseoul-o40fswnli-meggs-projects.vercel.app` reached READY, and deployed UGC photo smoke passed with cleanup verified. Deployed read-path smoke on that random preview URL hit the expected Naver Maps fallback because the hostname is not whitelisted.
- UGC submit enablement is implemented: the submit button is disabled until required fields/radio groups are complete, while preserved invalid/error form values still prefill and can enable submit.
- Admin workflow is documented for Supabase-dashboard moderation, and deployed UGC photo smoke now verifies that the created pending row is hidden from the public Supabase client.
- Epic 5 audit is now `PASS` with `Blocker: 0`; manual Supabase-dashboard approval and public map visibility on the Naver-whitelisted `dev` preview were completed on 2026-05-07.
- Deployed approval-flow smoke is added behind `RUN_DEPLOYED_APPROVAL_SMOKE=true` and has passed on the protected preview: temporary UGC row submitted, hidden while pending, approved through admin client, visible to the public client, then cleaned up.
- Metadata/OG polish is implemented and covered by e2e: production-oriented title/description, JA/KO route metadata, generated `/opengraph-image`, and middleware exclusion for that metadata route.
- Preview deployment `https://honbabseoul-207oftxw7-meggs-projects.vercel.app` reached READY after metadata/OG polish. Deployment ID: `dpl_3SZoAHcZkXYV4z3cJ5WH4JkQY1Bs`.
- Protected share URL for the metadata preview was created and deployed metadata smoke passed. Share URL expires on 2026-05-07 08:28:38: `https://honbabseoul-207oftxw7-meggs-projects.vercel.app/?_vercel_share=a2M39oHj8CJsX20QWuOuKTspRsW3PNNx`.
- Web manifest polish is implemented and covered by e2e: `/manifest.webmanifest`, manifest link, theme-color meta, and key manifest fields.
- Manifest preview deployment `https://honbabseoul-401eqjsvw-meggs-projects.vercel.app` reached READY and deployed metadata/manifest smoke passed. Deployment ID: `dpl_mH1g4rZqKW7apvEgsfzSgCMz8t2U`. Share URL expires on 2026-05-07 08:36:41: `https://honbabseoul-401eqjsvw-meggs-projects.vercel.app/?_vercel_share=Tu0a7nXzykY4yOosbo0JQjUOWEht1IIC`.
- Robots/sitemap polish is implemented and covered by e2e: `/robots.txt`, `/sitemap.xml`, content types, sitemap link, and `/ja` plus `/ko` canonical URLs.
- Robots/sitemap preview deployment `https://honbabseoul-27ilt14gk-meggs-projects.vercel.app` reached READY and deployed metadata/manifest/robots/sitemap smoke passed. Deployment ID: `dpl_26xho1AsPXxjcnH4RRucrWMVk2tZ`. Share URL expires on 2026-05-07 08:46:46: `https://honbabseoul-27ilt14gk-meggs-projects.vercel.app/?_vercel_share=NeFlWeiVJkeWiZY8GLozxE2hUfFq2KK9`.
- `docs/deployment.md` is refreshed with current Vercel envs, protected-preview smoke flow, latest preview trace, and the completed Epic 5 manual production gate.
- `README.md` is refreshed with current product surface, verification commands, and operations document links.
- Locale HTML lang is corrected after hydration via `[locale]/HtmlLang`, and e2e now asserts `/ja` -> `html[lang="ja"]`, `/ko` -> `html[lang="ko"]`. Playwright local server reuse is disabled to avoid accidentally testing another app on port 3000.
- Locale lang preview deployment `https://honbabseoul-qp30yxjgw-meggs-projects.vercel.app` reached READY and deployed `/ja`, `/ko`, lang, and metadata/discoverability smoke passed. Deployment ID: `dpl_FwZX8GRAXrAwMyFdnjAUJ5DoEMvE`. Share URL expires on 2026-05-07 09:14:22: `https://honbabseoul-qp30yxjgw-meggs-projects.vercel.app/?_vercel_share=Kmrqc1KnIYksfsKG5vjLv9sgHTxE0P2G`.
- `docs/deployment.md` Current Preview Trace now points to the latest verified locale-lang preview and its smoke scope.
- UGC duplicate submit guard is implemented locally: the submission form disables its submit button immediately after submit while preserving the existing required-field gate. Local lint, unit/component tests, and e2e passed.
- Local review package commit created on branch `codex/product-admin-readiness`: `Package product admin readiness bundle`.

## Next Action

Pick the next product/admin slice.

Candidate next work:

1. Push `codex/product-admin-readiness` and open a draft PR when publish is requested.
2. Keep real Naver verification as an explicit manual/headless gate when map behavior changes: `NEXT_PUBLIC_NAVER_MAPS_ALLOW_LOCALHOST=true` on local dev, then verify tiles, custom markers, selection state, and marker-to-bottom-sheet detail.

## Open Gates

- Legacy JWT keys are disabled in Supabase.
- Supabase legacy JWT migration is complete and verified on deployed `dev`.
- `pnpm db:types` needs Supabase CLI login token access; sandboxed runs without token access can fail and truncate the generated file because shell redirection opens the output first.
- Real Naver Maps local verification succeeds when localhost SDK loading is intentionally enabled and the NCP whitelist is configured. Default localhost SDK loading remains disabled so routine local sessions do not depend on NCP/network availability.

## Verification Defaults

- `pnpm lint`
- `pnpm test`
- `pnpm build` when runtime or Next.js config behavior changes
- `pnpm test:e2e` when user-facing flows, routing, maps, or UGC submission change
- `DEPLOYED_BASE_URL=<deployment-url> VERCEL_SHARE_URL=<protected-share-url> playwright test e2e/deployed-read-path.spec.ts` for protected deployed read-path smoke
