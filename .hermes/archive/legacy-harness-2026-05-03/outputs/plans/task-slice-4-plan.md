# Work Plan

## Task
Slice 4 (Epic 2 / Stage 2 / Slice 4) — Submissions repository + Storage helper

## Goal
Ship the public UGC write path: a zod-typed `Submission` model, a `submitPending` repository function that inserts into the `restaurants` table through the **server** Supabase client (so RLS + the BEFORE-INSERT trigger from Slice 1 force `status='pending'`), and a client-side `uploadPhoto` Storage helper for the optional photo on the submission form. After this slice the Epic 4 UGC form (later) has a fully tested data contract: validate → optionally upload photo → submit. All happy/edge paths covered by mocked Vitest.

## Context
- **Epic / Stage / Slice:** Epic 2 / Stage 2 / Slice 4. Stage 2 is **parallel** with Slice 3 (Restaurants read repository) — file lists are disjoint by design (different `models/`, `repositories/`, and `supabase/storage.ts` is exclusive to this slice).
- **Related plan:** `outputs/plans/epic-2-plan.md` (Slice 4 spec, Stage 2). Epic plan locks: `pnpm add zod` already happened in Slice 1; no new deps in this slice.
- **Schema dependency (already shipped in Slice 1):**
  - Table `restaurants` — columns include `id` (uuid pk default `gen_random_uuid()`), `name_ja`, `name_ko`, `address_ja`, `address_ko`, `latitude`, `longitude`, `price_range` (enum), `status` (enum, default `'pending'`), `is_solo_default` (default `true`), `has_jp_menu`, `is_late_night`, `naver_url`, `photo_url`, `created_at`, `updated_at`.
  - BEFORE-INSERT trigger `restaurants_force_pending_for_anon` — silently coerces `status` to `'pending'` whenever `auth.role() = 'anon'`. Anon `INSERT` policy is permissive (`with check (true)`) and the trigger does the work. Service-role bypasses RLS so admin inserts are unaffected. Conclusion: the repo can technically send any value for `status`, but for clarity and defence-in-depth the repo will explicitly NOT include `status` in the INSERT column list (the column default `'pending'` covers it on the DB side; the trigger is a second guard for anon).
- **Decisions already locked** (`context/decision-log.md`, 2026-04-25):
  - **Photo constraints:** `≤2MB`, MIME `image/jpeg` or `image/png`, **1 image max** per submission. Bucket `restaurant-photos` (public). Storage helper enforces both the size and MIME at the client before bytes hit the wire.
  - **Geo fallback:** UI-side concern (Seoul City Hall on geolocation refusal). Submission may still arrive with no lat/lng — schema allows null, repo passes through.
  - **`is_solo_default` semantics:** `false` means **verified 2인 이상 전용**. UGC submitters answer the JA-form question 「ひとりで入れますか?」 → maps to `is_solo` (true/false). The repository persists this onto `is_solo_default`. We accept the UGC submitter's answer as authoritative for now; an operator can override on review.
  - **`price_range` enum** is `'low' | 'mid' | 'high'`. The form picks one; the repo passes it through. Validation is part of the zod schema.
- **Related local rules:**
  - `.claude/rules/local/api-honbabseoul.md` — Repository Layer: UI must not import `@supabase/supabase-js` directly; UGC always inserts `status='pending'`; reject client-supplied `status`; `naver_url` allow-list `{ map.naver.com, naver.me }`; `SUPABASE_SERVICE_ROLE_KEY` is server-only. **This slice MUST honour every bullet.**
  - `.claude/rules/local/gotchas-honbabseoul.md` — RLS silent-empty trap (a successful-looking response with `data === []` is a real RLS outcome, not a network failure); UGC default is `pending`, never `approved`; service-role key in client bundle = incident.
  - `.claude/rules/local/frontend-honbabseoul.md` — `next/dynamic({ ssr: false })` for SDKs that touch `window`; this slice's storage helper is a `"use client"` module by virtue of using `File`/`FileReader` semantics, but it does NOT need `next/dynamic` because the **client** Supabase factory already runs only in the browser (it constructs lazily).
  - `.claude/rules/base/api.md` — parameterized queries, branch both halves of `{ data, error }`, never leak `PostgrestError` to UI.
