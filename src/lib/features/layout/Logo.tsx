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
import { useId } from "react";

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
  const titleId = useId();
  return (
    <svg
      role="img"
      aria-labelledby={titleId}
      viewBox="0 0 200 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...rest}
    >
      <title id={titleId}>혼밥서울 (ホンバプソウル)</title>
      <g fill={fill} transform="translate(48.1 39) scale(0.03 -0.03)">
        <path d="M697 469C697 550 602 593 433 593C264 593 170 550 170 469C170 394 249 352 393 345V280H38V217H827V280H469V345C615 351 697 394 697 469ZM740 -44V19H217V171H141V-44ZM778 628V690H87V628ZM618 468C618 423 540 405 433 405C327 405 249 423 249 468C249 515 327 532 433 532C540 532 618 515 618 468ZM586 734V797H285V734Z" />
        <path
          d="M843 530V594H710V804H634V327H710V530ZM710 -58V282H634V177H236V280H160V-58ZM634 4H236V115H634ZM475 354V754H399V618H144V754H68V354ZM399 417H144V555H399Z"
          transform="translate(865)"
        />
        <path
          d="M755 -70V804H679V492H475V428H679V-70ZM561 197C441 267 337 409 337 569V728H258V566C258 411 157 256 30 176L80 119C181 192 267 300 298 409C333 304 434 193 514 139Z"
          transform="translate(1730)"
        />
        <path
          d="M760 -62V0H206V87H732V281H469V370H827V433H38V370H393V281H128V220H656V144H130V-62ZM744 639C744 736 627 793 433 793C242 793 123 736 123 639C123 542 242 486 433 486C627 486 744 542 744 639ZM433 730C574 730 666 695 666 639C666 584 574 550 433 550C293 550 202 584 202 639C202 695 293 730 433 730Z"
          transform="translate(2595)"
        />
      </g>
      <g fill={fill} opacity={0.72} transform="translate(65 56) scale(0.01 -0.01)">
        <path d="M454 637H218C161 637 132 639 97 644V554C134 558 160 559 217 559H454V70C454 14 453 -14 448 -43H546C542 -12 541 10 541 70V559H784C842 559 865 558 905 554V644C870 639 842 637 782 637H541V699C541 753 542 775 546 804H448C453 778 454 753 454 701ZM236 473C232 433 222 396 202 340C163 229 122 159 57 89C94 73 106 66 138 40C224 151 275 259 316 421C320 436 321 438 325 449ZM669 450C674 439 675 437 680 421C684 410 687 402 688 397C698 368 701 359 709 335C756 209 795 134 862 38C893 65 905 72 940 91C875 169 834 242 789 359C768 413 759 441 752 472Z" />
        <path
          d="M146 650C235 597 315 532 390 452L451 527C378 598 316 646 205 717ZM161 -3C183 4 191 6 223 13C384 49 496 93 598 163C732 254 825 370 907 548C872 571 861 582 833 617C751 402 619 257 428 172C335 131 215 100 135 97Z"
          transform="translate(1000)"
        />
        <path
          d="M295 734C294 622 264 475 220 360C172 234 122 154 41 75C76 55 86 47 119 13C262 170 338 354 381 645C388 695 390 703 394 716ZM594 713C598 697 601 682 607 645C626 516 662 386 709 278C758 167 809 85 877 9C906 42 917 52 952 75C847 180 776 313 726 493C702 581 684 678 681 731ZM721 776C762 730 794 680 825 618L884 651C849 716 826 750 779 806ZM837 830C881 778 911 733 940 675L998 708C962 774 940 805 893 860Z"
          transform="translate(2000)"
        />
        <path
          d="M252 706C190 706 168 707 128 713V618C163 622 192 624 250 624H744C689 409 593 266 432 159C357 109 298 82 208 54C240 23 249 9 268 -29C405 26 492 78 584 163C705 275 782 408 834 599L840 620C850 617 862 615 873 615C936 615 987 666 987 729C987 792 936 843 873 843C810 843 759 792 759 729C759 721 760 713 761 706ZM873 799C911 799 943 767 943 729C943 691 911 659 873 659C835 659 803 691 803 729C803 767 835 799 873 799Z"
          transform="translate(3000)"
        />
        <path
          d="M140 698C194 609 240 500 270 384L360 420C317 558 290 619 226 730ZM751 734C749 704 747 687 739 650C699 465 629 321 528 213C452 132 375 78 261 29C291 4 301 -7 325 -46C438 10 521 71 598 155C704 271 783 430 825 613C841 684 841 685 851 709Z"
          transform="translate(4000)"
        />
        <path
          d="M541 644V731C541 762 543 787 547 807H446C450 783 451 767 451 730V644H243C198 644 177 645 147 648C149 623 150 598 150 563V435C150 399 149 372 146 348H243C241 369 240 399 240 433V566H770C750 367 677 235 536 141C470 97 412 72 317 48C348 14 356 2 372 -35C657 61 811 230 854 498C868 589 868 589 877 606L831 651C812 644 806 644 743 644Z"
          transform="translate(5000)"
        />
        <path
          d="M260 767C263 743 263 737 263 688C263 483 250 355 219 267C186 173 135 102 54 38C89 15 100 4 126 -29C215 57 264 128 298 223C335 324 343 397 351 674C353 736 353 737 357 762ZM512 775C516 755 517 732 517 693C517 686 517 679 517 671L511 105C511 58 510 45 504 26L551 -26C560 -21 563 -20 575 -15C585 -11 595 -7 607 -3C665 20 705 40 748 69C837 129 903 213 954 331C922 358 912 368 888 400C864 324 828 261 775 205C726 152 678 121 599 89L604 670C605 729 606 745 611 774Z"
          transform="translate(6000)"
        />
      </g>
    </svg>
  );
}
