"use client";

import { useCallback, useEffect, useState } from "react";
import type { Restaurant } from "@/lib/models/restaurant";
import { getById } from "@/lib/repositories/restaurants";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
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
  loading: string;
  naverLink: string;
  price: string;
  priceUnknown: string;
  title: string;
};

type MapLabels = {
  error: string;
  label: string;
  loading: string;
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
  const [detail, setDetail] = useState<Restaurant | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setStatus("idle");
      return;
    }

    let active = true;
    setStatus("loading");
    setDetail(null);
    setCopied(false);

    getById(createSupabaseBrowserClient(), selectedId)
      .then((restaurant) => {
        if (!active) return;
        if (!restaurant) {
          setStatus("error");
          return;
        }
        setDetail(restaurant);
        setStatus("idle");
      })
      .catch(() => {
        if (active) setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [selectedId]);

  const close = useCallback(() => {
    setSelectedId(null);
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

      <MapClient
        className="min-h-0 flex-1 space-y-2"
        containerClassName="h-[58vh] min-h-[420px] flex-1 md:h-auto"
        clientId={clientId}
        label={mapLabels.label}
        loadingLabel={mapLabels.loading}
        errorLabel={mapLabels.error}
        onRestaurantSelect={setSelectedId}
        restaurants={restaurants}
      />

      <BottomSheet
        closeLabel={detailLabels.close}
        onClose={close}
        open={selectedId !== null}
        title={detailLabels.title}
      >
        {status === "loading" ? <p className="text-sm text-text-muted">{detailLabels.loading}</p> : null}
        {status === "error" ? <p className="text-sm text-danger">{detailLabels.error}</p> : null}
        {detail ? (
          <RestaurantDetail
            copied={copied}
            labels={detailLabels}
            locale={locale}
            onCopyAddress={copyAddress}
            restaurant={detail}
          />
        ) : null}
      </BottomSheet>
    </>
  );
}
