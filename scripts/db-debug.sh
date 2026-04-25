#!/usr/bin/env bash
# Debug: check auth.role() and current_user behavior
set -euo pipefail
set -a
. "$(dirname "$0")/../.env.local"
set +a

echo "=== auth.role() as postgres (direct psql) ==="
psql "$DATABASE_URL" -c "select auth.role() as role, current_user, session_user"

echo ""
echo "=== request.jwt.claims setting (via postgres connection — not set by PostgREST) ==="
psql "$DATABASE_URL" -c "select current_setting('request.jwt.claims', true) as jwt_claims"

echo ""
echo "=== pg_roles: does anon role exist? ==="
psql "$DATABASE_URL" -c "select rolname from pg_roles where rolname in ('anon', 'authenticated', 'service_role', 'postgres')"

echo ""
echo "=== auth schema functions ==="
psql "$DATABASE_URL" -c "select proname, prosecdef, proowner::regrole from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'auth' and proname = 'role'"
