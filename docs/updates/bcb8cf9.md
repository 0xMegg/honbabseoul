---
hash: bcb8cf9
date: 2026-04-25
severity: P0
type: fix
breaking: false
---

# [P0] fix: bash3 compat + develop-noop guard + install-before-import rule

## Summary
honbabseoul Epic 1 (2026-04-25) Stage 2 overnight 회고에서 식별된 forge-side 결함 3건 수정. macOS 기본 bash 3.2 에서 `/epic` parallel-stage monitor 가 abort 하던 문제, `/develop` 이 silent 0 종료로 산출물 없이 끝나는 경우 reviewer 세션이 낭비되던 문제, 신규 import 시 lockfile 동기화 누락 PR 이 반복되던 문제를 함께 처리.

## Commits
- `bcb8cf9` fix: bash3 compat + develop-noop guard + install-before-import rule

## Changes
- `src/scripts/run-epic.sh` — parallel-stage monitor 의 `declare -A _pid_done` / `_pid_rc` 를 index-aligned 일반 배열로 교체. macOS bash 3.2 (`declare -A` 미지원) 에서 함수 진입 즉시 abort 하던 동작 해소.
- `src/scripts/run-task.sh` — `/develop` 직전·직후로 `git status --porcelain` + `git rev-parse HEAD` snapshot 캡처. identical 이면 `VERDICT=DEVELOP_NOOP` 로 즉시 fail (reviewer 진입 차단).
- `src/templates/role-developer.md` — "Follow-up Call-Sites" 와 동일 위계로 "Install Before Import (dependency hygiene)" 섹션 추가. 신규 import 시 매칭 dependency 가 lockfile 에 함께 들어가야 함을 명시.

## Manifest classification
- `[managed]` `scripts/run-epic.sh`
- `[managed]` `scripts/run-task.sh`
- `[managed]` `templates/role-developer.md`

## Why
honbabseoul Epic 1 의 6 slices / 4 stages overnight 실행이 Stage 2 에서 멈춘 회고. 3개 root cause:

1. **bash3 abort** — Darwin 기본 bash 3.2 인 환경 (macOS) 에서 connective array (`declare -A`) 사용 시 monitor 함수 진입 자체가 실패. CI 가 아닌 로컬 macOS 다운스트림 (honbabseoul, kody 등) 에서 `/epic` 자체가 동작 안 함.
2. **silent no-op** — Developer 세션이 0 으로 종료했지만 워킹트리·HEAD 변화 0건인 케이스 발생. 기존 로직은 exit code 만 보고 "성공" 처리 → reviewer 가 빈 변경에 대해 review 하느라 사이클 낭비.
3. **install-before-import 누락** — 패치 PR 들에서 `import 'foo'` 만 있고 `package.json` / lockfile 에 `foo` 가 없는 패턴 반복. role-developer.md 에 명시 규칙 부재가 원인.

원본 회고·diff: honbabseoul `docs/forge-feedback/2026-04-25-bash3-noop-install.md` (227줄), `docs/forge-feedback/2026-04-25-patch.diff` (109줄).

## Downstream impact

### 영향 받는 환경
- **모든 macOS 다운스트림** — bash3 fix 는 `/epic` 동작의 전제 조건. 이 패치 없으면 epic 진입 자체 불가능. P0 분류 이유.
- **모든 다운스트림** — develop-noop guard 와 install-before-import 룰은 OS 무관.

### 적용 후 동작 차이
- `/epic` 의 parallel-stage monitor 가 macOS 에서도 정상 진입.
- Developer 가 산출물 없이 종료하면 `VERDICT=DEVELOP_NOOP` 으로 task 실패 → reviewer skip → handoff 에 명시. 이전과 달리 빈 review 사이클이 사라짐.
- Developer prompt 에 install-before-import 규칙이 들어가므로 신규 import task 의 lockfile 동기화 누락 빈도 감소.

### 의도적 미해결
- DEVELOP_NOOP 시 자동 retry 비활성. 구조적 실패라 재시도 무의미.
- multi-repo workspace 의 noop guard 확장은 follow-up (현재 `PROJECT_DIR` 만 검사).
- doc-only / refactor-only slice false positive 무시 (모든 harness slice 는 최소 handoff 갱신 동반 가정).
- "병렬 spawn 자식이 silent 0 종료" 의 더 깊은 root cause 는 본 patch 가 증상만 차단. 다음 발생 시 honbabseoul `/tmp/honbabseoul-run/1-20260425-133941/task-slice-3/` 로그와 함께 추적.

## Verification
다운스트림에서:
```bash
# 1) 자동 적용 (다음 /task 또는 /epic 진입 시 자동 호출됨)
# 또는 수동:
bash scripts/upgrade-harness.sh --apply

# 2) bash3 호환 확인 (macOS)
/bin/bash -n scripts/run-epic.sh
grep -n "declare -A" scripts/run-epic.sh
#    → 1건만 잡혀야 함 (line 1124, 주석. 실제 statement 0건)

# 3) noop guard 확인
grep -n "VERDICT=DEVELOP_NOOP" scripts/run-task.sh
#    → 1건

# 4) install-before-import 룰 확인
grep -n "^## Install Before Import" templates/role-developer.md
#    → 1건
```

## Related
- 원본 피드백: honbabseoul `docs/forge-feedback/2026-04-25-bash3-noop-install.md`
- 원본 patch diff: honbabseoul `docs/forge-feedback/2026-04-25-patch.diff`
- 직전 update: `docs/updates/4d02f86.md` (auto-apply Phase 2)
