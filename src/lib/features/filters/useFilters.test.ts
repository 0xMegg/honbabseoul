import { describe, expect, it } from "vitest";
import {
  DEFAULT_FILTERS,
  parseFilters,
  parseFiltersFromSearchParams,
  writeFiltersToSearchParams,
  type Filters,
} from "./filter-params";

describe("filter URL state", () => {
  it("uses product defaults when query params are absent", () => {
    expect(parseFilters(new URLSearchParams())).toEqual(DEFAULT_FILTERS);
  });

  it("normalizes invalid query params back to defaults", () => {
    expect(parseFilters(new URLSearchParams("solo=yes&jp=true&late=2"))).toEqual(
      DEFAULT_FILTERS,
    );
  });

  it("parses explicit 1/0 query params", () => {
    expect(parseFilters(new URLSearchParams("solo=0&jp=1&late=1"))).toEqual({
      solo: false,
      jp: true,
      late: true,
    });
  });

  it("parses server searchParams objects and ignores array values", () => {
    expect(parseFiltersFromSearchParams({ solo: "0", jp: "1", late: ["1"] })).toEqual({
      solo: false,
      jp: true,
      late: DEFAULT_FILTERS.late,
    });
  });

  it("writes all filter params while preserving unrelated query params", () => {
    const filters: Filters = { solo: false, jp: true, late: false };
    const params = writeFiltersToSearchParams(
      new URLSearchParams("submission=success"),
      filters,
    );

    expect(params.toString()).toBe("submission=success&solo=0&jp=1&late=0");
  });
});
