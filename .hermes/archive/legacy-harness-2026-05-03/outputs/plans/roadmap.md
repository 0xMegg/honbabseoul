# honbabseoul — MVP Epic Roadmap

> Created: 2026-04-25
> Source: `docs/project-plan.md` (MVP v1.0)
> Next step: run `/plan Epic 1` (scaffolding). Each epic below is pre-sketched at slice granularity so the Planner can refine in-place rather than start from scratch.

## Overview

Six epics, sequential. Each epic has a concrete acceptance gate so we can ship → verify → learn before the next. (Epic 3 = Test infra was inserted on 2026-04-26 via renumber; Epic 6 = Polish was promoted from "follow-up Epic 5" hint.)

| # | Epic | Goal | Files (est.) | Stages |
|---|---|---|---|---|
| 1 | Project scaffolding | Empty Next.js app boots with tokens, i18n, Supabase client factories, Vitest, Playwright | ~15 | 3 |
| 2 | Data layer & repositories | Supabase schema + RLS + seed + read/write repo functions, verified by Vitest | ~8 | 2 |
| 3 | **Test infra reinforcement** | vite + plugin-react pin, Supabase types autogen, `*.int.test.ts` category, decision-log frontmatter | ~7 | 3 |
| 4 | Map + filters + bottom sheet (read path) | Users see approved restaurants on a Naver map, filter by 3 chips, open a bottom-sheet detail | ~10 | 3 |
| 5 | UGC submission (write path) | Users submit a new restaurant (pending), operators flip status in Supabase dashboard, next refresh shows it on the map | ~8 | 2 |
| 6 | Polish | Logo final art, meta tags, OG image, Vercel perf tuning, error boundaries (deferred from MVP) | TBD | TBD |

Scope explicitly **out**: admin UI (operators use the Supabase dashboard), social login, reviews/comments, push notifications, dark mode, A/B design variants.

---

## Cross-epic conventions

- **Branch**: each slice lands on `task/{id}`; stage integration commits land on `epic/{id}`; the epic is merged into `dev` when its acceptance criteria pass.
- **Data columns**: `name_ja`, `name_ko`, `address_ja`, `address_ko`, `price_range`, `status`, `is_solo_default`, `has_jp_menu`, `is_late_night`, `naver_url`, `photo_url`, `created_at`.
- **Visual tokens**: every color/shadow/radius referenced below goes through `--hb-*`. No literal hex outside `src/styles/tokens.css`.
- **Locale rule**: static UI copy uses next-intl keys; dynamic data shows `{locale}_ja ?? {locale}_ko` (for ja) or the inverse (for ko).

---

## Epic 1 — Project scaffolding

### Goal
A pristine Next.js 15 app on pnpm with strict TypeScript, Tailwind mapped to `--hb-*` tokens, next-intl routing under `/[locale]/...`, Supabase client factories split by runtime, Vitest smoke test, and Playwright smoke spec. No product features yet — `pnpm dev` opens a bilingual "coming soon" page.

### Context
- User need: blank state before any feature work.
- Dependencies: none (this epic creates the toolchain).
- Decisions already made: pnpm, TS strict, Tailwind + tokens, Vitest + Playwright, next-intl (ja default + ko), Supabase. See `context/about-me.md`.

### Stages & Slices

