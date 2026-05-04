import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Header } from "./Header";

describe("Header", () => {
  it("renders the bilingual logo and localized heading copy", () => {
    render(
      <Header
        description="一人でも入りやすいソウルのお店"
        eyebrow="ホンバプソウル"
        title="혼밥서울へようこそ"
      />,
    );

    expect(screen.getByRole("img", { name: /혼밥서울.*ホンバプソウル/ })).toBeVisible();
    expect(screen.getAllByText("ホンバプソウル").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("혼밥서울へようこそ");
    expect(screen.getByText("一人でも入りやすいソウルのお店")).toBeVisible();
  });
});
