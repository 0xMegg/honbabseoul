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

- Later rechecked on 2026-05-04: the NCP JavaScript API docs now state that the SDK query parameter changed from `ncpClientId` to `ncpKeyId`. The old line below was stale and caused a local auth false-negative.
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

Follow-up:

- PR #12 checks passed: GitGuardian, Vercel Preview Comments, and Vercel.
- PR #12 was squash-merged into `dev` as `c5b177471fd8c0a81c9a872b47a9dfeeb68b2efe`.

## 2026-05-04 — Epic 4 Slice 4.3.1 Bottom Sheet Detail

Plan:

- Add marker click selection without expanding clustering or custom marker scope.
- Manage selected restaurant detail in a client read-path shell and fetch detail through `getById`.
- Render a fixed bottom sheet with localized restaurant detail, address copy, and a Naver Maps web link.
- Keep `useSearchParams` consumers inside a `Suspense` boundary and add ja/ko detail copy together.

Decision:

- Added `MapReadPath` as the client shell composing `FilterBar`, `MapClient`, `BottomSheet`, and `RestaurantDetail`.
- Extended `MapClient` marker lifecycle to emit selected restaurant ids and remove Naver Maps event listeners during cleanup.
- Added detail rendering with locale fallback, price display as `₩` / `₩₩` / `₩₩₩`, address copy on successful Clipboard API writes, and `https://map.naver.com` external links only.

Reason:

- The bottom sheet composes the filter and pin slices without changing server write paths.
- Re-fetching selected detail through `getById` keeps the detail read boundary explicit before later richer detail fields or permissions are added.

Claude review:

- Claude reviewed the plan and required Suspense boundary preservation, Naver marker listener cleanup, and synchronized ja/ko i18n keys.
- Claude reviewed the implementation and returned `NO REQUIRED FIXES`.

Verification:

- Targeted Vitest passed: `MapClient`, `RestaurantDetail`, and `MapReadPath` tests, 13 tests.
- Full Vitest passed: 13 files, 76 tests.
- `next build` completed successfully; the existing `eslint-plugin-react-hooks` resolution warning still appears during the lint phase.
- Browser smoke against local `/ja?solo=0&jp=1&late=0` confirmed the map rendered, Japanese-menu chip stayed active, no dialog opened by default, and no console/page errors were captured.
- Playwright E2E passed: 6 tests.

Follow-up:

- PR #13 checks passed: GitGuardian, Vercel Preview Comments, and Vercel.
- PR #13 was squash-merged into `dev` as `a98975995805435682a83d0b73985fe8144bd7dd`.

## 2026-05-04 — Headless Read Path Audit

Plan:

- Verify the merged `dev` branch through a real headless browser rather than relying only on the existing smoke suite.
- Cover locale routing, Japanese/Korean render, filter chip interaction, Naver Maps SDK readiness, invalid submission preservation, and valid submission success.
- Clean up any smoke submission row created during the valid submission scenario.

Findings:

- Existing Playwright smoke passed: 6 tests.
- `/` redirected to `/ja`; `/ja` and `/ko` primary text and form surfaces rendered.
- Invalid submission preserved entered values and valid submission reached `submission=success`.
- Naver Maps SDK script loaded, but Naver validation reported `Authentication Failed` for `http://localhost:3000/ja`; `window.naver.maps.Map` and `window.naver.maps.Marker` stayed unavailable.
- The map container remained empty in the headless audit, and the user-facing map error label did not appear in the observed body text.
- Clicking the `日本語メニューあり` filter chip changed the URL to `/ja?solo=1&jp=1&late=0`, then the page showed a client-side application error. Directly opening the same URL rendered normally with the expected filter state.

Decision:

- Treat these as the next product task before clustering, custom marker UI, or broader read-path enhancements.
- Next work should fix Naver Maps local/dev auth, add a visible SDK-auth failure fallback, isolate the filter client-transition crash, and expand E2E coverage to include map/error/filter behavior.

Verification:

- Headless audit ran against local `dev` with a `Pixel 7` Chromium profile.
- The generated valid-submission smoke row `Codex smoke 1777885680099` was deleted from Supabase after verification.

## 2026-05-04 — Local Read Path Stability Fix

Plan:

- Prevent Naver Maps localhost auth failure from leaving the app in a partially initialized SDK state.
- Keep filter chip transitions stable under map failure and under very fast post-render clicks.
- Add regression coverage for the visible map fallback and filter URL transition.

Decision:

- `useNaverMapsSdk` now marks loaded/failed SDK scripts with dataset state, treats already-failed SDK scripts as `error`, and disables SDK loading on localhost by default unless `NEXT_PUBLIC_NAVER_MAPS_ALLOW_LOCALHOST=true`.
- `.env.local.example` documents the opt-in flag and ties it to NCP web service URL whitelist setup.
- `MapClient` now detects the case where Naver auth removes map constructors after initial map creation, clears map-owned DOM/marker state, and shows the map error fallback.
- `FilterBar` disables chip buttons until hydration so very fast clicks do not get lost before React event handlers attach.
- Playwright smoke now mocks an auth-failed Naver SDK and asserts that the fallback appears, filter URL transition completes, and no `Application error` is shown.

Verification:

- Targeted Vitest passed: `FilterBar` and `MapClient`, 14 tests.
- Full Vitest passed: 13 files, 79 tests.
- Playwright E2E passed: 7 tests.
- Real headless audit against local `dev` passed all 7 scenarios after the fix; filter chips reached `/ja?solo=1&jp=1&late=1`, fallback text appeared, and no page errors were captured.
- `next build` completed successfully.
- Supabase smoke rows created during valid-submission verification were cleaned up: 3 rows deleted.

## 2026-05-04 — Verification Gap Diagnosis

Diagnosis:

- Prior Epic 4 completion claims were too dependent on unit tests, shallow Playwright smoke, and limited browser smoke.
- The existing smoke suite confirmed locale rendering and form basics, but it did not prove the core user read path: real SDK readiness/failure, filter click transitions, marker visibility, marker click, or bottom-sheet selection.
- Naver Maps created a misleading success signal: the SDK script returned HTTP 200, but Naver validation failed with `Authentication Failed`, leaving the browser in a partial SDK state. Previous checks did not assert `window.naver.maps.Map`, visible fallback, or marker DOM behavior.
- The filter bug was timing-sensitive: direct loading `?solo=1&jp=1&late=0` rendered correctly, while a real click transition after SDK auth failure could show a client-side application error. Previous verification did not exercise that transition under failure conditions.
- Fast user interaction also exposed a hydration gap: filter buttons could be clicked before React handlers were attached. Previous tests clicked after test-render hydration and did not represent that user timing.

