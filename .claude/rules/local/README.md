# Local Rules — Project-Owned Knowledge

이 디렉토리는 프로젝트 고유의 학습/규칙을 쌓는 곳입니다.
`upgrade-harness.sh` 가 **절대 덮어쓰지 않습니다** (manifest `[seed]` 분류).

## 언제 여기에 파일을 만드나

- 우리 프로젝트에서만 통용되는 gotcha, convention, styling 규칙
- Epic/Task 수행 중 발견한 프로젝트-specific 교훈
- 특정 도메인/스택 고유의 제약 (예: 디자인 시스템 토큰, 외부 API 특이사항)

**주의**: 모든 프로젝트에 공통되는 일반 원칙이라면 여기가 아니라
`../base/*.md` (harness template 소유) 에 PR 올리는 쪽이 맞습니다.

## 파일 네이밍

`<topic>-<project>.md` 형태 권장. topic 은 base/ 의 파일명과 짝지어 쓰면
Claude 가 연관시키기 쉽습니다.

예시:
- `gotchas-kody.md` — kody OMS 프로젝트의 pitfall 누적
- `frontend-kody.md` — kody 의 3-variant 디자인 시스템 styling 규칙
- `testing-divebase.md` — Flutter 특화 테스팅 convention

## Claude 로드 동작

`CLAUDE.md` "Rules (auto-applied)" 섹션이 `base/*.md` 와 `local/*.md` 를
모두 로드하도록 지시합니다. 새 파일을 만들면 별도 설정 없이 다음 세션부터
바로 반영됩니다.

## 파일 크기

`post-edit-size-check.sh` 의 50줄 상한이 `base/`, `local/` 양쪽에 동일
적용됩니다. 50줄 초과하면 주제별로 파일 분할 권장.
