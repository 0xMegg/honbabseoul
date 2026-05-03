# Epic Plan

## Epic
Epic 3 — Test infra reinforcement

## Goal
The Vitest runner uses `@vitejs/plugin-react` (no more `esbuild.jsx` workaround), Supabase schema is mirrored into a generated TypeScript types file (`src/lib/supabase/types.gen.ts`) so future schema drift is caught statically, a new `*.int.test.ts` category exercises the live Supabase RLS contract (closing the gap that allowed Epic 2 Slice 1's WITH CHECK regression), and every entry in `context/decision-log.md` carries a `**Affects:**` frontmatter so the next Planner can grep historical decisions by epic/slice. After this epic, Epic 4 (Map + filters + bottom sheet) starts on a hardened test foundation.

## Context
- **User need:** Epic 4 ships heavy `.tsx` components (`MapClient`, `FilterBar`, `RestaurantPins`, `BottomSheet`, `RestaurantDetail`) and live data binding. Without (1) a real React plugin in the test runner, (2) generated types backstopping hand-rolled zod schemas, and (3) integration tests against the actual RLS-enabled DB, regressions will slip past the unit/E2E sandwich the same way Epic 2 Slice 1's WITH CHECK weakening did.
- **Approved plan source:** `/Users/mero/.claude/plans/honbabseoul-hazy-orbit.md` (user-approved 2026-04-26).
- **Renumber context:** Phase 0 housekeeping (commit `e23279f`, ff-merged into dev) renumbered the MVP epic list — Epic 3 = Test infra (this), Epic 4 = Map (was Epic 3), Epic 5 = UGC (was Epic 4), Epic 6 = Polish.
- **Decisions already locked** (`context/decision-log.md`):
  - `is_solo_default = NOT NULL DEFAULT true` (entry 9) — Slice 3.2.2 integration test should rely on this invariant when probing RLS.
  - Postgres `major_version = 17` — `supabase gen types` will target the live schema directly; CLI version mismatch caught early if it surfaces.
  - `@supabase/ssr` + `@supabase/supabase-js` already in tree (entry 7) — the generated types feed both clients.
- **Dependencies:** Epic 1 (Vitest baseline), Epic 2 (live Supabase + RLS, 20 seeded rows, `DATABASE_URL` in `.env.local`).
- **Forge round 2 caveat:** P3 (verdict cross-check in run-epic.sh) NOT yet landed. After this epic finishes, manually run `grep -E '<!-- FINAL_VERDICT' outputs/reviews/task-slice-*-review.md` to verify the runner's "all approved" summary — Epic 2 had a real mis-report on this gate.

## Pre-flight (must hold before Stage 1)
- [ ] On `dev` at `e23279f` or later (Phase 0 ff-merged).
- [ ] `.env.local` carries `DATABASE_URL` (transaction pooler URI, password current as of 2026-04-25 reset). Verified by `psql "$DATABASE_URL" -c "select count(*) from restaurants"` returning 20.
- [ ] `nvm use` picks Node `22.17.0`; `pnpm --version` reports 10.x.
- [ ] All 8 `outputs/reviews/*-review.md` carry `<!-- FINAL_VERDICT: APPROVE -->` (Phase 0 cleanup landed this).

## Stages & Slices

### Stage 1 — Test runner foundation (sequential, single slice)

#### Slice 1: vite + plugin-react pin
- **What:** `pnpm add -D vite@^6 @vitejs/plugin-react@^4 --save-exact`. Then in `vitest.config.ts`: remove the `esbuild: { jsx: "automatic" }` block (currently lines 13-15 with the explanatory NOTE comment), add `import react from "@vitejs/plugin-react"` at the top, and introduce `plugins: [react()]` inside `defineConfig({ ... })`. The NOTE comment can be deleted entirely once the workaround is gone.
- **Files:** `package.json`, `pnpm-lock.yaml`, `vitest.config.ts`
- **Depends on:** (none)
- **Done when:** `pnpm install` clean; `pnpm test` runs all 40 existing tests green; `vitest.config.ts` no longer contains `esbuild.jsx` and now contains `@vitejs/plugin-react`; `pnpm build` green.

### Stage 2 — Type-gen + integration test category (parallel — no file overlap)

#### Slice 2: Supabase types autogen
- **What:** Run `pnpm dlx supabase gen types typescript --project-id iosqakynywnrwxrexrfh > src/lib/supabase/types.gen.ts` and commit the generated file. Add a `db:types` script to `package.json` that re-runs that command on demand. Append a decision-log entry titled `2026-04-26 — Supabase generated types as static backstop` recording: zod schemas in `src/lib/repositories/restaurants.ts` and `submissions.ts` remain the runtime gate (defensive validation), `types.gen.ts` is the static-side backstop (TypeScript-time mismatch with live schema fails compilation), and `pnpm db:types` is operator-run after every migration.
- **Files:** `src/lib/supabase/types.gen.ts` (new), `package.json` (add `db:types` script), `context/decision-log.md` (append entry with `**Affects:** Epic-3 / Slice-2`)
- **Depends on:** Slice 1 (Vitest must still run after the types file is added; without 3.1.1's plugin-react, jsx components won't compile cleanly)
- **Done when:** `types.gen.ts` exists, contains the `restaurants` table type and the `restaurant_status`/`price_range` enums; `pnpm db:types` runnable; `pnpm tsc --noEmit` green (catches any drift between hand-rolled zod and generated types as a follow-up signal — does not block this slice); `pnpm build` + `pnpm test` green.

#### Slice 3: `*.int.test.ts` category + first integration test
- **What:** Modify `vitest.config.ts` to add `**/*.int.test.ts` to the `include` array (alongside the existing `src/**/*.{test,spec}.{ts,tsx}` pattern). Create `src/lib/repositories/restaurants.int.test.ts` with a `describe.skipIf(!process.env.DATABASE_URL)` outer block (so `pnpm test` runs the full suite when env is set, skips cleanly when not). Inside, write 2 integration tests:
  1. `listApproved` against the live DB returns exactly the 20 seeded rows, all with `status = 'approved'`.
  2. RLS ablation — perform an anon REST INSERT with `status: 'approved'` against `/rest/v1/restaurants`. Expect HTTP 201 + a row stored as `pending` (verifies the trigger + WITH CHECK two-layer guard restored in Epic 2 Slice 1 cleanup). Then DELETE that row via service-role to keep the test idempotent.
- **⚠ NO `package.json` edit** — explicitly do NOT add a `test:int` script. The env guard inside the test file handles auto-skip. This avoids file overlap with Slice 2 (which edits `package.json`) and keeps Stage 2 parallel-safe.
- **Files:** `vitest.config.ts` (modify — `include` array), `src/lib/repositories/restaurants.int.test.ts` (new)
- **Depends on:** Slice 1
- **Done when:** With `DATABASE_URL` set, `pnpm test` runs the integration test against live RLS and both assertions green; without `DATABASE_URL`, the int test suite shows as skipped (no failure); `pnpm test` total count reflects skip behavior correctly.

### Stage 3 — Decision log frontmatter (sequential, single slice)

#### Slice 4: `**Affects:**` on every decision-log entry
- **What:** Edit `context/decision-log.md`: add a `**Affects:** Epic-N / Slice-X` line to every entry (the 9 original entries from 2026-04-25 + the 1 entry added by Slice 2 of this epic = 10 total). Update the file's Format block at the top to require this field for new entries going forward. Map for the 9 original entries:
  - "Epic 1 tech stack versions" → `**Affects:** Epic 1 (all slices)`
  - "Scaffolding command" → `**Affects:** Epic 1 / Slice 1`
  - "Geolocation fallback" → `**Affects:** Epic 4 / Slice 1.1` (Map foundation)
  - "Price range format" → `**Affects:** Epic 2 / Slice 1, Epic 4 / Slice 3.1, Epic 5 / Slice 1.1`
  - "Photo upload constraints" → `**Affects:** Epic 5 / Slice 1.2`
  - "Tailwind v4 token wiring mechanism" → `**Affects:** Epic 1 / Slice 2`
  - "Supabase Next.js cookie wiring package" → `**Affects:** Epic 1 / Slice 4`
  - "Server-only enforcement for admin client" → `**Affects:** Epic 1 / Slice 4`
  - "is_solo_default NOT NULL" → `**Affects:** Epic 2 / Slice 1, Epic 2 / Slice 3`
  - "reason column deferred" → `**Affects:** Epic 5 / Slice 1.1` (renumbered note already there)
  - "Postgres major version 17" → `**Affects:** Epic 2 / Slice 1, Epic 3 / Slice 2`
  - "혼밥 가능 OFF semantics" → `**Affects:** Epic 2 / Slice 1, Epic 4 / Slice 2.1`
- **Files:** `context/decision-log.md`
- **Depends on:** Slice 2 (which adds an entry that also needs the new field)
- **Done when:** `grep -c '\*\*Affects:\*\*' context/decision-log.md` ≥ 10; the Format block at the top of the file lists `**Affects:**` as a required field; no entry is missing the line.

## Slicing Principles
- **Stage 1 single slice** — vite/plugin-react pin must land before Stage 2 because both Slice 2 and Slice 3 run tests/builds that exercise the new plugin (and Slice 3 in particular ships a new test file that needs jsx compilation if it ever imports a component).
- **Stage 2 parallel safety** — Slice 2 touches `package.json` (script add), Slice 3 explicitly does NOT touch `package.json` (env guard inside test file instead of a separate script). Slice 2 touches `decision-log.md` (entry add), Slice 3 does NOT touch `decision-log.md`. → Zero file overlap → parallel-safe per `docs/epic-guide.md` overlap gate.
- **Stage 3 single slice** — Slice 4 touches `decision-log.md` which Slice 2 also touched. Cross-stage sequencing satisfies the overlap rule. Slice 4 must run AFTER Slice 2 so Slice 4 can also frontmatter Slice 2's added entry.
- **Install Before Import** rule (forge `7f96dd4`) applies to Slice 1 — `pnpm add -D ...` runs before any plugin import in vitest.config.ts.
- **Spec invariant grep** (forge round 2 P4 not yet landed — apply manually): each slice's Done-when explicitly enumerates the observable outcome rather than "tests pass". Verify each acceptance criterion directly.

## Epic Acceptance Criteria
- [ ] All 4 slices reviewed and committed; every `outputs/reviews/task-slice-*-review.md` carries `<!-- FINAL_VERDICT: APPROVE -->` (manually verified by `grep -E '<!-- FINAL_VERDICT' outputs/reviews/task-slice-*-review.md` after epic completion — forge round 2 P3 not landed yet).
- [ ] `pnpm install && pnpm lint && pnpm test && pnpm build && pnpm test:e2e` all green.
- [ ] `pnpm db:types` runnable; regenerates `src/lib/supabase/types.gen.ts` without diff if schema unchanged.
- [ ] With `DATABASE_URL` set, `pnpm test` exercises ≥1 integration test against live RLS and passes; without `DATABASE_URL`, suite skips that test cleanly (no failure, no false-pass).
- [ ] `context/decision-log.md` Format block requires `**Affects:**`; every entry has the line; `grep -c '\*\*Affects:\*\*' context/decision-log.md` ≥ 10.
- [ ] `vitest.config.ts` no longer contains the `esbuild.jsx` workaround.
- [ ] No regression in existing 40 unit tests + 3 e2e specs.

## Open Questions
- **CI for integration tests:** No CI exists yet (improvements item G, scheduled for pre-Epic 5). Until CI lands, integration tests run only on operator's local machine when `DATABASE_URL` is present in `.env.local`. PR authors must confirm local int-test green before requesting merge — manual gate.
- **Generated types vs zod drift:** Slice 2 ships generated types as a static backstop but does NOT auto-rewrite hand-rolled zod schemas. If `tsc --noEmit` reveals drift after a future migration, the operator decides whether to re-derive zod from `types.gen.ts` or update zod manually. **Decision deferred** — surfaces naturally in Epic 5 Slice 1.1 (`reason` column migration).
- **Integration test seed isolation:** Slice 3's first integration test relies on the existing 20-row seed. If a future test mutates seed data, isolation strategy (transaction rollback per test? separate test schema?) is needed. **Out of scope** for this epic; revisit when ≥3 integration tests exist.

## Rollback Strategy
- All slices additive. Slice-by-slice revert is safe.
- **Slice 1 rollback:** `git revert <commit>` restores `esbuild.jsx` workaround + removes plugin-react. Existing tests still green via the workaround (proven during the lifetime of this codebase pre-Epic-3).
- **Slice 2 rollback:** Delete `src/lib/supabase/types.gen.ts` and the `db:types` script. The generated file has no runtime importers (zod is the gate); deletion is purely additive removal.
- **Slice 3 rollback:** Delete `src/lib/repositories/restaurants.int.test.ts` and revert `vitest.config.ts` `include` line. No production code touched.
- **Slice 4 rollback:** `git revert` of the decision-log edit restores the original Format block + removes the `**Affects:**` lines. No effect on running code.
- **Epic-level rollback:** `git revert` the merge commit on dev. All 4 slices land via the runner's stage-integration commits (parallel) or sequential commits — the merge commit (or final ff-merge of `epic/{ts}` branch) is the single revert point.
