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

## 2026-04-25 — "혼밥 가능" OFF semantics
- **Context:** Spec §3 says the default-on "혼밥 가능" filter, when turned off, should also show "2인 이상만 가능한 식당 (무한리필, 전골 등)". Ambiguous whether `is_solo_default=false` means "confirmed not solo-friendly" or "not yet verified".
- **Options considered:** A) false = "confirmed 2인 이상 전용", B) false = "unverified" (default for new rows).
- **Chosen:** A — `is_solo_default=false` strictly means **verified 2인 이상 전용**.
- **Reason:** Keeps the filter semantics meaningful — OFF means "I'm OK with group-only restaurants too", not "show me rows where we don't know yet". Unverified rows stay out of the public map until an operator sets a verified value.
- **Trade-off:** Operator has to actively mark `is_solo_default=false` for group-only spots; default of `true` during INSERT means UGC submitters have to either know the answer or leave it at `true` (potentially over-reporting solo-friendliness). Chip label when OFF: 「2人以上専用も表示」.