- **Slice 3 boundary** — Slice 3 owns `src/lib/models/restaurant.ts`, `src/lib/repositories/restaurants.ts` (+ test). This slice MUST NOT touch any of those files. If a shared `Database` row type for the `restaurants` table is desirable, defer to a follow-up: each slice declares its own narrow Insert/Row shapes for now, and a unification pass can come after both slices land. Stage 2 parallel safety hinges on file-list disjointness — keep it that way.
- **Carry-overs from previous Reviewer Handoff** (`handoff/task-slice-3.md`):
  - **Storage bucket `restaurant-photos` sanity** — open carry-over from Epic 1. This slice indirectly verifies bucket existence at live-test time (the upload happy path will fail if the bucket is missing). The Reviewer's live verification step lists an explicit bucket-listing curl as a precondition probe.
  - service_role key rotation — separate task, blocks deployment, NOT a Slice 4 prerequisite.
  - shadcn/ui adoption — out of scope.
  - Component tests + compatible `@vitejs/plugin-react` — out of scope; Slice 4 has no React surface.
- **Pre-flight (still needed for live verification):**
  - `DATABASE_URL` set in `.env.local` (already done; used by Slice 1/2's `db:push`/`db:reset`/`db:smoke`).
  - `psql` available (already done).
  - Supabase Storage bucket `restaurant-photos` exists and is **public** with the **anon role allowed `INSERT`** on the bucket. If a sanity check via `curl -X POST "$NEXT_PUBLIC_SUPABASE_URL/storage/v1/object/restaurant-photos/<smoke>.png" …` returns 403, the bucket policy needs an `INSERT` rule for `anon` (or a more specific policy if the form is gated behind auth later). Reviewer flags this as a CARRY OVER if the bucket is missing or not insertable; it does NOT block APPROVE for the static checks.

## Approach
1. **`src/lib/models/submission.ts`** — define the zod schema and the inferred TypeScript input type. No runtime side effects, no Supabase imports.
   - Constants exported alongside (so the storage helper, the form, and the repo all share a single source of truth):
     - `MAX_PHOTO_BYTES = 2 * 1024 * 1024` (= `2_097_152`).
     - `ALLOWED_PHOTO_MIME = ["image/jpeg", "image/png"] as const`.
     - `NAVER_URL_HOSTS = ["map.naver.com", "naver.me"] as const`.
   - `naverUrlSchema = z.string().url().refine(predicate, message)` where the predicate parses the URL with `new URL(value)` (try/catch is unnecessary because `.url()` already gates the format) and asserts `host` ∈ `NAVER_URL_HOSTS`. Exact-match comparison (lowercased) — no `endsWith("naver.com")` because that allows `evil.naver.com.attacker.tld`. Reject `m.map.naver.com` for now (decision log doesn't list it; tighten now, expand later if user data proves the need).
   - `priceRangeSchema = z.enum(["low", "mid", "high"])`.
   - `submissionSchema` (object, strict — `.strict()` so unknown keys are rejected; this is the surface where a malicious client might try to pass `status: 'approved'`):
     - `name: z.string().min(1).max(120)` — JP-locale form field; mapped to `name_ja` at the repo boundary (decision noted below in Risks).
     - `naverUrl: naverUrlSchema`.
     - `isSolo: z.boolean()` — maps to `is_solo_default`.
     - `hasJpMenu: z.boolean()` — maps to `has_jp_menu`.
     - `isLateNight: z.boolean()` — maps to `is_late_night`.
     - `reason: z.string().min(1).max(500)`.
     - `priceRange: priceRangeSchema.optional()` — operator may set on review; not strictly required at submission per spec §5, but the form will probably collect it. Optional keeps the schema permissive for the MVP form.
     - `photoUrl: z.string().url().optional()` — populated by `uploadPhoto` before submit; null/undefined when no photo. Repo treats `undefined` and `""` identically (drops the column).
   - Export `SubmissionInput = z.infer<typeof submissionSchema>` and a discriminated `SubmissionError` union for the repo to throw (`InvalidNaverUrl`, `InvalidInput` (zod aggregate), `Database` (PostgrestError pass-through with redacted message)).

2. **`src/lib/repositories/submissions.ts`** — server-only public-facing function `submitPending`.
   - File begins with `import "server-only";` — Slice 1 of Epic 1 already shipped this exact guard for `admin.ts`; same mechanism applies. The repo MUST never be imported into a `"use client"` module. UI calls it via a Server Action or Route Handler. (Decision: see Risks below for why the repo is server-only despite anon being allowed to INSERT through the public REST API.)
   - Single export: `submitPending(input: unknown): Promise<{ id: string }>`.
   - Pipeline:
     1. `const parsed = submissionSchema.safeParse(input)` — on failure, throw `new InvalidInputError(parsed.error.flatten())`. Surface no raw zod text to the UI; the JA/KO i18n message map handles user-facing wording.
     2. `const supabase = await createSupabaseServerClient()`.
     3. Build the insert row with explicit column mapping (snake_case DB columns vs camelCase input):
        - `name_ja: parsed.data.name`.
        - `name_ko: null` — operator translates on review.
        - `naver_url: parsed.data.naverUrl`.
        - `is_solo_default: parsed.data.isSolo`.
        - `has_jp_menu: parsed.data.hasJpMenu`.
        - `is_late_night: parsed.data.isLateNight`.
        - `price_range: parsed.data.priceRange ?? null` (column is nullable enum).
        - `photo_url: parsed.data.photoUrl ?? null`.
        - `reason` — there is **no `reason` column** on `restaurants` (Slice 1 schema). The submitter's reason text is metadata that the spec wants captured; the MVP table doesn't have a slot for it. **Decision (locked here):** add `reason` into a `submission_meta` JSONB column? No — that's a schema change and Stage 2 is sequential to Stage 1's frozen schema. Two options that don't require a migration:
           - α) Concatenate reason into `name_ja` (terrible UX).
           - β) Drop the `reason` column from this slice's persistence and document the gap as a Carry Over for Epic 4 (UGC form slice), which will introduce a `submission_metadata` table or a `reason` column via a follow-up migration.
           Choosing β: **the repo accepts `reason` in the input shape (so the form can be coded against the final input contract today), validates it, but does NOT persist it.** A `// TODO(Epic 4): persist reason once submission_metadata schema lands` comment + a single-line log via `console.info` (no PII; just "received reason of length N for submission <id>") so the absence is auditable. This keeps the form/server-action contract stable and avoids two breaking changes later. Documented in Risks + Open Questions. Reviewer can elect to overrule and demand a migration here if user prefers.
        - Notably absent: `status` (column default `'pending'` + trigger force on anon — explicit omission documents intent).
     4. `const { data, error } = await supabase.from("restaurants").insert(row).select("id").single();`.
     5. Branch the tuple:
        - `error !== null` → throw `new SubmissionDatabaseError(error.code ?? "unknown", "submission failed")`. Do NOT include `error.message` (may contain SQL fragments). Server logs the full error via `console.error` with a request id placeholder for now (`{ scope: "submitPending", code: error.code, hint: error.hint }`).
        - `data === null` (TypeScript-impossible after `.single()` if no error, but defensive): throw `new SubmissionDatabaseError("no_row", "no inserted row returned")`.
        - Happy: `return { id: data.id as string };` (cast is ok because `select("id")` is the column we asked for).
   - Defines and exports the error classes used (`InvalidInputError`, `SubmissionDatabaseError`, `InvalidNaverUrlError` if zod parse uniquely identifies that field — but the zod refine path already wraps that as a sub-issue, so a separate class is optional; keep the surface small with `InvalidInputError` only at first).

