import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      allow: ["/", "/ja", "/ko", "/opengraph-image", "/manifest.webmanifest"],
      userAgent: "*",
    },
    sitemap: "https://honbabseoul.vercel.app/sitemap.xml",
  };
}
