import type { MetadataRoute } from "next";

const baseUrl = "https://honbabseoul.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      changeFrequency: "weekly",
      lastModified: new Date("2026-05-06"),
      priority: 1,
      url: `${baseUrl}/ja`,
    },
    {
      changeFrequency: "weekly",
      lastModified: new Date("2026-05-06"),
      priority: 0.7,
      url: `${baseUrl}/ko`,
    },
  ];
}
