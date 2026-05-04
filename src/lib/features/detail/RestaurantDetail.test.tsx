import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Restaurant } from "@/lib/models/restaurant";
import { RestaurantDetail } from "./RestaurantDetail";

const labels = {
  address: "住所",
  copyAddress: "住所をコピー",
  copied: "コピーしました",
  naverLink: "Naver Mapで見る",
  price: "価格帯",
  priceUnknown: "未選択",
};

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

describe("RestaurantDetail", () => {
  it("renders localized restaurant detail with a safe Naver Maps link", () => {
    render(
      <RestaurantDetail
        copied={false}
        labels={labels}
        locale="ja"
        onCopyAddress={vi.fn()}
        restaurant={restaurant}
      />,
    );

    expect(screen.getByRole("heading", { name: restaurant.name_ja })).toBeVisible();
    expect(screen.getByText(restaurant.name_ko!)).toBeVisible();
    expect(screen.getByText("₩₩")).toBeVisible();
    expect(screen.getByRole("link", { name: labels.naverLink })).toHaveAttribute(
      "href",
      restaurant.naver_url,
    );
  });

  it("falls back to the alternate locale and hides non map.naver.com links", () => {
    render(
      <RestaurantDetail
        copied={false}
        labels={labels}
        locale="ja"
        onCopyAddress={vi.fn()}
        restaurant={{
          ...restaurant,
          name_ja: null,
          address_ja: null,
          naver_url: "https://naver.me/abc",
          price_range: null,
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: restaurant.name_ko! })).toBeVisible();
    expect(screen.getByText(restaurant.address_ko!)).toBeVisible();
    expect(screen.getByText(labels.priceUnknown)).toBeVisible();
    expect(screen.queryByRole("link", { name: labels.naverLink })).not.toBeInTheDocument();
  });

  it("emits the localized address when copy is clicked", () => {
    const onCopyAddress = vi.fn();
    render(
      <RestaurantDetail
        copied={false}
        labels={labels}
        locale="ko"
        onCopyAddress={onCopyAddress}
        restaurant={restaurant}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: labels.copyAddress }));

    expect(onCopyAddress).toHaveBeenCalledWith(restaurant.address_ko);
  });
});
