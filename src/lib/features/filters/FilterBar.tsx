"use client";

import { useEffect, useState } from "react";
import { FILTER_KEYS, type FilterKey } from "./filter-params";
import { useFilters } from "./useFilters";

type FilterBarLabels = Record<FilterKey, string>;

type FilterBarProps = {
  labels: FilterBarLabels;
};

export function FilterBar({ labels }: FilterBarProps) {
  const { filters, setFilter } = useFilters();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <div className="flex flex-wrap gap-2" aria-label="Restaurant filters">
      {FILTER_KEYS.map((key) => {
        const active = filters[key];

        return (
          <button
            key={key}
            type="button"
            aria-pressed={active}
            disabled={!hydrated}
            className={[
              "rounded-md border px-3 py-2 text-sm font-semibold transition",
              active
                ? "border-brand bg-brand text-text-invert"
                : "border-border bg-surface text-text hover:border-brand",
              !hydrated ? "cursor-wait opacity-80" : "",
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
