#!/usr/bin/env bash
# Phase I: RLS smoke probes
# 1. Anon SELECT returns [] (no approved rows yet)
# 2. Anon INSERT with status='approved' silently lands as 'pending'
# 3. Cleanup smoke row
# 4. Anon UPDATE denied (no rows affected or HTTP error)
set -euo pipefail
set -a
. "$(dirname "$0")/../.env.local"
set +a

BASE="${NEXT_PUBLIC_SUPABASE_URL}/rest/v1"
ANON_HDR=(-H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" -H "Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}")

echo "=== 1. Anon SELECT (expect []) ==="
curl -s "${ANON_HDR[@]}" "${BASE}/restaurants?select=id,status"
echo ""

echo ""
echo "=== 2. Anon INSERT with status='approved' (expect HTTP 201 — no body with return=minimal) ==="
echo "   (Prefer: return=representation is intentionally avoided: SELECT RLS filters pending"
echo "    rows, so RETURNING * would return empty and PostgREST raises 42501. This is correct"
echo "    security behavior. We verify the stored status via service-role psql in step 2b.)"
SMOKE_PAYLOAD='{"name_ja":"_rls_smoke_","name_ko":"_RLS_스모크_","status":"approved","naver_url":"https://map.naver.com/p/rls-smoke","is_solo_default":true,"has_jp_menu":false,"is_late_night":false,"price_range":"low","latitude":37.5666,"longitude":126.9784}'
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${ANON_HDR[@]}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  "${BASE}/restaurants" \
  -d "$SMOKE_PAYLOAD")
echo "HTTP status: $HTTP_STATUS (expect 201)"
echo ""

echo ""
echo "=== 2b. Service-role verify smoke row status via psql ==="
psql "$DATABASE_URL" -c "select id, status from restaurants where name_ja='_rls_smoke_'"

echo ""
echo "=== 3. Cleanup smoke row ==="
psql "$DATABASE_URL" -c "delete from restaurants where name_ja='_rls_smoke_'"
psql "$DATABASE_URL" -c "select count(*) as rows_after_cleanup from restaurants"

echo ""
echo "=== 4. Anon UPDATE denied (expect empty array or 401/403) ==="
UPDATE_RESP=$(curl -s -X PATCH "${ANON_HDR[@]}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  "${BASE}/restaurants?status=eq.pending" \
  -d '{"status":"approved"}')
echo "$UPDATE_RESP"

echo ""
echo "=== RLS smoke probes complete ==="