#### Stage 1 — Base toolchain (sequential, shared package.json)
##### Slice 1.1: Next.js + TypeScript + lint/format baseline
- **What:** scaffold Next.js 15 App Router, strict tsconfig, ESLint + Prettier, extend `.gitignore` for `.next/`, `playwright-report/`, `test-results/`, `.vercel/`, `.env.local`
- **Files:** `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `next.config.ts`, `.eslintrc.json`, `.prettierrc`, `.gitignore`
- **Depends on:** (none)
- **Done when:** `pnpm install && pnpm lint && pnpm build` succeeds on an empty `src/app/page.tsx` that renders "coming soon"

#### Stage 2 — Cross-cutting infra (parallel, disjoint directories)
##### Slice 2.1: Tailwind + `--hb-*` token layer
- **What:** Tailwind v4 wired to CSS variables; `tokens.css` defines `:root` defaults (color, radius, shadow, font, table-head text-transform); `tailwind.config.ts` aliases map to `var(--hb-*)`; global stylesheet imports tokens
- **Files:** `tailwind.config.ts`, `postcss.config.js`, `src/styles/tokens.css`, `src/styles/globals.css`
- **Depends on:** Slice 1.1
- **Done when:** a test element using `bg-brand` resolves to `var(--hb-brand)` and the page renders the brand color in dev

##### Slice 2.2: next-intl locale skeleton
- **What:** middleware for locale routing, message files for ja/ko with a single `common.hello` key, `src/app/[locale]/layout.tsx` wrapping children with `NextIntlClientProvider`, `src/app/[locale]/page.tsx` rendering `useTranslations("common").hello`
- **Files:** `src/i18n.ts`, `src/middleware.ts`, `messages/ja.json`, `messages/ko.json`, `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx`
- **Depends on:** Slice 1.1
- **Done when:** `/ja` shows Japanese, `/ko` shows Korean, root redirects to `/ja`

##### Slice 2.3: Supabase client factories + env scaffold
- **What:** browser / server / admin client factories with types, `.env.local.example` listing all public and secret env vars, typed env helper
- **Files:** `src/lib/supabase/browser.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts`, `src/lib/env.ts`, `.env.local.example`
- **Depends on:** Slice 1.1
- **Done when:** `pnpm build` passes with strict types; admin client is only reachable from server-only files (runtime assertion + import path convention documented)

#### Stage 3 — Test runners (parallel, independent configs)
##### Slice 3.1: Vitest + one smoke test
- **What:** Vitest config with jsdom env, Testing Library glue, smoke test proving `src/lib/env.ts` works; package scripts `test`, `test:watch`
- **Files:** `vitest.config.ts`, `src/test/setup.ts`, `src/lib/env.test.ts`
- **Depends on:** Stage 2
- **Done when:** `pnpm test` runs the smoke, exits 0, and `post-edit-test.sh` fires the targeted test on `env.ts` edit

##### Slice 3.2: Playwright + one smoke spec
- **What:** Playwright config (chromium only for MVP), `e2e/smoke.spec.ts` opening `/ja` and asserting the localized greeting; package script `test:e2e`
- **Files:** `playwright.config.ts`, `e2e/smoke.spec.ts`
- **Depends on:** Stage 2
- **Done when:** `pnpm test:e2e` against `pnpm dev` passes on CI-like env (chromium, headless)

### Acceptance
- [ ] All slices APPROVE'd
- [ ] `pnpm install && pnpm lint && pnpm test && pnpm build && pnpm test:e2e` all green on a clean clone
- [ ] `/ja` and `/ko` both render; logo slot present (can be placeholder SVG)
- [ ] No secrets in git; `.env.local.example` committed with comments

### Rollback
If scaffolding fails, everything in this epic is safe to delete — no production data, no external state. Revert the `epic/1` branch entirely.

---

## Epic 2 — Data layer & repositories

### Goal
Supabase has a `restaurants` table with RLS policies enforcing `status='approved'` for anon reads, a pending-only insert policy for anon writes, seed data for ~20 sample Seoul restaurants, and typed repository functions (`listApproved`, `getById`, `submitPending`) that the rest of the app will consume. No UI yet — verified entirely by Vitest + a curl script.

### Context
- User need: everything downstream is blocked until the data shape is stable.
- Dependencies: Epic 1 (Supabase client factories), a real Supabase project (user provisions; see `handoff/latest.md` open items).

### Stages & Slices

#### Stage 1 — Schema + policies (sequential)
##### Slice 2.1.1: Schema migration + RLS
- **What:** `restaurants` table with columns listed in "Cross-epic conventions", `status` enum (`pending`/`approved`/`rejected`), `is_solo_default` default `true`; RLS: anon SELECT where `status='approved'`, anon INSERT forcing `status='pending'`, everything else denied
- **Files:** `supabase/migrations/0001_restaurants.sql`
- **Depends on:** (none — Supabase project assumed created)
- **Done when:** migration applies on a fresh DB; `select * from restaurants where status='pending'` as anon returns 0 rows even if rows exist; anon `insert ... status:'approved'` fails

##### Slice 2.1.2: Seed data
- **What:** ~20 approved restaurants across 3 major Seoul areas (Hongdae, Myeongdong, Gangnam) with realistic bilingual fields and latitude/longitude
- **Files:** `supabase/seed.sql`
- **Depends on:** Slice 2.1.1
- **Done when:** `supabase db reset` applies schema + seed; `select count(*) from restaurants where status='approved'` returns 20

#### Stage 2 — Repository layer (parallel, different files)
##### Slice 2.2.1: Restaurants read repository
- **What:** `listApproved({ isSolo, hasJpMenu, isLateNight })` and `getById(id)` with typed `Restaurant` model, error branching, Vitest coverage over filter combinations
- **Files:** `src/lib/repositories/restaurants.ts`, `src/lib/repositories/restaurants.test.ts`, `src/lib/models/restaurant.ts`
- **Depends on:** Stage 1
- **Done when:** unit tests cover default-on `isSolo`, all-off, and edge case of an empty filter result; `{ data, error }` both branches exercised

##### Slice 2.2.2: Submissions write repository + Storage helper
- **What:** `submitPending(input)` validating required fields and Naver URL allow-list, `uploadPhoto(file)` for Supabase Storage, Vitest with mocked Supabase client
- **Files:** `src/lib/repositories/submissions.ts`, `src/lib/repositories/submissions.test.ts`, `src/lib/supabase/storage.ts`
- **Depends on:** Stage 1
- **Done when:** tests assert rejection of missing fields, non-Naver URL, and bad photo MIME; successful path returns the new row's id

### Acceptance
- [ ] Schema + RLS applied
- [ ] Seed provides enough rows to make the map visibly populated in Epic 4
- [ ] `pnpm test src/lib/repositories` fully green
- [ ] Manual curl (documented in slice review) proves RLS holds

### Rollback
The migration is additive — revert is a `drop table restaurants` + `drop type restaurant_status`. Seed data loss is acceptable.

---

## Epic 3 — Test infra reinforcement

### Goal
Test runner normalised for the upcoming `.tsx`-heavy product epics (vite + plugin-react pinned), Supabase schema-runtime drift caught automatically (generated TS types backstop hand-rolled zod), live-DB RLS regression caught immediately (`*.int.test.ts` category), and decision history grep-able for future Planners (`**Affects:**` frontmatter on every entry).

### Context
- User need: structural reinforcement before Epic 4 (Map) ships React components and live data; closes the "repository ↔ live RLS" gap that bit Epic 2 Slice 1 cleanup.
- Dependencies: Epic 1 (Vitest baseline), Epic 2 (live Supabase + RLS).

### Stages & Slices

#### Stage 1 — Test runner foundation (sequential)
##### Slice 3.1.1: vite + plugin-react pin
- **What:** `pnpm add -D vite@^6 @vitejs/plugin-react@^4 --save-exact`; remove `esbuild.jsx: 'automatic'` workaround in `vitest.config.ts`; introduce `import react from "@vitejs/plugin-react"` + `plugins: [react()]`.
- **Files:** `package.json`, `pnpm-lock.yaml`, `vitest.config.ts`
- **Depends on:** (none)
- **Done when:** Existing 40 tests still green; `vitest.config.ts` uses plugin-react; esbuild jsx workaround removed.

#### Stage 2 — Type-gen + integration test (parallel, no file overlap)
##### Slice 3.2.1: Supabase types autogen
- **What:** `pnpm dlx supabase gen types typescript --project-id iosqakynywnrwxrexrfh > src/lib/supabase/types.gen.ts`; add `db:types` script to `package.json`; decision-log entry on the role of generated types vs hand-rolled zod.
- **Files:** `src/lib/supabase/types.gen.ts` (new), `package.json`, `context/decision-log.md`
- **Depends on:** 3.1.1
- **Done when:** `pnpm db:types` runnable; `pnpm build` + `pnpm test` green.

##### Slice 3.2.2: `*.int.test.ts` category + first integration test
- **What:** Add `**/*.int.test.ts` glob to vitest include; first integration test exercises `listApproved` + RLS WITH-CHECK ablation against the live DB. **Does NOT add a separate `test:int` script** — env guard (`process.env.DATABASE_URL` absent → `describe.skip`) so `pnpm test` auto-branches. Avoids `package.json` overlap with 3.2.1.
- **Files:** `vitest.config.ts` (modify), `src/lib/repositories/restaurants.int.test.ts` (new)
- **Depends on:** 3.1.1
- **Done when:** With `DATABASE_URL` set, `pnpm test` runs the integration test against live RLS and passes; without it, the suite skips cleanly.

#### Stage 3 — Decision log frontmatter (sequential)
##### Slice 3.3.1: `**Affects:**` on every decision-log entry
- **What:** Add `**Affects:** Epic-N / Slice-X` line to every entry in `context/decision-log.md`; update the file's Format block to require it going forward.
- **Files:** `context/decision-log.md`
- **Depends on:** 3.2.1 (which adds an entry that also gets the new field)
- **Done when:** `grep -c '\*\*Affects:\*\*' context/decision-log.md` ≥ 10 (existing 9 + Slice 3.2.1 addition).

### Acceptance
- [ ] All slices APPROVE'd
- [ ] `pnpm install && pnpm lint && pnpm test && pnpm build` clean
- [ ] `pnpm db:types` runnable
- [ ] `DATABASE_URL` set → `pnpm test` exercises ≥1 int test against live RLS, green
- [ ] Every entry in `context/decision-log.md` carries `**Affects:**`

### Rollback
All additive. Slice-by-slice revert. 3.1.1 revert restores the esbuild jsx workaround. 3.2.x revert is file deletion. 3.3.1 revert is line-level.

---

## Epic 4 — Map + filters + bottom sheet (read path)

### Goal
A user opens the app, sees approved pins on a Naver map centered on Seoul, can toggle three filter chips (혼밥 default on, 日本語メニュー, 深夜営業), taps a pin and gets a bottom-sheet with bilingual name, price range, address (copyable), and a "네이버 지도로 보기" web link. Spec §3–4 fully delivered.

### Context
- User need: primary value loop — discover a solo-friendly restaurant and decide to go.
- Dependencies: Epic 1 (shell), Epic 2 (repositories), Naver Maps client ID (user provisions).

### Stages & Slices

#### Stage 1 — Map foundation (sequential)
##### Slice 4.1.1: Naver Maps client wrapper
- **What:** `MapClient` — `"use client"` component loading Naver Maps SDK only in `useEffect`; exposes an imperative handle for registering pin layers; default center = Seoul City Hall, fallback when geolocation is denied
- **Files:** `src/lib/features/map/MapClient.tsx`, `src/lib/features/map/useNaverMapsSdk.ts`
- **Depends on:** Epic 1
- **Done when:** `pnpm build` has no SSR errors; the component renders a map at the default center in `pnpm dev`

##### Slice 4.1.2: Map page shell
- **What:** `/[locale]/page.tsx` hosts the map full-viewport with the logo header and a loading fallback; no pins yet
- **Files:** `src/app/[locale]/page.tsx`, `src/lib/features/layout/Header.tsx`
- **Depends on:** Slice 4.1.1
- **Done when:** `/ja` and `/ko` render the map + localized header; Lighthouse mobile CLS < 0.1

#### Stage 2 — Filters + pins (parallel, separate directories)
##### Slice 4.2.1: Filter state + chip UI
- **What:** `useFilters` hook with URL-sync (`?solo=1&jp=0&late=0`); `FilterBar` chip component; default state is `solo=true, jp=false, late=false` per spec §3
- **Files:** `src/lib/features/filters/useFilters.ts`, `src/lib/features/filters/FilterBar.tsx`, `src/lib/features/filters/useFilters.test.ts`
- **Depends on:** Stage 1
- **Done when:** chips toggle URL params; refreshing the page preserves filter state; Vitest covers default + toggle logic

##### Slice 4.2.2: Pin layer on the map
- **What:** `RestaurantPins` fetches via `listApproved(filters)` and renders Naver Maps markers with cluster support; click emits a pin-select event
- **Files:** `src/lib/features/map/RestaurantPins.tsx`, `src/lib/features/map/pin-marker.ts`
- **Depends on:** Stage 1
- **Done when:** with seed data, all 20 pins render; toggling `solo=false` in URL changes the pin set; click dispatches the select event (asserted by Playwright in Stage 3)

#### Stage 3 — Bottom sheet detail (sequential, composes prior slices)
##### Slice 4.3.1: Bottom sheet + detail view
- **What:** `BottomSheet` primitive (drag-to-dismiss, snap points); `RestaurantDetail` renders bilingual name, price range, address with copy button, photo, and "네이버 지도로 보기" anchor (validated web URL, `target="_blank"`, `rel="noopener noreferrer"`); hooks into pin-select event
- **Files:** `src/lib/features/detail/BottomSheet.tsx`, `src/lib/features/detail/RestaurantDetail.tsx`, `src/lib/features/detail/use-copy-to-clipboard.ts`
- **Depends on:** Stage 2
- **Done when:** Playwright `e2e/read-path.spec.ts` covers: open `/ja` → first pin visible → click → bottom sheet shows name_ja + name_ko → external link href matches `https://map.naver.com/...`

### Acceptance
- [ ] Map visible, 20 seed pins, 3 filters functional including default-on 혼밥
- [ ] Bottom sheet opens on pin click with bilingual data + copyable address + Naver web link
- [ ] `e2e/read-path.spec.ts` green on chromium
- [ ] Lighthouse mobile score > 85 on `/ja`

### Rollback
If a slice breaks the read path, revert that slice alone — map foundation (Stage 1) is worth keeping.

---

## Epic 5 — UGC submission (write path)

### Goal
User opens `/[locale]/submit`, fills 7 required fields + optional photo, submit button stays disabled until valid, on submit the row is inserted with `status='pending'` and a confirmation toast shows. The operator (me or the stakeholder) later flips `status='approved'` via Supabase dashboard; next map refresh shows the new pin. Spec §5 fully delivered.

### Context
- User need: user-contributed data quality loop.
- Dependencies: Epic 1 (shell), Epic 2 (submissions repository), Supabase Storage bucket `restaurant-photos` created by operator.

### Stages & Slices

#### Stage 1 — Submission form UI (parallel, different files)
##### Slice 5.1.1: Form page + field components
- **What:** `/[locale]/submit/page.tsx` renders `SubmissionForm`; form uses react-hook-form or a hand-rolled equivalent with zod; required-field logic drives submit button disabled state per spec §5
- **Files:** `src/app/[locale]/submit/page.tsx`, `src/lib/features/submission/SubmissionForm.tsx`, `src/lib/features/submission/fields.ts`, `src/lib/features/submission/submission-schema.ts`
- **Depends on:** Epic 1
- **Done when:** Playwright asserts submit is disabled with any required field blank, enabled when all are filled; Vitest covers schema validation

##### Slice 5.1.2: Photo upload widget
- **What:** `PhotoUpload` component — client-side image selection, MIME/size check, direct Supabase Storage upload returning a public URL the form stashes
- **Files:** `src/lib/features/submission/PhotoUpload.tsx`, `src/lib/features/submission/use-photo-upload.ts`
- **Depends on:** Epic 2 (storage helper)
- **Done when:** manual verification: a ≤2MB jpg/png uploads and shows a thumbnail; oversized or wrong MIME shows an inline error

#### Stage 2 — Wiring + admin workflow
##### Slice 5.2.1: Server Action submission + toast
- **What:** `actions.ts` validates input server-side (zod + Naver URL allow-list), calls `submitPending`, returns success/error; form shows next-intl toast on success and redirects to `/[locale]`
- **Files:** `src/app/[locale]/submit/actions.ts`, `src/lib/features/submission/submit-toast.tsx`
- **Depends on:** Slice 5.1.1, Slice 5.1.2
- **Done when:** real Supabase receives a `status='pending'` row on full form submit; bad Naver URL gets 400; Playwright covers happy path

##### Slice 5.2.2: Operator workflow doc + audit
- **What:** `docs/admin-workflow.md` explains how the operator approves a pending row in the Supabase dashboard and what fields to double-check; Playwright E2E asserts a submitted row is NOT visible on the map (still pending); audit report confirms all acceptance criteria
- **Files:** `docs/admin-workflow.md`, `e2e/submission.spec.ts`, `outputs/reviews/epic-5-audit.md`
- **Depends on:** Slice 5.2.1
- **Done when:** the audit file contains `Verdict: PASS` and `Blocker=0`; the E2E spec proves pending row isolation; the operator has manually verified the approve flow once (recorded in audit)

### Acceptance
- [ ] All slices APPROVE'd
- [ ] End-to-end: submit in browser → dashboard shows pending row → operator sets approved → `/[locale]` pin appears on next reload
- [ ] `outputs/reviews/epic-5-audit.md` — `Verdict: PASS`, `Blocker=0`
- [ ] No raw PostgREST errors surface to the UI

### Rollback
The submission path is additive — revert is slice-by-slice. Pending rows can stay in DB (status filter hides them).

---

## Resolved decisions (answered 2026-04-25)

1. **Geolocation fallback.** Permission denied → center the map on **서울시청 (37.5666, 126.9784)** and show a non-blocking toast: "위치 사용을 허용하면 주변 식당이 먼저 보입니다 / 位置情報を許可すると近くのレストランが先に表示されます".
2. **Price range.** Stored as a **3-level enum** `price_range ∈ { 'low', 'mid', 'high' }` rendered as `₩ / ₩₩ / ₩₩₩`. Migration `supabase/migrations/0001_restaurants.sql` defines the enum.
3. **Photo constraints.** **≤ 2 MB**, `image/jpeg` or `image/png`, **1 image max** per submission. Server-side re-validates the MIME and byte length. Storage bucket: `restaurant-photos` (public).
4. **"혼밥 가능" OFF semantics.** `is_solo_default = false` means **"confirmed 2인 이상 전용"** (verified as not solo-friendly — 무한리필/전골류 등). It is NOT "unverified". Chip label when off: 「2人以上専用も表示」. Rows without verified solo status stay out of the public map until an operator flips `is_solo_default`.

---

## Rollout

Suggested pace: one epic per focused session, review between epics, 4 total sessions. Estimated 4–6 hours of Claude orchestration end-to-end (user reviews between).

After Epic 5 ships, a follow-up **Epic 6 — Polish** (logo final art, meta tags, OG image, Vercel perf tuning, error boundaries) is likely — but deferred until the three value loops are live.
