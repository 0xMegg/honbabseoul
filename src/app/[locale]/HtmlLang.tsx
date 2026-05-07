"use client";

import { useEffect } from "react";

export function HtmlLang({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale === "ko" ? "ko" : "ja";
  }, [locale]);

  return null;
}
