import { Suspense } from "react";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { publicEnv } from "@/lib/env";
import { parseFiltersFromSearchParams } from "@/lib/features/filters/filter-params";
import { FilterBar } from "@/lib/features/filters/FilterBar";
import { Header } from "@/lib/features/layout/Header";
import { MapClient } from "@/lib/features/map/MapClient";
import { listApproved } from "@/lib/repositories/restaurants";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { submitRestaurantAction } from "./actions";
import { ClearSubmissionFlashCookie } from "./clear-submission-flash-cookie";
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
          <FilterBar
            labels={{
              solo: t("filters.solo"),
              jp: t("filters.jp"),
              late: t("filters.late"),
            }}
          />
        </Suspense>

        <MapClient
          className="min-h-0 flex-1 space-y-2"
          containerClassName="h-[58vh] min-h-[420px] flex-1 md:h-auto"
          clientId={naverMapsClientId}
          label={t("map.label")}
          loadingLabel={t("map.loading")}
          errorLabel={t("map.error")}
          restaurants={restaurants}
        />
      </section>

      <section className="mx-auto w-full max-w-2xl px-5 pb-10 pt-4 md:pb-14">
        <form action={submitAction} className="space-y-5">
          <label className="block space-y-2">
            <span className="text-sm font-semibold">{t("form.name")}</span>
            <input
              className="w-full rounded-md border border-border bg-bg px-3 py-2"
              defaultValue={preservedFormValues.name}
              maxLength={120}
              name="name"
              required
              type="text"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold">{t("form.naverUrl")}</span>
            <input
              className="w-full rounded-md border border-border bg-bg px-3 py-2"
              defaultValue={preservedFormValues.naverUrl}
              name="naverUrl"
              required
              type="url"
            />
          </label>

          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">{t("form.isSolo")}</legend>
            <RadioPair
              name="isSolo"
              no={t("form.no")}
              value={preservedFormValues.isSolo}
              yes={t("form.yes")}
            />
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">{t("form.hasJpMenu")}</legend>
            <RadioPair
              name="hasJpMenu"
              no={t("form.no")}
              value={preservedFormValues.hasJpMenu}
              yes={t("form.yes")}
            />
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">{t("form.isLateNight")}</legend>
            <RadioPair
              name="isLateNight"
              no={t("form.no")}
              value={preservedFormValues.isLateNight}
              yes={t("form.yes")}
            />
          </fieldset>

          <label className="block space-y-2">
            <span className="text-sm font-semibold">{t("form.priceRange")}</span>
            <select
              className="w-full rounded-md border border-border bg-bg px-3 py-2"
              defaultValue={preservedFormValues.priceRange}
              name="priceRange"
            >
              <option value="">{t("form.priceUnknown")}</option>
              <option value="low">{t("form.priceLow")}</option>
              <option value="mid">{t("form.priceMid")}</option>
              <option value="high">{t("form.priceHigh")}</option>
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold">{t("form.reason")}</span>
            <textarea
              className="min-h-28 w-full rounded-md border border-border bg-bg px-3 py-2"
              defaultValue={preservedFormValues.reason}
              maxLength={500}
              name="reason"
              required
            />
          </label>

          <button
            className="w-full rounded-md bg-brand px-4 py-3 font-semibold text-text-invert transition hover:bg-brand-hover"
            type="submit"
          >
            {t("form.submit")}
          </button>
        </form>
      </section>
    </main>
  );
}

function RadioPair({
  name,
  no,
  value,
  yes,
}: {
  name: string;
  no: string;
  value: string;
  yes: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
        <input defaultChecked={value === "true"} name={name} required type="radio" value="true" />
        <span>{yes}</span>
      </label>
      <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
        <input defaultChecked={value === "false"} name={name} required type="radio" value="false" />
        <span>{no}</span>
      </label>
    </div>
  );
}
