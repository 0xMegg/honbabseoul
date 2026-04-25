import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

vi.mock("@/lib/supabase/browser", () => ({
  createSupabaseBrowserClient: vi.fn(),
}));

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  uploadPhoto,
  PhotoTooLargeError,
  PhotoMimeRejectedError,
  PhotoUploadError,
} from "@/lib/supabase/storage";
import { MAX_PHOTO_BYTES } from "@/lib/models/submission";

function makeFile(
  sizeBytes: number,
  type: string,
  name = "photo.jpg"
): File {
  const data = new Uint8Array(sizeBytes);
  return new File([data], name, { type });
}

function buildMockStorageClient(opts: {
  uploadError?: { statusCode: string } | null;
  publicUrl?: string;
}) {
  const getPublicUrl: Mock = vi.fn().mockReturnValue({
    data: { publicUrl: opts.publicUrl ?? "https://cdn.example.com/img.jpg" },
  });
  const upload: Mock = vi.fn().mockResolvedValue({
    error: opts.uploadError ?? null,
  });
  const fromStorage: Mock = vi.fn().mockReturnValue({ upload, getPublicUrl });
  const client = { storage: { from: fromStorage } };
  (createSupabaseBrowserClient as Mock).mockReturnValue(client);
  return { fromStorage, upload, getPublicUrl };
}

describe("uploadPhoto", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should reject oversized files (> 2MB)", async () => {
    buildMockStorageClient({});
    const file = makeFile(MAX_PHOTO_BYTES + 1, "image/png", "big.png");
    await expect(uploadPhoto(file)).rejects.toBeInstanceOf(PhotoTooLargeError);
  });

  it("should accept files exactly at the 2MB boundary", async () => {
    buildMockStorageClient({});
    const file = makeFile(MAX_PHOTO_BYTES, "image/png", "exact.png");
    await expect(uploadPhoto(file)).resolves.toBe(
      "https://cdn.example.com/img.jpg"
    );
  });

  it("should reject image/gif", async () => {
    buildMockStorageClient({});
    const file = makeFile(1024, "image/gif", "anim.gif");
    await expect(uploadPhoto(file)).rejects.toBeInstanceOf(
      PhotoMimeRejectedError
    );
  });

  it("should reject application/pdf", async () => {
    buildMockStorageClient({});
    const file = makeFile(1024, "application/pdf", "doc.pdf");
    await expect(uploadPhoto(file)).rejects.toBeInstanceOf(
      PhotoMimeRejectedError
    );
  });

  it("should accept image/jpeg and image/png (happy path)", async () => {
    for (const type of ["image/jpeg", "image/png"] as const) {
      buildMockStorageClient({});
      const file = makeFile(1024, type, "photo.jpg");
      await expect(uploadPhoto(file)).resolves.toBe(
        "https://cdn.example.com/img.jpg"
      );
    }
  });

  it("should pass the bucket name 'restaurant-photos' to supabase storage", async () => {
    const { fromStorage } = buildMockStorageClient({});
    const file = makeFile(1024, "image/jpeg", "test.jpg");
    await uploadPhoto(file);
    expect(fromStorage).toHaveBeenCalledWith("restaurant-photos");
  });

  it("should not use the user-supplied filename in the upload path", async () => {
    const { upload } = buildMockStorageClient({});
    const file = makeFile(1024, "image/jpeg", "my-secret-filename.jpg");
    await uploadPhoto(file);
    const uploadedPath = (upload as Mock).mock.calls[0]![0] as string;
    expect(uploadedPath).toMatch(/^\d{4}\/\d{2}\//);
    expect(uploadedPath).not.toContain("my-secret-filename");
  });

  it("should surface PhotoUploadError on storage upload failure", async () => {
    buildMockStorageClient({ uploadError: { statusCode: "413" } });
    const file = makeFile(1024, "image/jpeg", "fail.jpg");
    const err = await uploadPhoto(file).catch((e) => e);
    expect(err).toBeInstanceOf(PhotoUploadError);
    expect((err as PhotoUploadError).stage).toBe("upload");
    expect((err as PhotoUploadError).code).toBe("413");
  });

  it("should surface PhotoUploadError when publicUrl is empty string", async () => {
    buildMockStorageClient({ publicUrl: "" });
    const file = makeFile(1024, "image/png", "empty-url.png");
    const err = await uploadPhoto(file).catch((e) => e);
    expect(err).toBeInstanceOf(PhotoUploadError);
    expect((err as PhotoUploadError).stage).toBe("publicUrl");
  });
});
