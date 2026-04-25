/**
 * Supabase browser client.
 *
 * Reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
 * from the public env, returning a singleton tied to the browser bundle's
 * cookie store via `@supabase/ssr`.
 *
 * Use this from `"use client"` modules that need to talk to Supabase.
 * Repository functions in `src/lib/repositories/*` should be the typical
 * caller — UI components import the repositories, not this factory.
 */
import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

let cached: ReturnType<typeof createBrowserClient> | null = null;

export function createSupabaseBrowserClient() {
  if (cached) return cached;
  cached = createBrowserClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey);
  return cached;
}
