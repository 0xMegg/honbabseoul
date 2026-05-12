# Honbabseoul Admin Workflow

## Source Provenance

- MVP requirements: `docs/project-plan.md` section 5 and section 6.
- Status and solo-filter decisions: `context/decision-log.md`.
- Public read implementation: `src/lib/repositories/restaurants.ts`.
- Pending submit implementation: `src/lib/repositories/submissions.ts`.

## Scope

Operators manage submitted restaurants directly in the Supabase dashboard. There is no custom admin UI in the MVP.

The public map must only show rows with `status = approved`. Submitted UGC rows start as `pending` and stay hidden until an operator approves them.

## Review Queue

In Supabase, open the `restaurants` table and filter:

- `status` is `pending`
- newest rows first by `created_at`

Review these fields before approval:

- `name_ja`: user-submitted restaurant name.
- `name_ko`: may be auto-filled from Naver Local Search when the match is confident.
- `address_ko`: may be auto-filled from Naver Local Search when the match is confident.
- `latitude` / `longitude`: may be auto-filled from Naver Local Search when the match is confident.
- `naver_url`: must be a real Naver Maps place URL.
- `is_solo_default`: confirm whether solo dining is actually acceptable.
- `has_jp_menu`: confirm Japanese menu or Japanese-friendly support.
- `is_late_night`: confirm operation after 22:00.
- `price_range`: optional, but normalize to `low`, `mid`, `high`, or blank.
- `photo_url`: optional; confirm it is relevant and not low-quality/spam.
- `reason`: internal moderation context. Do not expose it on the public map.

## Daily Operations

For MVP v1.0, the Supabase dashboard is the admin surface. There is no custom
admin UI.

Daily operator pass:

- Review new `pending` rows.
- Reject spam, duplicates, unverifiable places, and restaurants that do not
  help solo travelers.
- Complete missing public map fields before approval.
- Keep `reason` private as moderation context.
- Confirm approved rows still match the public filters they are meant to
  satisfy.

Escalate instead of approving when a row has suspicious photo content, an
unclear Naver Maps URL, unsafe location data, or a restaurant policy that is
ambiguous for solo diners.

## Approval

Approve only after the row is complete enough for the public map:

- Fill `name_ko` when a Korean display name is known.
- Fill `address_ja` and `address_ko` when available.
- Fill `latitude` and `longitude` so the row can appear as a map marker.
- Treat auto-filled Naver Local Search values as review assistance, not final
  approval authority. Confirm the row still matches the submitted Naver URL.
- Keep `naver_url` as a web URL that opens in the browser.
- Set `status` to `approved`.

The row appears on the public map on the next page load only if it also matches the active filters.

## Launch Dataset

The production launch dataset must be 20 real restaurants approved by the
project owner. Use `docs/launch-data-template.csv` as the collection shape.

Do not import `supabase/seed.sql` into production. It contains fictional
development rows.

Each launch row must be complete enough for public map display:

- Japanese and Korean names.
- Japanese and Korean addresses.
- Latitude and longitude.
- Naver Maps web URL.
- `status = approved`.
- Accurate values for `is_solo_default`, `has_jp_menu`, and `is_late_night`.

`photo_url` is optional for launch because the public detail view has a branded
placeholder, but real food or menu photos should be added when available.

## Rejection

Set `status` to `rejected` when the submission is spam, unverifiable, irrelevant, duplicated, unsafe, or not useful for solo travelers.

Rejected rows stay hidden from the public map. Keep them for audit history unless a separate deletion decision is explicitly approved.

## Public Read Rules

The public read path has two guards:

- Supabase RLS should hide non-approved rows from public clients.
- The repository also applies `status = approved` before mapping rows into UI data.

Do not add `reason` to the public restaurant select list. It is moderation context, not user-facing content.
