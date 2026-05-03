# Decision Log

Decisions made during development. Prevents re-litigating settled choices across sessions.

Format:
```
## [date] — [decision title]
- **Context:** [why this came up]
- **Options considered:** [A, B, C]
- **Chosen:** [which option]
- **Reason:** [why]
- **Trade-off:** [what we gave up]
```

---

## 2026-04-25 — Epic 1 tech stack versions (pre-scaffolding lock-in)
- **Context:** Epic 1 (scaffolding) needs deterministic versions so the Planner/Developer don't drift and so reviewer diffs stay small.
- **Chosen versions:**
  - Node: `22.17.0` (pinned via `.nvmrc`)
  - pnpm: `10` (activated via `corepack enable` in Node 22)
  - Next.js: `15` (App Router, `--ts --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack`)
  - React: `19` (default with Next 15)
  - TypeScript: `5.6+` (bundled with create-next-app) — `strict: true`, `noUncheckedIndexedAccess: true` (add to tsconfig after scaffolding)
  - Tailwind: `4` (create-next-app default), but all color/radius/shadow tokens aliased to `var(--hb-*)` in `tailwind.config.ts`
  - next-intl: `4` (latest)
  - `@supabase/supabase-js`: latest `^2`
  - Vitest: `3`, `@vitejs/plugin-react`, `@testing-library/react`, `jsdom`
  - Playwright: latest; **chromium already pre-downloaded** to `~/Library/Caches/ms-playwright/chromium_headless_shell-1217` — Epic 1's `playwright install` should be a no-op
- **Reason:** Pinning now prevents "Planner picks Tailwind v3, Developer picks v4" type of mismatch. Versions chosen are the current stable baselines that fit the spec.
- **Trade-off:** Locking the minor version means a future hot upgrade requires an explicit decision-log entry.

## 2026-04-25 — Scaffolding command
- **Context:** Slice 1.1 needs a reproducible one-liner so the Planner specifies exactly what runs.
- **Chosen:** `pnpm dlx create-next-app@15 . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack --use-pnpm`
- **Reason:** `.` (current directory) avoids nested folder. `--no-turbopack` keeps the bundler choice open for Epic 5 (decision-log earlier implied Turbopack is fine but we defer the decision to post-MVP). `--use-pnpm` locks the package manager in the generated scripts.
- **Trade-off:** Must merge the scaffold against existing files (CLAUDE.md, .gitignore, etc.) — Developer uses `--force` only if needed and manually preserves harness files.

## 2026-04-25 — Geolocation fallback
- **Context:** Spec §4.1 requires "current location or designated area" but is silent on what happens when the browser denies geolocation.
- **Options considered:** A) 서울시청 center + toast, B) Random main area (Hongdae/Myeongdong/Gangnam), C) Hard block with a permission-required modal.
- **Chosen:** A — 서울시청 (37.5666, 126.9784) + non-blocking toast.
- **Reason:** Immediate map display respects the user's refusal while the toast still nudges them to grant permission for a better experience.
- **Trade-off:** Users who first open the app far from 서울시청 see pins that are not nearby; they have to pan/zoom.

## 2026-04-25 — Price range format
- **Context:** Spec §4.2 lists 가격대 without specifying whether it is a label, a numeric band, or free text.
- **Options considered:** A) enum 3 levels `low/mid/high` rendered as `₩/₩₩/₩₩₩`, B) numeric range, C) free text.
- **Chosen:** A — enum 3 levels.
- **Reason:** MVP keeps filter/sort/UI chip trivially implementable and matches how most review platforms render price. UGC operators pick one of 3 on submission — low cognitive load.
- **Trade-off:** Loses granularity (e.g., 8천원대 vs 1만5천원대 both map to `₩`).

## 2026-04-25 — Photo upload constraints
- **Context:** Spec §5 allows optional photo upload. Size/format/count unspecified.
- **Options considered:** A) ≤2MB, jpg/png, 1 image, B) ≤5MB, jpg/png/webp, up to 3 images, C) drop photos entirely.
- **Chosen:** A — ≤2MB, `image/jpeg` or `image/png`, 1 image max.
- **Reason:** Stays inside Supabase free-tier storage budget and keeps upload time acceptable on mobile data.
- **Trade-off:** Visually richer listings (multiple photos, higher resolution) not possible in MVP.

