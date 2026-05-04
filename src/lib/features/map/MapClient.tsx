"use client";

import { useEffect, useRef, useState } from "react";
import type { Restaurant } from "@/lib/models/restaurant";
import {
  SEOUL_CITY_HALL,
  type NaverMapsEventListener,
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
  onRestaurantSelect?: (id: string) => void;
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
  onRestaurantSelect,
}: MapClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<NaverMapInstance | null>(null);
  const markersRef = useRef<NaverMarkerInstance[]>([]);
  const markerListenersRef = useRef<NaverMapsEventListener[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [mapInitFailed, setMapInitFailed] = useState(false);
  const status = useNaverMapsSdk(clientId);

  useEffect(() => {
    if (
      status !== "ready" ||
      !containerRef.current ||
      !window.naver?.maps?.Map ||
      !window.naver.maps.LatLng
    ) {
      return;
    }
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
      clearMarkers(markersRef.current, markerListenersRef.current);
      markersRef.current = [];
      markerListenersRef.current = [];
      setMapReady(false);
      destroyMap(mapRef.current);
      mapRef.current = null;
    };
  }, [center.lat, center.lng, status, zoom]);

  useEffect(() => {
    const maps = window.naver?.maps;
    if (!mapReady || !mapRef.current || !maps?.Marker || !maps.LatLng) return;

    clearMarkers(markersRef.current, markerListenersRef.current);
    markersRef.current = [];
    markerListenersRef.current = [];

    for (const restaurant of restaurants.filter(hasCoordinates)) {
      const marker = new maps.Marker({
        map: mapRef.current,
        position: new maps.LatLng(restaurant.latitude, restaurant.longitude),
        title: restaurant.name_ja ?? restaurant.name_ko ?? undefined,
      });
      markersRef.current.push(marker);

      if (onRestaurantSelect && maps.Event) {
        markerListenersRef.current.push(
          maps.Event.addListener(marker, "click", () => {
            onRestaurantSelect(restaurant.id);
          }),
        );
      }
    }

    return () => {
      clearMarkers(markersRef.current, markerListenersRef.current);
      markersRef.current = [];
      markerListenersRef.current = [];
    };
  }, [mapReady, onRestaurantSelect, restaurants]);

  useEffect(() => {
    if (!mapReady) return;

    const intervalId = window.setInterval(() => {
      if (window.naver?.maps?.Map) return;

      clearMarkers(markersRef.current, markerListenersRef.current);
      markersRef.current = [];
      markerListenersRef.current = [];
      destroyMap(mapRef.current);
      mapRef.current = null;
      containerRef.current?.replaceChildren();
      setMapReady(false);
      setMapInitFailed(true);
    }, 500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [mapReady]);

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

function clearMarkers(markers: NaverMarkerInstance[], listeners: NaverMapsEventListener[]) {
  if (window.naver?.maps?.Event) {
    for (const listener of listeners) {
      try {
        window.naver.maps.Event.removeListener(listener);
      } catch {
        // Naver can revoke SDK internals after auth failure; cleanup must not crash React.
      }
    }
  }

  for (const marker of markers) {
    try {
      marker.setMap(null);
    } catch {
      // Naver can revoke SDK internals after auth failure; cleanup must not crash React.
    }
  }
}

function destroyMap(map: NaverMapInstance | null) {
  try {
    map?.destroy?.();
  } catch {
    // Naver can revoke SDK internals after auth failure; cleanup must not crash React.
  }
}

function hasCoordinates(
  restaurant: Restaurant,
): restaurant is Restaurant & { latitude: number; longitude: number } {
  return restaurant.latitude !== null && restaurant.longitude !== null;
}
