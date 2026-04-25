# Session Handoff

## Current State
- Task: **Epic 2 / Stage 2 / Slice 4 — Submissions repository + Storage helper**.
- Phase: **Plan → ready for Develop**.
- Date: 2026-04-25.
- Branch (planner ran from): `task/slice-2-seed-data` (Develop will rebase / branch off into `task/slice-4-submissions` per harness convention).
- Epic 2 progress so far:
  - Stage 1 / Slice 1 (`8388728`) — schema migration + RLS + triggers.
  - Stage 1 / Slice 2 (`7b5f9b0`) — 20-row curated seed.
  - Stage 2 / Slice 3 (Restaurants read repository) — running in parallel; do not touch its files.

## Last Action
Planner read `outputs/plans/epic-2-plan.md` Slice 4 spec, all four `.claude/rules/local/*` files, `supabase/migrations/0001_restaurants.sql`, `src/lib/supabase/{admin,browser,server}.ts`, `src/lib/env.ts`, `vitest.config.ts`, and the prior task-slice-2 plan/verify pair as a format reference. Drafted plan + verification artifacts. Archived previous handoff stub to `outputs/archive/handoff-2026-04-25-task-slice-4-pre-plan.md`.

Key planner decisions (locked, ready for Develop):
- **`reason` field is validated but NOT persisted** in this slice. Slice 1's schema has no `reason` column. Adding a migration would inflate scope and break Stage 2 parallelism. Plan adds a TODO + a `console.info` audit log on the server, defers the schema change to whatever Epic 4 slice introduces the UGC form. Reviewer may overrule.
- **Repo is `import "server-only"`** despite anon being allowed to INSERT publicly — pushes the Epic 4 form into a Server Action / Route Handler indirection. Aligns with the existing rule that UI must not import `@supabase/supabase-js` directly.
- **Naver host allow-list is exact-match** (`map.naver.com` and `naver.me` only). No `m.map.naver.com` for now; widen if user reports.
- **Photo path never embeds the user-supplied filename** — uses `crypto.randomUUID()`-derived path under `{yyyy}/{mm}/{uuid}.{jpg|png}`. Closes the classic filename-XSS hole.
- **Single source of truth for photo constants** — `MAX_PHOTO_BYTES`, `ALLOWED_PHOTO_MIME` defined in `src/lib/models/submission.ts` and imported by `src/lib/supabase/storage.ts`. Verifier asserts the literal `2 * 1024 * 1024` appears at most once across the two files.

## Files Changed
(none — Planner does not modify code)

Planner-produced files (planning artifacts only):
- `outputs/plans/task-slice-4-plan.md`
- `outputs/plans/task-slice-4-verify.md`
- `outputs/archive/handoff-2026-04-25-task-slice-4-pre-plan.md`
- `handoff/task-slice-3.md` (this overwrite — Planner Handoff for Slice 4)

## Verification Status
- Lint: not run (Planner does not touch code).
- Type check: not run.
- Format: not run.
- Build: not run.
- Test: not run.
- Live: not run.

## Issues Found
- Critical: none.
- Important:
  1. **`reason` schema gap** — Slice 1 didn't add a `reason` column. Plan intentionally accepts the `reason` input but does not persist it; documented as a TODO and a Carry Over for Epic 4 / UGC form slice. If the Reviewer wants persistence in Slice 4, scope must grow to include a `0002_*` migration.
  2. **Storage bucket `restaurant-photos` `INSERT` policy unverified** — open carry-over from Epic 1. The verify plan §17 includes an explicit anon-INSERT curl probe; if it returns 403, the bucket policy needs an anon-INSERT rule. Doesn't block APPROVE for the static contract — escalates to a Carry Over for the form slice.
- Minor:
  1. `pnpm-lock.yaml` and `package.json` are intentionally untouched (zod was added in Slice 1). Verifier asserts the lockfile diff is exactly 0 bytes.

