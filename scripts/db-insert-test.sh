#!/usr/bin/env bash
# Test anon INSERT with different Prefer headers to isolate the 42501 source
set -euo pipefail
set -a
. "$(dirname "$0")/../.env.local"
set +a

BASE="${NEXT_PUBLIC_SUPABASE_URL}/rest/v1"
ANON=(-H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" -H "Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}")
PAYLOAD='{"name_ja":"_insert_test_","status":"approved","naver_url":"https://map.naver.com/p/test","is_solo_default":true,"has_jp_menu":false,"is_late_night":false,"price_range":"low","latitude":37.5,"longitude":126.9}'

echo "=== Test A: INSERT without Prefer header (no return) ==="
curl -s -X POST "${ANON[@]}" \
  -H "Content-Type: application/json" \
  "${BASE}/restaurants" \
  -d "$PAYLOAD"
echo ""

echo "=== After Test A: service-role check ==="
psql "$DATABASE_URL" -c "SELECT id, status FROM restaurants WHERE name_ja='_insert_test_'"

echo ""
echo "=== Cleanup Test A ==="
psql "$DATABASE_URL" -c "DELETE FROM restaurants WHERE name_ja='_insert_test_'"

echo ""
echo "=== Test B: INSERT with Prefer: return=minimal ==="
curl -s -X POST "${ANON[@]}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  "${BASE}/restaurants" \
  -d "$PAYLOAD"
echo ""

echo "=== After Test B: service-role check ==="
psql "$DATABASE_URL" -c "SELECT id, status FROM restaurants WHERE name_ja='_insert_test_'"

echo ""
echo "=== Cleanup Test B ==="
psql "$DATABASE_URL" -c "DELETE FROM restaurants WHERE name_ja='_insert_test_'"

echo ""
echo "=== Test C: INSERT with Prefer: return=representation (original test) ==="
curl -s -X POST "${ANON[@]}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  "${BASE}/restaurants" \
  -d "$PAYLOAD"
echo ""

echo "=== After Test C: service-role check ==="
psql "$DATABASE_URL" -c "SELECT id, status FROM restaurants WHERE name_ja='_insert_test_'"

echo ""
echo "=== Cleanup Test C ==="
psql "$DATABASE_URL" -c "DELETE FROM restaurants WHERE name_ja='_insert_test_'"
