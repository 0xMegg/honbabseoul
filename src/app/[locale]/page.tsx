import { getTranslations } from "next-intl/server";
import { submitRestaurantAction } from "./actions";

type HomeProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ submission?: string | string[] }>;
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

export default async function Home({ params, searchParams }: HomeProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const t = await getTranslations("home");
  const submitAction = submitRestaurantAction.bind(null, locale);
  const submissionStatus = parseSubmissionStatus(query.submission);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-5 py-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold text-brand">{t("eyebrow")}</p>
        <h1 className="text-2xl font-semibold text-text">{t("title")}</h1>
        <p className="text-sm leading-6 text-text-muted">{t("description")}</p>
      </header>

      {submissionStatus ? (
        <p
          className="rounded-md border border-border bg-surface p-3 text-sm"
          role={submissionFeedbackRole(submissionStatus)}
        >
          {t(`submissionStatus.${submissionStatus}`)}
        </p>
      ) : null}

      <form action={submitAction} className="space-y-5">
        <label className="block space-y-2">
          <span className="text-sm font-semibold">{t("form.name")}</span>
          <input
            className="w-full rounded-md border border-border bg-bg px-3 py-2"
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
            name="naverUrl"
            required
            type="url"
          />
        </label>

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">{t("form.isSolo")}</legend>
          <RadioPair name="isSolo" no={t("form.no")} yes={t("form.yes")} />
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">{t("form.hasJpMenu")}</legend>
          <RadioPair name="hasJpMenu" no={t("form.no")} yes={t("form.yes")} />
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">{t("form.isLateNight")}</legend>
          <RadioPair name="isLateNight" no={t("form.no")} yes={t("form.yes")} />
        </fieldset>

        <label className="block space-y-2">
          <span className="text-sm font-semibold">{t("form.priceRange")}</span>
          <select
            className="w-full rounded-md border border-border bg-bg px-3 py-2"
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
    </main>
  );
}

function RadioPair({ name, no, yes }: { name: string; no: string; yes: string }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
        <input name={name} required type="radio" value="true" />
        <span>{yes}</span>
      </label>
      <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
        <input name={name} required type="radio" value="false" />
        <span>{no}</span>
      </label>
    </div>
  );
}