3. **`src/lib/repositories/submissions.test.ts`** — Vitest, jsdom-default env (already configured in `vitest.config.ts`), no DB hits.
   - Mock `@/lib/supabase/server` with `vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: vi.fn(...) }))`. Each test sets the implementation per scenario.
   - Test cases:
     - `rejects when name is empty` — calls `submitPending({ name: "", … })`, asserts throw `InvalidInputError`, asserts the underlying flatten contains `name`.
     - `rejects when naverUrl host is unknown` — `https://map.kakao.com/...` → throws `InvalidInputError`. The zod issue path includes `naverUrl`.
     - `rejects when naverUrl host suffix-injects` — `https://evil.naver.com.attacker.tld/...` → rejected (proves we use exact host match, not `endsWith`).
     - `accepts well-formed naver.me short link` — `https://naver.me/xyz123` → resolves with `{ id }`.
     - `accepts map.naver.com canonical url` — `https://map.naver.com/p/entry/place/12345678` → resolves.
     - `rejects unknown extra keys` — submission with a `status: 'approved'` extra key → throws (`.strict()` mode catches it). Sanity: this is the canonical rule that "the API must reject a client-provided `status` field."
     - `maps camelCase input fields to snake_case insert columns` — captures the argument passed to `.insert(...)` via `vi.fn()` and asserts `name_ja`, `is_solo_default`, `has_jp_menu`, `is_late_night`, `naver_url`, `photo_url`, `price_range` keys exist with correct values; asserts `status` is NOT included; asserts `name_ko` is `null`.
     - `does not persist reason` — asserts the captured insert row does NOT have a `reason` key. (Locks the "reason gap until Epic 4" decision in a test.)
     - `forwards photoUrl when provided, null when absent` — two sub-cases.
     - `surfaces InvalidInputError when zod fails, not the raw zod issue object` — caller sees a typed error, not a `z.SafeParseError`.
     - `surfaces SubmissionDatabaseError when supabase returns a PostgrestError` — sets the mock to return `{ data: null, error: { code: "23502", message: "<sql fragment>" } }` and asserts the thrown error has `.code === "23502"` and the message has been redacted (no SQL fragment in `.message`).
   - Test helper: `mockSupabaseClient({ insert?: ..., error?: ... })` returns a `vi.fn()`-laced fake with the chained `.from(table).insert(row).select("id").single()` shape, so each test reads cleanly. ~10 assertions total.

