import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { HtmlLang } from "./HtmlLang";

const localeMetadata = {
  ja: {
    description:
      "一人でも入りやすいソウルのお店を探せる、日本人旅行者向けのひとりごはんマップです。",
    openGraphLocale: "ja_JP",
    title: "혼밥서울 | おひとりさま専用・ソウルグルメマップ",
  },
  ko: {
    description: "혼자 들어가기 좋은 서울 식당을 찾고 제보할 수 있는 혼밥 지도입니다.",
    openGraphLocale: "ko_KR",
    title: "혼밥서울 | 혼자 먹기 좋은 서울 식당 지도",
  },
} as const;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return {};
  }

  const metadata = localeMetadata[locale];
  const path = `/${locale}`;

  return {
    alternates: {
      canonical: path,
      languages: {
        ja: "/ja",
        ko: "/ko",
      },
    },
    description: metadata.description,
    openGraph: {
      description: metadata.description,
      locale: metadata.openGraphLocale,
      siteName: "혼밥서울",
      title: metadata.title,
      type: "website",
      url: path,
    },
    title: {
      absolute: metadata.title,
    },
    twitter: {
      card: "summary_large_image",
      description: metadata.description,
      title: metadata.title,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  return (
    <NextIntlClientProvider>
      <HtmlLang locale={locale} />
      {children}
    </NextIntlClientProvider>
  );
}
