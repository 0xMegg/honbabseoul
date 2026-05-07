import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "혼밥서울",
  title: {
    default: "혼밥서울 | おひとりさま専用・ソウルグルメマップ",
    template: "%s | 혼밥서울",
  },
  description: "一人でも入りやすいソウルのお店を探せる、日本人旅行者向けのひとりごはんマップです。",
  manifest: "/manifest.webmanifest",
  metadataBase: new URL("https://honbabseoul.vercel.app"),
  openGraph: {
    description:
      "一人でも入りやすいソウルのお店を探せる、日本人旅行者向けのひとりごはんマップです。",
    locale: "ja_JP",
    siteName: "혼밥서울",
    title: "혼밥서울 | おひとりさま専用・ソウルグルメマップ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    description:
      "一人でも入りやすいソウルのお店を探せる、日本人旅行者向けのひとりごはんマップです。",
    title: "혼밥서울 | おひとりさま専用・ソウルグルメマップ",
  },
};

export const viewport: Viewport = {
  themeColor: "#5e6ad2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
