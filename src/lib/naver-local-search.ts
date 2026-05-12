import "server-only";
import { serverEnv } from "@/lib/env";

type NaverLocalSearchItem = {
  title?: string;
  address?: string;
  roadAddress?: string;
  mapx?: number | string;
  mapy?: number | string;
};

type NaverLocalSearchResponse = {
  items?: NaverLocalSearchItem[];
};

export type NaverLocalEnrichment = {
  addressKo: string | null;
  latitude: number;
  longitude: number;
  nameKo: string;
};

const NAVER_LOCAL_SEARCH_URL = "https://openapi.naver.com/v1/search/local.json";

export async function enrichSubmissionFromNaverLocal(
  submittedName: string,
): Promise<NaverLocalEnrichment | null> {
  const clientId = serverEnv.naverSearchClientId;
  const clientSecret = serverEnv.naverSearchClientSecret;

  if (!clientId || !clientSecret) return null;

  const url = new URL(NAVER_LOCAL_SEARCH_URL);
  url.searchParams.set("query", `${submittedName} 서울`);
  url.searchParams.set("display", "5");
  url.searchParams.set("start", "1");
  url.searchParams.set("sort", "random");

  const response = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as NaverLocalSearchResponse;
  return selectBestLocalSearchItem(submittedName, payload.items ?? []);
}

export function selectBestLocalSearchItem(
  submittedName: string,
  items: NaverLocalSearchItem[],
): NaverLocalEnrichment | null {
  const normalizedSubmitted = normalizeName(submittedName);
  if (!normalizedSubmitted) return null;

  for (const item of items) {
    const nameKo = stripMarkup(item.title ?? "");
    const normalizedCandidate = normalizeName(nameKo);
    if (!isConfidentNameMatch(normalizedSubmitted, normalizedCandidate)) continue;

    const coordinates = parseNaverLocalCoordinates(item.mapx, item.mapy);
    if (!coordinates) continue;

    return {
      addressKo: item.roadAddress || item.address || null,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      nameKo,
    };
  }

  return null;
}

function isConfidentNameMatch(submitted: string, candidate: string): boolean {
  return candidate.includes(submitted) || submitted.includes(candidate);
}

function normalizeName(value: string): string {
  return stripMarkup(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/[^0-9a-z가-힣ぁ-んァ-ン一-龯]/g, "");
}

function stripMarkup(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function parseNaverLocalCoordinates(
  rawMapx: number | string | undefined,
  rawMapy: number | string | undefined,
): { latitude: number; longitude: number } | null {
  const mapx = Number(rawMapx);
  const mapy = Number(rawMapy);
  if (!Number.isFinite(mapx) || !Number.isFinite(mapy)) return null;

  const longitude = Math.abs(mapx) > 180 ? mapx / 10_000_000 : mapx;
  const latitude = Math.abs(mapy) > 90 ? mapy / 10_000_000 : mapy;

  if (longitude < 124 || longitude > 132 || latitude < 33 || latitude > 39) return null;
  return { latitude, longitude };
}
