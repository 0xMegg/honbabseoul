# Hermes Log

Append important decisions, execution traces, and verification results here.

## 2026-05-03 — Cut Over Honbabseoul To Hermes Core

Decision:

- Archived the legacy Claude/Codex harness from active paths into `.hermes/archive/legacy-harness-2026-05-03/`.
- Installed Hermes Core policy, wiki baseline, skills placeholder, and operating structure.
- Added tracked root `AGENTS.md` as the active entrypoint.
- Rewrote `CLAUDE.md` as a thin adapter to `AGENTS.md` and `.hermes/`.
- Adopted Core `policy/harness-review.md` as active local policy after clean Core cutover.

Reason:

- The previous mixed adoption state applied Core propagation before Hermes itself was fully active in honbabseoul.
- Active authority must be tracked and unambiguous: `AGENTS.md` plus `.hermes/`.
- Legacy `.claude/`, `handoff/`, `outputs/`, `templates/`, `scripts/`, and old skills surfaces could otherwise revive the old workflow.

Source Evidence:

- Baseline commit: `216e9c6`.
- Mixed-state snapshot branch: `snapshot/pre-hermes-cutover-20260503`.
- Mixed-state tag: `snapshot-pre-hermes-20260503`.
- Ignored-file tarballs under `/private/tmp/honbabseoul-hermes-snapshots/`.

Verification:

- Snapshot branch and tag resolve to the mixed pre-cutover state.
- Runtime source diff from `216e9c6` is empty for `src/`, configs, Supabase, messages, E2E, public assets, package files, and lockfile.
- Legacy active surfaces were moved under `.hermes/archive/legacy-harness-2026-05-03/`.
- Root `AGENTS.md` is tracked and no longer ignored by `.git/info/exclude`.
- `CLAUDE.md` is a thin adapter to `AGENTS.md` and `.hermes/`.
- Claude final review initially returned required fixes for `.harness-manifest`, `docs/assumptions.md`, and `docs/plugin-guide.md`; those legacy harness files were archived and source provenance was corrected.
- Claude re-review returned required fixes for `.hermes/wiki/pages/honbabseoul-state.md` provenance and branch labels; those lines were corrected.
- Claude final quick re-review accepted the cutover with no further required fixes.

## 2026-05-03 — Epic 3 / Slice 2 Supabase Types

Decision:

- Generated Supabase TypeScript types from the remote `honbabseoul` project ref `iosqakynywnrwxrexrfh`.
- Stored the generated output at `src/lib/database.types.ts`.
- Added `pnpm db:types` as the repeatable regeneration command.
- Connected the generated `Database` type to Supabase browser, server, admin clients, and the public restaurant repository.
- Ignored `supabase/.temp/` because the Supabase CLI writes local cache files there.

Reason:

- Remote schema is the operational source for the current project database.
- A committed generated type file gives repository and Supabase client code a stable type surface without requiring runtime behavior changes in this slice.

Verification:

- `supabase projects list` confirmed `iosqakynywnrwxrexrfh` is the `honbabseoul` project.
- `supabase gen types typescript --project-id iosqakynywnrwxrexrfh > src/lib/database.types.ts` completed successfully.
- `pnpm db:types` completed successfully when run with access to the local Supabase CLI login token.
- `pnpm lint` passed.
- `pnpm test` passed: 5 files, 40 tests.
- `pnpm build` passed. Existing Tailwind warning for a wildcard CSS-variable arbitrary-color sample remained a known housekeeping item.

Follow-up safe cleanup:

- Connected UGC submission insert rows to `TablesInsert<"restaurants">`.
- Updated `context/access-policy.md` to point team-shared authority at `AGENTS.md` and `.hermes/` instead of legacy `.claude/settings.json`.
- Excluded `.hermes/archive`, `context`, and `docs` from Tailwind source scanning in `src/app/globals.css` so documentation examples do not generate utilities.

Follow-up verification:

- `pnpm lint` passed.
- `pnpm test` passed: 5 files, 40 tests.
- `pnpm build` passed without the prior Tailwind CSS optimizer warning.

## 2026-05-03 — UGC Form Entry Slice

