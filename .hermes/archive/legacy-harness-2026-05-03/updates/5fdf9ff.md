---
hash: 5fdf9ff
date: 2026-04-23
severity: P0
type: refactor
breaking: true
---

# [P0] refactor: .claude/rules/ base/local split (Option Y Phase 0)

## Summary
`.claude/rules/` 경로를 `base/` (managed, template 소유) + `local/` (seed, 프로젝트 소유) 로 분리. auto-apply 모델 진입 준비 + 프로젝트 고유 학습(kody F-01/F-02 등) 이 upgrade 에서 보존되도록 구조화.

**BREAKING**: 기존 `.claude/rules/*.md` 파일 위치 변경. 기존 파일이 `base/` 로 이동했는지 확인 필요.

## Commits
- `1192226` refactor: split .claude/rules/ into base/ and local/ (Option Y Phase 0-A1)
- `16291ae` docs: update references to .claude/rules/ layout (Option Y Phase 0-A2)
- `5fdf9ff` fix: extend post-edit-size-check to base/ and local/ (Option Y Phase 0-A3)

## Changes

### A1 (구조)
- `src/.claude/rules/{api,frontend,git,gotchas,testing}.md` → `src/.claude/rules/base/*.md` (git mv, rename 100%)
- `src/.claude/rules/local/README.md` (신규) — 목적/네이밍 convention/로드 동작
- `src/.harness-manifest` — `[managed] .claude/rules/base/**` + `[seed] .claude/rules/local/**`

### A2 (참조)
15 파일의 `.claude/rules/` 경로 참조 업데이트. 주요:
- `src/CLAUDE.md` — "Rules (auto-applied)" 블록 재정의 (base/ + local/ 각 한 줄)
- `src/setup.sh` — mkdir base/local 분리, cp base/ 대상 + local/README.md 시딩
- `src/scripts/harness-report.sh` — `rules_dir` 를 base 한정 + Local rules informational
- harvest pipeline (run-harvest.sh, fitness-filter, trend-harvest, harvest-policy) — canonical target 분기
- `src/PlaceholderGuide.md`, `src/README.md` (5곳), `src/docs/epic-guide.md`, `src/context/working-rules.md`, `src/skills/bug-fix/SKILL.md`, `src/skills/code-review/SKILL.md`, `src/templates/harvest-proposal.md`

### A3 (hook)
- `src/.claude/hooks/post-edit-size-check.sh` L33 `*/.claude/rules/*.md` → `*/.claude/rules/*/*.md` (base/local 양쪽 50줄 상한)

## Manifest classification
- `[managed]` `.claude/rules/base/**` — template 이 덮어씀
- `[seed]` `.claude/rules/local/**` — 프로젝트 소유, 절대 덮어쓰지 않음

## Why
kody 가 `.claude/rules/{gotchas,frontend}.md` 에 Epic 7 F-01/F-02 + K4/K5 scope clarification 등 프로젝트-specific 학습을 append. 기존 `[managed]` 정책에서 upgrade 시 커스텀 삭제. auto-apply 모델로 가기 전에 구조 분리 선행.

## Downstream impact

### 마이그레이션 필수
다운스트림은 apply 전에 **수동 이동** 필요:
```bash
mkdir -p .claude/rules/base .claude/rules/local
git mv .claude/rules/{api,frontend,git,gotchas,testing}.md .claude/rules/base/
cp /path/to/template/.claude/rules/local/README.md .claude/rules/local/
```

### 로컬 커스텀이 있다면
`base/*.md` 는 template 과 바이트 일치해야 함. 프로젝트 추가분은 `local/<topic>-<project>.md` 로 이동:
```bash
# 예: kody
mv <kody 추가 내용> .claude/rules/local/gotchas-kody.md
# base/gotchas.md 에서 원본 줄 제거
diff /path/to/template/.claude/rules/base/gotchas.md .claude/rules/base/gotchas.md  # 빈 출력이어야 apply 안전
```

### Harvest pipeline 변경
새로 발견된 pitfall 의 기본 target 이 `local/gotchas-<project>.md` 로 바뀜. harness-wide 규칙은 여전히 template PR 경로.

## Verification
```bash
ls .claude/rules/base/    # api frontend git gotchas testing 5개
ls .claude/rules/local/   # README.md + 프로젝트 파일
for f in api frontend git gotchas testing; do
  diff /path/to/template/.claude/rules/base/$f.md .claude/rules/base/$f.md
done
# → 빈 출력이어야 함

bash scripts/upgrade-harness.sh   # dry-run
# → Unknown 0, local/* overwrite 리스트에 없어야 함
bash scripts/harness-report.sh    # Rules 5/20 (base 집계)
```

## Related
- plan: `~/.claude/plans/y-0-indexed-zebra.md`
- forge handoff: PM-6
- 다운스트림 마이그레이션 예시:
  - divebase: `3345d6f` (이동) + `8fd4744` (apply)
  - kody: `247f921` (이동 + 커스텀 추출) + `c991658` (apply)
