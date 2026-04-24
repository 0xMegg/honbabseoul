# Gotchas — honbabseoul

## Supabase
- **RLS returns empty arrays silently.** If `{ error: null, data: [] }` comes back for a query you expect to find rows, the RLS policy is probably filtering them out. Always log the query + auth context when debugging "nothing shows up", never assume a network/404 failure.
- **Service-role key in client bundle = incident.** If `SUPABASE_SERVICE_ROLE_KEY` appears in any file under a `"use client"` boundary, treat it as a critical leak — rotate the key and fix imports. Never re-export admin clients from shared utility modules.
- **UGC status default is `pending`, not `approved`.** Public queries MUST filter `.eq("status", "approved")`. Double-check both the repository function and the RLS policy — a missing filter in either leaks pending (unvetted) entries onto the map.

## Naver Maps
- SDK is SSR-incompatible — importing it in a server component throws `window is not defined` at build time. Use `next/dynamic(() => import("..."), { ssr: false })`, and put the import path itself in a `"use client"` file, not a shared util.
- External map links must open the **web view** (`https://map.naver.com/...`), not the `nmap://` app-intent scheme. The spec explicitly forbids app-install nagging — verify the anchor tag's `href` during review.

## i18n (next-intl)
- `ja` is default but `ko` exists for operator review. Seeing Korean in dev is normal if `locale=ko`. Do not "fix" it by hardcoding Japanese literals.
- Every user-visible string passes through `useTranslations` / `getTranslations`. Inline Japanese/Korean literals in `.tsx` are a bug — move them to `messages/{ja,ko}.json`.
- Dynamic data (restaurant name, address) uses paired columns `name_ja` / `name_ko`. Null fallback policy: `name_ja ?? name_ko` (never show "null" or an empty chip).

## Design tokens
- Prefix is `--hb-*`. Raw Tailwind palette utilities (`bg-purple-500`, `text-red-600`) and inline hex values defeat the token layer — use the Tailwind config aliases or `bg-[var(--hb-brand)]`.
- Structural tokens matter too: radius, shadow, table-head `text-transform`. If you find yourself writing a literal for one of these, add a token instead.

## Mobile-first assumption
- Viewport defaults to ~375px. When something "looks wrong" in desktop review, check whether it's a mobile-first design being viewed in a context it wasn't optimized for — not necessarily a bug.
