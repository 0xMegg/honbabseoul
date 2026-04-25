#!/usr/bin/env bash
# Pre-flight connectivity check — reads DATABASE_URL from .env.local
set -euo pipefail

ENV_FILE="$(dirname "$0")/../.env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: .env.local not found at $ENV_FILE"
  exit 1
fi

# Source .env.local (POSIX-compatible)
set -a
. "$ENV_FILE"
set +a

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL not set in .env.local"
  exit 1
fi

echo "=== Connectivity ==="
psql "$DATABASE_URL" -c "select 1 as ok"

echo "=== Check for existing restaurants table ==="
psql "$DATABASE_URL" -c "select to_regclass('public.restaurants') as existing_table"

echo "=== gen_random_uuid() availability ==="
psql "$DATABASE_URL" -c "select gen_random_uuid()"

echo "=== Anon key storage bucket check ==="
curl -s -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" "${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/bucket" | head -200
