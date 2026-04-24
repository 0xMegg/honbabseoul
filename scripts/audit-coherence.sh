#!/bin/bash
# audit-coherence.sh — Audit harness coherence vs the trend-harvester philosophy
#
# Usage:
#   ./scripts/audit-coherence.sh                      # Audit project root
#   ./scripts/audit-coherence.sh --target src/        # Audit a subtree
#   ./scripts/audit-coherence.sh --json               # Machine-readable output
#   ./scripts/audit-coherence.sh --quiet              # Only print failures
#
# Reference:
#   - hugh-kim.space/trend-harvester-analysis.html (original philosophy doc)
#   - ~/.claude/plans/immutable-weaving-parasol.md (HARD core 8 + 6 principles)
#
# Exit codes:
#   0 — fully coherent (all checks pass)
#   1 — drift detected (one or more checks failed)
#   2 — usage error or missing target

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TARGET_DIR="$PROJECT_DIR"
JSON=0
QUIET=0

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      TARGET_DIR="$(cd "$2" && pwd)" || { echo "Invalid --target path: $2" >&2; exit 2; }
      shift 2
      ;;
    --json)
      JSON=1
      QUIET=1
      shift
      ;;
    --quiet)
      QUIET=1
      shift
      ;;
    -h|--help)
      sed -n '2,20p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

# Colors (suppressed in JSON/quiet)
if [ "$JSON" = "1" ] || [ ! -t 1 ]; then
  RED='' GREEN='' YELLOW='' CYAN='' DIM='' NC=''