Decision:

- Added a localized UGC submission form to `/[locale]`.
- Added a Server Action that converts form data into `submitPending` input and redirects with success, invalid, or error status.
- Kept `reason` validation in place but did not persist it because the `reason` column remains deferred.
- Extended JA/KO messages and smoke coverage for the visible submit button.

Reason:

- This connects the existing pending-submission repository to an actual user-facing entry point without changing schema or approval behavior.
- HTML required fields plus server-side zod validation keep the flow safe without adding extra client state.

Verification:

- `pnpm lint` passed.
- `pnpm test` passed: 5 files, 40 tests.
- `pnpm build` passed.
- `pnpm test:e2e` passed: 3 tests.
- Claude final review found no required fixes.
- Claude optional improvements applied: new color tokens are wired through `@theme inline`, `parseSubmissionStatus` avoids pre-guard enum casting, and the e2e smoke comment now includes the UGC entry surface.
- Final verification with Node 22.17.0 passed: `pnpm lint`, `pnpm test` (5 files, 40 tests), `pnpm build`, and `pnpm test:e2e` (3 tests).

## 2026-05-04 — UGC Feedback Cleanup

Plan:

- Claude produced the cleanup plan for UGC-1 and UGC-2.
- Codex accepted the plan with one verification correction: do not submit a real form during manual verification because that could write to Supabase.

Develop:

- Claude develop was attempted but blocked on file-write permissions for `src/app/[locale]/page.tsx` and `src/app/[locale]/actions.ts`.
- Codex applied the approved scope under the blocked-Claude-execution exception.
- Changed `searchParams.submission` handling to accept `string | string[] | undefined` and fail closed for array or unknown values.
- Added the `priceRange` empty-value intent comment.
- Changed submission feedback so `success` uses `role="status"` and `invalid`/`error` use `role="alert"`.
- Added e2e coverage for feedback live-region roles and unknown query fail-closed behavior.

Verification:

- `git diff --check` passed.
- Node 22.17.0 `pnpm lint` passed.
- Node 22.17.0 `pnpm test` passed: 5 files, 40 tests.
- Node 22.17.0 `pnpm build` passed.
- Node 22.17.0 `pnpm test:e2e` passed: 4 tests.
- Claude final review returned no required fixes.

## 2026-05-04 — Epic 5 Slice 1.1 Reason Persistence

Decision:

- Added `supabase/migrations/0002_submission_reason.sql` with nullable `restaurants.reason text`.
- Added a down migration for scoped rollback.
- Updated the Supabase `Database` type surface to include `reason`.
- Changed `submitPending` to persist validated `reason` and removed the length-only audit log.
- Changed public restaurant reads from `select("*")` to an explicit public column list so approved rows do not expose submission reasons through the public read repository.
- Updated `pnpm db:push` so fresh DB setup applies `0001` and `0002`.

Reason:

- The deferred `reason` field is part of the UGC submission contract and belongs with Epic 5 write-path work.
- A nullable additive column preserves existing rows and avoids changing approval/status behavior.
- Explicit public selects keep internal submission context out of the public restaurant model even though the table now stores it.

Verification:

- Claude-first plan review was attempted, but `claude` was not available in the current shell PATH.
- `git diff --check` passed.
- Node 22.17.0 `pnpm test` passed: 5 files, 41 tests.
- Node 22.17.0 `pnpm lint` passed.
- Node 22.17.0 `pnpm build` passed.
- Node 22.17.0 `pnpm test:e2e` initially failed in sandbox with `listen EPERM` on `0.0.0.0:3000`, then passed outside sandbox: 4 tests.
- Applied `supabase/migrations/0002_submission_reason.sql` to the configured `DATABASE_URL` DB; `information_schema.columns` confirmed `restaurants.reason` has type `text`.

## 2026-05-04 — Supabase Secret Key Rotation Prep

Decision:

- Prepared the admin client to prefer `SUPABASE_SECRET_KEY` and fall back to legacy `SUPABASE_SERVICE_ROLE_KEY`.
- Updated `.env.local.example` to document the new `sb_secret_...` server-only key and legacy fallback.
- Kept actual key creation/replacement/deletion pending because no `SUPABASE_ACCESS_TOKEN` was available in the shell and deleting an API key is irreversible.