4. **`src/lib/supabase/storage.ts`** — client-side Storage helper. Pure ESM, NO `"use client"` pragma at the top of the file (the directive applies to React components — utilities just need to be imported only from client-side code paths; the lint surface for this is the calling component, not this file). Imports `createSupabaseBrowserClient` from `@/lib/supabase/browser` (already shipped in Epic 1 / Slice 4).
   - Constants imported from `@/lib/models/submission`: `MAX_PHOTO_BYTES`, `ALLOWED_PHOTO_MIME`. Single source of truth — change the spec, change one file.
   - Errors:
     - `class PhotoTooLargeError extends Error` — fields `{ name, sizeBytes, maxBytes }`.
     - `class PhotoMimeRejectedError extends Error` — fields `{ name, mime, allowed }`.
     - `class PhotoUploadError extends Error` — fields `{ stage: "upload" | "publicUrl", code?: string }` for Supabase storage failures.
   - Export `uploadPhoto(file: File): Promise<string>`:
     1. Reject if `!ALLOWED_PHOTO_MIME.includes(file.type as (typeof ALLOWED_PHOTO_MIME)[number])` — **note the cast is for the `.includes` narrowing only; the runtime check is what matters.**
     2. Reject if `file.size > MAX_PHOTO_BYTES`.
     3. Build a stable, collision-resistant path: `restaurant-photos/{yyyy}/{mm}/{crypto.randomUUID()}.{ext}` where `ext` is derived from the MIME (`jpeg → .jpg`, `png → .png`). NEVER trust `file.name` as a path segment — that's the classic XSS-via-filename hole. Use `globalThis.crypto.randomUUID()` (jsdom polyfill is fine in test).
     4. `const supabase = createSupabaseBrowserClient(); const { error } = await supabase.storage.from("restaurant-photos").upload(path, file, { contentType: file.type, upsert: false });` — branch the error tuple, throw `PhotoUploadError({ stage: "upload", code: error.statusCode })` on failure.
     5. `const { data } = supabase.storage.from("restaurant-photos").getPublicUrl(path);` — Supabase returns `{ data: { publicUrl } }` synchronously. If `data?.publicUrl` is empty, throw `PhotoUploadError({ stage: "publicUrl" })`.
     6. Return the public URL string.
   - Bucket name lives in a single string literal in this module: `const BUCKET = "restaurant-photos" as const;` — no env var, no config knob (the bucket is operator-owned, decided in `decision-log`). Easy to grep for downstream.

5. **`src/lib/supabase/storage.test.ts`** — Vitest, jsdom env (already default via `vitest.config.ts`).
   - jsdom may or may not ship a usable `File` constructor; the existing setup uses jsdom 29 which **does** implement `File` and `Blob`. No polyfill needed. If a test environment quirk surfaces, add `import "blob-polyfill"` only as a fallback (NOT speculative).
   - Mock the browser supabase client similarly to the repo test:
     - `vi.mock("@/lib/supabase/browser", () => ({ createSupabaseBrowserClient: vi.fn() }))`.
     - Each test wires an implementation that returns a stub with `.storage.from(bucket)` returning `.upload`/`.getPublicUrl` `vi.fn()`s.
   - Test cases:
     - `rejects oversized files (>2MB)` — synthesise a `File([Buffer], "x.png", { type: "image/png" })` of 2_097_153 bytes; expects `PhotoTooLargeError`. (Use `new Uint8Array(2_097_153).fill(0)` — jsdom handles it; if memory is a concern, build a `Blob` of the right size with `new Array(N).fill(...)`).
     - `accepts files exactly at 2MB boundary` — 2_097_152 bytes is OK (boundary is `>` not `>=`).
     - `rejects image/gif` — `PhotoMimeRejectedError`.
     - `rejects application/pdf` — `PhotoMimeRejectedError`.
     - `accepts image/jpeg and image/png` — happy path returns the public URL.
     - `passes the supabase upload bucket name "restaurant-photos"` — captures the call arg.
     - `does NOT use the user-supplied filename in the path` — assert the supabase upload path arg starts with `${yyyy}/${mm}/` and does NOT contain the input File's `name`.
     - `surfaces PhotoUploadError on storage failure` — mock returns `{ error: { statusCode: "413" } }` → throws.
     - `surfaces PhotoUploadError on missing publicUrl` — mock `getPublicUrl` returns `{ data: { publicUrl: "" } }` → throws.
   - ~9 assertions total.

