/**
 * Supabase browser client.
 *
 * Reads `NEXT_PUBLIC_SUPABASE_URL` and the public Supabase API key from
 * env, returning a singleton tied to the browser bundle's cookie store via
 * `@supabase/ssr`.
 *
 * Use this from `"use client"` modules that need to talk to Supabase.
 * Repository functions in `src/lib/repositories/*` should be the typical
 * caller — UI components import the repositories, not this factory.
 */
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { publicEnv } from "@/lib/env";

let cached: SupabaseClient<Database> | null = null;

export function createSupabaseBrowserClient(): SupabaseClient<Database> {
  if (cached) return cached;
  cached = createBrowserClient<Database>(publicEnv.supabaseUrl, publicEnv.supabasePublicKey);
  return cached;
}
