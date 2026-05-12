import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Restaurant } from "@/lib/models/restaurant";
import { RestaurantDetail } from "./RestaurantDetail";

const labels = {
  address: "住所",
  badges: "お店の特徴",
  copyAddress: "住所をコピー",
  copied: "コピーしました",
  hasJpMenu: "日本語メニューあり",
  isLateNight: "深夜営業",
  isSolo: "一人食いOK",
  naverLink: "Naver Mapで見る",
  photoAlt: "代表写真",
  photoFallback: "写真準備中",
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
    expect(screen.getByRole("list", { name: labels.badges })).toBeVisible();
    expect(screen.getByText(labels.isSolo)).toBeVisible();
    expect(screen.queryByText(labels.hasJpMenu)).not.toBeInTheDocument();
    expect(screen.queryByText(labels.isLateNight)).not.toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: `${labels.photoFallback}: ${restaurant.name_ja}` }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: labels.naverLink })).toHaveAttribute(
      "href",
      restaurant.naver_url,
    );
  });

  it("falls back to the alternate locale and renders safe short Naver links", () => {
    const { rerender } = render(
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
    expect(screen.getByRole("link", { name: labels.naverLink })).toHaveAttribute(
      "href",
      "https://naver.me/abc",
    );

    rerender(
      <RestaurantDetail
        copied={false}
        labels={labels}
        locale="ja"
        onCopyAddress={vi.fn()}
        restaurant={{
          ...restaurant,
          naver_url: "https://pcmap.place.naver.com/restaurant/123",
        }}
      />,
    );

    expect(screen.getByRole("link", { name: labels.naverLink })).toHaveAttribute(
      "href",
      "https://pcmap.place.naver.com/restaurant/123",
    );
  });

  it("hides unsafe Naver lookalike links", () => {
    render(
      <RestaurantDetail
        copied={false}
        labels={labels}
        locale="ja"
        onCopyAddress={vi.fn()}
        restaurant={{
          ...restaurant,
          naver_url: "https://map.naver.com.attacker.tld/p/entry/place/123",
        }}
      />,
    );

    expect(screen.queryByRole("link", { name: labels.naverLink })).not.toBeInTheDocument();
  });

  it("renders safe restaurant photos and rejects unsafe photo URLs", () => {
    const { rerender } = render(
      <RestaurantDetail
        copied={false}
        labels={labels}
        locale="ja"
        onCopyAddress={vi.fn()}
        restaurant={{
          ...restaurant,
          photo_url: "https://images.example.com/menu.jpg",
        }}
      />,
    );

    expect(
      screen.getByRole("img", { name: `${labels.photoAlt}: ${restaurant.name_ja}` }),
    ).toHaveAttribute("src", "https://images.example.com/menu.jpg");

    rerender(
      <RestaurantDetail
        copied={false}
        labels={labels}
        locale="ja"
        onCopyAddress={vi.fn()}
        restaurant={{
          ...restaurant,
          photo_url: "javascript:alert(1)",
        }}
      />,
    );

    expect(
      screen.getByRole("img", { name: `${labels.photoFallback}: ${restaurant.name_ja}` }),
    ).toBeVisible();
    expect(
      screen.queryByRole("img", { name: `${labels.photoAlt}: ${restaurant.name_ja}` }),
    ).not.toBeInTheDocument();
  });

  it("renders all enabled restaurant feature badges", () => {
    render(
      <RestaurantDetail
        copied={false}
        labels={labels}
        locale="ja"
        onCopyAddress={vi.fn()}
        restaurant={{
          ...restaurant,
          has_jp_menu: true,
          is_late_night: true,
        }}
      />,
    );

    expect(screen.getByText(labels.isSolo)).toBeVisible();
    expect(screen.getByText(labels.hasJpMenu)).toBeVisible();
    expect(screen.getByText(labels.isLateNight)).toBeVisible();
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
