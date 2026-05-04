"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import {
  parseFilters,
  writeFiltersToSearchParams,
  type FilterKey,
} from "@/lib/features/filters/filter-params";

export {
  DEFAULT_FILTERS,
  FILTER_KEYS,
  parseFilters,
  parseFiltersFromSearchParams,
  writeFiltersToSearchParams,
  type FilterKey,
  type Filters,
} from "@/lib/features/filters/filter-params";

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
