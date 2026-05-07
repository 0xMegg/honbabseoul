import "server-only";
import type { TablesInsert } from "@/lib/database.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { enrichSubmissionFromNaverLocal } from "@/lib/naver-local-search";
import {
  submissionSchema,
  InvalidInputError,
  SubmissionDatabaseError,
} from "@/lib/models/submission";

export async function submitPending(input: unknown): Promise<{ id: string }> {
  const parsed = submissionSchema.safeParse(input);

  if (!parsed.success) {
    throw new InvalidInputError(
      parsed.error.flatten() as {
        formErrors: string[];
        fieldErrors: Partial<Record<string, string[]>>;
      },
    );
  }

  const { data } = parsed;
  const enrichment = await enrichSubmissionFromNaverLocal(data.name).catch((error: unknown) => {
    console.warn("[submitPending:enrichment]", {
      scope: "submitPending",
      reason: error instanceof Error ? error.name : "unknown",
    });
    return null;
  });

  const row = {
    name_ja: data.name,
    name_ko: enrichment?.nameKo ?? null,
    address_ko: enrichment?.addressKo ?? null,
    latitude: enrichment?.latitude ?? null,
    longitude: enrichment?.longitude ?? null,
    naver_url: data.naverUrl,
    is_solo_default: data.isSolo,
    has_jp_menu: data.hasJpMenu,
    is_late_night: data.isLateNight,
    price_range: data.priceRange ?? null,
    photo_url: data.photoUrl ?? null,
    reason: data.reason,
    // status intentionally omitted — column default 'pending' + BEFORE-INSERT
    // trigger both coerce to pending. Explicit omission documents intent.
  } satisfies TablesInsert<"restaurants">;

  const supabase = createSupabaseAdminClient();
  const { data: inserted, error } = await supabase
    .from("restaurants")
    .insert(row)
    .select("id")
    .single();

  if (error !== null) {
    console.error("[submitPending]", {
      scope: "submitPending",
      code: error.code,
      hint: (error as { hint?: string }).hint,
    });
    throw new SubmissionDatabaseError(error.code ?? "unknown", "submission failed");
  }

  if (inserted === null) {
    throw new SubmissionDatabaseError("no_row", "no inserted row returned");
  }

  return { id: inserted.id };
}
