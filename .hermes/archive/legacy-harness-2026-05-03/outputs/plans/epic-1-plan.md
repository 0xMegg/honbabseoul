# Epic Plan

## Epic
Epic 1 — Project scaffolding

## Goal
A pristine Next.js 15 App Router app on pnpm with strict TypeScript, Tailwind mapped to `--hb-*` CSS variable tokens, next-intl routing under `/[locale]/...` (ja default, ko parallel), Supabase client factories split by runtime, Vitest unit/component runner with one smoke test, and Playwright E2E runner with one smoke spec. `pnpm install && pnpm lint && pnpm test && pnpm build && pnpm test:e2e` all pass on a clean clone.

## Context
- User need: blank state before any product feature work. Everything downstream is blocked.
- Related docs: `docs/project-plan.md`, `outputs/plans/roadmap.md` (Epic 1 section), `context/decision-log.md` (version lock + scaffolding command entries from 2026-04-25).
- Dependencies: none. No external OAuth, no Supabase migration, no real Naver key fetch at runtime. `.env.local` already populated.

## Pre-Start Context (do not relitigate — decision-log is canonical)
- Node `22.17.0` pinned by `.nvmrc`.
- pnpm `10` activated via corepack (shim at `~/.nvm/versions/node/v22.17.0/bin/pnpm`).
- Scaffolding command: `pnpm dlx create-next-app@15 . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack --use-pnpm`.
- Playwright chromium already pre-downloaded to `~/Library/Caches/ms-playwright/chromium_headless_shell-1217` — `playwright install` will be a no-op.
- Token prefix: `--hb-*`. Default theme lives under `:root` in `src/styles/tokens.css`.
- Design-system reference: `/Users/mero/Dev/13.claude/workouts/kody-workspace/docs/design-system-pattern.md` (5-layer: Page → Primitive → Context → Config → Tokens).

## Stages & Slices

### Stage 1 — Base toolchain (sequential, shared package.json)

#### Slice 1: Next.js 15 + TypeScript + lint/format baseline + all package.json scripts
- **What:** Run the scaffolding command from the decision-log against the current directory. After scaffolding: tighten `tsconfig.json` (`strict: true`, `noUncheckedIndexedAccess: true`), add Prettier config, extend `.gitignore` with Next/Playwright artifacts, ensure a minimal `src/app/page.tsx` renders a "coming soon" placeholder so `pnpm build` succeeds. **Critically: pre-populate ALL `package.json` scripts now** so later stages never touch this file — `dev`, `build`, `start`, `lint`, `format`, `test` (`vitest run`), `test:watch` (`vitest`), `test:e2e` (`playwright test`). Scripts that reference not-yet-installed tools (vitest, playwright) are fine — the scripts are strings, they only run on demand. Preserve all harness files (`CLAUDE.md`, `.claude/`, `context/`, `docs/`, `handoff/`, `outputs/`, `scripts/`, `templates/`, `.harness-manifest`, `README.md`, `PlaceholderGuide.md`, `setup.sh`, `DRYRUN-NOTES.md`, `.mcp.json.example`, `.env.local`, `.env.local.example`, `.nvmrc`).
- **Files:** `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `next.config.ts`, `.eslintrc.json`, `.prettierrc`, `.gitignore`, `src/app/page.tsx`, `src/app/layout.tsx`
- **Depends on:** (none)
- **Done when:** `pnpm install` succeeds; `pnpm lint` passes; `pnpm build` produces `.next/` without type errors; `pnpm dev` served on `localhost:3000` shows the placeholder. Harness files untouched. All 7 scripts defined in `package.json` (subsequent slices add the backing tools, not new script entries).

### Stage 2 — Cross-cutting infrastructure (parallel, disjoint directories)

#### Slice 2: Tailwind v4 + `--hb-*` token layer
- **What:** Create `src/styles/tokens.css` defining `:root` defaults for color (`--hb-bg`, `--hb-text`, `--hb-brand`, `--hb-text-invert`, `--hb-success`, `--hb-danger`), radius (`--hb-radius-sm/md/lg`), shadow (`--hb-shadow-card`), spacing, typography (`--hb-font-sans`, `--hb-font-mono`), and a placeholder `--hb-brand-hover`. Wire `tailwind.config.ts` to alias `colors`, `boxShadow`, `borderRadius` to those variables so `bg-brand`, `shadow-card`, `rounded-md` resolve to the token values. Import `tokens.css` from `src/styles/globals.css`. Do not modify `src/app/page.tsx` from Slice 1.
- **Files:** `tailwind.config.ts`, `postcss.config.mjs`, `src/styles/tokens.css`, `src/styles/globals.css`
- **Depends on:** Slice 1
- **Done when:** A temporary element `<div className="bg-brand rounded-md shadow-card h-16" />` inserted into a test page renders with the brand color (Linear-like purple default, `#5e6ad2`) and 8px radius; `pnpm build` still passes.