Reason:

- Supabase now recommends replacing legacy JWT-based `service_role` keys with new Secret API Keys where possible.
- This is a no-downtime migration path: introduce the new key, update server environments, verify, then delete the exposed legacy key.

Verification:

- `git diff --check` passed.
- Node 22.17.0 `pnpm test` passed: 5 files, 45 tests.
- Node 22.17.0 `pnpm lint` passed.
- Node 22.17.0 `pnpm build` passed.
- After `SUPABASE_ACCESS_TOKEN` was added to `.env.local`, Management API access was verified by listing project API keys without printing key values.
- Existing project Secret API Key was revealed through the Management API and written to `.env.local` as `SUPABASE_SECRET_KEY` without printing the value.
- Supabase JS query using `SUPABASE_SECRET_KEY` passed: `restaurants_count=20`.

Carry-over:

- Update deployed server environments with `SUPABASE_SECRET_KEY`.
- Do not disable legacy JWT keys yet: the current public client still uses legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and Supabase legacy disablement affects anon and service_role together.

## 2026-05-04 — Supabase Publishable Key Migration Prep

Decision:

- Prepared public Supabase clients to prefer `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and fall back to legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Updated `.env.local.example` to document the new `sb_publishable_...` public key and legacy fallback.
- Revealed the existing project publishable key through the Management API and wrote it to `.env.local` without printing the value.

Reason:

- Legacy JWT key disablement affects both anon and service_role legacy keys, so public clients must migrate before disabling legacy JWT keys.
- The fallback keeps local and deployed environments working while env values are rolled forward.

Verification:

- `git diff --check` passed.
- Supabase JS query using `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` passed with RLS read: `approved_count=20`.
- Node 22.17.0 `pnpm test` passed: 5 files, 46 tests.
- Node 22.17.0 `pnpm lint` passed.
- Node 22.17.0 `pnpm test:e2e` passed: 4 tests.
- Node 22.17.0 `pnpm build` initially failed in sandbox due to DNS failure fetching Google Fonts, then passed outside sandbox with network access.

Carry-over:

- Update deployed environments with `SUPABASE_SECRET_KEY` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Disable legacy JWT keys only after deployed verification and explicit approval.

## 2026-05-04 — Vercel Supabase Env Migration

Decision:

- Added Vercel project env `SUPABASE_SECRET_KEY` as `sensitive` for production and preview.
- Added Vercel project env `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as plain for production, preview, and development.
- Did not add `SUPABASE_SECRET_KEY` to Vercel development because Vercel rejects sensitive env vars for the development target.
- Redeployed the latest Vercel deployment so the new env configuration is represented in an actual deployment.

Verification:

- `VERCEL_TOKEN` from `.env.local` was present and authorized for the `honbabseoul` Vercel project.
- Vercel API env upsert returned success for both keys without printing values.
- Vercel API env list confirmed key/type/target only:
  - `SUPABASE_SECRET_KEY`: sensitive, production/preview.
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: plain, production/preview/development.
- Redeploy `dpl_GY9W1SfYK833weFRQFiCxnpYJQuf` reached `READY`.
- Deployment smoke for `https://honbabseoul-4v0m1124i-meggs-projects.vercel.app/ja` returned HTTP 200.

Carry-over:

- Disable Supabase legacy JWT keys only after explicit approval and one final audit that no remaining runtime depends on legacy anon/service_role keys.

## 2026-05-04 — Legacy JWT Disable Audit

Findings:

- Supabase Management API reported legacy anon/service_role keys are still enabled.
- Vercel env list contains only the new Supabase key names among the audited keys:
  - `SUPABASE_SECRET_KEY`: sensitive, production/preview.
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: plain, production/preview/development.
- Local `.env.local` still contains legacy keys, but current code prefers the new keys and the legacy values are fallback only.
- The deployed `dev` redeploy used GitHub commit `e1d7dd8`, which predates the local key-migration code.
- Pushed `harness/hermes-core-cutover-20260503` to GitHub and Vercel created preview deployment `dpl_7Sz3xjvPZyHLdrkFujSnks1cJwcc`.