Policy for future Hermes work:

- User-facing product tasks are not done until at least one real headless scenario exercises the primary workflow, not just component tests or route render smoke.
- External SDK features require both success-path and failure-path verification. For maps, assert at minimum one of: usable `Map`/`Marker` constructors with tiles/markers, or a visible user-facing fallback.
- Route/query UI changes must be verified through real click transitions and direct URL loads.
- Form flows that write remote data must include cleanup verification for smoke rows.
- Completion logs must record what was actually observed, not just which commands passed.

Carry-over:

- After NCP web service URL whitelist is configured, re-enable local Naver SDK loading with `NEXT_PUBLIC_NAVER_MAPS_ALLOW_LOCALHOST=true` and verify real tiles, markers, marker click, and bottom-sheet detail.

## 2026-05-04 — Claude Review of Local Read Path Stability Fix

Plan:

- Ask Claude CLI to review the current uncommitted map/filter stability changes without editing files.
- Focus the review on required fixes in `useNaverMapsSdk.ts`, `MapClient.tsx`, `FilterBar.tsx`, and `e2e/smoke.spec.ts`.

Invocation notes:

- `claude auth status` failed in the GUI shell because `claude` was not on PATH.
- `/opt/homebrew/bin/claude auth status` succeeded with Claude.ai auth.
- Initial non-TTY and broad review invocations hung without output and were stopped.
- The successful invocation used `/opt/homebrew/bin/claude -p` with TTY, `--model sonnet`, `--effort low`, `--tools Read,Grep`, `--permission-mode dontAsk`, and `--no-session-persistence`.

Claude result:

- `NO REQUIRED FIXES`.
- Claude found the SDK status handling, map cleanup/watchdog, filter hydration guard, and Naver auth-failure E2E stub to be safe.

Residual risk:

- Real Naver tile/marker/bottom-sheet verification still depends on NCP URL whitelist setup and `NEXT_PUBLIC_NAVER_MAPS_ALLOW_LOCALHOST=true`.

## 2026-05-04 — Claude Plan for Real Naver Maps Verification

Plan source:

- Claude CLI was asked to plan the next task without editing files.
- Invocation used `/opt/homebrew/bin/claude -p` with TTY, `--model sonnet`, `--effort low`, `--tools Read,Grep`, `--permission-mode dontAsk`, and `--no-session-persistence`.

Claude plan summary:

- Treat the next task as human-gated verification after NCP URL whitelist setup, not as a new feature slice.
- Prerequisites: add `http://localhost:3000` to the NCP Maps web service URL whitelist, set `NEXT_PUBLIC_NAVER_MAPS_ALLOW_LOCALHOST=true` locally, confirm `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID`, and confirm at least one approved restaurant has non-null coordinates.
- Verification scope: real map tiles render, approved coordinate-bearing restaurant markers appear, marker click opens the bottom sheet, filter chips still update URL without crashing, and the fallback path still works when localhost SDK loading is disabled.
- Existing fallback E2E should remain stubbed; any real Naver SDK E2E should be a separate explicit suite so default CI does not depend on NCP/network availability.
- Out of scope: custom markers, clustering, production deployment verification, Supabase migrations, broad seed tooling, and changing the default `.env.local.example` value from `false`.

Codex correction:

- Claude's draft SQL used placeholder column names `name`, `lat`, and `lng`; the actual `restaurants` columns are `name_ja`, `name_ko`, `latitude`, and `longitude`.

## 2026-05-04 — Codex/Claude Progress on Real Naver Verification Gate

Plan:

- Use Codex to check the concrete prerequisites and run real headless verification.
- Use Claude to validate the next fix direction when real SDK behavior exposes additional failure modes.

Codex findings:

- `.env.local` has `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID=5xcs9i2c5v`.
- `.env.local` does not currently set `NEXT_PUBLIC_NAVER_MAPS_ALLOW_LOCALHOST=true`; the local default remains SDK-disabled.
- Supabase has enough marker data for a meaningful map demo: at least 10 `approved` restaurants with non-null `latitude` and `longitude`.
- When the dev server is started with `NEXT_PUBLIC_NAVER_MAPS_ALLOW_LOCALHOST=true`, Naver still returns `Authentication Failed` for `http://localhost:3000/ja`, so the NCP web service URL whitelist is still not configured for local verification.

Claude-guided fix:

- Claude diagnosed a two-phase Naver auth failure: the SDK can expose constructors after script load, then revoke them after async auth validation.
- Claude required two defenses: post-load auth validation in `useNaverMapsSdk`, and constructor-safe marker usage in `MapClient`.
- Codex implemented post-load validation before marking the SDK `ready`, added `LatLng`/`Marker` constructor guards, and wrapped Naver cleanup calls (`removeListener`, `marker.setMap(null)`, `map.destroy()`) because auth failure can make Naver cleanup APIs throw.

Verification:

- Targeted `MapClient` Vitest passed: 14 tests.
- Full Vitest passed: 13 files, 82 tests.
- Playwright E2E passed: 7 tests.
- Real headless auth-failure stack check with `NEXT_PUBLIC_NAVER_MAPS_ALLOW_LOCALHOST=true` and missing NCP whitelist reached `/ja?solo=1&jp=1&late=1`, showed the Japanese map fallback, and captured no page errors after cleanup hardening.
- `next build` completed successfully.
- Claude reviewed the final hardening and returned `NO REQUIRED FIXES`.

Carry-over:

- The only remaining gate for real map tiles/markers is external NCP configuration: add `http://localhost:3000` to the Naver Maps web service URL whitelist, then rerun the real SDK verification.

## 2026-05-04 — NCP Console Access Attempt

Codex check:

- Opened NCP from the Codex in-app browser and navigated to `https://console.ncloud.com/`.
- NCP redirected to `https://auth.ncloud.com/login`.
- No NCP CLI/API credentials or local NCP command-line tools were found in the project environment.

Gate:

- NCP web service URL whitelist configuration requires user login/authentication in the NCP console.
- This is a human gate; Codex should resume after the user logs in and adds `http://localhost:3000` to the Naver Maps web service URL whitelist, or after the user confirms a logged-in browser session is available for this task.

## 2026-05-04 — Real Naver Verification After User NCP Confirmation

Trigger:

- User confirmed the NCP application id `5xcs9i2c5v`, `Dynamic Map` selection, and local service URLs including `http://localhost:3000/ja`.

Codex findings:

- Official Naver Maps NCP documentation was rechecked. The current NCP JavaScript SDK load parameter is `ncpKeyId`; older docs/examples still mention `ncpClientId`, which caused the local auth false-negative.
- The app was still generating `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=...`; Naver returned `Authentication Failed` even with the user's whitelist configuration.
- After changing the SDK URL to `ncpKeyId`, real headless verification showed `window.naver.maps.Map`, `Marker`, and `LatLng` available and the SDK script status `ready`.
- Marker click then exposed a separate browser-only env bug: `publicEnv` used dynamic `process.env[key]` lookup, so `NEXT_PUBLIC_SUPABASE_URL` was not inlined into the Next client bundle. Server render had restaurant data, but marker-to-detail failed when the browser tried to create a Supabase client.

Fix:

- `buildNaverMapsSdkUrl` now emits `ncpKeyId`.
- `.env.local.example` documents that the NCP key/client id is authenticated through `ncpKeyId`.
- `publicEnv` now reads `process.env.NEXT_PUBLIC_*` through direct property access so Next can inline browser public env values.

Verification:

- Targeted `MapClient` Vitest passed: 14 tests.
- Full Vitest passed: 13 files, 82 tests.
- Playwright E2E passed: 7 tests.
- `next build` completed successfully; the pre-existing missing `eslint-plugin-react-hooks` warning still appears during lint/type check, but build output completed.
- Real headless map flow with `NEXT_PUBLIC_NAVER_MAPS_ALLOW_LOCALHOST=true` passed: SDK URL used `ncpKeyId`, SDK status was `ready`, fallback was absent, 22 marker-like DOM elements were observed, a visible marker click opened the Japanese bottom sheet for `明洞ぼっちラーメン`, and no browser console/page errors were captured.
- Claude reviewed the current fixes and returned `NO REQUIRED FIXES`.

## 2026-05-04 — Instant Marker Detail Slice

Decision:

- The server read path already passes all public restaurant columns needed by the bottom sheet into `MapReadPath`.
- Re-fetching the same row from the browser on marker click adds latency and reintroduces a client Supabase/env dependency without adding detail fidelity.
- Marker selection should resolve the selected restaurant from the current list and render the bottom sheet immediately.

Change:

- `MapReadPath` no longer imports `getById` or `createSupabaseBrowserClient`.
- The selected marker id is matched against the current `restaurants` prop with `useMemo`.
- The detail loading label was removed from the client contract and JA/KO messages because marker detail no longer has an async loading state.

Verification:

- Targeted detail tests passed: `MapReadPath` and `RestaurantDetail`, 5 tests.
- Full Vitest passed: 13 files, 82 tests.
- Playwright E2E passed: 7 tests.
- Real headless Naver flow with `NEXT_PUBLIC_NAVER_MAPS_ALLOW_LOCALHOST=true` passed: SDK ready, 22 marker-like elements, marker click opened the Japanese bottom sheet, and no browser errors were captured.
- `next build` completed successfully; the pre-existing missing `eslint-plugin-react-hooks` warning still appears during lint/type validation, but build output completed.

## 2026-05-04 — Marker UX Polish Slice

Decision:

- After PR #15, marker click and detail rendering are stable. The next MVP usability gap is recognition: default Naver pins do not communicate the restaurant identity or selected state clearly.
- Clustering remains deferred; the current slice should improve marker readability and selection feedback without changing map data contracts.

Change:

- `MapClient` now renders custom marker HTML through the Naver marker `icon.content` option.
- Custom marker content uses Honbabseoul design tokens, includes the localized restaurant name, and escapes HTML before injection.
- Marker click stores the selected restaurant id, redraws markers, and marks the selected marker with filled brand styling.
- `MapReadPath` shows the current server-filtered result count below the filter chips.

Verification:

- Targeted marker/read-path tests passed: 17 tests.
- Full Vitest passed: 13 files, 83 tests.
- Playwright E2E passed: 7 tests.
- `next build` completed successfully; the pre-existing missing `eslint-plugin-react-hooks` warning still appears during lint/type validation, but build output completed.
- Real headless custom marker flow with `NEXT_PUBLIC_NAVER_MAPS_ALLOW_LOCALHOST=true` passed: SDK ready, visible result count, 16 custom marker elements, selected marker state after click, Japanese bottom sheet opened, and no browser errors were captured.

## 2026-05-04 — Branch Merge State Cleanup

### Context

- `git branch --no-merged dev` showed old `codex/*` branches even though their PRs were merged.
- GitHub PR state confirmed PR #1-#16 were merged into `dev`; PR #7-#16 used squash-style merge commits, so their original branch tips were not ancestors of `dev`.
- Tree diffs from `dev` to the stale branch tips showed that merging them now would revert current product code rather than add missing work.

### Actions

- Deleted local merged/stale branch refs for PR #1-#3, PR #6, and PR #7-#13.
- Deleted remote merged/stale branch refs for PR #1-#4, PR #6, and PR #7-#13.
- Preserved `snapshot/pre-hermes-cutover-20260503` as an archive pointer.
- Updated `.hermes/NEXT.md` and `.hermes/wiki/pages/honbabseoul-state.md` to record PR #16 as merged and remove the stale marker UX handoff.

### Verification

- `gh pr list --state all --limit 40 --json number,state,headRefName,baseRefName,mergedAt,mergeCommit,title`
- `git branch --all --verbose --no-abbrev`
- `git branch --no-merged dev`
- `git status --short --branch`

## 2026-05-04 — Vercel Naver Env Fix

### Context

- The `dev` branch preview `https://honbabseoul-66ty48zw5-meggs-projects.vercel.app` showed a Next.js server-side exception with digest `4089574995`.
- Vercel env listing showed Supabase envs were present, but `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID` was missing.
- The server page reads `publicEnv.naverMapsClientId` during render, so missing env fails before the map fallback can render.

### Actions