## 2026-04-25 — Tailwind v4 token wiring mechanism (CSS @theme vs tailwind.config.ts)
- **Context:** Slice 2 must alias Tailwind utilities (`bg-brand`, `rounded-md`, `shadow-card`) back to `--hb-*` CSS variables. The earlier Epic 1 plan and `frontend-honbabseoul.md` referenced `tailwind.config.ts` as the wiring point. With Tailwind v4 (locked in the version-stack entry above), the JS config is optional and the canonical mechanism is the `@theme` directive in CSS.
- **Options considered:** A) Add `tailwind.config.ts` with `colors.brand = "var(--hb-brand)"` etc., load via an explicit `@config` directive in `globals.css`. B) Define the alias inline via `@theme inline { --color-brand: var(--hb-brand); … }` in `globals.css` (v4 CSS-first idiom). C) Both (TS + CSS for redundancy).
- **Chosen:** B — CSS-first `@theme inline`.
- **Reason:** Fewer surfaces (no JS↔CSS bridge); composes naturally with `@import "../styles/tokens.css"`; matches v4 documentation; keeps token authority in one CSS file. `tailwind.config.ts` remains addable later if a JS-only need (e.g. plugins, content scanning tweaks) appears.
- **Trade-off:** `frontend-honbabseoul.md` line "configure tailwind.config.ts so colors.brand = …" is now mechanism-specific and stale — keep its intent (token-aliasing principle), refresh the literal text in a follow-up rule edit.

## 2026-04-25 — Supabase Next.js cookie wiring package (Slice 4)
- **Context:** Epic 1 / Slice 4 mandates a `createServerClient()` factory "wired for Next.js cookies". The Slice 4 line in `outputs/plans/epic-1-plan.md` lists only `@supabase/supabase-js`, but that package alone does not handle Next.js App Router cookies.
- **Options considered:** A) `@supabase/ssr` (current canonical Supabase package for Next.js App Router; `getAll`/`setAll` API compatible with Next.js 15's async `cookies()`), B) `@supabase/auth-helpers-nextjs` (legacy, deprecated by Supabase in favour of `@supabase/ssr`), C) hand-rolled cookie adapter on top of bare `@supabase/supabase-js`.
- **Chosen:** A — `@supabase/ssr` alongside `@supabase/supabase-js`.
- **Reason:** Canonical, actively maintained, matches Next.js 15's cookies-as-Promise model. Hand-rolling (C) would duplicate logic Supabase already ships and tests. `auth-helpers-nextjs` (B) is explicitly deprecated. `@supabase/supabase-js` is still required for the admin client (no cookies needed for service-role).
- **Trade-off:** Adds one extra dependency (`@supabase/ssr`) on top of `@supabase/supabase-js`. Worth it for cookie correctness + future auth flow compatibility.

## 2026-04-25 — Server-only enforcement for admin client
- **Context:** `src/lib/supabase/admin.ts` uses `SUPABASE_SERVICE_ROLE_KEY`, which bypasses RLS and must NEVER reach the browser bundle. Slice 4 needs a build-time guard so a careless `import` from a `"use client"` module fails CI rather than silently leaking the key.
- **Options considered:** A) `import "server-only"` at the top of `admin.ts` (canonical Next.js / React server-component package). B) Custom Webpack/Turbopack rule barring `src/lib/supabase/admin.ts` from the client graph. C) Runtime check (`if (typeof window !== "undefined") throw …`) that runs only after a leak already shipped.
- **Chosen:** A — `import "server-only"`.
- **Reason:** First-class React/Next.js convention; produces a build-time error with a readable message; zero config; understood by Vercel and the Next.js error overlay.
- **Trade-off:** Adds one more dependency (`server-only`, ~0.5KB). The package is essentially a marker file Next.js detects.
- **Rotation prep note (2026-05-04):** The admin client now prefers `SUPABASE_SECRET_KEY` and falls back to legacy `SUPABASE_SERVICE_ROLE_KEY`. This supports Supabase's new Secret API Key path without breaking local environments that have not rotated yet.