6. **No `package.json` mutation** — `zod` was added in Epic 2 / Slice 1; `@supabase/ssr` and `@supabase/supabase-js` already satisfy the rest. **No new deps in this slice.** This keeps the parallel-safe property with Slice 3 trivially: neither slice writes to `package.json` or `pnpm-lock.yaml`.

7. **Manual smoke flow (Reviewer-driven, post-static checks)** — covered in `task-slice-4-verify.md` Live section. In summary: write a 5-line `scripts/storage-bucket-smoke.sh` that uses service-role to assert `restaurant-photos` exists and is public, NOT committed in this slice unless the bucket is provably broken (then it joins as a small ops helper). Mark its absence as a Carry Over otherwise.

## Scope
- Files to create:
  - `src/lib/models/submission.ts`
  - `src/lib/repositories/submissions.ts`
  - `src/lib/repositories/submissions.test.ts`
  - `src/lib/supabase/storage.ts`
  - `src/lib/supabase/storage.test.ts`
- Files to modify: (none)
- Files NOT to touch:
  - **Slice 3 territory**: `src/lib/models/restaurant.ts`, `src/lib/repositories/restaurants.ts`, `src/lib/repositories/restaurants.test.ts` — even read-importing these creates a coupling that breaks parallel-safety on a future re-shuffle.
  - **Slice 1/2 territory**: `supabase/migrations/**`, `supabase/seed.sql`, `supabase/config.toml`.
  - **Epic 1 territory**: `src/lib/supabase/{admin,browser,server}.ts`, `src/lib/env.ts` — read-only imports are fine, source modifications are forbidden.
  - `package.json`, `pnpm-lock.yaml` (no new deps).
  - `next.config.*`, `eslint.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`.
  - `.env.local`, `.env.local.example`, `.gitignore` (operator-owned).
  - Harness directories: `.claude/`, `templates/`, `scripts/`, `context/`, `docs/`.
  - Anything under `src/app/**`, `src/lib/features/**`, `e2e/**`, `messages/**` — UGC form (Epic 4) is the consumer; no UI changes in this slice.

## Acceptance Criteria
- [ ] `src/lib/models/submission.ts` exports `submissionSchema` (zod, `.strict()`), `SubmissionInput`, `MAX_PHOTO_BYTES`, `ALLOWED_PHOTO_MIME`, `NAVER_URL_HOSTS`, `priceRangeSchema`, `naverUrlSchema`, `InvalidInputError`, `SubmissionDatabaseError`. No Supabase import.
- [ ] `src/lib/repositories/submissions.ts` starts with `import "server-only";` and imports the **server** Supabase client only (NOT browser, NOT admin). Single export: `submitPending(input: unknown): Promise<{ id: string }>`.
- [ ] Insert row uses snake_case columns and **omits `status`** (the trigger and the column default coexist as guards). The `name_ko` column is explicitly set to `null`. The `reason` field is read from the input but NOT persisted to a column (documented TODO comment).
- [ ] `src/lib/supabase/storage.ts` exports `uploadPhoto(file: File): Promise<string>` and the three error classes. Bucket constant is `"restaurant-photos"`.
- [ ] Photo size limit `MAX_PHOTO_BYTES` = `2 * 1024 * 1024`. MIME allow-list = `["image/jpeg", "image/png"]`. Both imported from `models/submission.ts` (no duplicated literals).
- [ ] Upload path is `{yyyy}/{mm}/{uuid}.{jpg|png}` — never includes the user-supplied filename.
- [ ] Vitest tests for `submissions.test.ts` cover at minimum: empty name, bad host, suffix-injection host, naver.me, map.naver.com, extra-key rejection, snake_case mapping, reason-not-persisted, photoUrl pass-through, zod-error surface, postgrest-error surface — 11 cases.
- [ ] Vitest tests for `storage.test.ts` cover at minimum: oversize, exact-boundary OK, gif rejected, pdf rejected, jpeg+png happy path, bucket-name assertion, filename-stripped path, upload-error surface, publicUrl-empty surface — 9 cases.
- [ ] No file under `src/app/**` or `src/lib/features/**` is touched.
- [ ] No file imports `@supabase/supabase-js` directly (the only module that does is `src/lib/supabase/admin.ts`, untouched here); the repo goes through `@/lib/supabase/server`, the storage helper goes through `@/lib/supabase/browser`.
- [ ] `pnpm lint` → 0 errors / 0 warnings.
- [ ] `pnpm exec tsc --noEmit` → silent.
- [ ] `pnpm test` → all tests pass; expected count: prior 10 (4 Logo + 6 env smoke) + 11 submissions + 9 storage = **30 tests** (Slice 3 may add more in parallel; review will reconcile).
- [ ] `pnpm build` → succeeds.
- [ ] Harness preservation diff `git diff --name-only main..HEAD -- .claude/ templates/ scripts/ context/ docs/` is empty (this slice does not touch harness).