- Added `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID` to Vercel production, development, and `dev` preview envs.
- Created a local preview deployment `dpl_28rgpEyM2o8FXeUQfH2G4dr7DKN8`.
- Redeployed the Git `dev` preview deployment so `https://honbabseoul-git-dev-meggs-projects.vercel.app` points at `dpl_G9SwTGkXVyXGCcPBhbFDttRuv1u7`.

### Verification

- `vercel env ls` shows `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID` for Production, Development, and Preview (`dev`).
- `vercel inspect https://honbabseoul-2pwg1tgs8-meggs-projects.vercel.app` reports `READY` and the `honbabseoul-git-dev` alias.

## 2026-05-04 — Deployed Read Path Smoke Gate

Decision:

- Added a deployed-only Playwright smoke spec for the full `/ja` read path.
- `DEPLOYED_BASE_URL` switches Playwright to an existing deployment and disables the local dev-server webServer.
- `VERCEL_SHARE_URL` can be supplied for protected Vercel deployments so Playwright first sets the temporary auth cookie, then tests `/ja`.

Reason:

- The post-marker backlog called out a verification gap: unit and shallow local smoke checks did not prove the deployed read path.
- The deployment is protected by Vercel Authentication, so the smoke gate needs an explicit protected-preview access path.

Verification:

- Vercel access tool created a temporary share URL for `https://honbabseoul-git-dev-meggs-projects.vercel.app`, expiring on 2026-05-05 14:42:18.
- Protected dev preview smoke passed: Japanese page rendered, map label and result count were visible, no map error fallback or `Application error` appeared, custom markers rendered, a viewport-clickable marker opened the Japanese bottom sheet, closing worked, and the Japanese-menu filter transition preserved route and pressed state.
- `pnpm lint` passed on Node 22.17.0.
- `pnpm test` passed on Node 22.17.0: 13 files, 83 tests.
- `pnpm test:e2e` passed outside sandbox on Node 22.17.0: 7 passed, 1 deployed-only spec skipped.
- Deployed-only Playwright smoke passed outside sandbox on Node 22.17.0: 1 test.

Environment notes:

- Plain sandbox e2e failed with `listen EPERM` for the local dev server and Chromium MachPort permission errors; the same commands passed outside sandbox.
- Codex default Node v24 hit local native optional-binary code-signing failures for Rollup/Next SWC; Node 22.17.0 remains the working verification runtime.

## 2026-05-05 — Seed Data Read Path Acceptance

Decision:

- Added an automated seed-data acceptance test that reads `supabase/seed.sql` as the source of truth.
- The test verifies the curated MVP seed set size, public restaurant model compatibility, map/detail field completeness, Naver URL shape, and expected read-path filter counts.

Reason:

- The seed file documented expected counts in comments, but those expectations were not enforced by automation.
- The map read path now depends on seed rows having coordinates, localized names, localized addresses, safe Naver URLs, and enough rows after default UI filters.

Acceptance counts:

- All approved rows with filters off: 20.
- Default solo-friendly read path: 16.
- Default solo-friendly plus Japanese-menu filter: 15.
- Default solo-friendly plus late-night filter: 4.
- All three UI filters on: 4.

Verification:

- Targeted seed acceptance run passed on Node 22.17.0: 14 files, 87 tests.
- `pnpm test` passed on Node 22.17.0: 14 files, 87 tests.
- `pnpm lint` passed on Node 22.17.0.

## 2026-05-05 — Marker Clustering And Overlap Handling

Decision:

- Added lightweight client-side clustering inside `MapClient` using a small coordinate grid.
- Nearby restaurants now render as one branded count marker.
- Clicking a cluster expands that cluster into individual restaurant markers with small circular coordinate offsets, so marker-to-bottom-sheet selection remains available without introducing a new map library.
- Updated the deployed/read-path smoke to handle cluster-first map states by expanding a visible cluster before clicking an individual marker.

Reason:

- The post-marker backlog called out dense marker areas as the next read-path usability gap.
- This approach keeps the current Naver Maps marker API surface and bottom-sheet contract intact while reducing visual overlap in dense seed areas.

Verification:

- `MapClient` coverage now asserts nearby restaurants cluster first, cluster click does not select a restaurant prematurely, and expansion redraws offset individual markers.
- `pnpm test` passed on Node 22.17.0: 14 files, 88 tests.
- `pnpm lint` passed on Node 22.17.0.
- `pnpm build` passed on Node 22.17.0.
- `pnpm test:e2e` passed outside sandbox on Node 22.17.0: 7 passed, 1 deployed-only spec skipped.
- Real localhost Naver smoke passed with `NEXT_PUBLIC_NAVER_MAPS_ALLOW_LOCALHOST=true`: `/ja` rendered the map, marker/cluster path opened the Japanese bottom sheet, filter transition stayed stable, and the dev server was stopped afterward.

## 2026-05-05 — Path-Based Logo Replacement

Decision:

- Replaced the temporary font-dependent SVG `<text>` logo with fixed SVG path outlines for the bilingual `혼밥서울` / `ホンバプソウル` mark.
- Kept the accessible `<title>` text as `혼밥서울 (ホンバプソウル)`.
- Switched the logo title id to `useId()` so multiple logo instances do not duplicate `id` values.
- Updated Logo tests to assert that visible glyphs render as paths, not SVG text nodes, while token-backed `tone` fills still work.

Reason:

- The previous logo visually depended on device fonts. Path outlines make the brand mark locale-agnostic and device-agnostic.
- The product convention still requires a single bilingual mark with no locale branch.

Verification:

- Targeted Logo test passed on Node 22.17.0.
- `pnpm test` passed on Node 22.17.0: 14 files, 89 tests.
- `pnpm lint` passed on Node 22.17.0.
- `pnpm build` passed on Node 22.17.0.
- `git diff --check` passed.

## 2026-05-05 — Workflow Model Profile Surfaced

Decision:

- Hermes Core added a Recommended, opt-in stricter Claude-first workflow profile.
- Honbabseoul did not adopt it as active project policy in this change.
- Existing legacy harness provenance remains recorded: archived `.claude/commands/plan.md` used Opus, `develop.md` used Sonnet, and `review.md` used Opus.

Reason:

- Honbabseoul currently uses a lighter Hermes layer, and prior Core analysis explicitly identified forced adoption as a possible project-fit cost.
- Surfacing the profile preserves the reusable model mapping without adding process weight to active Honbabseoul product work.

