import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { MAX_PHOTO_BYTES } from "@/lib/models/submission";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  SubmissionPhotoRejectedError,
  SubmissionPhotoUploadError,
  uploadSubmissionPhoto,
} from "./storage-server";

function makeFile(sizeBytes: number, type: string, name = "photo.jpg"): File {
  const data = new Uint8Array(sizeBytes);
  return new File([data], name, { type });
}

function buildMockStorageClient(opts: {
  uploadError?: { statusCode: string } | null;
  publicUrl?: string;
}) {
  const getPublicUrl: Mock = vi.fn().mockReturnValue({
    data: { publicUrl: opts.publicUrl ?? "https://cdn.example.com/submission.jpg" },
  });
  const upload: Mock = vi.fn().mockResolvedValue({
    error: opts.uploadError ?? null,
  });
  const fromStorage: Mock = vi.fn().mockReturnValue({ upload, getPublicUrl });
  const client = { storage: { from: fromStorage } };
  (createSupabaseAdminClient as Mock).mockReturnValue(client);
  return { fromStorage, upload, getPublicUrl };
}

describe("uploadSubmissionPhoto", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("uploads JPEG/PNG files with the server-side Supabase client", async () => {
    const { fromStorage, upload } = buildMockStorageClient({});
    const file = makeFile(1024, "image/jpeg", "secret-name.jpg");

    await expect(uploadSubmissionPhoto(file)).resolves.toBe(
      "https://cdn.example.com/submission.jpg",
    );

    expect(fromStorage).toHaveBeenCalledWith("restaurant-photos");
    const [path, uploadedFile, options] = upload.mock.calls[0]!;
    expect(path).toMatch(/^\d{4}\/\d{2}\/.+\.jpg$/);
    expect(path).not.toContain("secret-name");
    expect(uploadedFile).toBe(file);
    expect(options).toMatchObject({ contentType: "image/jpeg", upsert: false });
  });

  it("rejects unsupported MIME types and oversized files before upload", async () => {
    buildMockStorageClient({});

    await expect(uploadSubmissionPhoto(makeFile(1024, "image/gif"))).rejects.toBeInstanceOf(
      SubmissionPhotoRejectedError,
    );
    await expect(
      uploadSubmissionPhoto(makeFile(MAX_PHOTO_BYTES + 1, "image/png")),
    ).rejects.toBeInstanceOf(SubmissionPhotoRejectedError);
  });

  it("surfaces storage upload and public URL failures", async () => {
    buildMockStorageClient({ uploadError: { statusCode: "413" } });
    const uploadError = await uploadSubmissionPhoto(makeFile(1024, "image/png")).catch(
      (error) => error,
    );
    expect(uploadError).toBeInstanceOf(SubmissionPhotoUploadError);
    expect((uploadError as SubmissionPhotoUploadError).stage).toBe("upload");
    expect((uploadError as SubmissionPhotoUploadError).code).toBe("413");

    buildMockStorageClient({ publicUrl: "" });
    const publicUrlError = await uploadSubmissionPhoto(makeFile(1024, "image/png")).catch(
      (error) => error,
    );
    expect(publicUrlError).toBeInstanceOf(SubmissionPhotoUploadError);
    expect((publicUrlError as SubmissionPhotoUploadError).stage).toBe("publicUrl");
  });
});
