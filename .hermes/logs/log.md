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