Verification:

- No runtime source, automation, hook, permission, deployment, Supabase, or Vercel change occurred.
- Adoption remains available through project-local review under Hermes promotion policy.
- Claude non-interactive review was requested from Hermes Core with scoped Honbabseoul access but produced no stdout for more than 60 seconds and was terminated; Codex accepted this as a surfaced opt-in profile, not active adoption.

## 2026-05-06 — Next.js Workspace Root Warning Housekeeping

Decision:

- Set `outputFileTracingRoot` and `turbopack.root` in `next.config.ts` to the honbabseoul project directory.

Reason:

- The parent workouts directory contains another app with its own lockfile, so Next.js can infer the workspace root from multiple lockfiles and warn that the selected root may be wrong.
- Pinning both tracing and Turbopack roots keeps build/dev resolution scoped to this app without changing runtime behavior.

Verification:

- `pnpm lint` passed.
- `pnpm build` first failed inside the sandbox because Google Fonts DNS access was blocked, then passed with network access.
- `pnpm dev` started cleanly on `http://localhost:3000` with no workspace-root warning, then the dev server was stopped.

## 2026-05-06 — Restaurant Detail Media Slot

Decision:

- Added a media slot to the restaurant bottom-sheet detail.
- The detail renders a safe `http`/`https` `photo_url` when one exists and falls back to a stable branded placeholder when the curated row has no photo yet.
- Added JA/KO labels for representative photo alt text and the no-photo placeholder.
- Extended deployed read-path smoke coverage so future deployment checks assert the detail media slot.

Reason:

- MVP v1.0 requires visual emphasis in the restaurant detail, but the current seed data has `photo_url = NULL` for every fake row.
- A placeholder-first media slot improves the detail surface now without changing schema, seed data, storage, or approval workflow.

Verification:

- Targeted detail tests passed: 2 files, 6 tests.
- `pnpm lint` passed.
- `pnpm test` passed: 14 files, 90 tests.
- `pnpm build` passed.
- `pnpm test:e2e` passed: 7 passed, 1 deployed-only spec skipped.

## 2026-05-06 — UGC Photo Upload Wiring

Decision:

- Added an optional UGC photo field to the submission form with JPEG/PNG accept metadata and JA/KO helper copy.
- Added a server-only Supabase Storage upload helper for submitted photos.
- The Server Action now uploads a non-empty selected file, passes the returned public URL to `submitPending`, and keeps empty file inputs as `photoUrl: undefined`.
- Rejected photo input, such as unsupported MIME or oversize, redirects through `submission=invalid`; storage upload/public URL failures redirect through `submission=error`.

Reason:

- The MVP form allows an optional food/menu photo, and `restaurants.photo_url` plus `submitPending.photoUrl` were already available.
- Uploading inside the Server Action keeps the storage write behind the server-only admin client and avoids exposing elevated keys or requiring a browser Supabase storage flow.

Verification:

- Targeted action/storage/submission tests passed: 3 files, 23 tests.
- `pnpm lint` passed.
- `pnpm test` passed: 15 files, 97 tests.
- `pnpm build` passed.
- `pnpm test:e2e` passed after asserting the photo input: 7 passed, 1 deployed-only spec skipped.

## 2026-05-06 — Deployed UGC Photo Smoke Gate

Decision:

- Added a gated deployed-only Playwright smoke spec for UGC photo submission.
- The spec fills the Japanese UGC form, attaches a tiny PNG, submits to a deployed target, verifies a `pending` restaurant row with a public `restaurant-photos` URL, then removes both the storage object and smoke row through the Supabase admin client.
- The gate is opt-in behind `RUN_DEPLOYED_UGC_PHOTO_SMOKE=true` so routine local e2e does not write remote data.

Reason:

- UGC photo upload touches deployment runtime env, Supabase Storage bucket behavior, Server Action multipart handling, row persistence, and cleanup.
- A gated deployed smoke keeps that full path measurable without making every local test run depend on remote services.

Verification:

- `pnpm lint` passed.
- `pnpm test:e2e` passed with deployed-only specs skipped by default: 7 passed, 2 skipped.
- Actual deployed photo smoke remains pending until a current deployed URL, Vercel share URL if protected, and Supabase admin envs are supplied.

## 2026-05-06 — Restaurant Detail Feature Badges

Decision:

- Added compact feature badges to the restaurant bottom-sheet detail for positive restaurant attributes: solo-friendly, Japanese menu, and late-night.
- Badges reuse existing restaurant booleans and locale message maps; disabled/false attributes remain hidden.

Reason:

- The same filters that drive map discovery are decision-critical inside the detail view.
- Showing only positive badges keeps the bottom sheet scannable on mobile and avoids adding noisy negative labels.

Verification:

- Targeted detail tests passed: 2 files, 7 tests.
- `pnpm lint` passed.
- `pnpm test` passed: 15 files, 98 tests.
- `pnpm build` passed.
- `pnpm test:e2e` passed: 7 passed, 2 deployed-only specs skipped.

## 2026-05-06 — Preview Deployment And UGC Photo Smoke

Decision:

- Created a Vercel preview deployment for the current working tree: `https://honbabseoul-o40fswnli-meggs-projects.vercel.app`.
- Created a protected-preview share URL expiring on 2026-05-07 07:41:47.
- Ran deployed UGC photo smoke against the preview with Supabase admin envs loaded.

Result:

- Preview deployment `dpl_eF2TKnEiA9fQodmsabM3qi69sy9y` reached `READY`.
- Deployed UGC photo smoke passed: form submission with a tiny PNG returned success, inserted a `pending` row with a public `restaurant-photos` URL, and the spec cleanup removed the uploaded object plus pending smoke row.
- Follow-up Supabase admin check found `Codex photo smoke%` rows count `0`.
- Deployed read-path smoke did not pass on the random preview URL because Naver Maps rendered the Japanese map fallback and no marker/cluster appeared. This is consistent with the random preview hostname not being in the Naver Maps allowed-domain whitelist, not with UGC photo upload failure.

Verification:

- `vercel deploy -y` passed.
- `RUN_DEPLOYED_UGC_PHOTO_SMOKE=true` deployed photo smoke passed outside sandbox.
- Supabase cleanup verification passed outside sandbox.

## 2026-05-06 — UGC Submit Enablement Gate

