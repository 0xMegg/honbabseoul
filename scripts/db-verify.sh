#!/usr/bin/env bash
# Phase H verification: table structure, enums, RLS, row count
set -euo pipefail
set -a
. "$(dirname "$0")/../.env.local"
set +a

echo "=== Table columns ==="
psql "$DATABASE_URL" -c "\d restaurants"

echo "=== Enum types ==="
psql "$DATABASE_URL" -c "\dT+"

echo "=== RLS status ==="
psql "$DATABASE_URL" -c "select tablename, rowsecurity from pg_tables where tablename='restaurants'"

echo "=== Row count ==="
psql "$DATABASE_URL" -c "select count(*) from restaurants"
