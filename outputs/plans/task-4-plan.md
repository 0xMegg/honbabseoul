# Work Plan

## Task
Task 4 (Epic 1 / Stage 2 / Slice 4) — Supabase client factories + typed env

## Goal
Three runtime-isolated Supabase client factories (`createBrowserClient`, `createServerClient`, `createAdminClient`) and a typed-env module (`src/lib/env.ts`) land under `src/lib/`. The admin client is import-time guarded so `pnpm build` fails the moment any `"use client"` module imports it. `pnpm install`, `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build` all pass on the new code; no other slice's files are touched.

## Context
- **Epic / Stage / Slice:** Epic 1 / Stage 2 (parallel) / Slice 4. Stage 2 contains three parallel slices — Slice 2 (Tailwind tokens), Slice 3 (next-intl skeleton), Slice 4 (this one). All three depend on Stage 1 (Slice 1 — already merged at commit `e1c6308` on `epic/20260425-133941`).
- **Related plan:** `outputs/plans/epic-1-plan.md` Slice 4 definition (lines 47–51).
- **Related rules (must follow exactly):**
  - `.claude/rules/local/api-honbabseoul.md` — "Keys & Clients" section: factories must be split by runtime; `SUPABASE_SERVICE_ROLE_KEY` is server-only; `"use client"` modules must never reach it.
  - `.claude/rules/local/gotchas-honbabseoul.md` — "Service-role key in client bundle = incident."
  - `CLAUDE.md` — Architecture: "Supabase SDK wrapped in `src/lib/repositories/*`; UI components and Server Components must not import `@supabase/supabase-js` directly." (This slice creates the **client factories** that the Epic 2 repository layer will call. Repositories themselves are out of scope for Slice 4.)
- **Env vars (already in `.env.local`, schema documented in `.env.local.example`):**
  - `NEXT_PUBLIC_SUPABASE_URL` — required, browser-safe.
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — required, browser-safe.
  - `SUPABASE_SERVICE_ROLE_KEY` — required, **server-only** (must never appear in the client bundle).
  - `SUPABASE_PROJECT_REF`, `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID` — present, NOT consumed by this slice.
- **Stage:** parallel with Slices 2 & 3 — disjoint file sets (Slice 2 owns `tailwind.config.ts`, `postcss.config.mjs`, `src/styles/*`; Slice 3 owns `src/i18n*.ts`, `src/middleware.ts`, `messages/*`, `src/app/[locale]/*`, `src/app/page.tsx`). Slice 4 owns `src/lib/**` exclusively. No file overlap → safe to run in parallel.

