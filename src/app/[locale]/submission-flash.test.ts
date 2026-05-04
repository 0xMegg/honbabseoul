import { describe, expect, it } from "vitest";
import {
  decodePreservedFormValues,
  EMPTY_PRESERVED_FORM_VALUES,
  encodePreservedFormValues,
  preservedValuesFromFormData,
} from "./submission-flash";

describe("submission flash values", () => {
  it("round-trips normalized form values", () => {
    const formData = new FormData();
    formData.set("name", "焼肉ホルモン 弘大");
    formData.set("naverUrl", "https://map.naver.com/p/entry/place/12345678");
    formData.set("isSolo", "true");
    formData.set("hasJpMenu", "false");
    formData.set("isLateNight", "true");
    formData.set("priceRange", "mid");
    formData.set("reason", "一人で入りやすい");

    const values = preservedValuesFromFormData(formData);

    expect(decodePreservedFormValues(encodePreservedFormValues(values))).toEqual(values);
  });

  it("returns empty values for absent or malformed cookie values", () => {
    expect(decodePreservedFormValues(undefined)).toEqual(EMPTY_PRESERVED_FORM_VALUES);
    expect(decodePreservedFormValues("not-json")).toEqual(EMPTY_PRESERVED_FORM_VALUES);
    expect(
      decodePreservedFormValues(Buffer.from(JSON.stringify(["name"]), "utf8").toString("base64url"))
    ).toEqual(EMPTY_PRESERVED_FORM_VALUES);
  });

  it("normalizes decoded values and ignores unsupported field values", () => {
    const encoded = Buffer.from(
      JSON.stringify({
        name: "x".repeat(130),
        naverUrl: "https://example.com",
        isSolo: "yes",
        hasJpMenu: "false",
        isLateNight: true,
        priceRange: "premium",
        reason: "r".repeat(510),
        extra: "ignored",
      }),
      "utf8"
    ).toString("base64url");

    expect(decodePreservedFormValues(encoded)).toEqual({
      name: "x".repeat(120),
      naverUrl: "https://example.com",
      isSolo: "",
      hasJpMenu: "false",
      isLateNight: "",
      priceRange: "",
      reason: "r".repeat(500),
    });
  });
});
