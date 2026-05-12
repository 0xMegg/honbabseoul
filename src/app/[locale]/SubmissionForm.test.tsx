import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SubmissionForm } from "./SubmissionForm";
import { EMPTY_PRESERVED_FORM_VALUES, type PreservedFormValues } from "./submission-flash";

const labels = {
  hasJpMenu: "日本語メニュー",
  isLateNight: "深夜営業",
  isSolo: "一人利用しやすい",
  name: "店名",
  naverUrl: "Naver Map URL",
  no: "いいえ",
  photo: "写真",
  photoHint: "JPEG/PNG, 2MBまで",
  photoInvalid: "JPEG/PNG only",
  photoTooLarge: "2MBまで",
  priceHigh: "高め",
  priceLow: "安め",
  priceMid: "普通",
  priceRange: "価格帯",
  priceUnknown: "不明",
  reason: "おすすめ理由",
  submit: "投稿する",
  yes: "はい",
};

function renderForm(
  preservedValues: PreservedFormValues = EMPTY_PRESERVED_FORM_VALUES,
  action = vi.fn(),
) {
  return render(
    <SubmissionForm action={action} labels={labels} preservedValues={preservedValues} />,
  );
}

describe("SubmissionForm", () => {
  it("keeps the submit button disabled until required fields are complete", () => {
    renderForm();

    const submit = screen.getByRole("button", { name: labels.submit });
    expect(submit).toBeDisabled();

    fireEvent.input(screen.getByLabelText(labels.name), {
      target: { value: "弘大ひとり食堂" },
    });
    fireEvent.input(screen.getByLabelText(labels.naverUrl), {
      target: { value: "https://naver.me/example" },
    });
    fireEvent.input(screen.getByLabelText(labels.reason), {
      target: { value: "カウンター席がある" },
    });
    fireEvent.click(screen.getAllByLabelText(labels.yes)[0]!);
    fireEvent.click(screen.getAllByLabelText(labels.no)[1]!);
    fireEvent.click(screen.getAllByLabelText(labels.yes)[2]!);

    expect(submit).toBeEnabled();
  });

  it("enables submit immediately when preserved required values are complete", () => {
    renderForm({
      hasJpMenu: "false",
      isLateNight: "true",
      isSolo: "true",
      name: "弘大ひとり食堂",
      naverUrl: "https://naver.me/example",
      priceRange: "mid",
      reason: "カウンター席がある",
    });

    expect(screen.getByRole("button", { name: labels.submit })).toBeEnabled();
    expect(screen.getByLabelText(labels.name)).toHaveValue("弘大ひとり食堂");
    expect(screen.getByLabelText(labels.naverUrl)).toHaveValue("https://naver.me/example");
    expect(screen.getByLabelText(labels.reason)).toHaveValue("カウンター席がある");
    expect(screen.getAllByLabelText(labels.yes)[0]).toBeChecked();
    expect(screen.getAllByLabelText(labels.no)[1]).toBeChecked();
    expect(screen.getAllByLabelText(labels.yes)[2]).toBeChecked();
  });

  it("disables submit immediately after the form starts submitting", () => {
    const action = vi.fn();
    renderForm(
      {
        hasJpMenu: "false",
        isLateNight: "true",
        isSolo: "true",
        name: "弘大ひとり食堂",
        naverUrl: "https://naver.me/example",
        priceRange: "mid",
        reason: "カウンター席がある",
      },
      action,
    );

    const submit = screen.getByRole("button", { name: labels.submit });
    expect(submit).toBeEnabled();

    fireEvent.submit(submit.closest("form")!);

    expect(submit).toBeDisabled();
    expect(submit).toHaveAttribute("aria-busy", "true");
  });

  it("keeps submit disabled when the selected photo is too large or unsupported", () => {
    renderForm({
      hasJpMenu: "false",
      isLateNight: "true",
      isSolo: "true",
      name: "弘大ひとり食堂",
      naverUrl: "https://naver.me/example",
      priceRange: "mid",
      reason: "カウンター席がある",
    });

    const submit = screen.getByRole("button", { name: labels.submit });
    const photo = document.querySelector('input[name="photo"]');
    expect(photo).toBeInstanceOf(HTMLInputElement);
    expect(submit).toBeEnabled();

    fireEvent.change(photo!, {
      target: {
        files: [new File([new Uint8Array(2 * 1024 * 1024 + 1)], "large.png", { type: "image/png" })],
      },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(labels.photoTooLarge);
    expect(submit).toBeDisabled();

    fireEvent.change(photo!, {
      target: {
        files: [new File([new Uint8Array([1])], "photo.gif", { type: "image/gif" })],
      },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(labels.photoInvalid);
    expect(submit).toBeDisabled();

    fireEvent.change(photo!, {
      target: {
        files: [new File([new Uint8Array([1])], "photo.png", { type: "image/png" })],
      },
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(submit).toBeEnabled();
  });
});
