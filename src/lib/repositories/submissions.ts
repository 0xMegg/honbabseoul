import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  submissionSchema,
  InvalidInputError,
  SubmissionDatabaseError,
} from "@/lib/models/submission";

export async function submitPending(input: unknown): Promise<{ id: string }> {
  const parsed = submissionSchema.safeParse(input);

  if (!parsed.success) {
    throw new InvalidInputError(parsed.error.flatten() as {
      formErrors: string[];
      fieldErrors: Partial<Record<string, string[]>>;
    });
  }

  const { data } = parsed;

  // TODO(Epic 4): persist reason once submission_metadata schema lands.
  // The reason field is validated but not stored — Slice 1 schema has no
  // reason column. Log length only (no PII) so the gap is auditable.
  console.info(
    `[submitPending] received reason of length ${data.reason.length}`
  );

  const row = {
    name_ja: data.name,
    name_ko: null as null | string,
    naver_url: data.naverUrl,
    is_solo_default: data.isSolo,
    has_jp_menu: data.hasJpMenu,
    is_late_night: data.isLateNight,
    price_range: data.priceRange ?? null,
    photo_url: data.photoUrl ?? null,
    // status intentionally omitted — column default 'pending' + BEFORE-INSERT
    // trigger both coerce to pending. Explicit omission documents intent.
  };

  const supabase = await createSupabaseServerClient();
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
    throw new SubmissionDatabaseError(
      error.code ?? "unknown",
      "submission failed"
    );
  }

  if (inserted === null) {
    throw new SubmissionDatabaseError("no_row", "no inserted row returned");
  }

  return { id: (inserted as { id: string }).id };
}
