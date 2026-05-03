/**
 * Supabase server client (Server Components / Route Handlers / Server Actions).
 *
 * Wires Next.js 15's async `cookies()` into `@supabase/ssr` so that auth
 * cookies set by Supabase SSR are propagated correctly across the request
 * lifecycle.
 *
 * Server-component reads should branch the `{ data, error }` tuple — never
 * leak `PostgrestError` to the UI; throw a typed error or return a
 * normalized failure shape from the repository layer.
 *
 * NOTE: This factory uses the public Supabase API key — it respects RLS. For
 * service-role privileges (admin tasks, status transitions), use
 * `src/lib/supabase/admin.ts` instead.
 */
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";
import { publicEnv } from "@/lib/env";

export async function createSupabaseServerClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();

  return createServerClient<Database>(publicEnv.supabaseUrl, publicEnv.supabasePublicKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot set cookies. The middleware refreshes
          // the session, so this branch is a no-op there.
        }
      },
    },
  });
}
