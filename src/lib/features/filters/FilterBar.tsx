"use client";

import type { FilterKey } from "./useFilters";
import { FILTER_KEYS, useFilters } from "./useFilters";

type FilterBarLabels = Record<FilterKey, string>;

type FilterBarProps = {
  labels: FilterBarLabels;
};

export function FilterBar({ labels }: FilterBarProps) {
  const { filters, setFilter } = useFilters();

  return (
    <div className="flex flex-wrap gap-2" aria-label="Restaurant filters">
      {FILTER_KEYS.map((key) => {
        const active = filters[key];

        return (
          <button
            key={key}
            type="button"
            aria-pressed={active}
            className={[
              "rounded-md border px-3 py-2 text-sm font-semibold transition",
              active
                ? "border-brand bg-brand text-text-invert"
                : "border-border bg-surface text-text hover:border-brand",
            ].join(" ")}
            onClick={() => setFilter(key, !active)}
          >
            {labels[key]}
          </button>
        );
      })}
    </div>
  );
}
