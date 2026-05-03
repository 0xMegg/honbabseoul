"use server";

import { redirect } from "next/navigation";
import { InvalidInputError, SubmissionDatabaseError } from "@/lib/models/submission";
import { submitPending } from "@/lib/repositories/submissions";

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

function redirectWithStatus(locale: string, status: string): never {
  redirect(`/${locale}?submission=${status}`);
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
      priceRange: priceRange === "" ? undefined : priceRange,
    });
  } catch (error) {
    if (error instanceof InvalidInputError) {
      redirectWithStatus(locale, "invalid");
    }
    if (error instanceof SubmissionDatabaseError) {
      redirectWithStatus(locale, "error");
    }
    throw error;
  }

  redirectWithStatus(locale, "success");
}
