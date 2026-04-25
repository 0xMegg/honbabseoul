# Review — Slice 4 (Epic 2 / Stage 2): Submissions repository + Storage helper

## Verdict
APPROVE.

## Scope
Files reviewed (created in this slice):
- `src/lib/models/submission.ts` (56 lines)
- `src/lib/repositories/submissions.ts` (66 lines)
- `src/lib/repositories/submissions.test.ts` (165 lines, 12 tests)
- `src/lib/supabase/storage.ts` (90 lines)
- `src/lib/supabase/storage.test.ts` (119 lines, 9 tests)

Slice 3 files (`src/lib/models/restaurant.ts`, `src/lib/repositories/restaurants.ts`, `src/lib/repositories/restaurants.test.ts`) are present in the working tree but are NOT part of this slice's diff — they are owned by the parallel Slice 3 review. This Slice 4 review and commit cover only the five files above plus planner/review artifacts and the handoff.

## Static Verification (per `outputs/plans/task-slice-4-verify.md`)
1. File presence — all 5 files present. PASS
2. `import "server-only";` is line 1 of `submissions.ts`. PASS
3. No `@supabase/supabase-js` import in `submissions.ts` or `storage.ts`. PASS
4. No raw `@supabase/ssr` import in `storage.ts`. PASS
5. Naver host allow-list — exact-match via `new URL(value).hostname.toLowerCase()` against `NAVER_URL_HOSTS`; no `endsWith` shortcut. PASS (`grep -E "endsWith\(['\"]naver" src/lib/models/submission.ts` → 0 lines).
6. `status` omitted from INSERT row in `submissions.ts` (`grep "status:" submissions.ts` → 0). PASS
7. `name_ko: null` explicit (line 30 of `submissions.ts`). PASS
8. Photo constants single-source — `2 * 1024 * 1024` literal appears exactly once across `submission.ts` + `storage.ts` (only in `submission.ts:3`). PASS
9. Slice 3 files untouched by Slice 4 work — `git diff HEAD -- src/lib/models/restaurant.ts ...` empty. PASS
10. Harness preservation — no changes under `.claude/`, `templates/`, `scripts/`, `context/`, `docs/`. PASS
11. `pnpm lint` — 0 errors / 0 warnings. PASS
12. `pnpm exec tsc --noEmit` — silent. PASS
13. Targeted tests:
    - `pnpm test src/lib/repositories/submissions.test.ts` — 12 cases green (≥11 required). PASS
    - `pnpm test src/lib/supabase/storage.test.ts` — 9 cases green. PASS
14. Full Vitest run — 40 tests / 5 files all green (6 env + 4 Logo + 9 restaurants + 12 submissions + 9 storage). PASS
15. `pnpm build` — succeeded; no new prerendered routes. PASS (pre-existing CSS warning on the `--hb-*` Tailwind sample utility is unrelated to this slice — it was present before Slice 4).
19. `package.json` and `pnpm-lock.yaml` unchanged in this slice (`git diff HEAD --` → 0 lines). PASS

## Live Verification
DEFERRED per plan. The Reviewer is in a sandbox environment; live curl probes against the Supabase bucket and `restaurants` anon-INSERT (verify §16–§18) are not executable here. The plan explicitly allows deferral: "If the bucket is missing or INSERT not allowed for anon, mark these as DEFERRED and add them to Carry Over for the Epic 4 UGC-form slice — they don't gate APPROVE for this slice's static contract." Carried over (see below).

## Architecture Check
- Repo correctly uses the **server** Supabase client (cookies-aware) + `import "server-only"` guard, even though anon-INSERT is publicly allowed. Forces Epic 4 form to wire through a Server Action / Route Handler — matches the API rule that UI must not import `@supabase/supabase-js` directly. PASS
- Storage helper goes through `@/lib/supabase/browser` factory — no direct SDK import. PASS
- `submissionSchema.strict()` blocks the canonical `status: 'approved'` injection vector — covered by the dedicated test case. PASS
- Defence-in-depth on `status`: trigger (DB) + column default (DB) + explicit omission (repo) → three guards. PASS
- `naverUrlSchema` uses exact-host match against an allow-list, not suffix matching — closes the `evil.naver.com.attacker.tld` injection vector (covered by test). PASS
- Photo path `${yyyy}/${mm}/${crypto.randomUUID()}.${ext}` never embeds the user-supplied filename (covered by test). PASS
- Single source of truth: `MAX_PHOTO_BYTES`, `ALLOWED_PHOTO_MIME` defined in `models/submission.ts` and imported by `storage.ts`. PASS
- `{ data, error }` tuple branched in `submitPending` (both `error !== null` AND defensive `inserted === null` after `.single()`). PASS
- No raw `PostgrestError.message` reaches the thrown error message — only `code` is preserved. PASS

