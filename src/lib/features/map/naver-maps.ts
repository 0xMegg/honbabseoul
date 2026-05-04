export const NAVER_MAPS_SCRIPT_ID = "naver-maps-sdk";
export const NAVER_MAPS_SDK_BASE_URL = "https://oapi.map.naver.com/openapi/v3/maps.js";

export const SEOUL_CITY_HALL = {
  lat: 37.5666103,
  lng: 126.9783882,
} as const;

export type NaverMapsStatus = "idle" | "loading" | "ready" | "error";

export type NaverMapInstance = {
  destroy?: () => void;
};

export type NaverMapsNamespace = {
  LatLng: new (lat: number, lng: number) => unknown;
  Map: new (
    element: HTMLElement,
    options: {
      center: unknown;
      zoom: number;
      scaleControl?: boolean;
      mapDataControl?: boolean;
      zoomControl?: boolean;
    },
  ) => NaverMapInstance;
};

declare global {
  interface Window {
    naver?: {
      maps?: NaverMapsNamespace;
    };
  }
}

export function buildNaverMapsSdkUrl(clientId: string): string {
  const params = new URLSearchParams({ ncpClientId: clientId });
  return `${NAVER_MAPS_SDK_BASE_URL}?${params.toString()}`;
}
