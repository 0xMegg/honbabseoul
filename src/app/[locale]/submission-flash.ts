export const UGC_FORM_FLASH_COOKIE = "hb_ugc_form";

export const UGC_FORM_VALUE_KEYS = [
  "name",
  "naverUrl",
  "isSolo",
  "hasJpMenu",
  "isLateNight",
  "priceRange",
  "reason",
] as const;

export type UGCFormValueKey = (typeof UGC_FORM_VALUE_KEYS)[number];
export type PreservedFormValues = Record<UGCFormValueKey, string>;

export const EMPTY_PRESERVED_FORM_VALUES: PreservedFormValues = {
  name: "",
  naverUrl: "",
  isSolo: "",
  hasJpMenu: "",
  isLateNight: "",
  priceRange: "",
  reason: "",
};

const MAX_PRESERVED_LENGTH: Record<UGCFormValueKey, number> = {
  name: 120,
  naverUrl: 1000,
  isSolo: 5,
  hasJpMenu: 5,
  isLateNight: 5,
  priceRange: 4,
  reason: 500,
};

function normalizePreservedValue(key: UGCFormValueKey, value: unknown): string {
  if (typeof value !== "string") return "";
  const clipped = value.slice(0, MAX_PRESERVED_LENGTH[key]);

  if (key === "isSolo" || key === "hasJpMenu" || key === "isLateNight") {
    return clipped === "true" || clipped === "false" ? clipped : "";
  }

  if (key === "priceRange") {
    return clipped === "low" || clipped === "mid" || clipped === "high" ? clipped : "";
  }

  return clipped;
}

export function preservedValuesFromFormData(formData: FormData): PreservedFormValues {
  return Object.fromEntries(
    UGC_FORM_VALUE_KEYS.map((key) => [
      key,
      normalizePreservedValue(key, formData.get(key)),
    ])
  ) as PreservedFormValues;
}

export function encodePreservedFormValues(values: PreservedFormValues): string {
  return Buffer.from(JSON.stringify(values), "utf8").toString("base64url");
}

export function decodePreservedFormValues(value: string | undefined): PreservedFormValues {
  if (!value) return EMPTY_PRESERVED_FORM_VALUES;

  try {
    const decoded = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as unknown;

    if (!decoded || typeof decoded !== "object" || Array.isArray(decoded)) {
      return EMPTY_PRESERVED_FORM_VALUES;
    }

    const record = decoded as Record<string, unknown>;
    return Object.fromEntries(
      UGC_FORM_VALUE_KEYS.map((key) => [key, normalizePreservedValue(key, record[key])])
    ) as PreservedFormValues;
  } catch {
    return EMPTY_PRESERVED_FORM_VALUES;
  }
}