else
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[0;33m'
  CYAN='\033[0;36m'
  DIM='\033[2m'
  NC='\033[0m'
fi

PASS_COUNT=0
FAIL_COUNT=0
FAILED_CHECKS=()
RESULTS_JSON=()

record_pass() {
  local id="$1" name="$2" detail="$3"
  PASS_COUNT=$((PASS_COUNT + 1))
  if [ "$QUIET" = "0" ]; then
    printf "  ${GREEN}✓${NC} %-32s ${DIM}%s${NC}\n" "$name" "$detail"
  fi
  RESULTS_JSON+=("{\"id\":\"$id\",\"name\":\"$name\",\"status\":\"pass\",\"detail\":\"${detail//\"/\\\"}\"}")
}

record_fail() {
  local id="$1" name="$2" detail="$3"
  FAIL_COUNT=$((FAIL_COUNT + 1))
  FAILED_CHECKS+=("$id: $name — $detail")
  printf "  ${RED}✗${NC} %-32s ${RED}%s${NC}\n" "$name" "$detail" >&2
  RESULTS_JSON+=("{\"id\":\"$id\",\"name\":\"$name\",\"status\":\"fail\",\"detail\":\"${detail//\"/\\\"}\"}")
}

# Helper: file_has <relative path> <regex>
file_has() {
  local rel="$1" pattern="$2"
  local path="$TARGET_DIR/$rel"
  [ -f "$path" ] && grep -qE "$pattern" "$path"
}

file_exists() {
  [ -f "$TARGET_DIR/$1" ]
}

dir_exists() {
  [ -d "$TARGET_DIR/$1" ]
}

# ─────────────────────────────────────────────────────────────
# HARD CORE 8 — non-negotiable structural invariants
# ─────────────────────────────────────────────────────────────

check_5axis_filter() {
  local f=".claude/skills/fitness-filter/SKILL.md"
  if ! file_exists "$f"; then
    record_fail "hc1" "5-axis filter" "missing $f"; return
  fi
  local axes=("Automation" "Friction" "HARD" "Token" "Measurability")
  local missing=()
  for axis in "${axes[@]}"; do
    grep -qiE "^### [0-9]+\. ${axis}" "$TARGET_DIR/$f" || missing+=("$axis")
  done
  if [ ${#missing[@]} -gt 0 ]; then
    record_fail "hc1" "5-axis filter" "missing axes: ${missing[*]}"
  else
    record_pass "hc1" "5-axis filter" "all 5 axes present"
  fi
}

check_6phase_pipeline() {
  local f=".claude/skills/trend-harvest/SKILL.md"
  if ! file_exists "$f"; then
    record_fail "hc2" "6-phase pipeline" "missing $f"; return
  fi
  # Each entry: regex matching either verb or noun form of the phase name
  local phases=("Guard" "Collect(ion)?" "Analy(sis|ze)" "Measur(e|ement)" "Judge" "Apply")
  local labels=("Guard" "Collect" "Analyze" "Measure" "Judge" "Apply")
  local missing=()
  local i
  for i in "${!phases[@]}"; do
    local p="${phases[$i]}"
    grep -qE "Phase [0-9](\.[0-9])?:.*${p}|^## ${p}|${p} \(Phase" "$TARGET_DIR/$f" \
      || missing+=("${labels[$i]}")
  done
  if [ ${#missing[@]} -gt 0 ]; then
    record_fail "hc2" "6-phase pipeline" "missing phases: ${missing[*]}"
  else
    record_pass "hc2" "6-phase pipeline" "Guard→Collect→Analyze→Measure→Judge→Apply present"
  fi
}

check_double_gating() {
  if file_has "context/working-rules.md" "double[- ]gat|Gate 2|SOFT.*HARD|HARD.*SOFT" \
     || file_has "README.md" "[Dd]ouble.[Gg]at|Gate 2|SOFT.*HARD" \
     || file_has ".claude/skills/trend-harvest/SKILL.md" "double[- ]gat|Gate 2|SOFT.*HARD"; then
    record_pass "hc3" "Double-gating (SOFT+HARD)" "documented in working-rules/README/skill"
  else
    record_fail "hc3" "Double-gating (SOFT+HARD)" "no double-gating reference found"
  fi
}

check_phase35_autoresearch() {
  local f=".claude/skills/trend-harvest/SKILL.md"
  if ! file_exists "$f"; then
    record_fail "hc4" "Phase 3.5 autoresearch" "missing $f"; return
  fi
  if grep -qE "stash|autoresearch|temporary apply|revert" "$TARGET_DIR/$f"; then
    record_pass "hc4" "Phase 3.5 autoresearch" "stash/apply/revert flow referenced"
  else
    record_fail "hc4" "Phase 3.5 autoresearch" "no autoresearch/stash/revert mention"
  fi
}

check_hard_block_categories() {
  local f="context/harvest-policy.md"
  if ! file_exists "$f"; then
    record_fail "hc5" "HARD BLOCK categories" "missing $f"; return
  fi
  local found=0
  grep -qiE "modif(y|ies|ying) existing|high.risk|HARD BLOCK|auto.apply.*(blocked|denied|forbid)" "$TARGET_DIR/$f" && found=1
  if [ "$found" = "1" ]; then
    record_pass "hc5" "HARD BLOCK categories" "destructive categories documented"
  else
    record_fail "hc5" "HARD BLOCK categories" "no HARD BLOCK / modifies-existing rule"
  fi
}

check_concurrency_dedup() {
  local missing=()
  file_has "harvest/config.json" "cooldown_minutes" || missing+=("config.cooldown_minutes")
  # .seen.json or .lock may not exist on a fresh checkout, so check for the
  # mechanism reference rather than the file itself.
  if ! file_has ".claude/skills/trend-harvest/SKILL.md" "\.seen\.json|\.lock|cooldown"; then
    missing+=("dedup mechanism (seen/lock/cooldown)")
  fi
  if [ ${#missing[@]} -gt 0 ]; then
    record_fail "hc6" "Concurrency + dedup" "missing: ${missing[*]}"
  else
    record_pass "hc6" "Concurrency + dedup" "cooldown + seen/lock referenced"
  fi
}

check_rollback_policy() {
  local found=0
  # Check settings.json deny list
  if file_has ".claude/settings.json" "git reset --hard|reset --hard"; then
    found=1
  fi
  # Or harvest-policy.md text
  if file_has "context/harvest-policy.md" "reset --hard|rollback"; then
    found=1
  fi
  if [ "$found" = "1" ]; then
    record_pass "hc7" "Rollback policy" "git reset --hard guarded"
  else
    record_fail "hc7" "Rollback policy" "no rollback/reset --hard reference"
  fi
}

check_change_type_routing() {
  local f="context/harvest-policy.md"
  if ! file_exists "$f"; then
    record_fail "hc8" "change_type routing" "missing $f"; return
  fi
  local types=("rule" "scaffold-rule" "new-skill" "hook")
  local missing=()
  for t in "${types[@]}"; do
    grep -qE "[\`\"']?${t}[\`\"']?" "$TARGET_DIR/$f" || missing+=("$t")
  done
  if [ ${#missing[@]} -gt 0 ]; then
    record_fail "hc8" "change_type routing" "missing types: ${missing[*]}"
  else
    record_pass "hc8" "change_type routing" "rule/scaffold-rule/new-skill/hook present"
  fi
}

# ─────────────────────────────────────────────────────────────
# 6 PRINCIPLES — directional invariants (looser, heuristic)
# ─────────────────────────────────────────────────────────────

check_p1_selective_evolution() {
  if file_has "harvest/config.json" "threshold.*[6-9]|fitness_threshold" \
     || file_has ".claude/skills/fitness-filter/SKILL.md" "[Tt]hreshold:.*6|threshold of 6"; then
    record_pass "p1" "P1: Selective evolution" "fitness threshold ≥ 6 enforced"
  else
    record_fail "p1" "P1: Selective evolution" "no threshold ≥ 6 found"
  fi
}

check_p2_hard_enforcement() {
  local scripts_dir="$TARGET_DIR/scripts"
  [ -d "$scripts_dir" ] || scripts_dir="$TARGET_DIR/src/scripts"
  if [ ! -d "$scripts_dir" ]; then
    record_fail "p2" "P2: HARD enforcement" "no scripts/ directory"; return
  fi
  local total hard
  total=$(find "$scripts_dir" -name '*.sh' -type f 2>/dev/null | wc -l | tr -d ' ')
  hard=$(grep -lE "set -euo pipefail|set -e" "$scripts_dir"/*.sh 2>/dev/null | wc -l | tr -d ' ')
  if [ "$total" -eq 0 ]; then
    record_fail "p2" "P2: HARD enforcement" "no shell scripts found"
  elif [ "$hard" -lt "$total" ]; then
    record_fail "p2" "P2: HARD enforcement" "$hard/$total scripts use set -e"
  else
    record_pass "p2" "P2: HARD enforcement" "$hard/$total scripts use set -e"
  fi
}

check_p3_self_improvement_loop() {
  if dir_exists "harvest/applied" \
     || file_has "harvest/config.json" "internal_feedback" \
     || dir_exists "outputs/evaluations"; then
    record_pass "p3" "P3: Self-improvement loop" "applied/ or internal_feedback present"
  else
    record_fail "p3" "P3: Self-improvement loop" "no harvest/applied/, internal_feedback, or evaluations/"
  fi
}

check_p4_empirical_verification() {
  if file_exists "scripts/harness-report.sh" \
     || file_exists "src/scripts/harness-report.sh"; then
    record_pass "p4" "P4: Empirical verification" "harness-report.sh present"
  else
    record_fail "p4" "P4: Empirical verification" "no harness-report.sh"
  fi
}

check_p5_meta_question() {
  if file_has "context/harvest-policy.md" "2[- ]?단계|two[- ]stage|user approval|2차 판단|second-stage"; then
    record_pass "p5" "P5: Meta question" "two-stage user approval policy present"
  else
    record_fail "p5" "P5: Meta question" "no two-stage/user-approval rule"
  fi
}

check_p6_safety_first() {
  # Resolve settings.json from project root or fall back to src/
  local denylist=""
  if file_exists ".claude/settings.json"; then
    denylist="$TARGET_DIR/.claude/settings.json"
  elif file_exists "src/.claude/settings.json"; then
    denylist="$TARGET_DIR/src/.claude/settings.json"
  fi
  if [ -z "$denylist" ]; then
    record_fail "p6" "P6: Safety-first" "no .claude/settings.json (root or src/)"; return
  fi
  local patterns=("rm -rf" "reset --hard" "force.push|push.*--force|push.*-f")
  local found=0
  for p in "${patterns[@]}"; do
    grep -qE "$p" "$denylist" && found=$((found + 1))
  done
  if [ "$found" -ge 2 ]; then
    record_pass "p6" "P6: Safety-first" "$found/3 destructive patterns guarded ($(basename "$(dirname "$(dirname "$denylist")")")/.claude)"
  else
    record_fail "p6" "P6: Safety-first" "only $found/3 destructive patterns in deny list"
  fi
}

# ─────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────

if [ "$QUIET" = "0" ]; then
  echo -e "${CYAN}Auditing harness coherence...${NC}"
  echo "  Target: $TARGET_DIR"
  echo ""
  echo -e "${CYAN}HARD Core (8 invariants)${NC}"
fi

check_5axis_filter
check_6phase_pipeline
check_double_gating
check_phase35_autoresearch
check_hard_block_categories
check_concurrency_dedup
check_rollback_policy
check_change_type_routing

if [ "$QUIET" = "0" ]; then
  echo ""
  echo -e "${CYAN}6 Principles (directional)${NC}"
fi

check_p1_selective_evolution
check_p2_hard_enforcement
check_p3_self_improvement_loop
check_p4_empirical_verification
check_p5_meta_question
check_p6_safety_first

TOTAL=$((PASS_COUNT + FAIL_COUNT))

if [ "$JSON" = "1" ]; then
  printf '{"target":"%s","pass":%d,"fail":%d,"total":%d,"results":[' \
    "$TARGET_DIR" "$PASS_COUNT" "$FAIL_COUNT" "$TOTAL"
  printf '%s' "$(IFS=,; echo "${RESULTS_JSON[*]}")"
  printf ']}\n'
elif [ "$QUIET" = "0" ]; then
  echo ""
  if [ "$FAIL_COUNT" -eq 0 ]; then
    echo -e "${GREEN}COHERENT: $PASS_COUNT/$TOTAL checks pass${NC}"
  else
    echo -e "${YELLOW}DRIFT DETECTED: $FAIL_COUNT/$TOTAL checks failed${NC}"
    for f in "${FAILED_CHECKS[@]}"; do
      echo "  - $f"
    done
  fi
fi

if [ "$FAIL_COUNT" -gt 0 ]; then
  exit 1
fi
exit 0
