/**
 * Public read repository for the restaurants table.
 *
 * The caller supplies the Supabase client so that the server-vs-browser
 * choice is explicit at the call site:
 *   Server Component: await listApproved(await createSupabaseServerClient(), filters)
 *   "use client" map shell: listApproved(createSupabaseBrowserClient(), filters)
 *
 * Errors surface as RestaurantRepositoryError carrying the original
 * PostgrestError as `cause`. Callers should NOT catch and re-throw raw
 * PostgREST text — map to user-facing JA/KO messages instead.
 *
 * RLS note: anon SELECT already filters status='approved' server-side.
 * The .eq("status","approved") calls below are the second guard, required
 * by api-honbabseoul.md §Public Read Path.
 *
 * is_solo_default deviation: the migration defines the column as
 * `boolean not null default true`, so `IS NULL` is unreachable. We apply
 * eq('is_solo_default', true) when isSolo=true and drop the filter when
 * isSolo=false. If a future migration loosens the NOT NULL constraint,
 * restore the OR-NULL clause here.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  RestaurantSchema,
  type Restaurant,
} from "@/lib/models/restaurant";

export type RestaurantFilters = {
  /** "혼밥 가능" chip — default ON. true = only solo-friendly, false = drop the filter. */
  isSolo:      boolean;
  /** 日本語メニュー chip. true = only `has_jp_menu=true`, false = drop. */
  hasJpMenu:   boolean;
  /** 深夜営業 chip. true = only `is_late_night=true`, false = drop. */
  isLateNight: boolean;
};

export class RestaurantRepositoryError extends Error {
  readonly cause: unknown;
  constructor(message: string, cause: unknown) {
    super(message);
    this.name = "RestaurantRepositoryError";
    this.cause = cause;
  }
}

export async function listApproved(
  client: SupabaseClient,
  filters: RestaurantFilters,
): Promise<Restaurant[]> {
  let query = client.from("restaurants").select("*").eq("status", "approved");
  if (filters.isSolo)      query = query.eq("is_solo_default", true);
  if (filters.hasJpMenu)   query = query.eq("has_jp_menu",     true);
  if (filters.isLateNight) query = query.eq("is_late_night",   true);
  const { data, error } = await query;
  if (error) throw new RestaurantRepositoryError("listApproved failed", error);
  return (data ?? []).map((row) => RestaurantSchema.parse(row));
}

export async function getById(
  client: SupabaseClient,
  id: string,
): Promise<Restaurant | null> {
  const { data, error } = await client
    .from("restaurants")
    .select("*")
    .eq("status", "approved")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new RestaurantRepositoryError("getById failed", error);
  return data ? RestaurantSchema.parse(data) : null;
}
