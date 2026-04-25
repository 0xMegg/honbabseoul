/**
 * honbabseoul logo — fixed bilingual mark.
 *
 * Per spec §2 the brand is `혼밥서울` (Hangul main) plus a small カタカナ
 * `ホンバプソウル` subcopy, rendered as a SINGLE SVG that is identical
 * across both `ja` and `ko` locales. Do NOT swap by locale.
 *
 * Token discipline: all colors come from `--hb-*` CSS variables. No hex
 * literals here — Tailwind utilities resolve through the @theme inline
 * aliases set up in `src/app/globals.css` (Slice 2). Defaults to the
 * primary text token; pass `tone="invert"` for dark hero placements.
 *
 * Sizing: width is fluid via Tailwind utilities at the call site
 * (e.g. `<Logo className="h-8 w-auto" />`). The internal viewBox is
 * 200×64 so consumers can apply `h-*` and let `w-auto` track aspect.
 *
 * Accessibility: the `<title>` is `혼밥서울 (ホンバプソウル)` — both
 * scripts so VoiceOver reads it correctly regardless of system locale.
 */

import type { SVGProps } from "react";

type LogoProps = SVGProps<SVGSVGElement> & {
  /** Primary fill source. `default` uses `--hb-text`, `brand` uses `--hb-brand`, `invert` uses `--hb-text-invert`. */
  tone?: "default" | "brand" | "invert";
};

const TONE_FILL: Record<NonNullable<LogoProps["tone"]>, string> = {
  default: "var(--hb-text)",
  brand: "var(--hb-brand)",
  invert: "var(--hb-text-invert)",
};

export function Logo({ tone = "default", className, ...rest }: LogoProps) {
  const fill = TONE_FILL[tone];
  return (
    <svg
      role="img"
      aria-labelledby="hb-logo-title"
      viewBox="0 0 200 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...rest}
    >
      <title id="hb-logo-title">혼밥서울 (ホンバプソウル)</title>
      <text
        x="100"
        y="38"
        textAnchor="middle"
        fontFamily="'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', system-ui, sans-serif"
        fontWeight={800}
        fontSize={28}
        letterSpacing="0.02em"
        fill={fill}
      >
        혼밥서울
      </text>
      <text
        x="100"
        y="55"
        textAnchor="middle"
        fontFamily="'Hiragino Sans', 'Yu Gothic', 'Noto Sans JP', system-ui, sans-serif"
        fontWeight={500}
        fontSize={10}
        letterSpacing="0.18em"
        opacity={0.72}
        fill={fill}
      >
        ホンバプソウル
      </text>
    </svg>
  );
}