## Security Check
- No secrets / keys in code. Reads only public env via wrapped factories. PASS
- `SUPABASE_SERVICE_ROLE_KEY` is not imported by either new file. PASS
- `naver_url` allow-list enforced server-side at the boundary (zod refine). PASS
- `.strict()` zod parse rejects client-supplied `status` (canonical UGC injection vector). PASS

## Dead-Code Guard
All public exports have call sites or are scheduled:
- `submissionSchema`, `SubmissionInput`, `InvalidInputError`, `SubmissionDatabaseError` — used by `submissions.ts` repo + test.
- `naverUrlSchema`, `priceRangeSchema` — composed into `submissionSchema`; also exported for re-use by the Epic 4 form.
- `MAX_PHOTO_BYTES`, `ALLOWED_PHOTO_MIME`, `NAVER_URL_HOSTS` — `MAX_PHOTO_BYTES` and `ALLOWED_PHOTO_MIME` consumed by `storage.ts` + tests; `NAVER_URL_HOSTS` consumed by `naverUrlSchema`.
- `uploadPhoto`, `PhotoTooLargeError`, `PhotoMimeRejectedError`, `PhotoUploadError` — consumed by `storage.test.ts`. The Epic 4 form (later slice) is the production call site, recorded as a scheduled consumer in the epic plan.

No new dead public surface — APPROVE on this axis.

## Issues Found

### Critical
- None.

### Important
- None.

### Minor
1. **`PhotoTooLargeError` constructor parameter `name` shadows `Error.name`.** `storage.ts:11` declares `public readonly name: string` for the file name, then `storage.ts:18` overwrites it with `this.name = "PhotoTooLargeError"`. Result: the file name is preserved only in the message string (computed in `super()` before the overwrite), but the public `error.name` field always reads `"PhotoTooLargeError"`. By contrast, `PhotoMimeRejectedError` correctly uses `fileName` to avoid the conflict. Suggest renaming the field to `fileName` for consistency in a follow-up. Not blocking — the message string is correct and no test depends on `error.name === "<file>"`.
2. **`console.error` in `submitPending` omits `error.message`** when logging — only `code` and `hint` are recorded. Server-side logs can safely include the message for debugging (the rule "no raw error messages in user-facing responses" applies to thrown errors that hit the UI, not to server logs). Slightly over-cautious; not a bug.

## Carry Over to Next Task

Slice 4-specific:
- **`reason` schema gap** — `reason` is validated and length-logged via `console.info`, but NOT persisted (Slice 1's schema has no `reason` column). Plan locked this as a deliberate deferral; carrying forward to Epic 4 (UGC form slice), which must either (a) add a `0002_*` migration introducing `reason text` on `restaurants`, or (b) introduce a `submission_metadata` table linked by `restaurant_id`. The repository contract already accepts `reason` in the input shape so the form contract is stable.
- **Live verification deferred** — bucket sanity (verify §16), anon-INSERT to `restaurant-photos` (verify §17), and anon-INSERT to `restaurants` triggering the BEFORE-INSERT downgrade (verify §18) were not executed in the sandboxed review environment. Operator/Reviewer should run these commands once during the Epic 4 e2e wire-up; they are non-blocking for Slice 4's static contract.
- **Storage bucket policy probe** — confirms anon-INSERT works on `restaurant-photos`. If the bucket is missing or rejects anon writes with 403, this becomes a deployment blocker for Epic 4.

Epic-wide (still open from earlier slices):
- service_role key rotation (pre-deployment).
- shadcn/ui adoption decision.
- Component tests + compatible Vite + plugin-react pair (Epic 3).
- `brew install bash` belt-and-suspenders.
- Naver Maps client ID (Epic 3 dependency).

## Commit
- Message: `feat: Slice 4 — submissions repository + storage helper`
- Files: 5 source files + 2 plan artifacts + 1 archive + 1 review + handoff/task-slice-3.md.
- Branch: `task/slice-2-seed-data` (current; orchestrator will reconcile branch naming).

<!-- FINAL_VERDICT: APPROVE -->
