#!/usr/bin/env bash
set -euo pipefail
set -a
. "$(dirname "$0")/../.env.local"
set +a

echo "=== Table-level privileges for restaurants ==="
psql "$DATABASE_URL" -c "
  SELECT grantee, privilege_type, is_grantable
  FROM information_schema.role_table_grants
  WHERE table_name = 'restaurants'
  ORDER BY grantee, privilege_type
"

echo ""
echo "=== Per-role table access check ==="
psql "$DATABASE_URL" -c "
  SELECT has_table_privilege('anon',          'restaurants', 'INSERT') as anon_insert,
         has_table_privilege('anon',          'restaurants', 'SELECT') as anon_select,
         has_table_privilege('authenticated', 'restaurants', 'INSERT') as auth_insert,
         has_table_privilege('authenticated', 'restaurants', 'SELECT') as auth_select
"
