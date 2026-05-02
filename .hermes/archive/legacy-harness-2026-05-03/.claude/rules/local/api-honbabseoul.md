# API & Data Rules — honbabseoul (Supabase)

## Repository Layer
- All database access lives in `src/lib/repositories/*`. UI, pages, server components, and route handlers import **functions**, not `createClient`.
- Each repository function returns either typed data or throws a typed error. Never leak raw `PostgrestError` objects to the UI.
- Supabase responses are `{ data, error }` tuples — branch both. An `error === null` with `data === []` is a real outcome (RLS hid rows, filter matched nothing) and must be handled distinctly from failure.

## Keys & Clients
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` are the only keys safe to expose to the client bundle.
- `SUPABASE_SERVICE_ROLE_KEY` is **server-only** — imported exclusively in Route Handlers (`src/app/api/**`) or Server Actions. If a `"use client"` module imports it, reject the change.
- Separate factory functions: `createServerClient()` vs `createBrowserClient()` vs `createAdminClient()`. Do not pass `any` client instance across the client/server boundary.

## Public Read Path
- The map, filter list, and bottom sheet must only read `status = 'approved'` restaurants. Apply the filter in the repository query AND enforce it via RLS policy — two independent guards.
- Default public filter is also `is_solo_default = true` (spec §3); only disabled when the user explicitly turns off "혼밥 가능" filter.

## UGC Write Path
- Public submission always inserts `status = 'pending'`. The API must reject a client-provided `status` field.
- Required fields (spec §5): name, naver_url, is_solo, has_jp_menu, is_late_night, reason. Photo upload is optional (Supabase Storage bucket, authenticated anon).
- Validate `naver_url` server-side against allow-list `{ map.naver.com, naver.me }`. Reject anything else.

## Admin Path
- Admin pages and `status` transitions (`pending → approved | rejected`) use the server client with service-role or an authenticated admin session. Not exposed to anon.

## Logging
- Never log tokens, Supabase keys, or user session cookies.
- Log request id + endpoint + user id (if present) + error code. No raw error messages in user-facing responses.
