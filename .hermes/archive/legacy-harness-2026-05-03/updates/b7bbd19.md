---
hash: b7bbd19
date: 2026-04-23
severity: P0
type: fix
breaking: false
---

# [P0] fix: color var hoist in run-task.sh / run-epic.sh

## Summary
`check_harness_version()` 이 색상 변수 (${CYAN}/${YELLOW}/${GREEN}) 를 참조하는데, 색상 변수 정의가 함수 정의보다 **아래에** 있어서 `set -euo pipefail` 조합에서 unbound variable 로 exit 1. 새 다운스트림 첫 `/task` 실행 자체를 막던 blocker.

## Commits
- `b7bbd19` fix: kody P0-5 — color var hoist (run-task.sh + run-epic.sh)

## Changes
- `src/scripts/run-task.sh` — 색상 변수 블록을 `set -euo pipefail` 바로 아래로 hoist. 중간의 중복 블록 제거. "Do not move below function definitions" 주석 추가
- `src/scripts/run-epic.sh` — 동일 조치 (bash 버전 체크 앞)

## Manifest classification
- `[managed]` `.claude/scripts/run-task.sh`
- `[managed]` `.claude/scripts/run-epic.sh`

## Why
kody Epic 7 피드백 E9/P0-5. `bash -euo pipefail scripts/run-task.sh --dry-run "smoke"` → `line 95: YELLOW: unbound variable`. 모든 strict-mode bash 환경에서 재현.

피드백 원문: `docs/downstream-feedback/kody-2026-04-23.md` §E9 / §P0-5.

## Downstream impact
- 영향 대상: `set -u` 환경을 쓰는 모든 다운스트림 (= 기본값)
- 적용 후: 새 프로젝트에서 첫 `/task` 실행 시 color var unbound 에러 사라짐
- 기존 downstream 이 로컬 patch 로 우회 중이었다면 (예: kody) apply 후 patch 제거 가능 — 내용 동일

## Verification
```bash
bash -n scripts/run-task.sh && bash -n scripts/run-epic.sh
bash -euo pipefail scripts/run-task.sh --dry-run "smoke"
# → unbound error 없이 PLAN phase 진입
```

## Related
- 피드백: `docs/downstream-feedback/kody-2026-04-23.md`
- forge handoff: PM-4
