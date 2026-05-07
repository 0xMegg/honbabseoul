# Epic 5 Audit — UGC Submission

Date: 2026-05-07

## Verdict

Verdict: PASS

Blocker: 0

The UGC write path is verified, including deployed photo upload, pending row creation, automated admin approval, public visibility after approval, cleanup, public pending-row isolation, and manual Supabase-dashboard approval with public map visibility on a Naver-whitelisted deployed URL.

## Scope

Epic 5 covers user-generated restaurant submission:

- Required UGC fields and disabled submit state.
- Optional JPEG/PNG photo upload.
- Server Action validation and persistence.
- Pending moderation state.
- Supabase-dashboard operator workflow.
- Public map/read-path isolation for non-approved rows.

## Evidence

- `docs/project-plan.md` defines the MVP UGC requirements.
- `docs/admin-workflow.md` documents review, approval, rejection, and public-read rules.
- `src/app/[locale]/SubmissionForm.tsx` implements required-field submit enablement.
- `src/app/[locale]/actions.ts` handles Server Action submission and photo upload.
- `src/lib/repositories/submissions.ts` persists submitted rows without explicitly approving them.
- `e2e/deployed-ugc-photo.spec.ts` verifies deployed submission, `pending` status, storage URL persistence, cleanup, and public-client invisibility.
- `e2e/deployed-approval-flow.spec.ts` verifies deployed submission, automated admin approval, public-client visibility after approval, and cleanup.

## Acceptance Matrix

| Acceptance item | Status | Evidence |
| --- | --- | --- |
| Form accepts required fields | PASS | `SubmissionForm` unit tests and local smoke |
| Submit disabled until required values are complete | PASS | `SubmissionForm.test.tsx`, `e2e/smoke.spec.ts` |
| Optional photo upload supports JPEG/PNG and server validation | PASS | `storage-server.test.ts`, `actions.test.ts`, deployed UGC smoke |
| Submitted row is created as `pending` | PASS | deployed UGC smoke |
| Pending row is hidden from public client/read path | PASS | deployed UGC smoke public-client assertion |
| Approved row is visible to the public client | PASS | deployed approval-flow smoke |
| Operator workflow is documented | PASS | `docs/admin-workflow.md` |
| Operator manually approves one row in Supabase dashboard | PASS | human dashboard approval completed on 2026-05-07 |
| Approved row appears on public map after refresh | PASS | human verification on Naver-whitelisted `dev` preview URL |
| Raw PostgREST errors do not surface in UI | PASS | Server Action maps failures to localized status redirects |

## Verification Run

- `pnpm lint`: PASS
- `pnpm test`: PASS, 16 files and 100 tests
- `pnpm test:e2e`: PASS, 7 passed and 2 deployed-only specs skipped
- Deployed UGC photo smoke with public pending-row isolation: PASS
- Deployed approval-flow smoke with public approved-row visibility: PASS
- Manual Supabase-dashboard approval and Naver-whitelisted public map visibility: PASS

## Manual Gate Result

On 2026-05-07, the operator submitted a test row, completed missing public map fields in the Supabase dashboard, set the row to `approved`, and confirmed it appears on the Naver-whitelisted `dev` deployed map after refresh.