Verification:

- Vercel preview deployment for `harness/hermes-core-cutover-20260503` reached `READY`.
- Preview smoke for `https://honbabseoul-gur43s5qh-meggs-projects.vercel.app/ja` returned HTTP 200 and included the current UGC submission form surface.

Decision:

- Do not disable legacy JWT keys yet. Current key-migration code is verified on preview only, not on the deployed branch.

Carry-over:

- Open and merge a PR from `harness/hermes-core-cutover-20260503` into `dev`.
- Verify the deployed branch after merge.
- Disable Supabase legacy JWT keys only after deployed-branch verification and explicit approval.

Follow-up:

- Opened draft PR #5: https://github.com/0xMegg/honbabseoul/pull/5

## 2026-05-04 — Key Migration PR Merge And Dev Smoke

Decision:

- Closed draft PR #5 after the GitHub connector failed to mark the draft ready because of a connector GraphQL field mismatch.
- Opened non-draft PR #6 and merged it into `dev`: https://github.com/0xMegg/honbabseoul/pull/6
- Kept Supabase legacy JWT keys enabled because disablement is production-impacting and requires explicit approval.

Verification:

- PR #6 merge commit on `dev`: `32ddb3d4c8eecbd9d07825a802f5b3ae38b01d5c`.
- Vercel `dev` deployment `dpl_2WxujWtYG31JEcmm1bcPxU16pN6p` reached `READY`.
- Smoke for `https://honbabseoul-inaopeoep-meggs-projects.vercel.app/ja` returned HTTP 200 and included the current UGC submission form surface.

Carry-over:

- Disable Supabase legacy JWT keys only after explicit approval.
- After disablement, verify deployed `/ja` and the relevant Supabase read/write path.

## 2026-05-04 — Legacy JWT Disable And Submission Write Fix

Decision:

- Disabled Supabase legacy JWT keys through the Management API after explicit approval.
- Kept public read paths on the publishable key.
- Switched `submitPending` to the server-only Supabase admin client for UGC submission writes.

Reason:

- Management API confirmed legacy JWT keys changed from `enabled: true` to `enabled: false`.
- After disablement, publishable-key REST reads returned HTTP 200, but REST inserts failed with RLS `42501` because the previous insert policy targeted the JWT `anon` role.
- `submitPending` is only called from a Server Action, so using `SUPABASE_SECRET_KEY` for this write path keeps the key server-only and avoids relying on legacy JWT role mapping.

Verification:

- Supabase Management API legacy key status confirmed `enabled: false`.
- Publishable-key read check returned HTTP 200.
- Publishable-key insert rollback check returned RLS `42501`, confirming the post-disable write gap.
- `git diff --check` passed.
- Node 22.17.0 `pnpm test` passed: 5 files, 46 tests.
- Node 22.17.0 `pnpm lint` passed.
- Node 22.17.0 `pnpm build` passed.
- Node 22.17.0 `pnpm test:e2e` passed: 4 tests.

Carry-over:

- Push the submission admin-client fix to `dev`.
- Wait for the Vercel deployment and smoke `/ja` plus deployed submission behavior.

Follow-up:

- Pushed commit `b38f2f3` to `dev`; Vercel deployment `dpl_AcENcSCQ6W65U7bbN5pxaXGv9Z2P` reached `READY`.
- Protected deployment access required a Vercel share URL for smoke checks.
- `/ja` HTML smoke passed through the share URL.
- Actual browser form submission returned HTTP 500 and did not create a row.
- Vercel env audit showed `SUPABASE_SECRET_KEY` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` existed, but `NEXT_PUBLIC_SUPABASE_URL` was missing.
- Added `NEXT_PUBLIC_SUPABASE_URL` to Vercel env for production/preview/development.

Carry-over:

- Push this env follow-up record to trigger a redeploy.
- Verify the new deployment's `/ja` page and submission write behavior.

Follow-up:

- Pushed commit `219fc63` to `dev`; Vercel deployment `dpl_CBreYYS6RGRKzEBTRYLKdAwV4FM8` reached `READY`.
- Protected deployment share URL smoke for `/ja` passed.
- Browser submission against `https://honbabseoul-mu25phxbt-meggs-projects.vercel.app/ja` returned POST 303 and redirected to `?submission=success`.
- Supabase REST check using `SUPABASE_SECRET_KEY` found the smoke row with `status=pending`.
- Smoke row cleanup returned HTTP 204 and follow-up select confirmed count 0.
- Final Supabase Management API check confirmed legacy JWT keys remain `enabled: false`.

