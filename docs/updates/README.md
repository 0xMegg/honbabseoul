# Harness Updates

forge 의 src/ 변경을 다운스트림 관점에서 정리한 changelog. 각 파일은 "다운스트림이 이 업데이트를 받으면 무엇이 바뀌는가" 를 기술한다.

## 목적

- 다운스트림이 `upgrade-harness.sh` 실행 전 영향 범위를 파악할 수 있게 함
- Phase 2 의 auto-apply 로직이 "무엇을 적용하는지" 사용자에게 요약 출력할 때 데이터 소스
- 과거 업그레이드 추적 (언제 어떤 blocker fix 가 내려갔는지)

## 언제 작성하나

**필수**: forge 의 `src/` 하위 파일을 수정한 커밋 (managed/seed 영역 불문)

**생략**: forge-only 문서 (`handoff/`, `docs/downstream-feedback/`, `docs/blog/`, `context/` 등) 만 수정한 커밋

판단 기준: 해당 커밋이 `build-template.sh` 결과물에 변화를 일으키는가. 일으키면 update doc 필수.

## 파일명

`docs/updates/<forge-hash>.md` — hash 는 해당 change set 의 **tip commit short hash**.

여러 커밋이 하나의 논리적 변경(예: Option Y 재구성의 A1/A2/A3) 을 이룰 때는 마지막 커밋의 hash 를 쓰고, 본문에 3개 커밋 해시를 전부 나열한다.

## 템플릿

```markdown
---
hash: <forge-short-hash>
date: YYYY-MM-DD
severity: P0 | P1 | P2
type: fix | feat | refactor | chore
breaking: true | false
---

# [<severity>] <type>: <짧은 제목>

## Summary
1-2 문장으로 무엇이 바뀌고 왜 중요한지.

## Commits
- `<hash1>` <subject>
- `<hash2>` <subject>
(single-commit change 면 1개)

## Changes
- `path/to/file` — 변경 내용 한 줄 요약
- ...

## Manifest classification
- `[managed]` 자동 덮어써지는 파일
- `[seed]` 기존에 없으면 설치, 있으면 skip

## Why
근본 원인 / 동기 / 참조 피드백 문서.

## Downstream impact
- 영향 받는 프로젝트 유형 (예: "zsh 환경", "멀티라인 TASK 쓰는 모든 프로젝트")
- 적용 후 기대 동작 차이
- 로컬 커스텀과의 충돌 가능성 (있으면 대처 방법)

## Verification
다운스트림이 apply 후 확인할 명령/단계.

## Related
- 피드백 문서 경로
- 관련 이전 update 링크
```

## Severity 기준

- **P0** — 다음 작업 전 반드시 반영 필요. 블로커, 재현 가능한 exit/crash, 보안 이슈
- **P1** — 중요 개선. 방치 시 기능 저하, 버그 가능성. 가까운 시일 내 적용 권장
- **P2** — minor / nice-to-have. 편의성, 문서, 관례 변경

Phase 2 auto-apply 는 severity 와 무관하게 모두 apply 하지만, severity 는 사용자가 release notes 를 훑을 때 우선순위 판단용.

## INDEX.md

`docs/updates/INDEX.md` 가 연대기 테이블. 새 update 작성 시 INDEX 상단에 한 줄 추가.

## 소급 적용 (retroactive)

이 시스템 도입(2026-04-23) 이전 변경 중 의미 있는 것은 소급 작성. INDEX 의 "Retroactive" 섹션에 묶음. 이후 변경은 커밋과 함께 생성.

## Phase 2 연결

auto-apply 구현 시 `run-task.sh` / `run-epic.sh` 의 `check_harness_version()` 이:
1. local `.harness-version` 과 template HEAD 비교
2. 그 사이 발생한 forge 커밋 목록 얻기
3. 각 커밋에 대응하는 `docs/updates/<hash>.md` 중 존재하는 것 요약 출력
4. `upgrade-harness.sh --apply` 자동 호출
5. 적용 결과 배너

update doc 이 없으면 "변경 요약 없음" 으로 표시하지만 apply 는 그대로 진행.
