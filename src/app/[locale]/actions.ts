"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { InvalidInputError, SubmissionDatabaseError } from "@/lib/models/submission";
import { submitPending } from "@/lib/repositories/submissions";
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

async function redirectWithStatus(
  locale: string,
  status: string,
  formData?: FormData
): Promise<never> {
  const params = new URLSearchParams({ submission: status });
  const cookieStore = await cookies();

  if (status === "invalid" && formData) {
    cookieStore.set(
      UGC_FORM_FLASH_COOKIE,
      encodePreservedFormValues(preservedValuesFromFormData(formData)),
      {
        httpOnly: true,
        maxAge: 300,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      }
    );
  } else {
    cookieStore.delete(UGC_FORM_FLASH_COOKIE);
  }

  redirect(`/${locale}?${params.toString()}`);
}

export async function submitRestaurantAction(locale: string, formData: FormData): Promise<void> {
  const priceRange = formString(formData, "priceRange");

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
    });
  } catch (error) {
    if (error instanceof InvalidInputError) {
      await redirectWithStatus(locale, "invalid", formData);
    }
    if (error instanceof SubmissionDatabaseError) {
      await redirectWithStatus(locale, "error");
    }
    throw error;
  }

  await redirectWithStatus(locale, "success");
}
