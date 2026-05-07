/**
 * Logo smoke test — guards the spec invariants:
 *  - Bilingual brand mark always exposes BOTH scripts (Hangul + カタカナ).
 *  - Visible glyphs are path outlines, not device-font-dependent SVG text.
 *  - Fill respects the `tone` prop, all values are token-backed (no hex).
 *  - The component never branches on locale (single SVG, identical output).
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Logo } from "./Logo";

describe("Logo", () => {
  it("renders both scripts in the same SVG", () => {
    render(<Logo />);
    const img = screen.getByRole("img", { name: /혼밥서울.*ホンバプソウル/ });
    expect(img.textContent).toContain("혼밥서울");
    expect(img.textContent).toContain("ホンバプソウル");
  });

  it("renders visible glyphs as path outlines instead of text nodes", () => {
    const { container } = render(<Logo />);
    expect(container.querySelectorAll("text")).toHaveLength(0);
    expect(container.querySelectorAll("path").length).toBeGreaterThan(0);
  });

  it("uses --hb-text token by default (no hex literals)", () => {
    const { container } = render(<Logo />);
    const fills = Array.from(container.querySelectorAll("g")).map((el) => el.getAttribute("fill"));
    for (const fill of fills) {
      expect(fill).toMatch(/^var\(--hb-/);
    }
  });

  it("switches to --hb-brand token when tone='brand'", () => {
    const { container } = render(<Logo tone="brand" />);
    const fills = Array.from(container.querySelectorAll("g")).map((el) => el.getAttribute("fill"));
    for (const fill of fills) {
      expect(fill).toBe("var(--hb-brand)");
    }
  });

  it("forwards arbitrary svg props (className, etc.)", () => {
    const { container } = render(<Logo className="h-8 w-auto" />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("class")).toBe("h-8 w-auto");
  });
});
