import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  enrichSubmissionFromNaverLocal,
  selectBestLocalSearchItem,
} from "@/lib/naver-local-search";

describe("selectBestLocalSearchItem", () => {
  it("returns Korean name, address, and WGS84 coordinates for a confident match", () => {
    const result = selectBestLocalSearchItem("조선옥", [
      {
        title: "<b>조선옥</b>",
        roadAddress: "서울특별시 중구 을지로15길 6-5",
        address: "서울특별시 중구 을지로3가 229-1",
        mapx: "1269912345",
        mapy: "375612345",
      },
    ]);

    expect(result).toEqual({
      addressKo: "서울특별시 중구 을지로15길 6-5",
      latitude: 37.5612345,
      longitude: 126.9912345,
      nameKo: "조선옥",
    });
  });

  it("returns null when the first candidates are ambiguous or outside Korea bounds", () => {
    expect(
      selectBestLocalSearchItem("조선옥", [
        {
          title: "다른 식당",
          roadAddress: "서울특별시 중구",
          mapx: "1269912345",
          mapy: "375612345",
        },
      ]),
    ).toBeNull();

    expect(
      selectBestLocalSearchItem("조선옥", [
        {
          title: "조선옥",
          roadAddress: "서울특별시 중구",
          mapx: "311277",
          mapy: "552097",
        },
      ]),
    ).toBeNull();
  });
});

describe("enrichSubmissionFromNaverLocal", () => {
  const originalId = process.env.NAVER_SEARCH_CLIENT_ID;
  const originalSecret = process.env.NAVER_SEARCH_CLIENT_SECRET;
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    if (originalId === undefined) {
      delete process.env.NAVER_SEARCH_CLIENT_ID;
    } else {
      process.env.NAVER_SEARCH_CLIENT_ID = originalId;
    }
    if (originalSecret === undefined) {
      delete process.env.NAVER_SEARCH_CLIENT_SECRET;
    } else {
      process.env.NAVER_SEARCH_CLIENT_SECRET = originalSecret;
    }
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("skips enrichment when Naver Search credentials are missing", async () => {
    delete process.env.NAVER_SEARCH_CLIENT_ID;
    delete process.env.NAVER_SEARCH_CLIENT_SECRET;

    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    await expect(enrichSubmissionFromNaverLocal("조선옥")).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("calls Naver Local Search with server-only credentials", async () => {
    process.env.NAVER_SEARCH_CLIENT_ID = "client-id";
    process.env.NAVER_SEARCH_CLIENT_SECRET = "client-secret";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        items: [
          {
            title: "<b>조선옥</b>",
            roadAddress: "서울특별시 중구 을지로15길 6-5",
            mapx: "1269912345",
            mapy: "375612345",
          },
        ],
      }),
    });
    globalThis.fetch = fetchMock;

    await expect(enrichSubmissionFromNaverLocal("조선옥")).resolves.toMatchObject({
      nameKo: "조선옥",
      addressKo: "서울특별시 중구 을지로15길 6-5",
    });

    const [url, options] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain("https://openapi.naver.com/v1/search/local.json");
    expect(String(url)).toContain("query=%EC%A1%B0%EC%84%A0%EC%98%A5+%EC%84%9C%EC%9A%B8");
    expect(options).toMatchObject({
      headers: {
        "X-Naver-Client-Id": "client-id",
        "X-Naver-Client-Secret": "client-secret",
      },
    });
  });
});
