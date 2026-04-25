# Work Plan

## Task
Slice 1 (Epic 2 / Stage 1) — Schema migration + RLS policies

## Goal
The Supabase project carries the `restaurants` table with `restaurant_status` + `price_range` enums and three RLS guarantees: anon SELECT only sees `status='approved'`, anon INSERT silently coerces any client-provided status to `'pending'`, anon UPDATE/DELETE are denied. The migration is reversible via a paired `.down` script. The repo also gains the `db:push` / `db:reset` package scripts that wrap psql so future slices (and the Reviewer) can re-apply the migration deterministically. `zod` is installed once here so Slices 3 & 4 can import it without re-touching `package.json`.

## Context
- **Epic / Stage / Slice:** Epic 2 / Stage 1 / Slice 1. Stage 1 is sequential — Slice 2 (seed) depends on this slice; Stage 2 (repository layer, Slices 3 & 4) depends on Stage 1's schema being live.
- **Plan source:** `outputs/plans/epic-2-plan.md` (Stage 1 / Slice 1 spec, lines 28–38).
- **Roadmap source:** `outputs/plans/roadmap.md` Epic 2 / Stage 1 / Slice 2.1.1.
- **Decision-log entries to honor:** 2026-04-25 — "Price range format" (enum `low|mid|high`), "Photo upload constraints" (drives `photo_url text` column shape but not constraints — those live in Slice 4), "혼밥 가능 OFF semantics" (`is_solo_default = false` means **verified 2인 이상 전용**; default of `true` matches OFF-filter semantics).
- **Rules to follow exactly:**
  - `.claude/rules/local/api-honbabseoul.md` — "Public Read Path" (`status='approved'` filter at both repository AND RLS), "UGC Write Path" (anon insert always lands as `pending`, status field rejected at API).
  - `.claude/rules/local/gotchas-honbabseoul.md` — "RLS returns empty arrays silently" (verification must distinguish a real empty result from RLS hiding rows), "UGC status default is `pending`, not `approved`".
  - `.claude/rules/base/api.md` — "Use parameterized queries; always include WHERE clauses in UPDATE/DELETE; use transactions for multi-step mutations" (the migration itself is a single-transaction DDL block).
  - `.claude/rules/base/git.md` — commit message format: `feat: Slice 1 — schema + RLS policies`.
- **Dependencies (already in `.env.local`):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PROJECT_REF`, `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID`. **Adds:** `DATABASE_URL` (user-provided, see Pre-flight). The example file `.env.local.example` will document the new key.
- **npm dependencies:** `pnpm add zod` is a Slice 1 responsibility (Epic 2 plan §Slicing Principles — "Install Before Import" rule, forge `7f96dd4`). zod is NOT imported in this slice; the install is purely so Slices 3 & 4 do not stomp `package.json`.

## Pre-flight (must hold before Stage 1 — Developer's first action)
The Developer phase must verify these before writing or running the migration. If either fails, halt and report to user.
- [ ] `grep -E '^DATABASE_URL=' .env.local` returns a non-empty assignment whose value starts with `postgresql://`. The actual URL value MUST NOT be echoed to logs or stdout — only presence is checked.
- [ ] `command -v psql` resolves. Expected: `/opt/homebrew/opt/libpq/bin/psql` or similar after `brew install libpq && brew link --force libpq`.
- [ ] Optional sanity (NOT a halt condition — Slice 4 owns the bucket): record `curl -s -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_URL/storage/v1/bucket"` output for later cross-check; if the array is empty, Slice 4 will create `restaurant-photos`.

## Pre-Start Greps Reflected
- **New public symbol introduced**: `restaurants` table + `restaurant_status` + `price_range` enums. Consumers in this repo come in **later slices** (Slice 2 seed inserts rows; Slice 3 reads via `listApproved` / `getById`; Slice 4 inserts via `submitPending`). Per the Pre-Start Checklist, those consumer files are listed in Stage 2 of `outputs/plans/epic-2-plan.md` — they belong to a later Stage, not this slice. No file overlap inside Stage 1 ✅.
- **`grep -rE 'restaurants|restaurant_status|price_range' src/`** before this slice returns 0 hits — confirms we are not introducing a duplicate of an existing TS symbol. After this slice, still 0 hits in `src/` (Slice 3 introduces them).
- **`grep -rE '\\bzod\\b' src/`** before this slice returns 0 hits. After `pnpm add zod`, still 0 hits — Slices 3 & 4 introduce the imports. Lock the install here so the lockfile diff is local to this slice.
- **`grep -rE 'DATABASE_URL' .`** before slice: 0 hits in tracked files (the user-provided value lives only in `.env.local`, gitignored). After slice: hits in `.env.local.example` (documentation block) and `package.json` (script consumers) only.
- **`grep -rE 'supabase/migrations|supabase/seed|supabase/config' .`** before slice: 0 hits. After slice: only hits inside the new `supabase/` directory + `package.json` references.

