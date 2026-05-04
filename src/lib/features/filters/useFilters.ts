"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

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

function parseBooleanParam(value: string | null, fallback: boolean): boolean {
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

export function useFilters() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = useMemo(
    () => parseFilters(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const setFilter = useCallback(
    (key: FilterKey, value: boolean) => {
      const nextFilters = { ...filters, [key]: value };
      const nextParams = writeFiltersToSearchParams(
        new URLSearchParams(searchParams.toString()),
        nextFilters,
      );
      router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
    },
    [filters, pathname, router, searchParams],
  );

  return { filters, setFilter };
}
