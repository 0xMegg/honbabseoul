export type Filters = {
  solo: boolean;
  jp: boolean;
  late: boolean;
};

export type FilterKey = keyof Filters;

export const DEFAULT_FILTERS: Filters = {
  solo: true,
  jp: false,
  late: false,
};

export const FILTER_KEYS = ["solo", "jp", "late"] as const satisfies readonly FilterKey[];

export type FilterSearchParams = Partial<Record<FilterKey, string | string[] | undefined>>;

function parseBooleanParam(value: string | null | undefined, fallback: boolean): boolean {
  if (value === "1") return true;
  if (value === "0") return false;
  return fallback;
}

export function parseFilters(searchParams: URLSearchParams): Filters {
  return {
    solo: parseBooleanParam(searchParams.get("solo"), DEFAULT_FILTERS.solo),
    jp: parseBooleanParam(searchParams.get("jp"), DEFAULT_FILTERS.jp),
    late: parseBooleanParam(searchParams.get("late"), DEFAULT_FILTERS.late),
  };
}

export function parseFiltersFromSearchParams(searchParams: FilterSearchParams): Filters {
  return {
    solo: parseBooleanParam(singleParam(searchParams.solo), DEFAULT_FILTERS.solo),
    jp: parseBooleanParam(singleParam(searchParams.jp), DEFAULT_FILTERS.jp),
    late: parseBooleanParam(singleParam(searchParams.late), DEFAULT_FILTERS.late),
  };
}

export function writeFiltersToSearchParams(
  currentSearchParams: URLSearchParams,
  filters: Filters,
): URLSearchParams {
  const next = new URLSearchParams(currentSearchParams);

  for (const key of FILTER_KEYS) {
    next.set(key, filters[key] ? "1" : "0");
  }

  return next;
}

function singleParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? undefined : value;
}