## Risks & Open Questions
- **`reason` field has no column.** Spec §5 lists `reason` as required input but Slice 1's schema doesn't have a `reason` column. Plan opts to accept-and-validate-but-not-persist with a TODO. Alternative is a follow-up migration in this slice (would inflate scope and break Stage 2 parallelism). Reviewer may overrule. If overruled: extend Slice 1 with a `0002_reason.sql` migration and persist; otherwise keep the TODO and surface it as a Carry Over for Epic 4 / Slice that introduces the UGC form.
- **Repo is server-only despite anon-INSERT being publicly allowed.** The choice forces Epic 4 to wire the form through a Server Action or Route Handler instead of calling Supabase directly from the browser. Trade-off: the repo can use the cookies-aware client (future auth), and the input revalidation lives on a trusted boundary; the cost is one extra hop. Justification: the rule "UI components must not import `@supabase/supabase-js` directly" already implies an indirection layer, and a Server Action fits that pattern. If the user later prefers a direct browser-side insert, splitting `submitPending` into a thin browser variant is a one-file diff at that time.
- **Bucket policy gap.** `restaurant-photos` may exist as public-read but not allow anon `INSERT`. If so, `uploadPhoto` will fail with 403 in real-browser smoke. Test mocks bypass this; live verification is the only place that reveals it. Carry-over remains until Epic 4's e2e covers the form.
- **`File` polyfill in jsdom.** jsdom 29 ships `File`/`Blob`. If the synthesised 2MB file triggers OOM or perf issues in jsdom, we use a `Blob` with a sized `Uint8Array` once and reuse via `new File([blob], "x.png", { type: "image/png" })`. Plan B if jsdom proves flaky: `vi.stubGlobal("File", class { constructor(parts: BlobPart[], name: string, opts: FilePropertyBag) { this.size = (opts as any).size ?? 0; this.type = opts.type ?? ""; this.name = name; } size: number; type: string; name: string; })` — but only as a fallback. Default plan uses native jsdom File.
- **Naver host allow-list is exact-match.** `m.map.naver.com` is rejected. If the form's "share to map" feature returns mobile-host URLs, the user will hit "invalid URL" errors. Reviewer may want to widen the allow-list; for MVP we keep it tight per the API rule. Easy follow-up: add `m.map.naver.com` to `NAVER_URL_HOSTS` if user reports.
- **No service-role bypass in this slice.** The repo deliberately uses the server (cookies-aware) client. If a future admin-side "force submit on behalf" path appears, it should live in a separate `submissions-admin.ts` repo behind `import "server-only"` and `createSupabaseAdminClient()`. Out of scope.
- **Concurrency within `crypto.randomUUID()` paths.** Two simultaneous uploads of the same `yyyy/mm/<uuid>.png` is statistically impossible (UUID v4); we don't need a second collision check. `upsert: false` is the safety net regardless.

## Rollback Plan
- All new files. `git revert <slice-4-commit>` removes all five files cleanly. No DB or schema state to undo.
- If a partial failure surfaces post-merge, the storage helper alone can be deleted without affecting `submitPending` correctness in tests (which are mocked); however, in production the form needs both. Treat the slice as one atomic unit.
- No bucket changes were made by this slice (operator-owned), so no Storage rollback is needed even if `uploadPhoto` was wired into a downstream component before revert.
