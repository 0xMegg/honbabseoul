# Honbabseoul Conventions

## Source Provenance

- Existing root contract before Hermes adoption: `AGENTS.md`, `CLAUDE.md`.
- Project context: `context/about-me.md`.

## Project

- Name: honbabseoul
- Type: Web App, mobile-first, Japanese-primary
- Stack: Next.js 15 App Router, React 19, TypeScript strict, Tailwind CSS with `--hb-*` CSS variable tokens, next-intl, Supabase, Naver Maps JS SDK, pnpm, Vercel

## Product Context

Honbabseoul curates Seoul restaurants suitable for solo dining without social pressure. The primary users are Japanese women travelers in their 20s and 30s visiting Korea. The primary UI language is Japanese, with Korean maintained in parallel for planning and operations review.

Core MVP surfaces:

- Naver Maps pin and filter UI.
- Bottom-sheet restaurant details with Japanese/Korean content and Naver Maps web links.
- UGC restaurant submissions stored as pending until approved in Supabase.

## Build & Test Commands

- Install: `pnpm install`
- Dev/Run: `pnpm dev`
- Build: `pnpm build`
- Lint/Analyze: `pnpm lint`
- Format: `pnpm format`
- Unit/component tests: `pnpm test`
- Single Vitest file: `pnpm test <file>`
- Test watch: `pnpm test:watch`
- E2E: `pnpm test:e2e`

## Folder Boundaries

- Source code: `src/`
- Unit/component tests: co-located in `src/` as `*.test.ts` or `*.test.tsx`
- E2E tests: `e2e/*.spec.ts`
- Do not modify without explicit scope: `.env`, `.env.local`, `.next/`, `pnpm-lock.yaml`, `supabase/migrations/`, `next.config.*`, `.vercel/`, `playwright-report/`, `test-results/`

## Architecture

- Feature-first route and library structure: `src/app/[locale]/...`, `src/lib/features/*`, `src/lib/repositories/*`.
- State management: React local state plus Server Components for server state; no global store yet.
- Routing: locale-prefixed App Router paths under `/[locale]/...`, with `ja` default and `ko` parallel.
- Data access: wrap Supabase SDK in `src/lib/repositories/*`; UI components and Server Components must not import `@supabase/supabase-js` directly.

## Coding Conventions

- TypeScript strict mode with `noUncheckedIndexedAccess`.
- Naming: `camelCase` for variables/functions, `PascalCase` for components/types, `SCREAMING_SNAKE` for env keys.
- File naming: `kebab-case` for routes/utilities, `PascalCase.tsx` for React components.
- Imports: use `@/` absolute alias; avoid deep `../../` imports.
- Error handling: branch Supabase `{ data, error }` at repository boundary, throw typed errors upward, and surface user-facing errors through JA/KO message maps.

## Product Gotchas

- Keep `messages/ja.json` and `messages/ko.json` synchronized for user-facing strings.
- Naver Maps SDK is not SSR-safe; load map UI with `dynamic(() => import(...), { ssr: false })`.
- Naver external links must use browser web URLs on `map.naver.com`; do not use app intent schemes.
- UGC inserts must use `status='pending'`; public reads must filter `status='approved'`.
- Service-role keys are server-only and must never be exposed to client bundles.
- UI is mobile-first for 360-414px, with desktop enhanced progressively at `md:` and above.
- Logo is the Korean `혼밥서울` graphic with `ホンバプソウル` supporting copy; do not split by locale.
