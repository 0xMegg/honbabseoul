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
