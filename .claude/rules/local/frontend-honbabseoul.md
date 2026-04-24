# Frontend Rules — honbabseoul

## Design System (5-layer, single-codebase multi-variant ready)
- Token prefix: `--hb-*`. Defaults live in `:root`, future themes override via `[data-theme="..."]`.
- Layering: Page (semantic intent) → Primitive (`var(--hb-*)` only) → Context (theme provider) → Config (TS) → Tokens (CSS).
- Primitives **never** branch on theme. If a visual difference appears, push it into a token, not a `if (theme === ...)` check.
- Pages declare domain intent (`<Badge variant="approved">`, `<PriceText mono>`), never visual literals.
- Reference patterns: `/Users/mero/Dev/13.claude/workouts/kody-workspace/docs/design-system-pattern.md`.

## Styling Rules
- Tailwind is allowed only when its class maps back to a `--hb-*` token (configure `tailwind.config.ts` so `colors.brand = "var(--hb-brand)"`, `boxShadow.card = "var(--hb-shadow-card)"`, etc.).
- ❌ Raw palette utilities: `bg-purple-500`, `text-red-600`, `rounded-[12px]` with hardcoded value.
- ❌ Inline literal styles: `style={{ color: "#5e6ad2" }}`, `borderRadius: 6`.
- ✅ Token-backed utility: `bg-[var(--hb-brand)]`, `text-[color:var(--hb-text)]`, or preferably a config alias.
- Logo: `혼밥서울` is the fixed Hangul main graphic + カタカナ `ホンバプソウル` subcopy — rendered as a single SVG, never swapped by locale.

## Mobile-first
- Design for 360–414px width first. Only add `md:` / `lg:` variants for genuine tablet/desktop value.
- Bottom sheets, filter chips, and map controls must be thumb-reachable (lower half of viewport).

## Routing & i18n (next-intl)
- All user routes live under `src/app/[locale]/...`; `locale ∈ { "ja", "ko" }` with `ja` default.
- Static UI strings go in `messages/ja.json` + `messages/ko.json`. No inline literals — always via `useTranslations` / `getTranslations`.
- Dynamic data (restaurant name, address) keeps both `*_ja` and `*_ko` columns; the component picks the one matching the active locale.

## Naver Maps
- SDK is SSR-incompatible. Load only in client components via `next/dynamic(() => import("./map"), { ssr: false })`.
- Never import the Naver SDK from a layout, page, or server component directly.
- External navigation to Naver Maps uses the web URL `https://map.naver.com/...` with `target="_blank"` + `rel="noopener noreferrer"`. Never use `nmap://` intent schemes — the spec requires the browser view, not the app.
