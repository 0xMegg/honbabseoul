---
hash: 8f2cea7
date: 2026-04-23
severity: P2
type: docs
breaking: false
---

# [P2] docs: harness updates changelog system

## Summary
forge src/ 변경을 다운스트림 관점에서 정리한 changelog (`docs/updates/`) 시스템 구축. Phase 2 auto-apply 가 "무엇을 적용하는지" 요약 출력 시 사용할 데이터 소스.

## Commits
- `8f2cea7` docs: harness updates changelog system — README + INDEX + retroactive (Phase 1)

## Changes
- `src/docs/updates/README.md` (신규) — 시스템 설명, 템플릿, severity, 작성 convention
- `src/docs/updates/INDEX.md` (신규) — 연대기 테이블
- `src/docs/updates/{b7bbd19,2a2a51a,5fdf9ff,657575d}.md` (신규) — 소급 4건
- `src/.harness-manifest` — `docs/updates/**` `[managed]` 등록

## Manifest classification
- `[managed]` `docs/updates/**`

## Why
auto-apply (Phase 2) 는 stale 상태에서 자동 `upgrade-harness.sh --apply` 호출. 사용자가 "무엇이 적용됐는지" 알 수 있도록 각 커밋의 changelog 필요. 또 과거 업그레이드 추적 (언제 어떤 blocker 가 내려갔나) 용도.

## Downstream impact
- 영향: 새 directory `.claude/../docs/updates/` 가 apply 후 생성됨 (readonly 참조)
- 기능 영향 없음 — pure documentation
- 사용자는 apply 전후 `docs/updates/INDEX.md` 를 읽어 변경 파악 가능

## Verification
```bash
ls docs/updates/   # README.md INDEX.md + *.md 여러 개
cat docs/updates/INDEX.md | head -20
```

## Related
- forge handoff: PM-8 (이번 Phase 1 완료)
- 다음: Phase 2 (run-task/run-epic 의 auto-apply 로직)
