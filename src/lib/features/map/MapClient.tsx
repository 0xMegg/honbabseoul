"use client";

import { useEffect, useRef, useState } from "react";
import type { Restaurant } from "@/lib/models/restaurant";
import {
  SEOUL_CITY_HALL,
  type NaverMapInstance,
  type NaverMarkerInstance,
} from "./naver-maps";
import { useNaverMapsSdk } from "./useNaverMapsSdk";

type MapClientProps = {
  clientId: string;
  containerClassName?: string;
  className?: string;
  label: string;
  loadingLabel: string;
  errorLabel: string;
  center?: typeof SEOUL_CITY_HALL;
  zoom?: number;
  restaurants?: Restaurant[];
};

export function MapClient({
  clientId,
  containerClassName = "h-[360px]",
  className = "space-y-2",
  label,
  loadingLabel,
  errorLabel,
  center = SEOUL_CITY_HALL,
  zoom = 14,
  restaurants = [],
}: MapClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<NaverMapInstance | null>(null);
  const markersRef = useRef<NaverMarkerInstance[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [mapInitFailed, setMapInitFailed] = useState(false);
  const status = useNaverMapsSdk(clientId);

  useEffect(() => {
    if (status !== "ready" || !containerRef.current || !window.naver?.maps) return;
    if (mapRef.current) return;

    try {
      mapRef.current = new window.naver.maps.Map(containerRef.current, {
        center: new window.naver.maps.LatLng(center.lat, center.lng),
        zoom,
        scaleControl: false,
        mapDataControl: true,
        zoomControl: true,
      });
      setMapReady(true);
      setMapInitFailed(false);
    } catch {
      setMapReady(false);
      setMapInitFailed(true);
    }

    return () => {
      clearMarkers(markersRef.current);
      markersRef.current = [];
      setMapReady(false);
      mapRef.current?.destroy?.();
      mapRef.current = null;
    };
  }, [center.lat, center.lng, status, zoom]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !window.naver?.maps?.Marker) return;

    clearMarkers(markersRef.current);
    markersRef.current = restaurants
      .filter(hasCoordinates)
      .map(
        (restaurant) =>
          new window.naver!.maps!.Marker({
            map: mapRef.current!,
            position: new window.naver!.maps!.LatLng(restaurant.latitude, restaurant.longitude),
            title: restaurant.name_ja ?? restaurant.name_ko ?? undefined,
          }),
      );

    return () => {
      clearMarkers(markersRef.current);
      markersRef.current = [];
    };
  }, [mapReady, restaurants]);

  return (
    <section className={className} aria-label={label}>
      <div
        ref={containerRef}
        className={`${containerClassName} w-full overflow-hidden rounded-md border border-border bg-surface`}
        data-testid="naver-map"
      />
      {status === "loading" || status === "idle" ? (
        <p className="text-sm text-text-muted">{loadingLabel}</p>
      ) : null}
      {status === "error" || mapInitFailed ? (
        <p className="text-sm text-danger">{errorLabel}</p>
      ) : null}
    </section>
  );
}

function clearMarkers(markers: NaverMarkerInstance[]) {
  for (const marker of markers) {
    marker.setMap(null);
  }
}

function hasCoordinates(
  restaurant: Restaurant,
): restaurant is Restaurant & { latitude: number; longitude: number } {
  return restaurant.latitude !== null && restaurant.longitude !== null;
}