Decision:

- Split the UGC submission form into a client `SubmissionForm` component.
- The submit button now starts disabled and becomes enabled only after all required text fields and required boolean radio groups are complete.
- Preserved flash values still prefill the form after invalid/error redirects and can enable submit immediately when required values are complete.

Reason:

- Native `required` validation only blocks after the user attempts submission.
- The MVP requires clearer required-input feedback before submit, while keeping the existing Server Action validation as the source of truth.

Verification:

- Targeted `SubmissionForm` tests passed: 2 tests.
- `pnpm lint` passed.
- `pnpm test` passed: 16 files, 100 tests.
- `pnpm build` passed.
- `pnpm test:e2e` passed: 7 passed, 2 deployed-only specs skipped.

## 2026-05-06 — Admin Workflow And Pending Isolation Gate

Decision:

- Added `docs/admin-workflow.md` for the Supabase-dashboard moderation flow.
- Documented review, approval, rejection, and public-read rules for UGC restaurant submissions.
- Extended deployed UGC photo smoke so the submitted row is verified as `pending` through the admin client and invisible through the public Supabase client.

Reason:

- MVP admin scope is the Supabase dashboard, not a custom admin UI.
- The user-facing map must never expose `pending` or `rejected` rows; the deployed smoke now checks that RLS/public-read boundary on the same row it creates.

Verification:

- Targeted deployed UGC photo spec loaded and skipped by default without errors.
- `pnpm lint` passed.
- `pnpm test` passed: 16 files, 100 tests.
- `pnpm test:e2e` passed: 7 passed, 2 deployed-only specs skipped.

## 2026-05-06 — Epic 5 Audit Artifact

Decision:

- Added `outputs/reviews/epic-5-audit.md` as the UGC submission acceptance record.
- Marked the audit `CONDITIONAL PASS` with `Blocker: 1` instead of overstating completion.
- Recorded that the remaining gate is manual Supabase-dashboard approval verification plus public map visibility on a Naver-whitelisted deployed URL.

Reason:

- Epic 5 acceptance explicitly requires an audit artifact.
- Automated submission, deployed photo upload, pending status, cleanup, and public pending-row isolation are verified; manual operator approval has not been performed in the dashboard.

Verification:

- Deployed UGC photo smoke with public pending-row isolation passed outside sandbox.

## 2026-05-06 — Deployed Approval Flow Smoke Gate

Decision:

- Added `e2e/deployed-approval-flow.spec.ts` behind `RUN_DEPLOYED_APPROVAL_SMOKE=true`.
- The spec submits a temporary UGC row on a deployed preview, verifies it starts as `pending`, verifies the public client cannot read it, updates it through the admin client to `approved` with public map fields, verifies the public client can read it, then deletes the smoke row.
- Updated the Epic 5 audit to record automated approval-flow evidence separately from the remaining manual Supabase-dashboard gate.

Reason:

- The remaining Epic 5 blocker is a human operator workflow gate, but the data path around approval can still be tested safely with a gated temporary row.
- Keeping this deployed-only prevents routine local e2e from writing remote public data.

Verification:

- Targeted approval-flow spec loaded and skipped by default without errors.
- Deployed approval-flow smoke passed outside sandbox on the protected preview.

## 2026-05-06 — Metadata And OG Polish

Decision:

- Replaced the root `Coming soon` metadata with production-oriented Honbabseoul title, description, Open Graph, Twitter card, and application name.
- Added locale-specific metadata in `[locale]/layout.tsx` for Japanese and Korean routes.
- Added a generated `/opengraph-image` image using Next.js `ImageResponse`.
- Set the root HTML language default to Japanese because Japanese is the primary MVP locale.
- Excluded `/opengraph-image` from the locale middleware matcher so the generated metadata image route responds directly instead of redirecting to `/ja/opengraph-image`.
- Added local e2e coverage for JA/KO metadata and the generated OG image response.

Reason:

- The product is no longer a placeholder; social previews and search snippets should describe the actual solo-dining map.
- Locale-specific metadata keeps Japanese as the default user-facing offer while giving `/ko` a Korean title and description.

Verification:

- `pnpm lint` passed.
- `pnpm build` passed and generated `/opengraph-image`.
- Targeted metadata e2e passed.
- `pnpm test:e2e` passed: 8 passed, 3 deployed-only specs skipped.

## 2026-05-06 — Metadata Preview Deployment

Decision:

- Created a Vercel preview deployment for the current working tree after metadata/OG and middleware polish.
- Preview URL: `https://honbabseoul-207oftxw7-meggs-projects.vercel.app`.
- Deployment ID: `dpl_3SZoAHcZkXYV4z3cJ5WH4JkQY1Bs`.

Result:

- Vercel deployment reached `READY`.
- Vercel build output included the generated `/opengraph-image` route.

Verification:

- `vercel deploy -y` passed.

## 2026-05-06 — Deployed Metadata Smoke

Decision:

- Created a protected-preview share URL for the metadata preview deployment.
- Share URL: `https://honbabseoul-207oftxw7-meggs-projects.vercel.app/?_vercel_share=a2M39oHj8CJsX20QWuOuKTspRsW3PNNx`.
- Expires on 2026-05-07 08:28:38.
- Updated local smoke setup to visit `VERCEL_SHARE_URL` first when present, matching the deployed-only smoke pattern for protected previews.

Result:

- Deployed metadata smoke passed against `https://honbabseoul-207oftxw7-meggs-projects.vercel.app`.
- The smoke verified route metadata and generated `/opengraph-image` response on the protected preview.

Verification:

- First deployed metadata smoke attempt failed in sandbox due Chromium MachPort permissions, then passed outside sandbox.
- `pnpm test:e2e` passed locally after the smoke setup change: 8 passed, 3 deployed-only specs skipped.

## 2026-05-06 — Web Manifest Polish

Decision:

- Added `src/app/manifest.ts` using the Next.js manifest file convention.
- Added root metadata `manifest: "/manifest.webmanifest"` and viewport `themeColor`.
- Extended metadata e2e coverage to verify the manifest link, `theme-color` meta tag, manifest response, and key manifest fields.

Reason:

- Metadata/OG polish should also cover app/share surface metadata, not only social cards.
- A generated manifest keeps the browser-facing app name, start URL, display mode, language, and theme color explicit.

Verification:

- Targeted metadata/manifest e2e passed.
- `pnpm lint` passed.
- `pnpm build` passed and generated `/manifest.webmanifest`.
- `pnpm test:e2e` passed: 8 passed, 3 deployed-only specs skipped.

## 2026-05-06 — Manifest Preview Deployment And Smoke

Decision:

- Created a Vercel preview deployment for the current working tree after manifest polish.
- Preview URL: `https://honbabseoul-401eqjsvw-meggs-projects.vercel.app`.
- Deployment ID: `dpl_mH1g4rZqKW7apvEgsfzSgCMz8t2U`.
- Created a protected-preview share URL: `https://honbabseoul-401eqjsvw-meggs-projects.vercel.app/?_vercel_share=Tu0a7nXzykY4yOosbo0JQjUOWEht1IIC`.
- Share URL expires on 2026-05-07 08:36:41.

Result:

- Vercel deployment reached `READY`.
- Vercel build output included both `/manifest.webmanifest` and `/opengraph-image`.
- Deployed metadata/manifest smoke passed against the protected preview.

Verification:

- `vercel deploy -y` passed.
- First deployed metadata/manifest smoke attempt failed in sandbox due Chromium MachPort permissions, then passed outside sandbox.

## 2026-05-06 — Robots And Sitemap Polish

Decision:

- Added `src/app/robots.ts` using the Next.js robots file convention.
- Added `src/app/sitemap.ts` with `/ja` and `/ko` canonical URLs.
- Extended metadata e2e coverage to verify `/robots.txt`, `/sitemap.xml`, content types, sitemap link, and locale URLs.

Reason:

- Metadata, OG, and manifest are now present; robots and sitemap complete the basic discoverability surface for the MVP routes.
- Keeping the sitemap limited to `/ja` and `/ko` avoids indexing generated metadata assets as primary pages.

Verification:

- Targeted metadata/robots/sitemap e2e passed.
- `pnpm lint` passed.
- `pnpm build` passed and generated `/robots.txt` and `/sitemap.xml`.
- `pnpm test:e2e` passed: 8 passed, 3 deployed-only specs skipped.

## 2026-05-06 — Robots/Sitemap Preview Deployment And Smoke

Decision:

- Created a Vercel preview deployment for the current working tree after robots/sitemap polish.
- Preview URL: `https://honbabseoul-27ilt14gk-meggs-projects.vercel.app`.
- Deployment ID: `dpl_26xho1AsPXxjcnH4RRucrWMVk2tZ`.
- Created a protected-preview share URL: `https://honbabseoul-27ilt14gk-meggs-projects.vercel.app/?_vercel_share=NeFlWeiVJkeWiZY8GLozxE2hUfFq2KK9`.
- Share URL expires on 2026-05-07 08:46:46.

Result:

- Vercel deployment reached `READY`.
- Vercel build output included `/manifest.webmanifest`, `/opengraph-image`, `/robots.txt`, and `/sitemap.xml`.
- Deployed metadata/manifest/robots/sitemap smoke passed against the protected preview.

Verification:

- `vercel deploy -y` passed.
- First deployed metadata smoke attempt failed in sandbox due Chromium MachPort permissions, then passed outside sandbox.

## 2026-05-06 — Deployment Documentation Refresh

Decision:

- Expanded `docs/deployment.md` from a Vercel output-directory note into the current deployment runbook.
- Documented required Vercel environment variables, legacy key fallback status, protected-preview share URL handling, gated remote smoke specs, the latest verified preview trace, and the remaining Epic 5 manual production gate.

Reason:

- Deployment state had moved beyond the original placeholder document.
- Fresh operators need one concise document that connects preview deployment, protected Vercel auth, Supabase-backed smoke tests, and the unresolved manual approval gate.

Verification:

- `docs/deployment.md` formatted with Prettier.

## 2026-05-06 — README Orientation Refresh

Decision:

- Expanded `README.md` with the current product surface, default locale routes, public approval boundary, generated discoverability routes, E2E command, and operations document links.
- Kept detailed deployment and approval procedures in `docs/deployment.md` and `docs/admin-workflow.md` to avoid duplicating runbook content in README.

Reason:

- Fresh contributors need a concise entrypoint before reading Hermes state or deployment runbooks.
- The README still described only the initial development commands and did not mention the UGC approval boundary or generated metadata routes.

Verification:

- `README.md` formatted with Prettier.

## 2026-05-06 — Locale HTML Lang And E2E Server Reuse Hardening

Decision:

- Added a locale client helper that updates `document.documentElement.lang` to `ja` or `ko` from the active `[locale]` route.
- Added e2e assertions that `/ja` resolves to `html[lang="ja"]` and `/ko` resolves to `html[lang="ko"]`.
- Changed Playwright local web server config to `reuseExistingServer: false`.

Reason:

- The root layout is above the `[locale]` segment, so the server-rendered root `<html>` cannot safely derive the route locale from `[locale]` params in this app structure.
- A client-side lang correction improves the hydrated document state for `/ko` without a larger App Router layout restructure.
- The e2e suite was able to reuse an unrelated app already listening on port 3000, producing misleading failures; disabling reuse makes this class of harness error loud.

Verification:

- Targeted JA/KO locale smoke passed after killing the stale server.
- `pnpm lint` passed.
- `pnpm test` passed: 16 files, 100 tests.
- `pnpm build` passed.
- `pnpm test:e2e` passed: 8 passed, 3 deployed-only specs skipped.

## 2026-05-06 — Locale Lang Preview Deployment And Smoke

Decision:

- Created a Vercel preview deployment after locale HTML lang and Playwright server-reuse hardening.
- Preview URL: `https://honbabseoul-qp30yxjgw-meggs-projects.vercel.app`.
- Deployment ID: `dpl_FwZX8GRAXrAwMyFdnjAUJ5DoEMvE`.
- Created a protected-preview share URL: `https://honbabseoul-qp30yxjgw-meggs-projects.vercel.app/?_vercel_share=Kmrqc1KnIYksfsKG5vjLv9sgHTxE0P2G`.
- Share URL expires on 2026-05-07 09:14:22.

Result:

- Vercel deployment reached `READY`.
- Vercel build output included `/manifest.webmanifest`, `/opengraph-image`, `/robots.txt`, and `/sitemap.xml`.
- Deployed smoke passed for `/ja`, `/ko`, locale HTML lang correction after hydration, and metadata/discoverability routes.

