# Work Plan

## Task
Task 3 (Epic 1 / Stage 2 / Slice 3) — next-intl locale skeleton (`/[locale]` routing, `ja` default, `ko` parallel)

## Goal
After this slice, `pnpm dev` serves `/ja` rendering the Japanese greeting and `/ko` rendering the Korean greeting; the bare URL `/` redirects to `/ja`. Static UI strings flow through next-intl message files; the locale segment is the only routing prefix; `pnpm build && pnpm lint && pnpm exec tsc --noEmit` are green; harness files untouched; the design-token layer (Slice 2) and Supabase client factories (Slice 4) remain unaware of this slice (no shared file collisions outside `package.json`/`pnpm-lock.yaml`/`next.config.ts`).

## Context
- **Related files (this slice owns / creates / deletes):**
  - NEW: `src/i18n/routing.ts`, `src/i18n/request.ts`, `src/middleware.ts`, `messages/ja.json`, `messages/ko.json`, `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx`
  - MODIFIED: `next.config.ts` (wrap with `createNextIntlPlugin`), `package.json` (`+ "next-intl": "^4"`), `pnpm-lock.yaml` (regenerated)
  - DELETED: `src/app/page.tsx` (Slice 1 placeholder — middleware now handles `/`)
- **Read-only / not-this-slice:**
  - `src/app/layout.tsx` — Slice 1 root layout; per epic-1-plan line 45 it stays as-is. `<html lang="en">` is intentionally NOT changed in this slice (a future Polish slice will make `<html lang>` per-locale; Slice 3 must not race that scope).
  - `src/app/globals.css`, `tailwind.config.ts`, `postcss.config.mjs`, `src/styles/**` — owned by **Slice 2** (parallel). Touching them is a parallel-overlap violation.
  - `src/lib/supabase/**`, `src/lib/env.ts` — owned by **Slice 4** (parallel). Same rule.
  - `tsconfig.json`, `.gitignore`, `eslint.config.mjs`, `.prettierignore` — Slice 1 carry-overs (`nextscaffold/` exclude entries) belong to **Slice 2's** cleanup, NOT Slice 3.
  - `outputs/plans/epic-1-plan.md`, `outputs/plans/roadmap.md`, harness directories.
- **Related plan / decisions:**
  - `outputs/plans/epic-1-plan.md` lines 40–46 (Slice 3 spec).
  - `outputs/plans/roadmap.md` lines 57–61 (Slice 2.2 sketch — same scope).
  - `context/decision-log.md` 2026-04-25 entries: `next-intl: 4 (latest)`; locale rule (`ja` default + `ko`).
  - `.claude/rules/local/frontend-honbabseoul.md` (i18n rules: routes under `/[locale]`, messages via `useTranslations`/`getTranslations`, no inline literals).
  - `.claude/rules/local/gotchas-honbabseoul.md` (next-intl ja default, dynamic data uses paired `*_ja` / `*_ko` columns — out of scope here, but the convention informs message-key choices).
- **Dependencies:**
  - Slice 1 — DONE (commit `e1c6308`).
  - Parallel siblings — Slice 2 (Tailwind tokens) and Slice 4 (Supabase factories) run in the same Stage 2 batch. Disjoint directories. Shared-file overlap analysis below.
- **Stage:** Epic 1 / Stage 2 (parallel, three slices). Stage boundary requires Slice 2 + Slice 3 + Slice 4 all green before Stage 3 (Vitest) starts.

## Pre-Start Context (do not relitigate)
- **next-intl version:** `^4` (decision-log lock-in). Setup follows the v4 docs pattern: `routing.ts` + `request.ts` under `src/i18n/`, plugin wrapper in `next.config.ts`, `setRequestLocale` for static rendering. Do NOT use the legacy v3 single-file `src/i18n.ts` form (epic plan even says "follow whatever the current docs recommend").
- **Default locale:** `ja` (Japanese). Parallel locale: `ko` (Korean). Hard-coded; no auto-detection in MVP.
- **Locale prefix mode:** default (`as-needed` is the next-intl default for `defineRouting`). `/` → middleware redirects to `/ja`. URLs are always prefixed (`/ja`, `/ko`).
- **`<html lang="en">` in `src/app/layout.tsx`:** intentionally left as-is for this slice. The epic plan explicitly says to leave the root layout alone. Per-locale `<html lang>` is a polish task (cosmetic only — does not affect i18n routing or content correctness).
- **Greeting copy** (per epic-1-plan line 41):
  - `messages/ja.json` → `common.hello = "혼밥서울へようこそ"` (Hangul brand mark + Japanese welcome — matches the logo policy in `frontend-honbabseoul.md`: 혼밥서울 is fixed Hangul, never swapped by locale).
  - `messages/ko.json` → `common.hello = "혼밥서울에 오신 것을 환영합니다"`.
