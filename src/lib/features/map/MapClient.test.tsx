import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MapClient } from "./MapClient";
import { buildNaverMapsSdkUrl, NAVER_MAPS_SCRIPT_ID, SEOUL_CITY_HALL } from "./naver-maps";

const labels = {
  clientId: "naver-client-id",
  label: "Map",
  loadingLabel: "Loading map",
  errorLabel: "Could not load map",
};

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

  it("shows an alert when the SDK fails to load", () => {
    render(<MapClient {...labels} />);
    dispatchScriptEvent("error");

    expect(screen.getByRole("alert")).toHaveTextContent(labels.errorLabel);
  });
});