#### Slice 3: next-intl locale skeleton
- **What:** Install `next-intl@4`. Create `src/i18n.ts` (or `src/i18n/request.ts` per next-intl v4 docs — follow whatever the current docs recommend), `src/middleware.ts` (locale routing with ja default), `messages/ja.json` and `messages/ko.json` each with a `common.hello` key (`"혼밥서울へようこそ"` / `"혼밥서울에 오신 것을 환영합니다"`). Create `src/app/[locale]/page.tsx` rendering `useTranslations("common").hello`, and `src/app/[locale]/layout.tsx` wrapping children in `NextIntlClientProvider`. **Remove Slice 1's `src/app/page.tsx` placeholder** — middleware handles `/` → `/ja` redirect. Leave `src/app/layout.tsx` alone (root layout with `<html>`/`<body>` stays there; locale-specific providers live in `[locale]/layout.tsx`).
- **Files:** `src/i18n.ts`, `src/middleware.ts`, `messages/ja.json`, `messages/ko.json`, `src/app/[locale]/page.tsx`, `src/app/[locale]/layout.tsx`, `src/app/page.tsx`
- **Depends on:** Slice 1
- **Done when:** `pnpm dev` → `/ja` shows Japanese greeting, `/ko` shows Korean greeting, `/` redirects to `/ja`. `pnpm build` passes with no type errors. `src/app/page.tsx` no longer exists.
- **Note on Stage 2 parallelism:** `src/app/page.tsx` appears in both Slice 1 (Stage 1 — created) and Slice 3 (Stage 2 — removed). Because they are in different Stages, the parallel-overlap gate does NOT flag this. Slice 2 and Slice 4 must not touch `src/app/page.tsx` or any `src/app/[locale]/*` file.

#### Slice 4: Supabase client factories + typed env
- **What:** Install `@supabase/supabase-js`. Create three factories: `src/lib/supabase/browser.ts` (uses `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`), `src/lib/supabase/server.ts` (same two but for Server Components / Route Handlers / Server Actions, wired for Next.js cookies), and `src/lib/supabase/admin.ts` (uses `SUPABASE_SERVICE_ROLE_KEY`, includes a `"server-only"` import guard so build fails if it is imported from a client module). Create `src/lib/env.ts` that reads + type-narrows the env vars and throws on missing required ones.
- **Files:** `src/lib/supabase/browser.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts`, `src/lib/env.ts`
- **Depends on:** Slice 1
- **Done when:** `pnpm build` passes; importing `admin.ts` from a `"use client"` module causes a build-time error (verify with a scratch file then delete it); `env.ts` unit-testable (deferred to Slice 5).

### Stage 3 — Vitest

#### Slice 5: Vitest + one smoke test
- **What:** Install `vitest@3`, `@vitejs/plugin-react`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` via `pnpm add -D`. Create `vitest.config.ts` (jsdom env, React plugin, path alias `@/`), `src/test/setup.ts` (loads `@testing-library/jest-dom`), and a smoke test `src/lib/env.test.ts` that asserts `env.ts` throws when a required var is undefined. **Do NOT modify `package.json` scripts — Slice 1 already defined `test` and `test:watch`.** `pnpm add -D` mutates `devDependencies` + `pnpm-lock.yaml` — that's fine because Stage 3 has only one slice.
- **Files:** `vitest.config.ts`, `src/test/setup.ts`, `src/lib/env.test.ts`
- **Depends on:** Stage 2
- **Done when:** `pnpm test` runs the smoke test and exits 0; `.claude/hooks/post-edit-test.sh` on `src/lib/env.ts` edits triggers only the `env.test.ts` run (verify by editing `env.ts`).

### Stage 4 — Playwright

#### Slice 6: Playwright + one smoke spec
- **What:** Install `@playwright/test` latest via `pnpm add -D`. Create `playwright.config.ts` (chromium only, reuse `~/Library/Caches/ms-playwright` cache, `baseURL: http://localhost:3000`, `webServer: { command: 'pnpm dev', port: 3000, reuseExistingServer: !process.env.CI }`). Create `e2e/smoke.spec.ts` that opens `/ja` and asserts the localized greeting text. **Do NOT modify `package.json` scripts — Slice 1 already defined `test:e2e`.**
- **Files:** `playwright.config.ts`, `e2e/smoke.spec.ts`
- **Depends on:** Stage 3
- **Done when:** `pnpm test:e2e` passes on chromium headless without downloading anything new (cache hit at `~/Library/Caches/ms-playwright/`).

## Slicing Principles
- Each slice is independently testable and reviewable.
- Stage 2 slices never touch `src/app/page.tsx` or `src/app/layout.tsx` owned by Slice 1 — they only add files under `src/styles/`, `src/i18n.ts`, `src/middleware.ts`, `messages/`, `src/app/[locale]/`, `src/lib/supabase/`, `src/lib/env.ts`.
- Stages 3 and 4 only add test infrastructure (never product code), so they cannot collide with Stage 2 output.
- `package.json` scripts are all defined in Slice 1; later slices only run `pnpm add -D` which the executor serialises via Stage separation (Stage 3 = Vitest, Stage 4 = Playwright).

## Epic Acceptance Criteria
- [ ] All 6 slices completed and reviewed (or Developer-Reviewer cycle approved each).
- [ ] `pnpm install && pnpm lint && pnpm test && pnpm build && pnpm test:e2e` all green on a clean clone.
- [ ] `/ja` and `/ko` both render localized greetings; `/` redirects to `/ja`.
- [ ] `src/lib/supabase/admin.ts` cannot be imported from a client module (build-time guard).
- [ ] No hardcoded colors/radii/shadows anywhere in `src/` — only `--hb-*` tokens via Tailwind aliases.
- [ ] Harness files (`.claude/`, `CLAUDE.md`, `context/`, `docs/`, `handoff/`, `outputs/`, `scripts/`, `templates/`) untouched.

## Open Questions
None — the four open questions from the roadmap (geo fallback, price_range, photo constraints, solo OFF semantics) do not affect Epic 1 scope.

## Rollback Strategy
Epic 1 creates only product-scaffolding files. If it must be abandoned:
- Revert the `epic/1` branch entirely with `git branch -D epic/1` (the pre-Epic-1 state is `main @ eb7b4d5`).
- `.env.local` and harness files survive the rollback because they were not created by this epic.
- No Supabase changes to undo. No external resources consumed.