- **Slice 1 carry-overs NOT addressed here:** Slice 2 owns the `nextscaffold/` cleanup and the four exclude-list deletions. Slice 3 must not touch `tsconfig.json` / `.gitignore` / `eslint.config.mjs` / `.prettierignore` for that purpose — overlap with Slice 2.

### Pre-Start grep results (per Planner role)
- **New public exports introduced this slice + their callers:**
  - `routing` from `src/i18n/routing.ts` → consumed by `src/middleware.ts`, `src/i18n/request.ts`, `src/app/[locale]/layout.tsx` (all created in this slice — same Stage, same slice, no inter-slice dependency). `grep -rl "@/i18n/routing" src/` is currently empty (file does not yet exist), as expected.
  - Default export of `src/i18n/request.ts` → consumed only by next-intl runtime via the plugin (`createNextIntlPlugin()` defaults to `./src/i18n/request.ts`). No app-code call-sites expected.
- **Literal → token migration:** N/A. Slice 3 introduces no styled output beyond a single `<h1>` with utility classes for layout (carried over verbatim from Slice 1's placeholder; no palette literals). Token wiring is Slice 2's job.
- **Shared/core change enumeration:** `next.config.ts` is shared toolchain. `grep -rln "next.config" outputs/plans/` confirms only Slice 1 has touched it (kept the scaffold default empty config). Slice 2 and Slice 4 do **not** modify `next.config.ts` — verified against `outputs/plans/epic-1-plan.md` lines 36–51. Therefore Slice 3 wrapping it with `createNextIntlPlugin` is safe within Stage 2.
- **`src/app/page.tsx` deletion:** Slice 1 created it; Slice 3 deletes it. Different stages → epic-1-plan line 45 explicitly waives the parallel-overlap gate for this case.

### Parallel-overlap audit (Stage 2, three slices in flight)
| File | Slice 2 (Tailwind) | Slice 3 (this) | Slice 4 (Supabase) | Risk |
|---|---|---|---|---|
| `package.json` (`dependencies`) | no install (Tailwind already in Slice 1) | `+ next-intl@^4` | `+ @supabase/supabase-js@^2` | **MEDIUM — git-merge conflict possible**; orchestrator must merge `dependencies` keys, then regenerate `pnpm-lock.yaml` once. Plan handles by isolating only the `dependencies` block and naming the canonical post-merge command (Risk 1 below). |
| `pnpm-lock.yaml` | unchanged | regenerated by `pnpm install` | regenerated by `pnpm install` | Same — regenerated deterministically by `pnpm install` after the merge. |
| `next.config.ts` | NOT touched | **wrapped with `createNextIntlPlugin`** | NOT touched | None — single-slice ownership in this Stage. |
| `src/app/layout.tsx` | NOT touched | NOT touched | NOT touched | None. |
| `src/app/page.tsx` | NOT touched | **deleted** | NOT touched | None — single-slice ownership. |
| `src/app/[locale]/**` | NOT touched | **created** | NOT touched | None. |
| `src/i18n/**`, `src/middleware.ts`, `messages/**` | NOT touched | **created** | NOT touched | None. |
| `src/lib/**` | NOT touched | NOT touched | created (`supabase/`, `env.ts`) | None. |
| `src/styles/**`, `tailwind.config.ts`, `postcss.config.mjs`, `src/app/globals.css` | created/modified | NOT touched | NOT touched | None. |

The only real shared-file risk is `package.json` + `pnpm-lock.yaml`. Risk 1 below specifies the merge protocol.

## Approach

### Phase A — Pre-flight
1. Confirm working tree is on `epic/20260425-133941` (or the parallel worktree branch the orchestrator put us on — accept either; do not switch branches).
2. `git status` — should show only the four parallel handoff files and any other Slice 2/4 progress in the parallel worktree. The Developer must NOT touch any of those.
3. Verify `package.json` does not already contain `next-intl` (should be absent — Slice 1 only installed Next/React/Tailwind/ESLint/Prettier).

### Phase B — Install next-intl
4. `pnpm add next-intl@^4` (NOT `-D` — next-intl is a runtime dependency).
   - Mutates `package.json#dependencies` and `pnpm-lock.yaml`.
   - If parallel-mode merge conflict appears later, the orchestrator's merge-resolution step is `git checkout --ours package.json && jq '.dependencies."next-intl" = "^X.Y.Z"' package.json | sponge package.json && pnpm install` (or analogous manual edit). This slice's Developer just runs the `pnpm add` and trusts the merge step.

### Phase C — Author next-intl glue
5. **`src/i18n/routing.ts`** — define the routing config:
   ```ts
   import { defineRouting } from "next-intl/routing";

   export const routing = defineRouting({
     locales: ["ja", "ko"],
     defaultLocale: "ja",
   });
   ```
   - No `localePrefix` override → uses next-intl's default (`always`), which produces `/ja` and `/ko` URLs and redirects `/` → `/ja`.

6. **`src/i18n/request.ts`** — server-side message loader:
   ```ts
   import { getRequestConfig } from "next-intl/server";
   import { hasLocale } from "next-intl";
   import { routing } from "./routing";

   export default getRequestConfig(async ({ requestLocale }) => {
     const requested = await requestLocale;
     const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
     return {
       locale,
       messages: (await import(`../../messages/${locale}.json`)).default,
     };
   });
   ```
   - `hasLocale` narrows the type from `string | undefined` to `Locale`; safe under `noUncheckedIndexedAccess`.

7. **`src/middleware.ts`** — locale-routing middleware:
   ```ts
   import createMiddleware from "next-intl/middleware";
   import { routing } from "./i18n/routing";

   export default createMiddleware(routing);

   export const config = {
     // Match all pathnames except for
     // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
     // - … the ones containing a dot (e.g. `favicon.ico`)
     matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
   };
   ```

8. **`messages/ja.json`** —
   ```json
   {
     "common": {
       "hello": "혼밥서울へようこそ"
     }
   }
   ```

9. **`messages/ko.json`** —
   ```json
   {
     "common": {
       "hello": "혼밥서울에 오신 것을 환영합니다"
     }
   }
   ```

10. **`src/app/[locale]/layout.tsx`** — locale-aware shell wrapping `NextIntlClientProvider`. **No `<html>` / `<body>` here** (root layout owns those):
    ```tsx
    import { hasLocale, NextIntlClientProvider } from "next-intl";
    import { setRequestLocale } from "next-intl/server";
    import { notFound } from "next/navigation";
    import { routing } from "@/i18n/routing";

    export function generateStaticParams() {
      return routing.locales.map((locale) => ({ locale }));
    }

    export default async function LocaleLayout({
      children,
      params,
    }: {
      children: React.ReactNode;
      params: Promise<{ locale: string }>;
    }) {
      const { locale } = await params;
      if (!hasLocale(routing.locales, locale)) {
        notFound();
      }
      setRequestLocale(locale);
      return <NextIntlClientProvider>{children}</NextIntlClientProvider>;
    }
    ```
    - `params` is a Promise in Next.js 15 (App Router) — must `await`. This is the project's Next 15 pattern.

11. **`src/app/[locale]/page.tsx`** — minimal greeting:
    ```tsx
    import { useTranslations } from "next-intl";

    export default function Home() {
      const t = useTranslations("common");
      return (
        <main className="flex min-h-screen items-center justify-center p-8 text-center">
          <h1 className="text-2xl font-semibold">{t("hello")}</h1>
        </main>
      );
    }
    ```
    - Reuses Slice 1's layout utilities verbatim — only the body string changes (now via translation key).

### Phase D — Wire next-intl into Next.js
12. **`next.config.ts`** — wrap with the next-intl plugin:
    ```ts
    import type { NextConfig } from "next";
    import createNextIntlPlugin from "next-intl/plugin";

    const withNextIntl = createNextIntlPlugin();

    const nextConfig: NextConfig = {
      /* config options here */
    };

    export default withNextIntl(nextConfig);
    ```
    - `createNextIntlPlugin()` defaults to looking for `./src/i18n/request.ts` — matches step 6.

### Phase E — Remove Slice 1's placeholder
13. `git rm src/app/page.tsx` (or just delete the file; `git status` will show the deletion). The middleware now owns `/` and redirects to `/ja`.

### Phase F — Verify
14. Run the verification plan in `outputs/plans/task-3-verify.md`.

## Scope

### Files to create
- `src/i18n/routing.ts`
- `src/i18n/request.ts`
- `src/middleware.ts`
- `messages/ja.json`
- `messages/ko.json`
- `src/app/[locale]/layout.tsx`
- `src/app/[locale]/page.tsx`

### Files to modify
- `next.config.ts` (wrap with `createNextIntlPlugin`; deviates from epic-1-plan's Slice 3 file list — see Risk 2)
- `package.json` (`+ "next-intl": "^4"` in `dependencies`)
- `pnpm-lock.yaml` (regenerated)

### Files to delete
- `src/app/page.tsx`

### Files NOT to touch (HARD GUARD — Reviewer rejects on violation)
- `src/app/layout.tsx` (Slice 1 owns; epic plan line 41 forbids)
- `src/app/globals.css`, `src/styles/**`, `tailwind.config.ts`, `postcss.config.mjs` (Slice 2 owns — parallel)
- `src/lib/**` (Slice 4 owns — parallel)
- `tsconfig.json`, `.gitignore`, `eslint.config.mjs`, `.prettierignore` (Slice 1 carry-overs are Slice 2's job)
- `vitest.config.ts`, `playwright.config.ts`, `e2e/**`, `src/test/**` (later stages)
- `CLAUDE.md`, `PlaceholderGuide.md`, `README.md`, `DRYRUN-NOTES.md`, `setup.sh`, `.harness-manifest`, `.mcp.json.example`, `.env.local`, `.env.local.example`, `.nvmrc`
- Whole directories: `.claude/`, `context/`, `docs/`, `outputs/` (except this slice's plan/verify/handoff), `scripts/`, `skills/`, `templates/`

## Acceptance Criteria
- [ ] `pnpm install` succeeds; `package.json#dependencies` contains `"next-intl": "^4..."` (exact patch left to pnpm).
- [ ] `pnpm lint` exits 0 (no warnings either — same bar as Slice 1).
- [ ] `pnpm exec tsc --noEmit` exits 0 with strict + `noUncheckedIndexedAccess` honored (the `params: Promise<{locale: string}>` typing is required for Next 15).
- [ ] `pnpm build` succeeds with both `/[locale]/page` and `/[locale]/layout` routes prerendered for `locale ∈ {ja, ko}` (`generateStaticParams` covers both); the production build log shows static rendering for `/ja` and `/ko`, not dynamic.
- [ ] `pnpm dev` →
  - GET `/` returns `307` (or `308`) Location: `/ja` (next-intl middleware redirect).
  - GET `/ja` returns `200` and HTML body contains `혼밥서울へようこそ`.
  - GET `/ko` returns `200` and HTML body contains `혼밥서울에 오신 것을 환영합니다`.
- [ ] `src/app/page.tsx` does NOT exist (`test ! -e src/app/page.tsx`).
- [ ] `src/app/layout.tsx` is byte-identical to its state on commit `e1c6308`.
- [ ] All harness files unchanged (diff against `e1c6308`).
- [ ] No raw locale strings (`"ja"`, `"ko"`) hard-coded outside `src/i18n/routing.ts` (single source of truth).
- [ ] `messages/ja.json` and `messages/ko.json` have the **same key shape** (both contain `common.hello` and nothing else). A future mismatch breaks `useTranslations` typing.
- [ ] Lint/analyze passes (covered above).
- [ ] Tests pass — N/A (Vitest installed in Slice 5; Playwright smoke `/ja` greeting is in Slice 6).

## Risks & Open Questions

### Risks

- **Risk 1 — `package.json` / `pnpm-lock.yaml` parallel-merge conflict with Slice 4.**
  - Both Slice 3 (`pnpm add next-intl`) and Slice 4 (`pnpm add @supabase/supabase-js`) mutate the same files in parallel worktrees. Git will mark a merge conflict on `dependencies` and a guaranteed conflict on `pnpm-lock.yaml`.
  - **Mitigation (orchestrator-side):** the standard recipe is to take both additive `dependencies` entries (semantic merge — neither slice removes anything) and then regenerate `pnpm-lock.yaml` with `pnpm install` once on the merge commit. The Reviewer of this slice does NOT need to resolve this; the orchestrator merging Stage 2 does.
  - **Mitigation (this-slice):** Developer must NOT manually edit Slice 4's keys, even if visible in the parallel worktree. The Developer's commit must touch only `dependencies."next-intl"` and the resulting lockfile changes attributable to that.

- **Risk 2 — `next.config.ts` not in epic-1-plan's Slice 3 file list.**
  - The epic plan's Slice 3 file list is `src/i18n.ts, src/middleware.ts, messages/ja.json, messages/ko.json, src/app/[locale]/page.tsx, src/app/[locale]/layout.tsx, src/app/page.tsx`. It omits `next.config.ts`, but next-intl v4 requires the plugin wrapper for the `request.ts` lookup.
  - **Mitigation:** I am explicitly extending the file list to include `next.config.ts` and `package.json`/`pnpm-lock.yaml`. This is a planner correction, not scope creep. The parallel-overlap audit (table above) confirms neither Slice 2 nor Slice 4 touches `next.config.ts`, so the addition is parallel-safe. The Reviewer of this slice should verify `next.config.ts`'s diff is exactly the plugin wrap (no other changes).

- **Risk 3 — `<html lang="en">` mismatch with the Japanese/Korean content.**
  - Slice 1's `src/app/layout.tsx` hard-codes `<html lang="en">` and the epic plan (line 41) explicitly says to leave it alone. Browsers will see Korean/Japanese content under `lang="en"`, which a strict accessibility / SEO audit will flag.
  - **Mitigation:** Out of scope for this slice. The functional acceptance criteria (correct greeting per locale, `/` redirect) all pass regardless. A later Polish slice will refactor the root layout to be a pass-through and move `<html lang={locale}>` into `[locale]/layout.tsx`. **Carry over** to handoff.

- **Risk 4 — `setRequestLocale` omitted from `[locale]/page.tsx`.**
  - Per next-intl v4 docs, `setRequestLocale` should ideally be called in **every** static-rendered Server Component segment. The layout already calls it (step 10). For a tiny single-file page that uses `useTranslations` (which is a client hook on Server Components in next-intl v4 via the provider), the layout call is sufficient. If `pnpm build` log shows a "Forced dynamic" warning for `/[locale]`, the Developer should add `setRequestLocale(locale)` to `page.tsx` as well. Track this in verification step 8.

- **Risk 5 — Middleware matcher regex misses some paths.**
  - The matcher `/((?!api|trpc|_next|_vercel|.*\\..*).*)` is the next-intl recommended pattern (it skips API routes, internals, and files with extensions like `favicon.ico`). If the Developer mistypes the regex, `/` won't redirect or static assets will get caught. Verification step 6 covers this with a real curl.

- **Risk 6 — Slice 2 and Slice 3 both touch `src/app/page.tsx` lifecycle?**
  - Slice 2 does not touch `src/app/page.tsx` (per epic plan line 45). Slice 3 deletes it. There is no overlap. Confirmed.

### Open Questions
- None blocking this slice. The four spec-level open questions (geo fallback, price_range, photo, solo OFF) are already resolved in the decision-log and do not affect Epic 1.

## Rollback Plan
1. The slice produces 7 new files + 3 modified files + 1 deleted file. Rollback = `git restore --staged --worktree . && git clean -fd src/i18n src/app/[locale] messages` then `pnpm install` to drop `next-intl` from the lockfile.
2. Branch state returns to commit `e1c6308` (Slice 1 final state).
3. No external systems touched; no Supabase/Naver state changes; no commits land before Reviewer APPROVE.
4. If only the dev runtime is broken (build passes, dev fails), the safer rollback is to revert just `next.config.ts` and `src/middleware.ts` while keeping the message files — they cause no harm at rest.
