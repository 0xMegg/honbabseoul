import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Restaurant } from "@/lib/models/restaurant";
import { MapClient } from "./MapClient";
import { buildNaverMapsSdkUrl, NAVER_MAPS_SCRIPT_ID, SEOUL_CITY_HALL } from "./naver-maps";

const labels = {
  clientId: "naver-client-id",
  label: "Map",
  loadingLabel: "Loading map",
  errorLabel: "Could not load map",
};

const restaurant = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  name_ja: "テスト食堂",
  name_ko: "테스트 식당",
  address_ja: null,
  address_ko: null,
  latitude: 37.5667,
  longitude: 126.9784,
  price_range: "mid",
  status: "approved",
  is_solo_default: true,
  has_jp_menu: false,
  is_late_night: false,
  naver_url: null,
  photo_url: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
} satisfies Restaurant;

function dispatchScriptEvent(type: "load" | "error") {
  const script = document.getElementById(NAVER_MAPS_SCRIPT_ID);
  if (!script) throw new Error("Naver Maps script was not appended");
  act(() => {
    script.dispatchEvent(new Event(type));
  });
}

describe("MapClient", () => {
  afterEach(() => {
    document.getElementById(NAVER_MAPS_SCRIPT_ID)?.remove();
    delete window.naver;
    vi.clearAllMocks();
  });

  it("loads the Naver Maps SDK with the public client id", () => {
    render(<MapClient {...labels} />);

    const script = document.getElementById(NAVER_MAPS_SCRIPT_ID) as HTMLScriptElement | null;
    expect(script).not.toBeNull();
    expect(script?.src).toBe(buildNaverMapsSdkUrl(labels.clientId));
    expect(screen.getByText(labels.loadingLabel)).toBeVisible();
  });

  it("allows the shell to control the inner map container height", () => {
    render(<MapClient {...labels} containerClassName="h-[58vh] min-h-[420px]" />);

    expect(screen.getByTestId("naver-map")).toHaveClass("h-[58vh]", "min-h-[420px]");
  });

  it("initializes a map when the SDK is ready", async () => {
    const map = vi.fn();
    const latLng = vi.fn();
    window.naver = {
      maps: {
        LatLng: class {
          constructor(lat: number, lng: number) {
            latLng(lat, lng);
          }
        },
        Map: class {
          constructor(element: HTMLElement, options: unknown) {
            map(element, options);
          }
        },
        Marker: class {
          setMap() {}
        },
      },
    };

    render(<MapClient {...labels} />);

    await waitFor(() => {
      expect(map).toHaveBeenCalledOnce();
    });
    expect(latLng).toHaveBeenCalledWith(SEOUL_CITY_HALL.lat, SEOUL_CITY_HALL.lng);
    expect(map.mock.calls[0]?.[1]).toMatchObject({
      zoom: 14,
      mapDataControl: true,
      scaleControl: false,
      zoomControl: true,
    });
  });

  it("shows an inline error when the SDK fails to load", () => {
    render(<MapClient {...labels} />);
    dispatchScriptEvent("error");

    expect(screen.getByText(labels.errorLabel)).toBeVisible();
  });

  it("shows an inline error when map initialization fails", async () => {
    window.naver = {
      maps: {
        LatLng: class {},
        Map: class {
          constructor() {
            throw new Error("auth failed");
          }
        },
        Marker: class {
          setMap() {}
        },
      },
    };

    render(<MapClient {...labels} />);

    await waitFor(() => {
      expect(screen.getByText(labels.errorLabel)).toBeVisible();
    });
  });

  it("creates one marker per restaurant with coordinates", async () => {
    const marker = vi.fn();
    const latLng = vi.fn();
    const mapInstance = {};
    window.naver = {
      maps: {
        LatLng: class {
          constructor(lat: number, lng: number) {
            latLng(lat, lng);
          }
        },
        Map: class {
          constructor() {
            return mapInstance;
          }
        },
        Marker: class {
          constructor(options: unknown) {
            marker(options);
          }
          setMap() {}
        },
      },
    };

    render(<MapClient {...labels} restaurants={[restaurant, { ...restaurant, latitude: null }]} />);

    await waitFor(() => {
      expect(marker).toHaveBeenCalledOnce();
    });
    expect(latLng).toHaveBeenCalledWith(restaurant.latitude, restaurant.longitude);
    expect(marker.mock.calls[0]?.[0]).toMatchObject({
      map: mapInstance,
      title: restaurant.name_ja,
    });
  });

  it("clears old markers when restaurant props change", async () => {
    const setMap = vi.fn();
    window.naver = {
      maps: {
        LatLng: class {},
        Map: class {},
        Marker: class {
          setMap = setMap;
        },
      },
    };

    const { rerender } = render(<MapClient {...labels} restaurants={[restaurant]} />);

    await waitFor(() => {
      expect(setMap).not.toHaveBeenCalled();
    });

    rerender(<MapClient {...labels} restaurants={[{ ...restaurant, id: "550e8400-e29b-41d4-a716-446655440002" }]} />);

    await waitFor(() => {
      expect(setMap).toHaveBeenCalledWith(null);
    });
  });
});
