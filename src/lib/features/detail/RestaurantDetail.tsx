"use client";

import type { Restaurant } from "@/lib/models/restaurant";

type Locale = "ja" | "ko";

type RestaurantDetailLabels = {
  address: string;
  copyAddress: string;
  copied: string;
  naverLink: string;
  price: string;
  priceUnknown: string;
};

type RestaurantDetailProps = {
  copied: boolean;
  labels: RestaurantDetailLabels;
  locale: string;
  onCopyAddress: (address: string) => void;
  restaurant: Restaurant;
};

const PRICE_LABELS = {
  low: "₩",
  mid: "₩₩",
  high: "₩₩₩",
} as const;

export function RestaurantDetail({
  copied,
  labels,
  locale,
  onCopyAddress,
  restaurant,
}: RestaurantDetailProps) {
  const normalizedLocale: Locale = locale === "ko" ? "ko" : "ja";
  const name = localizedValue(restaurant, "name", normalizedLocale);
  const secondaryName = localizedValue(restaurant, "name", normalizedLocale === "ja" ? "ko" : "ja");
  const address = localizedValue(restaurant, "address", normalizedLocale);
  const naverUrl = mapNaverUrl(restaurant.naver_url);

  return (
    <article className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-xl font-bold">{name}</h2>
        {secondaryName && secondaryName !== name ? (
          <p className="text-sm text-text-muted">{secondaryName}</p>
        ) : null}
      </header>

      <dl className="space-y-3 text-sm">
        <div className="space-y-1">
          <dt className="font-semibold">{labels.price}</dt>
          <dd>{restaurant.price_range ? PRICE_LABELS[restaurant.price_range] : labels.priceUnknown}</dd>
        </div>

        {address ? (
          <div className="space-y-2">
            <dt className="font-semibold">{labels.address}</dt>
            <dd className="leading-6">{address}</dd>
            <button
              className="rounded-md border border-border bg-surface px-3 py-2 font-semibold"
              onClick={() => onCopyAddress(address)}
              type="button"
            >
              {copied ? labels.copied : labels.copyAddress}
            </button>
          </div>
        ) : null}
      </dl>

      {naverUrl ? (
        <a
          className="inline-flex rounded-md bg-brand px-4 py-3 font-semibold text-text-invert transition hover:bg-brand-hover"
          href={naverUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          {labels.naverLink}
        </a>
      ) : null}
    </article>
  );
}

function localizedValue(
  restaurant: Restaurant,
  field: "address" | "name",
  locale: Locale,
): string | null {
  if (field === "name") {
    return locale === "ja"
      ? restaurant.name_ja ?? restaurant.name_ko
      : restaurant.name_ko ?? restaurant.name_ja;
  }

  return locale === "ja"
    ? restaurant.address_ja ?? restaurant.address_ko
    : restaurant.address_ko ?? restaurant.address_ja;
}

function mapNaverUrl(value: string | null): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "map.naver.com" ? url.toString() : null;
  } catch {
    return null;
  }
}
