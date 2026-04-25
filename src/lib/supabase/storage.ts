import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  MAX_PHOTO_BYTES,
  ALLOWED_PHOTO_MIME,
} from "@/lib/models/submission";

const BUCKET = "restaurant-photos" as const;

export class PhotoTooLargeError extends Error {
  constructor(
    public readonly name: string,
    public readonly sizeBytes: number,
    public readonly maxBytes: number
  ) {
    super(
      `Photo "${name}" is ${sizeBytes} bytes; maximum is ${maxBytes} bytes`
    );
    this.name = "PhotoTooLargeError";
  }
}

export class PhotoMimeRejectedError extends Error {
  constructor(
    public readonly fileName: string,
    public readonly mime: string,
    public readonly allowed: readonly string[]
  ) {
    super(
      `Photo MIME type "${mime}" is not allowed; accepted: ${allowed.join(", ")}`
    );
    this.name = "PhotoMimeRejectedError";
  }
}

export class PhotoUploadError extends Error {
  constructor(
    public readonly stage: "upload" | "publicUrl",
    public readonly code?: string
  ) {
    super(`Photo upload failed at stage "${stage}"${code ? ` (${code})` : ""}`);
    this.name = "PhotoUploadError";
  }
}

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
};

export async function uploadPhoto(file: File): Promise<string> {
  if (
    !ALLOWED_PHOTO_MIME.includes(
      file.type as (typeof ALLOWED_PHOTO_MIME)[number]
    )
  ) {
    throw new PhotoMimeRejectedError(file.name, file.type, ALLOWED_PHOTO_MIME);
  }

  if (file.size > MAX_PHOTO_BYTES) {
    throw new PhotoTooLargeError(file.name, file.size, MAX_PHOTO_BYTES);
  }

  const now = new Date();
  const yyyy = now.getFullYear().toString();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const ext = MIME_TO_EXT[file.type] ?? "bin";
  const path = `${yyyy}/${mm}/${globalThis.crypto.randomUUID()}.${ext}`;

  const supabase = createSupabaseBrowserClient();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError !== null) {
    throw new PhotoUploadError(
      "upload",
      (uploadError as { statusCode?: string }).statusCode
    );
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  if (!data?.publicUrl) {
    throw new PhotoUploadError("publicUrl");
  }

  return data.publicUrl;
}
