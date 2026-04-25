#!/usr/bin/env bash
# Show all policies and grants on the restaurants table
set -euo pipefail
set -a
. "$(dirname "$0")/../.env.local"
set +a

echo "=== RLS policies on restaurants ==="
psql "$DATABASE_URL" -c "
  SELECT polname, polcmd, polroles::regrole[],
         pg_get_expr(polqual, polrelid) as using_expr,
         pg_get_expr(polwithcheck, polrelid) as withcheck_expr
  FROM pg_policy
  WHERE polrelid = 'restaurants'::regclass
"

echo ""
echo "=== Table privileges ==="
psql "$DATABASE_URL" -c "\z restaurants"

echo ""
echo "=== Schema privileges ==="
psql "$DATABASE_URL" -c "
  SELECT nspname, nspacl
  FROM pg_namespace
  WHERE nspname = 'public'
"

echo ""
echo "=== Test: can anon role do ANYTHING on restaurants? ==="
psql "$DATABASE_URL" -c "
  SELECT has_table_privilege('anon', 'restaurants', 'INSERT') as can_insert,
         has_table_privilege('anon', 'restaurants', 'SELECT') as can_select,
         has_table_privilege('anon', 'restaurants', 'UPDATE') as can_update,
         has_table_privilege('anon', 'restaurants', 'DELETE') as can_delete
"
