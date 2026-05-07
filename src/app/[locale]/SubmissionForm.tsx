"use client";

import { useMemo, useState } from "react";
import type { PreservedFormValues } from "./submission-flash";

type SubmissionFormLabels = {
  hasJpMenu: string;
  isLateNight: string;
  isSolo: string;
  name: string;
  naverUrl: string;
  no: string;
  photo: string;
  photoHint: string;
  priceHigh: string;
  priceLow: string;
  priceMid: string;
  priceRange: string;
  priceUnknown: string;
  reason: string;
  submit: string;
  yes: string;
};

type SubmissionFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  labels: SubmissionFormLabels;
  preservedValues: PreservedFormValues;
};

type RequiredValues = Pick<
  PreservedFormValues,
  "hasJpMenu" | "isLateNight" | "isSolo" | "name" | "naverUrl" | "reason"
>;

export function SubmissionForm({ action, labels, preservedValues }: SubmissionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requiredValues, setRequiredValues] = useState<RequiredValues>({
    hasJpMenu: preservedValues.hasJpMenu,
    isLateNight: preservedValues.isLateNight,
    isSolo: preservedValues.isSolo,
    name: preservedValues.name,
    naverUrl: preservedValues.naverUrl,
    reason: preservedValues.reason,
  });
  const canSubmit = useMemo(
    () =>
      requiredValues.name.trim().length > 0 &&
      requiredValues.naverUrl.trim().length > 0 &&
      requiredValues.reason.trim().length > 0 &&
      requiredValues.isSolo !== "" &&
      requiredValues.hasJpMenu !== "" &&
      requiredValues.isLateNight !== "",
    [requiredValues],
  );
  const isSubmitDisabled = !canSubmit || isSubmitting;

  function setRequiredValue(key: keyof RequiredValues, value: string) {
    setRequiredValues((current) => ({ ...current, [key]: value }));
  }

  return (
    <form action={action} className="space-y-5" onSubmit={() => setIsSubmitting(true)}>
      <label className="block space-y-2">
        <span className="text-sm font-semibold">{labels.name}</span>
        <input
          className="w-full rounded-md border border-border bg-bg px-3 py-2"
          defaultValue={preservedValues.name}
          maxLength={120}
          name="name"
          onInput={(event) => setRequiredValue("name", event.currentTarget.value)}
          required
          type="text"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-semibold">{labels.naverUrl}</span>
        <input
          className="w-full rounded-md border border-border bg-bg px-3 py-2"
          defaultValue={preservedValues.naverUrl}
          name="naverUrl"
          onInput={(event) => setRequiredValue("naverUrl", event.currentTarget.value)}
          required
          type="url"
        />
      </label>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">{labels.isSolo}</legend>
        <RadioPair
          name="isSolo"
          no={labels.no}
          onChange={(value) => setRequiredValue("isSolo", value)}
          value={preservedValues.isSolo}
          yes={labels.yes}
        />
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">{labels.hasJpMenu}</legend>
        <RadioPair
          name="hasJpMenu"
          no={labels.no}
          onChange={(value) => setRequiredValue("hasJpMenu", value)}
          value={preservedValues.hasJpMenu}
          yes={labels.yes}
        />
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">{labels.isLateNight}</legend>
        <RadioPair
          name="isLateNight"
          no={labels.no}
          onChange={(value) => setRequiredValue("isLateNight", value)}
          value={preservedValues.isLateNight}
          yes={labels.yes}
        />
      </fieldset>

      <label className="block space-y-2">
        <span className="text-sm font-semibold">{labels.priceRange}</span>
        <select
          className="w-full rounded-md border border-border bg-bg px-3 py-2"
          defaultValue={preservedValues.priceRange}
          name="priceRange"
        >
          <option value="">{labels.priceUnknown}</option>
          <option value="low">{labels.priceLow}</option>
          <option value="mid">{labels.priceMid}</option>
          <option value="high">{labels.priceHigh}</option>
        </select>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-semibold">{labels.reason}</span>
        <textarea
          className="min-h-28 w-full rounded-md border border-border bg-bg px-3 py-2"
          defaultValue={preservedValues.reason}
          maxLength={500}
          name="reason"
          onInput={(event) => setRequiredValue("reason", event.currentTarget.value)}
          required
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-semibold">{labels.photo}</span>
        <input
          accept="image/jpeg,image/png"
          className="w-full rounded-md border border-border bg-bg px-3 py-2"
          name="photo"
          type="file"
        />
        <span className="block text-xs text-text-muted">{labels.photoHint}</span>
      </label>

      <button
        className="w-full rounded-md bg-brand px-4 py-3 font-semibold text-text-invert transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
        aria-busy={isSubmitting}
        disabled={isSubmitDisabled}
        type="submit"
      >
        {labels.submit}
      </button>
    </form>
  );
}

function RadioPair({
  name,
  no,
  onChange,
  value,
  yes,
}: {
  name: string;
  no: string;
  onChange: (value: string) => void;
  value: string;
  yes: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
        <input
          defaultChecked={value === "true"}
          name={name}
          onChange={(event) => onChange(event.currentTarget.value)}
          required
          type="radio"
          value="true"
        />
        <span>{yes}</span>
      </label>
      <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
        <input
          defaultChecked={value === "false"}
          name={name}
          onChange={(event) => onChange(event.currentTarget.value)}
          required
          type="radio"
          value="false"
        />
        <span>{no}</span>
      </label>
    </div>
  );
}
