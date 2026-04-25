import { z } from "zod";

export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
export const ALLOWED_PHOTO_MIME = ["image/jpeg", "image/png"] as const;
export const NAVER_URL_HOSTS = ["map.naver.com", "naver.me"] as const;

export const naverUrlSchema = z
  .string()
  .url()
  .refine(
    (value) =>
      (NAVER_URL_HOSTS as readonly string[]).includes(
        new URL(value).hostname.toLowerCase()
      ),
    { message: "URL must be from map.naver.com or naver.me" }
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
