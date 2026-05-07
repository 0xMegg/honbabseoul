import { Suspense } from "react";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { publicEnv } from "@/lib/env";
import { parseFiltersFromSearchParams } from "@/lib/features/filters/filter-params";
import { MapReadPath } from "@/lib/features/detail/MapReadPath";
import { Header } from "@/lib/features/layout/Header";
import { listApproved } from "@/lib/repositories/restaurants";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { submitRestaurantAction } from "./actions";
import { ClearSubmissionFlashCookie } from "./clear-submission-flash-cookie";
import { SubmissionForm } from "./SubmissionForm";
import {
  decodePreservedFormValues,
  EMPTY_PRESERVED_FORM_VALUES,
  UGC_FORM_FLASH_COOKIE,
} from "./submission-flash";

type HomeProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    submission?: string | string[];
    solo?: string | string[];
    jp?: string | string[];
    late?: string | string[];
  }>;
};

const SUBMISSION_STATUSES = ["success", "invalid", "error"] as const;
type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

function parseSubmissionStatus(value: string | string[] | undefined): SubmissionStatus | null {
  if (Array.isArray(value)) return null;
  if (!(SUBMISSION_STATUSES as readonly string[]).includes(value ?? "")) {
    return null;
  }
  return value as SubmissionStatus;
}

function submissionFeedbackRole(status: SubmissionStatus): "alert" | "status" {
  return status === "success" ? "status" : "alert";
}

function shouldPreserveFormValues(status: SubmissionStatus | null): boolean {
  return status === "invalid" || status === "error";
}

export default async function Home({ params, searchParams }: HomeProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const t = await getTranslations("home");
  const submitAction = submitRestaurantAction.bind(null, locale);
  const naverMapsClientId = publicEnv.naverMapsClientId;
  const submissionStatus = parseSubmissionStatus(query.submission);
  const filters = parseFiltersFromSearchParams(query);
  const restaurants = await listApproved(await createSupabaseServerClient(), {
    isSolo: filters.solo,
    hasJpMenu: filters.jp,
    isLateNight: filters.late,
  });
  const preservedFormValues = shouldPreserveFormValues(submissionStatus)
    ? decodePreservedFormValues((await cookies()).get(UGC_FORM_FLASH_COOKIE)?.value)
    : EMPTY_PRESERVED_FORM_VALUES;

  return (
    <main className="min-h-screen bg-bg">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-5 px-5 py-5 md:px-8 md:py-8">
        <Header description={t("description")} eyebrow={t("eyebrow")} title={t("title")} />

        {submissionStatus ? (
          <p
            className="rounded-md border border-border bg-surface p-3 text-sm"
            role={submissionFeedbackRole(submissionStatus)}
          >
            {t(`submissionStatus.${submissionStatus}`)}
          </p>
        ) : null}

        {shouldPreserveFormValues(submissionStatus) ? <ClearSubmissionFlashCookie /> : null}

        <Suspense fallback={null}>
          <MapReadPath
            clientId={naverMapsClientId}
            detailLabels={{
              address: t("detail.address"),
              badges: t("detail.badges"),
              close: t("detail.close"),
              copied: t("detail.copied"),
              copyAddress: t("detail.copyAddress"),
              error: t("detail.error"),
              hasJpMenu: t("detail.hasJpMenu"),
              isLateNight: t("detail.isLateNight"),
              isSolo: t("detail.isSolo"),
              naverLink: t("detail.naverLink"),
              photoAlt: t("detail.photoAlt"),
              photoFallback: t("detail.photoFallback"),
              price: t("detail.price"),
              priceUnknown: t("detail.priceUnknown"),
              title: t("detail.title"),
            }}
            filterLabels={{
              solo: t("filters.solo"),
              jp: t("filters.jp"),
              late: t("filters.late"),
            }}
            locale={locale}
            mapLabels={{
              label: t("map.label"),
              loading: t("map.loading"),
              error: t("map.error"),
              resultCount: t("map.resultCount", { count: restaurants.length }),
            }}
            restaurants={restaurants}
          />
        </Suspense>
      </section>

      <section className="mx-auto w-full max-w-2xl px-5 pb-10 pt-4 md:pb-14">
        <SubmissionForm
          action={submitAction}
          labels={{
            hasJpMenu: t("form.hasJpMenu"),
            isLateNight: t("form.isLateNight"),
            isSolo: t("form.isSolo"),
            name: t("form.name"),
            naverUrl: t("form.naverUrl"),
            no: t("form.no"),
            photo: t("form.photo"),
            photoHint: t("form.photoHint"),
            priceHigh: t("form.priceHigh"),
            priceLow: t("form.priceLow"),
            priceMid: t("form.priceMid"),
            priceRange: t("form.priceRange"),
            priceUnknown: t("form.priceUnknown"),
            reason: t("form.reason"),
            submit: t("form.submit"),
            yes: t("form.yes"),
          }}
          preservedValues={preservedFormValues}
        />
      </section>
    </main>
  );
}