## Next Step
1. Developer reads `outputs/plans/task-slice-4-plan.md` (and §Risks / §Open Questions before writing code).
2. Developer creates the five files in the order: `models/submission.ts` → `supabase/storage.ts` → `repositories/submissions.ts` → both `*.test.ts` files. Tests are co-located.
3. Developer runs `pnpm lint && pnpm exec tsc --noEmit && pnpm test src/lib/repositories/submissions.test.ts && pnpm test src/lib/supabase/storage.test.ts && pnpm test && pnpm build`. All green required.
4. Reviewer follows `outputs/plans/task-slice-4-verify.md` static checks first; live checks (§16–18) are best-effort and the deferred ones become Carry Over.

## Carry Over (Slice 4-specific, plus Epic-wide items already on the roster)
Slice 4-specific:
- Persist `reason` (open Q): either a follow-up `0002_*` migration adding a `reason text` column to `restaurants`, OR a separate `submission_metadata` table linked by `restaurant_id`. Decision deferred to Epic 4 / UGC form slice. Plan includes an inline TODO so the gap doesn't get lost.
- Bucket policy probe: confirm anon-INSERT works on `restaurant-photos` via the curl in verify §17. If 403, Reviewer flags as a deployment-blocker carry-over.

Epic-wide (from previous handoff, still open):
- service_role key rotation (pre-deployment).
- shadcn/ui adoption decision (after first two product screens).
- Component tests + compatible vite + plugin-react pair (Epic 3 will reintroduce).
- `brew install bash` belt-and-suspenders (forge fix already applied).
- Naver Maps client ID — Epic 3 dependency.
- Live HTTP probing — sandbox may block `curl localhost`; use `pnpm test` mocks for static review, real curl probes during operator-side verification.

## Plan & Review Locations
- Epic 2 plan: `outputs/plans/epic-2-plan.md`
- Slice 4 plan: `outputs/plans/task-slice-4-plan.md`
- Slice 4 verify: `outputs/plans/task-slice-4-verify.md`
- Slice 4 review: (to be created by Reviewer at `outputs/reviews/task-slice-4-review.md`)
- Decision log: `context/decision-log.md`

## Developer Handoff (Slice 4)

### Completed
- Created `src/lib/models/submission.ts` — exports `submissionSchema` (`.strict()`), `SubmissionInput`, `MAX_PHOTO_BYTES`, `ALLOWED_PHOTO_MIME`, `NAVER_URL_HOSTS`, `priceRangeSchema`, `naverUrlSchema`, `InvalidInputError`, `SubmissionDatabaseError`. No Supabase import.
- Created `src/lib/repositories/submissions.ts` — begins with `import "server-only"`, uses server Supabase client only, single export `submitPending(input: unknown): Promise<{ id: string }>`. Insert row uses snake_case columns, omits `status`, sets `name_ko: null`. Reason accepted + validated but not persisted (TODO comment + `console.info` length log).
- Created `src/lib/repositories/submissions.test.ts` — 12 Vitest cases (11 plan-specified + 1 split of photoUrl pass-through into two `it` blocks). Mocks `server-only` and `@/lib/supabase/server`. All assertions pass.
- Created `src/lib/supabase/storage.ts` — exports `uploadPhoto(file: File): Promise<string>`, `PhotoTooLargeError`, `PhotoMimeRejectedError`, `PhotoUploadError`. Bucket constant is `"restaurant-photos"`. Path is `{yyyy}/{mm}/{uuid}.{ext}` — never embeds user filename. Constants imported from `models/submission.ts`.
- Created `src/lib/supabase/storage.test.ts` — 9 Vitest cases. Mocks `@/lib/supabase/browser`.

### Deviations from plan
- `FlatErrors` interface defined locally in `models/submission.ts` instead of using `ReturnType<z.ZodError["flatten"]>` — avoids Zod v4 internal-type brittleness. Functionally identical.
- Test file created `submissions.test.ts` with 12 tests (photoUrl split into two `it` blocks) vs the plan's "11 cases". Exceeds the minimum.
- `vi.mock("server-only", () => ({}))` added to submissions test to prevent runtime throw outside Next.js build pipeline.
- `mock.calls[0]![0]` non-null assertion required by `noUncheckedIndexedAccess: true` — pragmatic, not a bug.