Verification:

- `vercel deploy -y` passed.
- First deployed smoke attempt failed in sandbox due Chromium MachPort permissions, then passed outside sandbox.

## 2026-05-06 — Deployment Trace Refresh

Decision:

- Updated `docs/deployment.md` Current Preview Trace to the latest verified locale-lang preview.
- The document now points to `https://honbabseoul-qp30yxjgw-meggs-projects.vercel.app`, deployment `dpl_FwZX8GRAXrAwMyFdnjAUJ5DoEMvE`, and its protected share URL.
- Added the deployed smoke scope verified on that preview: `/ja`, `/ko`, hydrated `html[lang]`, metadata, manifest, Open Graph image, robots, and sitemap.

Reason:

- `docs/deployment.md` still pointed to the prior robots/sitemap preview.
- Operators should use the most recent verified preview trace when continuing deployment or production-readiness work.

Verification:

- `docs/deployment.md` formatted with Prettier.

## 2026-05-06 — Next Work Triage And Local Verification Refresh

Decision:

- Deferred the remaining Epic 5 PASS update because the open blocker is a manual Supabase-dashboard operator gate.
- Treated the current worktree as an accumulated product/admin readiness bundle rather than starting another feature slice on top of uncommitted changes.
- Re-ran local verification for the current bundle before further product work.

Reason:

- The active handoff lists manual dashboard approval as the first candidate, but that requires human operator action before the audit can be marked `PASS`.
- Adding another product slice before confirming the existing bundle would increase review risk and make failures harder to attribute.

Verification:

- `pnpm lint` passed.
- `pnpm test` passed: 16 files, 100 tests.
- `pnpm build` passed and generated `/ja`, `/ko`, `/manifest.webmanifest`, `/opengraph-image`, `/robots.txt`, and `/sitemap.xml`.
- `pnpm test:e2e` passed: 8 local specs passed, 3 deployed-only specs skipped.

## 2026-05-07 — Epic 5 Manual Approval Gate Completed

Decision:

- Updated `outputs/reviews/epic-5-audit.md` from `CONDITIONAL PASS` / `Blocker: 1` to `PASS` / `Blocker: 0`.
- Updated active handoff, deployment documentation, and project state to reflect the completed manual operator gate.

Result:

- The operator submitted a test row, completed missing public map fields in the Supabase dashboard, set the row to `approved`, and confirmed it appears on the Naver-whitelisted `dev` deployed map after refresh.
- Duplicate accidental submissions were identified as an operator-flow issue; non-canonical duplicate rows should remain audit-preserved and be set to `rejected` rather than deleted.

Verification:

- Human verification completed on 2026-05-07 against the Naver-whitelisted `dev` deployed map URL.

## 2026-05-07 — UGC Duplicate Submit Guard Slice

Decision:

- Selected the next product/admin slice from the manual approval finding: reduce accidental duplicate UGC submissions at the browser form layer.
- The UGC form now marks itself submitting on submit and disables the submit button while preserving the existing required-field enablement gate.
- Added component coverage for the immediate post-submit disabled and `aria-busy` state.

Reason:

- Manual approval verification exposed duplicate accidental submissions as an operator-flow issue.
- A client-side pending guard is additive and reversible, reduces common double-click repeats, and does not change Supabase schema, moderation status, or server-side validation.

Verification:

- `pnpm test 'src/app/[locale]/SubmissionForm.test.tsx'` passed: 1 file, 3 tests.
- `pnpm lint` passed.
- `pnpm test` passed: 16 files, 101 tests.
- `pnpm build` passed and generated `/ja`, `/ko`, `/manifest.webmanifest`, `/opengraph-image`, `/robots.txt`, and `/sitemap.xml`.
- `pnpm test:e2e` passed: 8 local specs passed, 3 deployed-only specs skipped.

## 2026-05-07 — Product/Admin Readiness Bundle Packaged

Decision:

- Created branch `codex/product-admin-readiness` from `dev`.
- Staged the accumulated product/admin readiness bundle and committed it as `Package product admin readiness bundle`.
- Left remote publish and PR creation as the next explicit publish step.

Reason:

- The worktree contained a coherent local bundle spanning read-path polish, UGC photo/admin readiness, discoverability metadata, documentation, and verification gates.
- A local branch commit gives review a stable artifact without pushing or opening a PR before publish is explicitly requested.

Verification:

- Staged file list contained source, docs, e2e, audit, and Hermes state files only; generated `.next` output was not staged.

## 2026-05-07 — PR #17 Preview Verification

Decision:

- Pushed `codex/product-admin-readiness` and opened draft PR #17 against `dev`: https://github.com/0xMegg/honbabseoul/pull/17
- Added branch-scoped Vercel Preview env `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID` for `codex/product-admin-readiness` after the first preview returned `/ja` 500.
- Redeployed the PR preview after the env fix.
- Marked PR #17 ready for review after checks passed and the branch-host Naver whitelist gap was documented.

Result:

- GitHub/Vercel checks are green and PR merge state is `CLEAN`.
- First protected deployed smoke found `/ja` server-side exception digest `903459998`; Vercel runtime logs showed missing `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID`.
- After adding the branch Preview env and redeploying, protected `/ja` returned HTTP 200.
- Deployed metadata/discoverability smoke passed on the PR preview.
- Deployed full read-path smoke still does not pass on the PR branch alias because Naver Maps falls back and renders `地図を読み込めませんでした。`; the branch alias is not part of the known Naver-whitelisted host gate.

Verification:

- `gh pr checks 17` passed: GitGuardian, Vercel, Vercel Preview Comments.
- `vercel inspect https://honbabseoul-eqdum8l17-meggs-projects.vercel.app` reported deployment `dpl_Ap87ZHfsSAaxUUuDNPzNtCnH1dr9` as `READY`.
- Protected preview share URL was created for the redeploy; it expires on 2026-05-08 01:53:01 KST.
- `DEPLOYED_BASE_URL=... VERCEL_SHARE_URL=... pnpm exec playwright test e2e/deployed-read-path.spec.ts e2e/smoke.spec.ts -g 'deployed read path smoke|locale metadata and generated OG image are available'` passed the metadata smoke and failed the read-path smoke at marker visibility because the deployed map rendered the expected fallback instead of Naver markers.
