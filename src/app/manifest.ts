import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#ffffff",
    categories: ["food", "travel"],
    description:
      "一人でも入りやすいソウルのお店を探せる、日本人旅行者向けのひとりごはんマップです。",
    display: "standalone",
    lang: "ja",
    name: "혼밥서울 | おひとりさま専用・ソウルグルメマップ",
    orientation: "portrait",
    scope: "/",
    short_name: "혼밥서울",
    start_url: "/ja",
    theme_color: "#5e6ad2",
  };
}
