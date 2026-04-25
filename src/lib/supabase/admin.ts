/**
 * Supabase admin client (service-role).
 *
 * BYPASSES RLS. Only callable from server-only code (Route Handlers,
 * Server Actions, scripts). The `import "server-only"` directive at the
 * top causes Next.js to fail the build if any module under a `"use client"`
 * boundary tries to import this file — that's the canonical guard against
 * leaking the service-role key into the browser bundle.
 *
 * Uses `@supabase/supabase-js` directly because admin code paths do not
 * deal with auth cookies.
 *
 * Use this for: status transitions on UGC submissions, admin dashboards
 * (if any), data migrations, scripts. Anything user-facing should go
 * through the cookies-aware server client (`./server.ts`).
 */
import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv, serverEnv } from "@/lib/env";

let cached: ReturnType<typeof createClient> | null = null;

export function createSupabaseAdminClient() {
  if (cached) return cached;
  cached = createClient(publicEnv.supabaseUrl, serverEnv.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
  return cached;
}
