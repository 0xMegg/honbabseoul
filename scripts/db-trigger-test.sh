#!/usr/bin/env bash
# Test: does the BEFORE INSERT trigger run during a PostgREST REST call?
# We'll temporarily install an unconditional status-override trigger,
# test insert, then restore.
set -euo pipefail
set -a
. "$(dirname "$0")/../.env.local"
set +a

BASE="${NEXT_PUBLIC_SUPABASE_URL}/rest/v1"
ANON=(-H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" -H "Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}")

echo "=== Current trigger definition ==="
psql "$DATABASE_URL" -c "
  SELECT prosrc FROM pg_proc WHERE proname = 'force_pending_for_anon'
"

echo ""
echo "=== Temporarily replace with unconditional version ==="
psql "$DATABASE_URL" -c "
  CREATE OR REPLACE FUNCTION force_pending_for_anon()
    RETURNS trigger AS \$\$
  BEGIN
    -- Unconditional: always set to pending for ANY role
    new.status := 'pending';
    RETURN new;
  END;
  \$\$ LANGUAGE plpgsql;
"

echo ""
echo "=== Anon INSERT with status='approved' (now UNCONDITIONAL trigger) ==="
RESP=$(curl -s -X POST "${ANON[@]}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  "${BASE}/restaurants" \
  -d '{"name_ja":"_trigger_test_","status":"approved","naver_url":"https://map.naver.com/p/test","is_solo_default":true,"has_jp_menu":false,"is_late_night":false,"price_range":"low","latitude":37.5,"longitude":126.9}')
echo "$RESP"

echo ""
echo "=== Service-role check ==="
psql "$DATABASE_URL" -c "SELECT id, status FROM restaurants WHERE name_ja='_trigger_test_'"

echo ""
echo "=== Cleanup ==="
psql "$DATABASE_URL" -c "DELETE FROM restaurants WHERE name_ja='_trigger_test_'"