## Approach
Run as discrete phases. Stop at each phase boundary, verify, then proceed. Do NOT batch all DDL into one untested step.

### Phase A — Pre-flight verification
1. Confirm `DATABASE_URL` and `psql` per the Pre-flight checklist above.
2. Probe DB connectivity: `psql "$DATABASE_URL" -c '\conninfo'` (suppress URL echo via `cat` redirect if needed). Must succeed.
3. Confirm a clean target: `psql "$DATABASE_URL" -c "select to_regclass('public.restaurants')"` returns `null` (no leftover from a prior experimental run). If non-null, halt and ask user to clean (do NOT auto-drop — could be live data).

### Phase B — Install zod
4. `pnpm add zod` (no version pin — let pnpm resolve to latest stable in the `^4` line; if the resolved version is unexpected, surface it in the Developer handoff and let the Reviewer call it).
5. Diff: `package.json#dependencies` gains `zod`; `pnpm-lock.yaml` updates. No other changes.

### Phase C — Author the up migration
6. Create `supabase/migrations/0001_restaurants.sql`. Wrap the entire script in `begin; ... commit;` so a failure mid-DDL leaves a clean DB.
   - Enable `pgcrypto` extension for `gen_random_uuid()` (Supabase usually has it; `create extension if not exists`).
   - `create type restaurant_status as enum ('pending', 'approved', 'rejected');`
   - `create type price_range as enum ('low', 'mid', 'high');`
   - `create table restaurants` with columns: `id uuid primary key default gen_random_uuid()`, `name_ja text`, `name_ko text`, `address_ja text`, `address_ko text`, `latitude double precision`, `longitude double precision`, `price_range price_range`, `status restaurant_status not null default 'pending'`, `is_solo_default boolean not null default true`, `has_jp_menu boolean not null default false`, `is_late_night boolean not null default false`, `naver_url text`, `photo_url text`, `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()`.
   - `create or replace function set_updated_at() returns trigger as $$ begin new.updated_at := now(); return new; end; $$ language plpgsql;`
   - `create trigger restaurants_set_updated_at before update on restaurants for each row execute function set_updated_at();`
   - `create or replace function force_pending_for_anon() returns trigger as $$ begin if auth.role() = 'anon' then new.status := 'pending'; end if; return new; end; $$ language plpgsql security definer;`
     - **Why `security definer`:** so the function can read `auth.role()` regardless of caller permissions. Function owner is `postgres` (default for migration scripts).
     - **Why `auth.role() = 'anon'`:** canonical Supabase pattern; service_role and authenticated roles fall through and keep whatever status they sent (admin path needs to be able to set `approved` directly).
   - `create trigger restaurants_force_pending_for_anon before insert on restaurants for each row execute function force_pending_for_anon();`
   - `alter table restaurants enable row level security;`
   - Policy 1: `create policy "anon read approved" on restaurants for select to anon using (status = 'approved');`
   - Policy 2: `create policy "anon insert pending only" on restaurants for insert to anon with check (status = 'pending');`
     - **Why both trigger AND with-check:** defense in depth. The trigger silently rewrites `status` for anon (matches Epic 2 plan's "silently downgraded" wording); the with-check verifies the rewritten value lands. If some future migration breaks the trigger, the policy still rejects `status='approved'` from anon.
   - **No anon UPDATE / DELETE policies** — RLS denies by default when no policy is present.
   - **Add helpful indexes:** `create index restaurants_status_idx on restaurants(status);` and `create index restaurants_status_solo_idx on restaurants(status, is_solo_default);` (the public query in Slice 3 always filters `status='approved'` and frequently filters `is_solo_default`).
7. Linter: `psql --no-psqlrc -h localhost -p 5432 -U test -d test -f supabase/migrations/0001_restaurants.sql --dry-run` is NOT a thing in psql; instead use `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 --single-transaction -f supabase/migrations/0001_restaurants.sql`. The single-transaction + on-error-stop pair is the actual rollback safety net.

### Phase D — Author the down migration
8. Create `supabase/migrations/0001_restaurants.sql.down` mirroring Phase C in reverse:
   - `drop trigger if exists restaurants_force_pending_for_anon on restaurants;`
   - `drop trigger if exists restaurants_set_updated_at on restaurants;`
   - `drop function if exists force_pending_for_anon();`
   - `drop function if exists set_updated_at();`
   - `drop policy if exists "anon insert pending only" on restaurants;`
   - `drop policy if exists "anon read approved" on restaurants;`
   - `drop index if exists restaurants_status_solo_idx;`
   - `drop index if exists restaurants_status_idx;`
   - `drop table if exists restaurants;`
   - `drop type if exists price_range;`
   - `drop type if exists restaurant_status;`
   - Wrap in `begin; ... commit;`. Do NOT drop the `pgcrypto` extension — other tables may use it.

### Phase E — Minimal supabase/config.toml
9. Create `supabase/config.toml` with the minimum the Supabase CLI requires so future `pnpm dlx supabase ...` invocations don't complain:
   ```toml
   project_id = "iosqakynywnrwxrexrfh"

   [db]
   major_version = 15
   ```
   - `project_id` matches `SUPABASE_PROJECT_REF` from `.env.local.example` / chat record.
   - `major_version = 15` — Supabase's current default; if the actual project differs (e.g. 14), the Reviewer should bump this. The CLI is NOT used in this slice (we use raw psql), so a mismatch here is non-fatal but worth flagging.

### Phase F — package.json scripts
10. Add to `package.json#scripts` (preserve existing 8-script order; append at the end):
    - `"db:push": "set -a && . ./.env.local && set +a && psql \"$DATABASE_URL\" -v ON_ERROR_STOP=1 --single-transaction -f supabase/migrations/0001_restaurants.sql"`
    - `"db:reset": "set -a && . ./.env.local && set +a && psql \"$DATABASE_URL\" -v ON_ERROR_STOP=1 --single-transaction -f supabase/migrations/0001_restaurants.sql.down && pnpm db:push"`
    - **Why `set -a; . ./.env.local; set +a`:** sources the env file with auto-export so `psql` sees `DATABASE_URL`. POSIX-portable. Works under pnpm's `sh -c` script runner on macOS/Linux.
    - **Why `ON_ERROR_STOP=1 --single-transaction`:** any SQL error rolls back the entire migration cleanly.

### Phase G — Document DATABASE_URL in `.env.local.example`
11. Append a section to `.env.local.example`:
    ```
    # -----------------------------------------------------------------------------
    # Supabase — direct Postgres connection (server-only)
    # -----------------------------------------------------------------------------
    # Used by `pnpm db:push` / `pnpm db:reset` to apply migrations via psql.
    # Fetch from Supabase Dashboard → Settings → Database → Connection string → URI.
    # The pooler ("Transaction" mode) URL is fine for migration application.
    # NEVER paste the value into chat — same exposure model as service_role.
    DATABASE_URL=
    ```
    Place after the existing `SUPABASE_PROJECT_REF` block, before the Naver Maps section.

### Phase H — Apply the migration
12. Run `pnpm db:push`. Expected output: `BEGIN`, several `CREATE TYPE`/`CREATE TABLE`/`CREATE FUNCTION`/`CREATE TRIGGER`/`CREATE POLICY`/`CREATE INDEX` lines, `COMMIT`.
13. Smoke verify directly via psql (service-role implicit since we're connected as the DB owner):
    - `psql "$DATABASE_URL" -c "\d restaurants"` — shows the table with all 16 columns.
    - `psql "$DATABASE_URL" -c "\dT+"` — shows both enums.
    - `psql "$DATABASE_URL" -c "select tablename, rowsecurity from pg_tables where tablename='restaurants'"` — returns `t` (RLS on).
    - `psql "$DATABASE_URL" -c "select count(*) from restaurants"` — returns 0.

### Phase I — RLS smoke probes (the cardinal verification)
This phase is what proves the slice is "done" per the Epic 2 plan's "Done when" line. The Reviewer reruns these.
14. **Anon SELECT returns approved-only.** With the table empty, the contract is: anon-key REST call returns `[]`. After Slice 2 lands seed data, the same call returns the 20 approved rows. Probe:
    - `curl -s -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/restaurants?select=id,status"`
    - Expected now: `[]`. After Slice 2: 20 objects with `status='approved'` only.
15. **Anon INSERT silently downgrades `status`.** Insert with `status:'approved'` and confirm the stored row has `status='pending'`:
    - `curl -s -X POST -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" -H "Content-Type: application/json" -H "Prefer: return=representation" "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/restaurants" -d '{"name_ja":"_rls_smoke_","name_ko":"_RLS_스모크_","status":"approved","naver_url":"https://map.naver.com/p/rls-smoke","is_solo_default":true,"has_jp_menu":false,"is_late_night":false,"price_range":"low","latitude":37.5666,"longitude":126.9784}'`
    - Expected response: a JSON object with `"status":"pending"` (NOT `"approved"`). The insert succeeds; the trigger silently overrides.
    - Then verify via service-role psql: `psql "$DATABASE_URL" -c "select status from restaurants where name_ja='_rls_smoke_'"` → `pending`.
16. **Cleanup the smoke row** so Slice 2 starts from a clean count: `psql "$DATABASE_URL" -c "delete from restaurants where name_ja='_rls_smoke_'"`. Verify: `psql "$DATABASE_URL" -c "select count(*) from restaurants"` → 0.
17. **Anon UPDATE denied.** Probe: `curl -s -X PATCH ... /rest/v1/restaurants?id=eq.<some-uuid> -d '{"status":"approved"}'` returns either an empty array (no rows match — RLS hid them) or a 401/403 error code. Either is acceptable; record what the response actually looks like for the Reviewer.

### Phase J — Repo hygiene
18. `pnpm lint` — must remain 0/0 (this slice changes no JS/TS source).
19. `pnpm exec tsc --noEmit` — must remain silent.
20. `pnpm test` — must still pass with the 10 existing Vitest tests (no test files added).
21. `pnpm build` — must succeed (no Next.js routes added; `package.json` scripts adding `db:push`/`db:reset` don't affect the build pipeline).
22. `pnpm exec prettier --check supabase/ package.json .env.local.example` — formatting must pass. If `.env.local.example` is excluded by `.prettierignore`, that's fine; the SQL files should be Prettier-stable on default config.

## Scope

### Files to modify
- `package.json` — append `db:push` + `db:reset` scripts to `scripts`; `zod` lands in `dependencies` automatically via `pnpm add`.
- `pnpm-lock.yaml` — auto-updated by `pnpm add zod`. Reviewer should NOT hand-edit; just verify the `zod` entry appears.
- `.env.local.example` — append `DATABASE_URL=` documentation block.

### Files to create
- `supabase/migrations/0001_restaurants.sql` — the up migration (Phase C).
- `supabase/migrations/0001_restaurants.sql.down` — the down migration (Phase D).
- `supabase/config.toml` — minimal CLI config (Phase E).
- `outputs/plans/task-slice-1-plan.md` — this file (Planner artifact, already created).
- `outputs/plans/task-slice-1-verify.md` — verification plan (Planner artifact).
- `outputs/archive/handoff-2026-04-25-epic2-entry.md` — Planner archive of prior handoff (already created).

### Files NOT to touch
- All `src/**` files. Slices 3 & 4 own the model/repository/storage paths under `src/lib/`.
- `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`, `next-env.d.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `playwright.config.ts`, `src/middleware.ts`, `src/i18n.ts`, `src/i18n-request.ts`, `src/i18n-routing.ts` — none affected by this slice.
- `messages/ja.json`, `messages/ko.json`, `e2e/**` — no UI / E2E surface in this slice.
- `src/lib/env.ts` — `DATABASE_URL` is consumed by shell scripts only, not the Node app, so `env.ts` does NOT need it.
- `src/lib/supabase/{browser,server,admin}.ts` — already shipped in Slice 4 of Epic 1; this slice does not touch them.
- Harness files: `.claude/`, `scripts/`, `templates/`, `outputs/plans/roadmap.md`, `outputs/plans/epic-1-plan.md`, `outputs/plans/epic-2-plan.md`, `outputs/plans/task-{1..4}-{plan,verify}.md`, `outputs/reviews/task-{1..4}-review.md`, `context/`, `docs/`, `.harness-manifest`, `.mcp.json.example`, `.nvmrc`, `setup.sh`, `CLAUDE.md`, `PlaceholderGuide.md`, `README.md`, `DRYRUN-NOTES.md`.
- Existing handoff files OTHER than `handoff/task-slice-0.md`: `handoff/latest.md` and `handoff/task-slice-1.md` are NOT this slice's responsibility (per the user's command-args, all reads/writes go through `handoff/task-slice-0.md`).

## Acceptance Criteria
- [ ] `supabase/migrations/0001_restaurants.sql` and its `.down` companion exist and apply cleanly via `pnpm db:reset` from a Supabase project that already had the table (round-trip works).
- [ ] `supabase/config.toml` exists with `project_id` matching `SUPABASE_PROJECT_REF` and a `[db]` section.
- [ ] `package.json#scripts` contains `db:push` and `db:reset` after the existing 8 scripts.
- [ ] `pnpm-lock.yaml` and `package.json#dependencies` contain `zod` (any `^4` version).
- [ ] `.env.local.example` documents `DATABASE_URL` with a "do not paste into chat" warning matching the existing service_role hygiene.
- [ ] `psql "$DATABASE_URL" -c "select count(*) from restaurants"` returns 0 (table exists, empty after smoke cleanup).
- [ ] Anon REST `GET /rest/v1/restaurants?select=*` returns `[]` (RLS holds — no rows visible while empty).
- [ ] Anon REST `POST /rest/v1/restaurants` with `status:'approved'` lands as `status='pending'` (verified by service-role select on the smoke row before deleting it).
- [ ] Anon REST `PATCH` / `DELETE` on the smoke row are denied (no rows affected or HTTP error).
- [ ] `pnpm lint` → 0/0; `pnpm exec tsc --noEmit` → silent; `pnpm test` → 10 passing; `pnpm build` → green.

## Risks & Open Questions
- **`auth.role()` semantics in trigger.** The function depends on Supabase's PostgREST shim that sets `request.jwt.claims` for each request. If the migration is applied via raw psql under a non-Supabase Postgres role, `auth.role()` may not exist. Mitigation: this slice is applied against the actual Supabase project (the only place we run it), so `auth` schema is present. If the Developer hits "function auth.role() does not exist", that means either DATABASE_URL points at a non-Supabase DB or the auth schema is unusually configured — halt and surface to user.
- **`pgcrypto` availability.** Supabase enables it by default. If `create extension if not exists "pgcrypto"` fails (insufficient privilege), fallback is `gen_random_uuid()` from PG ≥ 13's built-in `pg_catalog`. Verify with `psql "$DATABASE_URL" -c "select gen_random_uuid()"` before relying.
- **`major_version` in `supabase/config.toml`.** Set to 15 by default. If the actual project is on 14 or 16, the CLI may complain when this slice's successors invoke `pnpm dlx supabase ...`. Slice 1 itself doesn't run the CLI, so a mismatch is non-blocking — Reviewer can correct in a follow-up.
- **Smoke row residue.** Phase I step 16 deletes the inserted smoke row. If Phase I fails mid-step, a leftover `_rls_smoke_` row may persist. The Developer must verify count returns 0 before moving to Phase J; if not, run the explicit delete.
- **`zod` version pin.** Not pinning lets pnpm resolve the latest. If a major (e.g. v4) ships a breaking change before Slices 3/4, that's a concern for those slices, not this one. Worth recording the resolved version in the Developer handoff so the Reviewer can spot a surprise.
- **Pooler vs direct connection.** Supabase's "Transaction" pooler is fine for short-lived migration runs; "Session" pooler is not (statement-level pooling breaks `--single-transaction` usage). Either works for raw psql one-offs, but if the Developer sees "prepared statements not supported" type errors, they should suggest the user paste the direct (non-pooler) connection string instead.

## Rollback Plan
- **Code:** `git revert <slice-1-commit>` removes `supabase/`, the new package.json scripts, the zod dep, and the `.env.local.example` documentation block.
- **Database:** `pnpm db:reset` runs the down migration first, then re-pushes — but for a true rollback, just run the down migration alone:
  - `set -a && . ./.env.local && set +a && psql "$DATABASE_URL" -v ON_ERROR_STOP=1 --single-transaction -f supabase/migrations/0001_restaurants.sql.down`
  - Or if the migration file is gone (post-revert), inline the drops: `psql "$DATABASE_URL" -c "drop table if exists restaurants cascade; drop type if exists price_range; drop type if exists restaurant_status;"` — `cascade` is safe here because no other tables exist yet.
- **Bucket `restaurant-photos`:** untouched by this slice — operator-owned.
- **Smoke row:** Phase I deletes it; if rollback happens before Phase I cleanup, the down migration drops the table entirely and the row goes with it.