## Pre-Start Context (do not relitigate)
- **Slice 1 outcome (commit `e1c6308`):** Next 15.5.15 + React 19 + Tailwind v4 + ESLint 9 (flat config at `eslint.config.mjs`) + Prettier 3 + 8-script `package.json`. `tsconfig.json` has `strict: true` and `noUncheckedIndexedAccess: true`.
- **Carry-overs from Slice 1 (NOT this slice's responsibility):** Manual `rm -rf nextscaffold` + dropping `nextscaffold` exclude entries from `tsconfig.json` / `eslint.config.mjs` / `.prettierignore` / `.gitignore`. Slice 2 owns the cleanup (it edits those files anyway). Slice 4 must NOT touch any of them.
- **Decision-log lock:** `@supabase/supabase-js` latest `^2`. `noUncheckedIndexedAccess: true` is on, so any `process.env.X` access must narrow `string | undefined` explicitly (covered by `env.ts`).

### Pre-Start grep — new-symbol enumeration
The slice introduces six new exports. Grep results below confirm no current call-sites exist — all six land as Stage 2 scaffolding for downstream consumers (Slice 5 + Epic 2). The Planner gate on dead-code is **intentionally relaxed for this slice** because the Epic 1 plan acceptance criteria (`outputs/plans/epic-1-plan.md` line 81 + Slice 4 done-when on line 51) explicitly mandate creating these factories before any consumer exists.

| New export | Lives in | First downstream call-site (planned) |
| --- | --- | --- |
| `publicEnv` (object) | `src/lib/env.ts` | `src/lib/supabase/browser.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts` (this slice — same file batch) |
| `getServiceRoleKey()` | `src/lib/env.ts` | `src/lib/supabase/admin.ts` (this slice) |
| `createBrowserClient()` | `src/lib/supabase/browser.ts` | Slice 5 (`env.test.ts` does NOT need this — only `env.ts`); Epic 2 client-side repository helpers |
| `createServerClient()` | `src/lib/supabase/server.ts` | Epic 2 server-side repositories (Server Components / Route Handlers) |
| `createAdminClient()` | `src/lib/supabase/admin.ts` | Epic 2 admin pages + Route Handlers under `src/app/api/admin/**` |
| (test fixture) | `src/lib/env.test.ts` (Slice 5) | Slice 5 imports `env.ts` to assert the missing-var throw — closes the loop |

`grep -r "createBrowserClient\|createServerClient\|createAdminClient\|publicEnv\|getServiceRoleKey" src/` returns empty today. Acceptable.

### Pre-Start grep — literal-to-token migration
N/A. Slice 4 writes only TypeScript modules (no CSS, no colors, no design tokens).

### Pre-Start grep — shared/core change
- `package.json` is touched (additive `dependencies`). Stage 1 owned the `scripts` block; Stage 2 only adds `dependencies` / `devDependencies`. Slice 2 and Slice 3 also `pnpm add` packages — three parallel `pnpm add` calls into the same `package.json` will race. **Mitigation:** the parallel slice runner serialises pnpm operations within a worktree; if running outside a worktree, the Developer must coordinate with the Stage 2 sibling slices (run `pnpm install` once at the end after all three have edited `dependencies`). Practically, each slice's `pnpm add` is idempotent and the Developer can `git status` before/after to confirm only the expected entries appear.
- `pnpm-lock.yaml` is touched. Same race concern as `package.json`. Same mitigation.

## Approach

### Phase A — Pre-flight
1. `git status` — confirm clean tree on `epic/20260425-133941` (or its parallel-slice worktree). Stop if dirty for reasons unrelated to this slice.
2. Confirm `src/lib/` does not yet exist (`ls src/lib 2>/dev/null` returns no results). If a sibling parallel slice has already created `src/lib/env.ts` or any `src/lib/supabase/*.ts`, STOP and reconcile — Slice 4 is the sole owner of `src/lib/env.ts` and `src/lib/supabase/**`.

### Phase B — Install dependencies
3. `pnpm add @supabase/supabase-js @supabase/ssr server-only`
   - **Why three packages, not just `@supabase/supabase-js`:** the Epic 1 plan (line 48) says "wired for Next.js cookies" for the server factory. The canonical Next.js App Router cookie wiring is `@supabase/ssr` (Supabase's official package, supersedes the older `@supabase/auth-helpers-nextjs`). `@supabase/supabase-js` is the underlying client used directly by `admin.ts` (no cookies needed for service-role). `server-only` is the `react`/`next` ecosystem package that throws a build-time error when imported into a `"use client"` module — this is the canonical guard the Epic plan mandates on line 48.
   - These three additions are dependencies (not devDependencies) — they ship with the runtime build.
   - **Decision-log carry:** add a single line to `context/decision-log.md` recording the `@supabase/ssr` choice (canonical for Next.js 15 cookie wiring; `auth-helpers-nextjs` is deprecated). Planner adds the entry now (Planner can edit `context/`); Developer does not need to revisit.

### Phase C — Typed env module
4. Create `src/lib/env.ts`:
   ```ts
   /**
    * Centralised env access. Public (NEXT_PUBLIC_*) values are validated at
    * module load — they are inlined by Next.js at build time and always defined
    * in both server and client bundles. Server-only secrets are validated
    * lazily inside `getServiceRoleKey()` so this module remains safe to import
    * from client code (the secret is never referenced at import time).
    */

   function requirePublic(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY"): string {
     const value = process.env[name];
     if (!value) {
       throw new Error(`[env] Missing required public env var: ${name}`);
     }
     return value;
   }

   export const publicEnv = {
     NEXT_PUBLIC_SUPABASE_URL: requirePublic("NEXT_PUBLIC_SUPABASE_URL"),
     NEXT_PUBLIC_SUPABASE_ANON_KEY: requirePublic("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
   } as const;

   export function getServiceRoleKey(): string {
     const value = process.env.SUPABASE_SERVICE_ROLE_KEY;
     if (!value) {
       throw new Error("[env] Missing required server env var: SUPABASE_SERVICE_ROLE_KEY");
     }
     return value;
   }
   ```
   - Top-level `requirePublic` calls run at every import. In production both vars are inlined by Next.js, so the throw never fires post-build. In dev, a missing `.env.local` entry produces a clear error pointing at the key name.
   - `getServiceRoleKey` is called only from `admin.ts` (server-only). The function body never executes during browser runtime because `admin.ts` itself is server-only-guarded.
   - **No `as` casts**, no `any`. Each branch narrows `string | undefined` to `string` via the explicit throw.

### Phase D — Browser client factory
5. Create `src/lib/supabase/browser.ts`:
   ```ts
   import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";
   import { publicEnv } from "@/lib/env";

   export function createBrowserClient() {
     return createSupabaseBrowserClient(
       publicEnv.NEXT_PUBLIC_SUPABASE_URL,
       publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
     );
   }
   ```
   - No `"use client"` directive on this file. Adding one would force every importer into a client boundary — instead, this module is **isomorphic** and gets called from a `"use client"` consumer in Epic 2.
   - Wraps `@supabase/ssr`'s `createBrowserClient` (cookie-aware, syncs session with the server client). Per Supabase's Next.js 15 App Router docs.

### Phase E — Server client factory
6. Create `src/lib/supabase/server.ts`:
   ```ts
   import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
   import { cookies } from "next/headers";
   import { publicEnv } from "@/lib/env";

   export async function createServerClient() {
     const cookieStore = await cookies();
     return createSupabaseServerClient(
       publicEnv.NEXT_PUBLIC_SUPABASE_URL,
       publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
       {
         cookies: {
           getAll() {
             return cookieStore.getAll();
           },
           setAll(cookiesToSet) {
             try {
               cookiesToSet.forEach(({ name, value, options }) => {
                 cookieStore.set(name, value, options);
               });
             } catch {
               // setAll is invalid in Server Components (read-only cookies);
               // safe to ignore when middleware is responsible for refresh.
             }
           },
         },
       },
     );
   }
   ```
   - Async because `cookies()` in Next.js 15 returns `Promise<ReadonlyRequestCookies>`. Callers must `await createServerClient()`.
   - Importing `next/headers` is itself a server-only operation (Next.js will reject this import in a `"use client"` file). That alone is a hard guard, but we still rely on the explicit `server-only` import inside `admin.ts` for the service-role key.

### Phase F — Admin client factory (with build-time guard)
7. Create `src/lib/supabase/admin.ts`:
   ```ts
   import "server-only";
   import { createClient } from "@supabase/supabase-js";
   import { publicEnv, getServiceRoleKey } from "@/lib/env";

   export function createAdminClient() {
     return createClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, getServiceRoleKey(), {
       auth: {
         persistSession: false,
         autoRefreshToken: false,
       },
     });
   }
   ```
   - `import "server-only"` is the canonical Next.js guard: when bundled into a client component graph, the build fails with `You're importing a component that needs "server-only". That only works in a Server Component`.
   - `auth.persistSession: false` + `autoRefreshToken: false` — admin clients are stateless, must never write session cookies (would leak the service-role token via the browser).
   - Uses `@supabase/supabase-js` directly (not `@supabase/ssr`) — the admin path bypasses RLS, no cookies involved.

### Phase G — Verify the import-time guard
8. **Scratch file (will be deleted before commit):** create `src/app/_scratch-admin-guard.tsx`:
   ```tsx
   "use client";
   import { createAdminClient } from "@/lib/supabase/admin";

   export function ScratchGuardProbe() {
     return <div>{String(typeof createAdminClient)}</div>;
   }
   ```
   Run `pnpm build`. Expected: build fails with `"server-only" cannot be imported from a Client Component module` (or equivalent Next.js wording). Record the exact error in the verification report.
9. **Delete the scratch file** (`rm src/app/_scratch-admin-guard.tsx`). Re-run `pnpm build` — must now succeed.
   - Two distinct outcomes are required:
     - Step 8: build FAILS with the server-only guard error → proves the guard works.
     - Step 9: build PASSES after the scratch file is removed → proves nothing else accidentally imports admin.ts from a client boundary.

### Phase H — Final verification
10. Run the verification plan in `outputs/plans/task-4-verify.md`. All commands must pass; the scratch file must be gone before handoff.

## Scope

### Files to modify (canonical list, owned by Slice 4)
- `package.json` — adds `@supabase/supabase-js`, `@supabase/ssr`, `server-only` to `dependencies`.
- `pnpm-lock.yaml` — regenerated by pnpm.
- `src/lib/env.ts` — NEW.
- `src/lib/supabase/browser.ts` — NEW.
- `src/lib/supabase/server.ts` — NEW.
- `src/lib/supabase/admin.ts` — NEW.
- `context/decision-log.md` — APPEND ONE ENTRY (Planner-authored — Developer must NOT edit decision-log; if Planner forgot to add it, Developer flags in handoff and proceeds).

### Files transiently touched (must NOT survive into the commit)
- `src/app/_scratch-admin-guard.tsx` — created in Phase G step 8, deleted in Phase G step 9. Reviewer's `git status` after Developer hands off MUST NOT list this file.

### Files NOT to touch (HARD GUARD — Reviewer rejects on violation)
- Anything outside `src/lib/`, `package.json`, `pnpm-lock.yaml`. In particular:
  - `tsconfig.json`, `eslint.config.mjs`, `.prettierignore`, `.gitignore` — Slice 2's nextscaffold cleanup (carry-over from Slice 1).
  - `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css` — Slice 3 / Slice 2 own these.
  - `src/i18n*.ts`, `src/middleware.ts`, `messages/**`, `src/app/[locale]/**` — Slice 3.
  - `tailwind.config.ts`, `postcss.config.mjs`, `src/styles/**` — Slice 2.
  - All harness files: `CLAUDE.md`, `PlaceholderGuide.md`, `README.md`, `DRYRUN-NOTES.md`, `setup.sh`, `.harness-manifest`, `.mcp.json.example`, `.env.local`, `.env.local.example`, `.nvmrc`, and the `.claude/`, `docs/`, `handoff/` (Reviewer overwrites slice-3 handoff only), `outputs/`, `scripts/`, `skills/`, `templates/` directories.
  - `vitest.config.ts`, `playwright.config.ts`, `e2e/`, `src/test/` — Slice 5 / Slice 6.

## Acceptance Criteria
- [ ] `pnpm install` succeeds with no peer-dep errors after the three packages are added.
- [ ] `pnpm lint` exits 0 on the new modules.
- [ ] `pnpm exec tsc --noEmit` exits 0 (every `process.env.X` access narrows `string | undefined` → `string` correctly under `noUncheckedIndexedAccess`).
- [ ] `pnpm build` succeeds AFTER the scratch file is removed.
- [ ] `pnpm build` FAILS with the `server-only` guard error WHILE the scratch file exists (verification step — recorded but not committed).
- [ ] `src/app/_scratch-admin-guard.tsx` does NOT exist in the working tree at handoff time (`ls src/app/_scratch-admin-guard.tsx` returns "No such file").
- [ ] `package.json#dependencies` contains exactly `@supabase/supabase-js`, `@supabase/ssr`, `server-only` (in addition to the Slice 1 set: `react`, `react-dom`, `next`).
- [ ] No `*.test.ts` exists yet under `src/lib/` — Slice 5 owns the test runner. (`env.test.ts` is explicitly Slice 5's responsibility, not Slice 4's.)
- [ ] All "Files NOT to touch" remain byte-identical to commit `e1c6308`. Verify with `git diff e1c6308 -- <list>` returning empty.
- [ ] Lint/analyze passes (covered above).
- [ ] Tests pass — N/A (Vitest is Slice 5).

## Risks & Open Questions

### Risks
- **Risk 1 — `@supabase/ssr` is a deviation from the strict-text Epic 1 plan.** The plan said "Install `@supabase/supabase-js`" but mandated cookie wiring. Mitigation: the Planner records the `@supabase/ssr` choice in `context/decision-log.md` so future slices/epics don't relitigate. The package is canonical Supabase tooling for Next.js App Router (`auth-helpers-nextjs` is deprecated).
- **Risk 2 — Stage 2 parallel `pnpm add` race.** Slices 2/3/4 may all mutate `package.json` + `pnpm-lock.yaml` simultaneously. Mitigation: parallel runner serialises pnpm via worktree isolation; if running on a single working tree, the Developer pauses until sibling slices finish their `pnpm add` (the harness-orchestrated parallel runner handles this). Worst case: lockfile merge conflict at integration time; resolved by re-running `pnpm install` to regenerate the lockfile from the merged `package.json`.
- **Risk 3 — `cookies()` async API surprise.** A consumer that forgets to `await createServerClient()` will get a Promise-typed Supabase client. Mitigation: the function signature returns `Promise<SupabaseClient>` — TypeScript will flag missing `await` at the call-site. Acceptance criteria checks `tsc --noEmit` passes.
- **Risk 4 — `server-only` guard semantics differ from "build fails on import".** The actual error happens during the client-bundle compile step inside `next build`, not at module-resolve time. Mitigation: Phase G step 8 produces the exact failure mode the Epic plan asks for. Recorder logs the exact message; Reviewer can match it against the Next.js error format.
- **Risk 5 — `noUncheckedIndexedAccess` strictness on `process.env[name]`.** Reading `process.env[dynamicKey]` returns `string | undefined` regardless of the flag (which is correct); each branch needs an explicit narrow. Mitigation: `requirePublic` and `getServiceRoleKey` each check `if (!value) throw …`. No type assertions.
- **Risk 6 — Scratch file accidentally committed.** If the Developer forgets Phase G step 9, the unrelated client-side admin probe ships in the build. Mitigation: acceptance criterion "scratch file does not exist at handoff" is enforced via `git status` and `ls` in the verify plan.
- **Risk 7 — `@supabase/ssr` major version drift.** Latest as of 2026-04-25 is the `0.x` line (likely `0.5.x` or `0.6.x`). The `getAll`/`setAll` cookie API matches `@supabase/ssr@0.5+` (Next.js 15 cookies-as-Promise compatibility). Mitigation: Developer pins what `pnpm add` resolves to; if pnpm picks a `<0.5` build, upgrade to `^0.5.0`.

### Open Questions
- **Should Slice 4 also create a thin `repositories/` placeholder?** Decision: NO. Epic 1 acceptance criteria do not mention `src/lib/repositories/*`; Epic 2 introduces the first real repository. Pre-creating an empty directory would be dead code.
- **Should `env.ts` validate `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID`?** Decision: NO. Slice 4 is Supabase-only. Epic 3 (Naver Maps) extends `env.ts` with the Naver var.
- **Should we add a generated DB-types import (`Database` generic) to the factories?** Decision: NO. Schema does not exist yet (`supabase/schema.sql` is mentioned in CLAUDE.md but file is not created). Epic 2 generates the types via `supabase gen types typescript` and threads `<Database>` through the factories at that point.

## Rollback Plan
If the slice goes sideways:
1. `git restore --staged --worktree src/lib/ package.json pnpm-lock.yaml` to drop unstaged changes to slice-owned files.
2. `git clean -fd src/lib/` to remove untracked new files (`env.ts`, `supabase/*.ts`).
3. Delete the scratch file if it survived: `rm -f src/app/_scratch-admin-guard.tsx`.
4. Revert any partial `decision-log.md` addition: `git restore context/decision-log.md`.
5. `pnpm install` to restore `node_modules/` consistent with the reverted `pnpm-lock.yaml`.
Branch state returns to commit `e1c6308`. No external systems are touched (no Supabase migrations, no Naver registration), so rollback is purely local.