### Verification Status
- Lint (`pnpm lint`): ✅ 0 errors / 0 warnings.
- Type check (`pnpm exec tsc --noEmit`): ✅ clean (after fixing `noUncheckedIndexedAccess` issues on mock.calls).
- Tests (`pnpm test`): ✅ 40 tests pass — 6 env + 4 Logo + 9 restaurants + 12 submissions + 9 storage.
- Build (`pnpm build`): ✅ success.
- Live: not run (sandbox environment; bucket policy probe deferred to Carry Over per plan).

### Issues Found
- Critical: none.
- Important: `reason` not persisted (per plan decision, documented TODO in repository).
- Minor: pre-existing CSS warning in build (`--hb-*` token in Tailwind — pre-dates Slice 4, not introduced here).

### Next Step
Reviewer runs `outputs/plans/task-slice-4-verify.md` static checks, commits on APPROVE.

## Reviewer Handoff (Slice 4)

### Verdict
APPROVE.

### Verification
- Lint (`pnpm lint`): ✅ 0 errors / 0 warnings.
- Type check (`pnpm exec tsc --noEmit`): ✅ silent.
- Tests (`pnpm test`): ✅ 40/40 pass — 6 env + 4 Logo + 9 restaurants + 12 submissions + 9 storage. Targeted runs also green (≥11 submissions, ≥9 storage cases as required).
- Build (`pnpm build`): ✅ success. Pre-existing CSS warning on a `--hb-*` Tailwind sample utility is unrelated to this slice.
- Static checks (verify §1–§15, §19): all PASS — file presence, server-only guard, no `@supabase/supabase-js`/`ssr` direct imports, exact-match Naver host allow-list, `status` omitted from INSERT row, `name_ko: null` explicit, photo size literal appears once total, Slice 3 files untouched, harness preservation, no `package.json`/lockfile mutation.
- Live checks (verify §16–§18): DEFERRED per plan (sandbox environment) — operator-driven probe at Epic 4 wire-up time.

### Issues Found
- Critical: none.
- Important: none.
- Minor:
  1. `PhotoTooLargeError` constructor uses `public readonly name` for the file name; this shadows `Error.name`, which is then explicitly overwritten with `"PhotoTooLargeError"`. The file name survives only inside the message string. `PhotoMimeRejectedError` avoids this by using `fileName`. Suggest renaming for consistency in a follow-up. Non-blocking.
  2. Server-side `console.error` in `submitPending` omits `error.message` (only `code` + `hint` logged). Slightly over-cautious for server logs; not a bug.

### Carry Over (Reviewer's roster)
- **`reason` not persisted** — locked deferral to Epic 4 (UGC form slice). Repo accepts/validates reason but does not write it; Epic 4 must add either a `0002_*` migration introducing `reason text` on `restaurants` or a separate `submission_metadata` table.
- **Live Supabase probes deferred** — bucket sanity, anon Storage INSERT to `restaurant-photos`, anon REST INSERT to `restaurants` triggering pending-downgrade. To be run during Epic 4 e2e wire-up (commands inline in `outputs/plans/task-slice-4-verify.md` §16–§18).
- **Storage bucket anon-INSERT policy** — open carry-over from Epic 1; will surface as a 403 if missing when Epic 4 form ships.
- Epic-wide: service_role key rotation, shadcn/ui adoption, component-test toolchain, Naver Maps client ID.

### Commit
- `feat: Slice 4 — submissions repository + storage helper` (hash to be filled after `git commit`).
- Slice 3 files + plans/archives are intentionally **excluded** from this commit — they belong to the parallel Slice 3 review.

### Next Step
Slice 3 (Restaurants read repository) review proceeds in parallel; Stage 2 closes once both Slice 3 and Slice 4 are committed. Epic 2 then moves to whatever comes next per `outputs/plans/epic-2-plan.md`.

## Post-task activities
(Reviewer fills after APPROVE)
