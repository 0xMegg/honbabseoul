"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { InvalidInputError, SubmissionDatabaseError } from "@/lib/models/submission";
import { submitPending } from "@/lib/repositories/submissions";
import {
  cleanupSubmissionPhoto,
  SubmissionPhotoRejectedError,
  SubmissionPhotoUploadError,
  uploadSubmissionPhoto,
} from "@/lib/supabase/storage-server";
import {
  encodePreservedFormValues,
  preservedValuesFromFormData,
  UGC_FORM_FLASH_COOKIE,
} from "./submission-flash";

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function formBoolean(formData: FormData, key: string): boolean | undefined {
  const value = formData.get(key);
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function formFile(formData: FormData, key: string): File | null {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

async function redirectWithStatus(
  locale: string,
  status: string,
  formData?: FormData,
): Promise<never> {
  const params = new URLSearchParams({ submission: status });
  const cookieStore = await cookies();

  if ((status === "invalid" || status === "error") && formData) {
    cookieStore.set(
      UGC_FORM_FLASH_COOKIE,
      encodePreservedFormValues(preservedValuesFromFormData(formData)),
      {
        httpOnly: true,
        maxAge: 300,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    );
  } else {
    cookieStore.delete(UGC_FORM_FLASH_COOKIE);
  }

  redirect(`/${locale}?${params.toString()}`);
}

export async function clearSubmissionFlashCookieAction(): Promise<void> {
  (await cookies()).delete(UGC_FORM_FLASH_COOKIE);
}

export async function submitRestaurantAction(locale: string, formData: FormData): Promise<void> {
  const priceRange = formString(formData, "priceRange");

  try {
    const photo = formFile(formData, "photo");
    const uploaded = photo ? await uploadSubmissionPhoto(photo) : undefined;

    try {
      await submitPending({
        name: formString(formData, "name"),
        naverUrl: formString(formData, "naverUrl"),
        isSolo: formBoolean(formData, "isSolo"),
        hasJpMenu: formBoolean(formData, "hasJpMenu"),
        isLateNight: formBoolean(formData, "isLateNight"),
        reason: formString(formData, "reason"),
        // Empty select value means "unknown"; submissionSchema validates low/mid/high.
        priceRange: priceRange === "" ? undefined : priceRange,
        photoUrl: uploaded?.publicUrl,
      });
    } catch (submitError) {
      if (uploaded) {
        try {
          await cleanupSubmissionPhoto(uploaded.path);
        } catch {
          // Best-effort cleanup; surface the original submit error.
        }
      }
      throw submitError;
    }
  } catch (error) {
    if (error instanceof InvalidInputError || error instanceof SubmissionPhotoRejectedError) {
      await redirectWithStatus(locale, "invalid", formData);
    }
    if (error instanceof SubmissionDatabaseError || error instanceof SubmissionPhotoUploadError) {
      await redirectWithStatus(locale, "error", formData);
    }
    throw error;
  }

  await redirectWithStatus(locale, "success");
}
