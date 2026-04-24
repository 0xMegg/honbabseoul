# About This Project

## Project Name
honbabseoul (ホンバプソウル)

## What It Does
눈치 보지 않고 1인 식사가 가능한 서울 식당을 큐레이션해 지도로 제공하는 모바일 웹 서비스. 타겟은 한국을 방문하는 일본인 2030 여성 혼자 여행객이고, UI는 일본어 기본(next-intl로 한국어 병존 — 운영·기획 검수용). 핵심 기능은 (1) 네이버 지도 기반 핀+필터 UI, (2) 핀 클릭 시 바텀시트 상세 (일문/국문 병기 + 네이버 지도 웹 링크), (3) 유저 제보 UGC — Pending 상태로 저장되고 관리자가 Supabase 대시보드에서 approved 처리해야 라이브에 노출.

## Tech Stack
- Frontend: Next.js 15 (App Router), React 19, TypeScript strict, Tailwind CSS + semantic CSS variable tokens (--hb-*), next-intl
- Backend: None dedicated — Next.js Route Handlers + Server Actions over Supabase
- Database: Supabase (Postgres + RLS + Storage + Auth)
- Hosting: Vercel

## Key Directories
- `src/` — source code (app router under `src/app/[locale]`, features in `src/lib/features`, repositories in `src/lib/repositories`); Vitest tests co-located as `*.test.ts(x)`
- `e2e/` — Playwright end-to-end specs (`*.spec.ts`)
- Config: project root (`next.config.*`, `tsconfig.json`, `tailwind.config.*`, `vitest.config.ts`, `playwright.config.ts`, `messages/ja.json`, `messages/ko.json`)

## Current State
- [x] MVP / Prototype (harness just initialised, code not scaffolded yet)
- [ ] Active development
- [ ] Production / Maintenance

## Who Uses It
한국 방문 일본인 2030 여성 나홀로 여행객. 모바일 웹 중심 접속. UI 언어는 일본어 기본, 개발·기획 검수용 한국어 로케일 병존.

## Important Context
- UI 로케일: `ja` 기본 + `ko` 병존. 운영진이 일본어를 못 읽는 현실 제약 → next-intl로 양쪽 메시지 파일(`messages/ja.json`, `messages/ko.json`) 동시 유지. URL은 `/[locale]/...`.
- 로고는 한글 '혼밥서울'이 메인 그래픽이고 카타카나 서브 카피 `ホンバプソウル`가 보조. 폰트/레이아웃 고정 — locale 분기 없이 동일 SVG 사용.
- Mobile-first. 360–414px 우선 설계, 데스크톱은 `md:` 이상에서 점진 확대.
- 네이버 지도 외부 이동은 **앱 설치 유도 X, 웹 브라우저로 열림** — `map.naver.com/...` 웹 URL만 사용, intent 스킴 금지.
- UGC 제보는 반드시 `status='pending'`으로만 insert, 공개 조회는 `status='approved'` 필터. RLS 정책과 애플리케이션 쿼리 양쪽에서 이중 방어.
- 디자인 시스템: `--hb-*` CSS 변수 prefix + `:root[data-theme]` 구조로 시작 (현재 테마 1개, 확장 여지 유지). 참조 패턴: `/Users/mero/Dev/13.claude/workouts/kody-workspace/docs/design-system-pattern.md`.
- Naver Maps SDK는 SSR 비호환 — 반드시 `dynamic(() => import(...), { ssr: false })`로 로드.
- Supabase service-role 키는 서버 전용 (Route Handlers / Server Actions). 클라이언트 번들에 절대 노출 금지.