## 2026-04-25 — `is_solo_default` is `NOT NULL DEFAULT TRUE` (not nullable)
- **Context:** Epic 2 plan Slice 3 wrote `listApproved`'s isSolo filter as `is_solo_default=true OR IS NULL`, anticipating that some rows might be unverified (`NULL`). Slice 1 migration instead defines the column as `boolean NOT NULL DEFAULT true`, which makes the `IS NULL` branch dead code.
- **Options considered:** A) Loosen the column to `NULL` and keep the OR-NULL filter to allow an explicit "unverified" state. B) Keep `NOT NULL DEFAULT true` and drop the OR-NULL branch — every row is either verified-solo or verified-2인-이상-전용.
- **Chosen:** B. Slice 3's repository drops the OR-NULL clause; the column constraint is canonical.
- **Reason:** Aligns with the prior decision ("`is_solo_default = false` means verified 2인 이상 전용, not unverified"). A `NULL` state would re-introduce the very ambiguity that decision rejected. UGC submissions default to `true` because the operator ratifies every row before flipping `status='approved'` — at that point the operator either confirms `true` or downgrades to `false`.
- **Trade-off:** Anon UGC submitters who genuinely don't know the answer can over-report `is_solo_default=true`. The operator's approval gate is the corrective.

## 2026-04-25 — `reason` column deferred to Epic 5 schema delta
- **Context:** Spec §5 lists "추천 이유" as a required UGC field. Epic 2 Slice 1's column list (frozen by the plan and ratified by Reviewer) does NOT include a `reason` column. Slice 4's `submissions.ts` accepts `reason` via zod but does not persist it (`TODO(Epic 5)`).
- **Options considered:** A) Patch Slice 1 migration retroactively to add `reason text`. B) Defer the column to an Epic 5 schema delta (e.g. `0002_submission_reason.sql`) so Slice 1 stays untouched and the new write path lands together with the UGC form UI.
- **Chosen:** B. The Epic 2 cleanup pass does not add the column; Epic 5's first slice will own a small migration that adds `reason text` plus any other UGC-specific fields surfaced by Slice 4 reality.
- **Reason:** Plan adherence — Reviewer's verify §29 enumerated the column set; mutating it after-the-fact would muddle the audit trail. Storing `reason` is genuinely scoped with the UGC UI work, so coupling them in Epic 5 is natural.
- **Trade-off:** `reason` is currently logged at submission time but lost after the request ends. No production submissions are happening yet, so the data loss is hypothetical until Epic 5 ships.
- **Renumber note (2026-04-26):** Original entry said "Epic 4". Epic numbering shifted: new Epic 3 = Test infra reinforcement, Epic 4 = Map (read path), Epic 5 = UGC (write path), Epic 6 = Polish.
- **Resolution note (2026-05-04):** Epic 5 / Slice 1.1 added `supabase/migrations/0002_submission_reason.sql` with nullable `reason text`, persists `reason` from `submitPending`, and changes public restaurant reads to select explicit public columns instead of `*`.

## 2026-04-25 — Postgres major version is 17 (not 15)
- **Context:** Slice 1 set `supabase/config.toml [db].major_version = 15` based on a guess. Live `select version()` reports `17.6`.
- **Chosen:** Bump `major_version = 17`.
- **Reason:** Catches latent CLI mismatch (Supabase CLI uses this value to launch the local matching Postgres version for migration validation).
- **Trade-off:** None.

## 2026-04-25 — "혼밥 가능" OFF semantics
- **Context:** Spec §3 says the default-on "혼밥 가능" filter, when turned off, should also show "2인 이상만 가능한 식당 (무한리필, 전골 등)". Ambiguous whether `is_solo_default=false` means "confirmed not solo-friendly" or "not yet verified".
- **Options considered:** A) false = "confirmed 2인 이상 전용", B) false = "unverified" (default for new rows).
- **Chosen:** A — `is_solo_default=false` strictly means **verified 2인 이상 전용**.
- **Reason:** Keeps the filter semantics meaningful — OFF means "I'm OK with group-only restaurants too", not "show me rows where we don't know yet". Unverified rows stay out of the public map until an operator sets a verified value.
- **Trade-off:** Operator has to actively mark `is_solo_default=false` for group-only spots; default of `true` during INSERT means UGC submitters have to either know the answer or leave it at `true` (potentially over-reporting solo-friendliness). Chip label when OFF: 「2人以上専用も表示」.
