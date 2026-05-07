import "server-only";
import { ALLOWED_PHOTO_MIME, MAX_PHOTO_BYTES } from "@/lib/models/submission";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const BUCKET = "restaurant-photos" as const;

export class SubmissionPhotoRejectedError extends Error {
  constructor(
    public readonly reason: "mime" | "size",
    message: string,
  ) {
    super(message);
    this.name = "SubmissionPhotoRejectedError";
  }
}

export class SubmissionPhotoUploadError extends Error {
  constructor(
    public readonly stage: "upload" | "publicUrl",
    public readonly code?: string,
  ) {
    super(`Submission photo upload failed at ${stage}${code ? ` (${code})` : ""}`);
    this.name = "SubmissionPhotoUploadError";
  }
}

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
};

export async function uploadSubmissionPhoto(
  file: File,
): Promise<{ path: string; publicUrl: string }> {
  if (!ALLOWED_PHOTO_MIME.includes(file.type as (typeof ALLOWED_PHOTO_MIME)[number])) {
    throw new SubmissionPhotoRejectedError("mime", `Unsupported photo MIME: ${file.type}`);
  }

  if (file.size > MAX_PHOTO_BYTES) {
    throw new SubmissionPhotoRejectedError("size", `Photo exceeds ${MAX_PHOTO_BYTES} bytes`);
  }

  const now = new Date();
  const yyyy = now.getFullYear().toString();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const ext = MIME_TO_EXT[file.type] ?? "bin";
  const path = `${yyyy}/${mm}/${globalThis.crypto.randomUUID()}.${ext}`;

  const supabase = createSupabaseAdminClient();
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError !== null) {
    throw new SubmissionPhotoUploadError(
      "upload",
      (uploadError as { statusCode?: string }).statusCode,
    );
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  if (!data?.publicUrl) {
    await cleanupSubmissionPhoto(path).catch(() => {});
    throw new SubmissionPhotoUploadError("publicUrl");
  }

  return { path, publicUrl: data.publicUrl };
}

export async function cleanupSubmissionPhoto(path: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await supabase.storage.from(BUCKET).remove([path]);
}