Decision:

- Supabase legacy JWT migration is complete and verified on deployed `dev`.

## 2026-05-04 — Core Claude CLI Policy Forward Propagation

Decision:

- Adopted Hermes Core `/Users/mero/Dev/13.claude/templates/hermes-essence/policy/claude-cli.md` as local active policy.
- Added `.hermes/policy/claude-cli.md`, added it to `AGENTS.md` read order, and indexed it in `.hermes/wiki/index.md`.

Reason:

- Honbabseoul previously recorded a Claude-first review attempt where `claude` was unavailable in the current shell PATH.
- The Core policy separates GUI PATH failures, Claude auth failures, and workspace read-permission failures so future reviews do not collapse them into one generic "Claude unavailable" state.

Claude review:

- Core policy was reviewed by Claude on 2026-05-04; this forward propagation is a scoped adoption of that reviewed policy.

Verification:

- Policy file exists, read order references it, and wiki index/log record the adoption.

## 2026-05-04 — UGC Invalid Input Preservation

Decision:

- Preserved submitted UGC form values when server-side validation fails.
- Used an invalid-only, short-lived, HTTP-only flash cookie from the Server Action redirect and page-level `defaultValue` / `defaultChecked` rendering.
- Kept submitted free-form values out of the redirect URL.
- Added a shared typed form-value key list so the Server Action preservation path and page restoration path do not drift silently.

Reason:

- The current form is a Server Component with a Server Action redirect flow, so flash cookie restoration preserves input without adding client state.
- Invalid preservation helps users correct server-side validation failures such as a non-Naver URL without retyping every field.
- Claude review correctly rejected query-string restoration because UGC `reason` is free-form user text and can leak through logs, browser history, and `Referer` headers.

Verification:

- Local `pnpm` was unavailable in the Codex shell PATH, so verification used bundled Node plus local project binaries.
- `eslint .` passed.
- `vitest run` passed: 5 files, 46 tests.
- `next build` passed.
- `playwright test` passed against a local Next dev server: 6 tests.
- Claude follow-up review was requested after the initial query-string implementation and returned required fixes for URL privacy, fabricated-query E2E coverage, and key drift; those fixes were applied before final verification.
- Claude final re-review returned `NO REQUIRED FIXES`; optional note only: cookie-size headroom is thin but within typical per-cookie limits for current field caps.

## 2026-05-04 — UGC Invalid Input Preservation Follow-up

Decision:

- Made `hb_ugc_form` one-shot by rendering a client component on invalid/error feedback pages that calls a Server Action to delete the HTTP-only flash cookie after the first render.
- Preserved submitted form values for `SubmissionDatabaseError` because the failure is backend-caused, not user-caused.
- Added focused unit coverage for invalid/error cookie preservation, success/error cleanup, explicit flash-cookie clearing, and `submission-flash.ts` encode/decode normalization.

Reason:

- Server Components can read the flash cookie for first render, while the Server Action preserves HTTP-only deletion semantics without exposing submitted free-form values to the browser URL.
- DB-write failures should let the user retry without retyping, while success must clear any stale preserved values.

Verification:

- Local `pnpm` was unavailable in the Codex shell PATH, so verification used bundled Node plus local project binaries.
- Targeted Vitest passed: `src/app/[locale]/submission-flash.test.ts` and `src/app/[locale]/actions.test.ts`, 7 tests.
- Full Vitest passed: 7 files, 53 tests.
- `next build` completed successfully.
- Standalone `eslint .` failed before linting source because the current install cannot resolve `eslint-plugin-react-hooks` from `eslint-config-next/core-web-vitals`; `next build` printed the same ESLint plugin failure but still completed type/build output.
- Claude review was attempted with full working-tree inspection but the default invocation produced no output and was killed after repeated waits; `claude auth status` reported logged in, and a lower-effort `sonnet` review completed with `NO REQUIRED FIXES`.

