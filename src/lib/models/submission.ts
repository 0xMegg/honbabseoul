import { z } from "zod";
import { isAllowedNaverUrlHost, NAVER_URL_HOSTS } from "@/lib/naver-url";
import { ALLOWED_PHOTO_MIME, MAX_PHOTO_BYTES } from "@/lib/photo-constraints";

export { ALLOWED_PHOTO_MIME, MAX_PHOTO_BYTES };

export const naverUrlSchema = z
  .string()
  .url()
  .refine(
    (value) => isAllowedNaverUrlHost(new URL(value).hostname),
    { message: `URL must be from ${NAVER_URL_HOSTS.join(", ")}` }
  );

export const priceRangeSchema = z.enum(["low", "mid", "high"]);

export const submissionSchema = z
  .object({
    name: z.string().min(1).max(120),
    naverUrl: naverUrlSchema,
    isSolo: z.boolean(),
    hasJpMenu: z.boolean(),
    isLateNight: z.boolean(),
    reason: z.string().min(1).max(500),
    priceRange: priceRangeSchema.optional(),
    photoUrl: z.string().url().optional(),
  })
  .strict();

export type SubmissionInput = z.infer<typeof submissionSchema>;

interface FlatErrors {
  formErrors: string[];
  fieldErrors: Partial<Record<string, string[]>>;
}

export class InvalidInputError extends Error {
  constructor(public readonly flatErrors: FlatErrors) {
    super("Invalid submission input");
    this.name = "InvalidInputError";
  }
}

export class SubmissionDatabaseError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "SubmissionDatabaseError";
  }
}
