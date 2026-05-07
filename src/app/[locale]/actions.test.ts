import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { InvalidInputError, SubmissionDatabaseError } from "@/lib/models/submission";
import { submitPending } from "@/lib/repositories/submissions";
import { clearSubmissionFlashCookieAction, submitRestaurantAction } from "./actions";
import { decodePreservedFormValues, UGC_FORM_FLASH_COOKIE } from "./submission-flash";

const mocks = vi.hoisted(() => ({
  cookieDelete: vi.fn(),
  cookieSet: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  uploadSubmissionPhoto: vi.fn(),
  SubmissionPhotoRejectedError: class SubmissionPhotoRejectedError extends Error {
    constructor() {
      super("photo rejected");
      this.name = "SubmissionPhotoRejectedError";
    }
  },
  SubmissionPhotoUploadError: class SubmissionPhotoUploadError extends Error {
    constructor() {
      super("photo upload failed");
      this.name = "SubmissionPhotoUploadError";
    }
  },
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    delete: mocks.cookieDelete,
    set: mocks.cookieSet,
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/repositories/submissions", () => ({
  submitPending: vi.fn(),
}));

vi.mock("@/lib/supabase/storage-server", () => ({
  uploadSubmissionPhoto: mocks.uploadSubmissionPhoto,
  SubmissionPhotoRejectedError: mocks.SubmissionPhotoRejectedError,
  SubmissionPhotoUploadError: mocks.SubmissionPhotoUploadError,
}));

function buildFormData() {
  const formData = new FormData();
  formData.set("name", "焼肉ホルモン 弘大");
  formData.set("naverUrl", "https://map.naver.com/p/entry/place/12345678");
  formData.set("isSolo", "true");
  formData.set("hasJpMenu", "false");
  formData.set("isLateNight", "true");
  formData.set("priceRange", "mid");
  formData.set("reason", "一人で入りやすい");
  return formData;
}

function makePhoto(type = "image/jpeg") {
  return new File([new Uint8Array([1, 2, 3])], "photo.jpg", { type });
}

async function captureRedirect(callback: () => Promise<void>) {
  const error = await callback().catch((err) => err);
  expect(error).toBeInstanceOf(Error);
  return error as Error;
}

describe("submitRestaurantAction", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("stores submitted values when validation fails", async () => {
    (submitPending as Mock).mockRejectedValue(
      new InvalidInputError({ formErrors: [], fieldErrors: { name: ["Required"] } }),
    );

    const redirectError = await captureRedirect(() =>
      submitRestaurantAction("ja", buildFormData()),
    );

    expect(redirectError.message).toBe("NEXT_REDIRECT:/ja?submission=invalid");
    expect(mocks.cookieSet).toHaveBeenCalledOnce();
    expect(mocks.cookieSet).toHaveBeenCalledWith(
      UGC_FORM_FLASH_COOKIE,
      expect.any(String),
      expect.objectContaining({ httpOnly: true, maxAge: 300, path: "/" }),
    );
    expect(decodePreservedFormValues(mocks.cookieSet.mock.calls[0]![1])).toMatchObject({
      name: "焼肉ホルモン 弘大",
      priceRange: "mid",
      reason: "一人で入りやすい",
    });
    expect(mocks.cookieDelete).not.toHaveBeenCalled();
  });

  it("stores submitted values when the database write fails", async () => {
    (submitPending as Mock).mockRejectedValue(
      new SubmissionDatabaseError("23502", "submission failed"),
    );

    const redirectError = await captureRedirect(() =>
      submitRestaurantAction("ko", buildFormData()),
    );

    expect(redirectError.message).toBe("NEXT_REDIRECT:/ko?submission=error");
    expect(mocks.cookieSet).toHaveBeenCalledOnce();
    expect(decodePreservedFormValues(mocks.cookieSet.mock.calls[0]![1])).toMatchObject({
      name: "焼肉ホルモン 弘大",
      reason: "一人で入りやすい",
    });
  });

  it("clears stale submitted values after a successful submission", async () => {
    (submitPending as Mock).mockResolvedValue({ id: "restaurant-id" });

    const redirectError = await captureRedirect(() =>
      submitRestaurantAction("ja", buildFormData()),
    );

    expect(redirectError.message).toBe("NEXT_REDIRECT:/ja?submission=success");
    expect(mocks.cookieDelete).toHaveBeenCalledWith(UGC_FORM_FLASH_COOKIE);
    expect(mocks.cookieSet).not.toHaveBeenCalled();
  });

  it("uploads an optional photo and forwards its public URL to submitPending", async () => {
    (submitPending as Mock).mockResolvedValue({ id: "restaurant-id" });
    mocks.uploadSubmissionPhoto.mockResolvedValue("https://cdn.example.com/photo.jpg");
    const formData = buildFormData();
    const photo = makePhoto();
    formData.set("photo", photo);

    const redirectError = await captureRedirect(() => submitRestaurantAction("ja", formData));

    expect(redirectError.message).toBe("NEXT_REDIRECT:/ja?submission=success");
    expect(mocks.uploadSubmissionPhoto).toHaveBeenCalledWith(photo);
    expect(submitPending).toHaveBeenCalledWith(
      expect.objectContaining({ photoUrl: "https://cdn.example.com/photo.jpg" }),
    );
  });

  it("skips photo upload when the file input is empty", async () => {
    (submitPending as Mock).mockResolvedValue({ id: "restaurant-id" });
    const formData = buildFormData();
    formData.set("photo", new File([], "", { type: "application/octet-stream" }));

    await captureRedirect(() => submitRestaurantAction("ja", formData));

    expect(mocks.uploadSubmissionPhoto).not.toHaveBeenCalled();
    expect(submitPending).toHaveBeenCalledWith(expect.objectContaining({ photoUrl: undefined }));
  });

  it("treats rejected photo input as invalid submission", async () => {
    mocks.uploadSubmissionPhoto.mockRejectedValue(new mocks.SubmissionPhotoRejectedError());
    const formData = buildFormData();
    formData.set("photo", makePhoto("image/gif"));

    const redirectError = await captureRedirect(() => submitRestaurantAction("ja", formData));

    expect(redirectError.message).toBe("NEXT_REDIRECT:/ja?submission=invalid");
    expect(submitPending).not.toHaveBeenCalled();
    expect(mocks.cookieSet).toHaveBeenCalledOnce();
  });

  it("treats storage upload failure as submission error", async () => {
    mocks.uploadSubmissionPhoto.mockRejectedValue(new mocks.SubmissionPhotoUploadError());
    const formData = buildFormData();
    formData.set("photo", makePhoto());

    const redirectError = await captureRedirect(() => submitRestaurantAction("ko", formData));

    expect(redirectError.message).toBe("NEXT_REDIRECT:/ko?submission=error");
    expect(submitPending).not.toHaveBeenCalled();
    expect(mocks.cookieSet).toHaveBeenCalledOnce();
  });
});

describe("clearSubmissionFlashCookieAction", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("deletes the form flash cookie so preserved values are one-shot", async () => {
    await clearSubmissionFlashCookieAction();

    expect(mocks.cookieDelete).toHaveBeenCalledWith(UGC_FORM_FLASH_COOKIE);
    expect(mocks.cookieSet).not.toHaveBeenCalled();
  });
});