Follow-up:

- Commit `a55d90c` was pushed to PR #7.
- PR #7 checks passed: GitGuardian, Vercel Preview Comments, and Vercel.
- PR #7 was squash-merged into `dev` as `daaea6427585e30f3f05948f011d19d16bdd899d`.

## 2026-05-04 — Claude CLI Policy Docs Cleanup

Decision:

- Kept the Hermes Claude CLI policy adoption as a docs-only cleanup separate from PR #7 runtime work.
- Added `.hermes/policy/claude-cli.md` to active read order and wiki policy index.

Reason:

- The policy affects agent invocation judgment, not product runtime behavior.
- Separating it from the UGC runtime PR keeps review scope and git history clear.

Claude review:

- Claude reviewed the docs-only cleanup and returned `NO REQUIRED FIXES`.

Verification:

- Diff is limited to `AGENTS.md`, `.hermes/policy/claude-cli.md`, `.hermes/wiki/index.md`, `.hermes/wiki/log.md`, `.hermes/NEXT.md`, and `.hermes/logs/log.md`.

Follow-up:

- PR #8 checks passed: GitGuardian, Vercel Preview Comments, and Vercel.
- PR #8 was squash-merged into `dev` as `45247c8d605bd16e77a410396481a3878c13c041`.

## 2026-05-04 — Epic 4 Slice 4.1.1 Naver Maps Client Wrapper

Decision:

- Selected Epic 4 / Slice 4.1.1 as the next product slice after UGC and Hermes docs cleanup landed.
- Added a client-side Naver Maps SDK loader and `MapClient` wrapper, using `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID` from the server page and passing it to the client component as a prop.
- Mounted the first map surface on `/[locale]` with Seoul City Hall as the default center.

Reason:

- The read-path map is the next MVP product loop after UGC submission.
- A verified SDK loader lowers the largest external integration risk before pin/filter/bottom-sheet work.
- The map loading text intentionally does not use `role="status"` so it does not collide with submission feedback live-region semantics.

Claude review:

- Claude selected Slice 4.1.1 as the next product slice.
- Claude reviewed the implementation and returned `NO REQUIRED FIXES`.

Verification:

- Official Naver Maps JavaScript API v3 docs checked for the SDK URL format: `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=...`.
- Local `.env.local` contains `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID`.
- Full Vitest passed: 8 files, 57 tests.
- `next build` completed successfully; the existing `eslint-plugin-react-hooks` resolution warning still appears during the lint phase.
- Browser smoke against local `/ja` confirmed the map container rendered, SDK script src was present, `window.naver.maps.Map` existed, and no console/page errors were captured.
- Playwright E2E passed: 6 tests.

Follow-up:

- PR #9 checks passed: GitGuardian, Vercel Preview Comments, and Vercel.
- PR #9 was squash-merged into `dev` as `4289fa3430094390530f5f1938ab99116a390723`.

## 2026-05-04 — Epic 4 Slice 4.1.2 Map Page Shell

Plan:

- Keep the slice scoped to map-first page shell, localized header, and UGC form placement.
- Exclude pins, filters, bottom sheet, and restaurant data fetching.
- Let the shell control the inner map container height through `MapClient.containerClassName`.

Decision:

- Added a reusable `Header` component for the logo and localized heading copy.
- Reworked `/[locale]` into a map-first first viewport while keeping the UGC submission form as a lower page section.
- Added `MapClient` shell styling props and guarded map-constructor failures so Naver SDK/auth failures do not crash the app.

Reason:

- Slice 4.1.2 should establish the read-path visual shell before filter/pin/bottom-sheet behavior lands.
- Keeping UGC on the same page preserves the existing working submission flow while moving primary product value toward the map.
- Map loading/error copy must not reuse submission live-region roles.

Claude review:

