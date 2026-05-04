"use client";

import { useCallback, useMemo, useState } from "react";
import type { Restaurant } from "@/lib/models/restaurant";
import { FilterBar } from "@/lib/features/filters/FilterBar";
import type { FilterKey } from "@/lib/features/filters/filter-params";
import { MapClient } from "@/lib/features/map/MapClient";
import { BottomSheet } from "./BottomSheet";
import { RestaurantDetail } from "./RestaurantDetail";

type DetailLabels = {
  address: string;
  close: string;
  copied: string;
  copyAddress: string;
  error: string;
  naverLink: string;
  price: string;
  priceUnknown: string;
  title: string;
};

type MapLabels = {
  error: string;
  label: string;
  loading: string;
  resultCount: string;
};

type MapReadPathProps = {
  clientId: string;
  detailLabels: DetailLabels;
  filterLabels: Record<FilterKey, string>;
  locale: string;
  mapLabels: MapLabels;
  restaurants: Restaurant[];
};

export function MapReadPath({
  clientId,
  detailLabels,
  filterLabels,
  locale,
  mapLabels,
  restaurants,
}: MapReadPathProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const selectedRestaurant = useMemo(
    () => restaurants.find((restaurant) => restaurant.id === selectedId) ?? null,
    [restaurants, selectedId],
  );

  const close = useCallback(() => {
    setSelectedId(null);
    setCopied(false);
  }, []);

  const selectRestaurant = useCallback((id: string) => {
    setSelectedId(id);
    setCopied(false);
  }, []);

  const copyAddress = useCallback(async (address: string) => {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
  }, []);

  return (
    <>
      <FilterBar labels={filterLabels} />

      <p className="text-sm font-semibold text-text-muted">{mapLabels.resultCount}</p>

      <MapClient
        className="min-h-0 flex-1 space-y-2"
        containerClassName="h-[58vh] min-h-[420px] flex-1 md:h-auto"
        clientId={clientId}
        label={mapLabels.label}
        loadingLabel={mapLabels.loading}
        errorLabel={mapLabels.error}
        onRestaurantSelect={selectRestaurant}
        restaurants={restaurants}
      />

      <BottomSheet
        closeLabel={detailLabels.close}
        onClose={close}
        open={selectedId !== null}
        title={detailLabels.title}
      >
        {selectedId && !selectedRestaurant ? (
          <p className="text-sm text-danger">{detailLabels.error}</p>
        ) : null}
        {selectedRestaurant ? (
          <RestaurantDetail
            copied={copied}
            labels={detailLabels}
            locale={locale}
            onCopyAddress={copyAddress}
            restaurant={selectedRestaurant}
          />
        ) : null}
      </BottomSheet>
    </>
  );
}
