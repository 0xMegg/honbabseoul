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