- Claude reviewed the plan and required one clarification: apply external height control to the inner map div via `containerClassName`.
- Claude reviewed the implementation and returned `NO REQUIRED FIXES`.

Verification:

- Full Vitest passed: 9 files, 60 tests.
- `next build` completed successfully; the existing `eslint-plugin-react-hooks` resolution warning still appears during the lint phase.
- Playwright E2E passed: 6 tests.
- Browser smoke against local mobile `/ja` confirmed heading visible, map box `372x530.6875`, submit button visible, no captured console/page errors, and CLS `0`.

Follow-up:

- PR #10 checks passed: GitGuardian, Vercel Preview Comments, and Vercel.
- PR #10 was squash-merged into `dev` as `0574addb056afa5681d692b9c0b76fab72990865`.

## 2026-05-04 — Epic 4 Slice 4.2.1 Filter State And Chip UI

Plan:

- Implement URL-synced filter state for `solo`, `jp`, and `late`.
- Render three filter chips above the map.
- Exclude restaurant pins, data fetching, and bottom-sheet behavior.
- Wrap the `useSearchParams` consumer in a `Suspense` boundary.

Decision:

- Added `useFilters` with `?solo=1&jp=0&late=0` serialization and default normalization.
- Added `FilterBar` with `aria-pressed` chip buttons and `router.replace(..., { scroll: false })`.
- Mounted the filter bar above the map in the locale home shell.

Reason:

- The filter URL contract should be fixed before the pin layer consumes it.
- Keeping data fetching out of this slice preserves the Stage 2 boundary between filter state and marker rendering.

Claude review:

- Claude reviewed the plan and required explicit `Suspense` handling for `useSearchParams`.
- Claude reviewed the implementation and returned `NO REQUIRED FIXES`.

Verification:

- Full Vitest passed: 11 files, 67 tests.
- `next build` completed successfully; the existing `eslint-plugin-react-hooks` resolution warning still appears during the lint phase.
- Browser smoke against local `/ja` toggled Japanese-menu and solo chips, produced `/ja?solo=0&jp=1&late=0`, preserved state after refresh, kept map visible, and captured no console/page errors.
- Playwright E2E passed: 6 tests.

Follow-up:

- PR #11 checks passed: GitGuardian, Vercel Preview Comments, and Vercel.
- PR #11 was squash-merged into `dev` as `c16213f4e0e75b26763440f58eae35b5cffda8ab`.

## 2026-05-04 — Epic 4 Slice 4.2.2 Restaurant Pin Layer

Plan:

- Fetch approved restaurants in the existing locale Home server component using URL filter state.
- Map `{ solo, jp, late }` to repository filters `{ isSolo, hasJpMenu, isLateNight }` explicitly.
- Render only latitude/longitude-bearing restaurants as Naver Maps markers inside `MapClient`.
- Exclude bottom sheet detail UI, clustering, and custom marker UI from this slice.

Decision:

- Split filter parsing into a server/client-safe `filter-params.ts` module.
- Added server-side `listApproved(await createSupabaseServerClient(), filters)` to `/[locale]`.
- Added `restaurants` support to `MapClient`, plus Naver `Marker` typings and marker cleanup through `setMap(null)`.

Reason:

- The pin layer should consume the filter URL contract fixed in Slice 4.2.1 before bottom-sheet interaction is added.
- Keeping marker lifecycle inside `MapClient` avoids exposing an imperative map API before a real second consumer exists.

Claude review:

- Claude reviewed the plan and required explicit page file scope, filter mapping, server searchParams parsing, Naver `Marker` typing, marker lifecycle synchronization, and repository error behavior.
- Claude reviewed the implementation and returned `NO REQUIRED FIXES`.

Verification:

- Targeted Vitest passed: filter params and `MapClient` marker tests, 12 tests.
- Full Vitest passed: 11 files, 70 tests.
- `next build` completed successfully; the existing `eslint-plugin-react-hooks` resolution warning still appears during the lint phase.
- Browser smoke against local `/ja?solo=0&jp=1&late=0` confirmed the map rendered, Japanese-menu chip stayed active after reload, and no console/page errors were captured.
- Playwright E2E passed: 6 tests.
