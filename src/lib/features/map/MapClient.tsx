"use client";

import { useEffect, useRef } from "react";
import { SEOUL_CITY_HALL, type NaverMapInstance } from "./naver-maps";
import { useNaverMapsSdk } from "./useNaverMapsSdk";

type MapClientProps = {
  clientId: string;
  label: string;
  loadingLabel: string;
  errorLabel: string;
  center?: typeof SEOUL_CITY_HALL;
  zoom?: number;
};

export function MapClient({
  clientId,
  label,
  loadingLabel,
  errorLabel,
  center = SEOUL_CITY_HALL,
  zoom = 14,
}: MapClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<NaverMapInstance | null>(null);
  const status = useNaverMapsSdk(clientId);

  useEffect(() => {
    if (status !== "ready" || !containerRef.current || !window.naver?.maps) return;
    if (mapRef.current) return;

    mapRef.current = new window.naver.maps.Map(containerRef.current, {
      center: new window.naver.maps.LatLng(center.lat, center.lng),
      zoom,
      scaleControl: false,
      mapDataControl: true,
      zoomControl: true,
    });

    return () => {
      mapRef.current?.destroy?.();
      mapRef.current = null;
    };
  }, [center.lat, center.lng, status, zoom]);

  return (
    <section className="space-y-2" aria-label={label}>
      <div
        ref={containerRef}
        className="h-[360px] w-full overflow-hidden rounded-md border border-border bg-surface"
        data-testid="naver-map"
      />
      {status === "loading" || status === "idle" ? (
        <p className="text-sm text-text-muted">{loadingLabel}</p>
      ) : null}
      {status === "error" ? (
        <p className="text-sm text-danger" role="alert">
          {errorLabel}
        </p>
      ) : null}
    </section>
  );
}
