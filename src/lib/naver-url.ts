export const NAVER_URL_HOSTS = [
  "map.naver.com",
  "m.place.naver.com",
  "naver.me",
  "pcmap.place.naver.com",
  "place.map.naver.com",
] as const;

export function isAllowedNaverUrlHost(hostname: string): boolean {
  return (NAVER_URL_HOSTS as readonly string[]).includes(hostname.toLowerCase());
}

export function mapNaverUrl(value: string | null): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && isAllowedNaverUrlHost(url.hostname)
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
