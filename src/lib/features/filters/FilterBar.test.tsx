import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FilterBar } from "./FilterBar";

const replace = vi.fn();
let currentSearchParams = "";

vi.mock("next/navigation", () => ({
  usePathname: () => "/ja",
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(currentSearchParams),
}));

const labels = {
  solo: "一人食いOK",
  jp: "日本語メニューあり",
  late: "深夜営業",
};

describe("FilterBar", () => {
  beforeEach(() => {
    replace.mockClear();
    currentSearchParams = "";
  });

  it("renders the default active state", () => {
    render(<FilterBar labels={labels} />);

    expect(screen.getByRole("button", { name: labels.solo })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: labels.jp })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: labels.late })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("updates the URL query when a chip is toggled", async () => {
    render(<FilterBar labels={labels} />);

    fireEvent.click(screen.getByRole("button", { name: labels.jp }));

    expect(replace).toHaveBeenCalledWith("/ja?solo=1&jp=1&late=0", {
      scroll: false,
    });
  });

  it("preserves existing non-filter query params", async () => {
    currentSearchParams = "submission=success&solo=0&jp=1&late=0";
    render(<FilterBar labels={labels} />);

    fireEvent.click(screen.getByRole("button", { name: labels.late }));

    expect(replace).toHaveBeenCalledWith(
      "/ja?submission=success&solo=0&jp=1&late=1",
      { scroll: false },
    );
  });
});
