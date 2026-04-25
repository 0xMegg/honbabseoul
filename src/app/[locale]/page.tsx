import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("common");
  return (
    <main className="flex min-h-screen items-center justify-center p-8 text-center">
      <h1 className="text-2xl font-semibold">{t("hello")}</h1>
    </main>
  );
}
