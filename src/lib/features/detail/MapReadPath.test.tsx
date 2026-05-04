import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Restaurant } from "@/lib/models/restaurant";
import { getById } from "@/lib/repositories/restaurants";
import { MapReadPath } from "./MapReadPath";

vi.mock("@/lib/repositories/restaurants", () => ({
  getById: vi.fn(),
}));

vi.mock("@/lib/supabase/browser", () => ({
  createSupabaseBrowserClient: () => ({}),
}));

vi.mock("@/lib/features/filters/FilterBar", () => ({
  FilterBar: () => <div data-testid="filter-bar" />,
}));

vi.mock("@/lib/features/map/MapClient", () => ({
  MapClient: ({ onRestaurantSelect }: { onRestaurantSelect?: (id: string) => void }) => (
    <button onClick={() => onRestaurantSelect?.(restaurant.id)} type="button">
      marker
    </button>
  ),
}));

const restaurant = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  name_ja: "テスト食堂",
  name_ko: "테스트 식당",
  address_ja: "ソウル市中区",
  address_ko: "서울시 중구",
  latitude: 37.5667,
  longitude: 126.9784,
  price_range: "mid",
  status: "approved",
  is_solo_default: true,
  has_jp_menu: false,
  is_late_night: false,
  naver_url: "https://map.naver.com/p/entry/place/123",
  photo_url: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
} satisfies Restaurant;

const props = {
  clientId: "naver-client-id",
  detailLabels: {
    address: "住所",
    close: "閉じる",
    copied: "コピーしました",
    copyAddress: "住所をコピー",
    error: "お店の詳細を読み込めませんでした。",
    loading: "お店の詳細を読み込んでいます。",
    naverLink: "Naver Mapで見る",
    price: "価格帯",
    priceUnknown: "未選択",
    title: "お店の詳細",
  },
  filterLabels: {
    solo: "一人食いOK",
    jp: "日本語メニューあり",
    late: "深夜営業",
  },
  locale: "ja",
  mapLabels: {
    error: "地図を読み込めませんでした。",
    label: "ソウルの一人ごはんマップ",
    loading: "地図を読み込んでいます。",
  },
  restaurants: [restaurant],
};

describe("MapReadPath", () => {
  beforeEach(() => {
    vi.mocked(getById).mockReset();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("fetches detail when a marker is selected and closes the sheet", async () => {
    vi.mocked(getById).mockResolvedValue(restaurant);

    render(<MapReadPath {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "marker" }));

    expect(screen.getByText(props.detailLabels.loading)).toBeVisible();
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: restaurant.name_ja })).toBeVisible();
    });

    fireEvent.click(screen.getByRole("button", { name: props.detailLabels.close }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows an error when detail fetch fails", async () => {
    vi.mocked(getById).mockRejectedValue(new Error("failed"));

    render(<MapReadPath {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "marker" }));

    await waitFor(() => {
      expect(screen.getByText(props.detailLabels.error)).toBeVisible();
    });
  });
});
