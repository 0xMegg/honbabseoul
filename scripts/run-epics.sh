#!/bin/bash
# run-epics.sh — Batch-run multiple epics sequentially.
#
# Usage:
#   ./scripts/run-epics.sh                  # default set — reads outputs/plans/roadmap.md header
#                                           # and runs 1 2 3 4 (the MVP roadmap)
#   ./scripts/run-epics.sh 1 2 3 4          # explicit list
#   ./scripts/run-epics.sh --from 2         # continue from epic 2 through the default tail
#   ./scripts/run-epics.sh --dry-run 1 2    # dry run (no tokens spent)
#
# Flow:
#   For each epic number N (in order):
#     ./scripts/run-epic.sh [--dry-run] "Epic N"
#   Stops on the first failure. The run-epic.sh script itself commits + pushes
#   and ff-merges the epic branch into dev on success; this wrapper just chains.
#
# Status:
#   Writes /tmp/<project>-run/epics-batch-status with KEY=VALUE pairs so the
#   epic-monitor.sh loop and the /epics slash command can read progress.

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_NAME="${PROJECT_NAME:-$(basename "$PROJECT_DIR")}"
LOG_BASE="/tmp/${PROJECT_NAME}-run"

DEFAULT_EPICS=(1 2 3 4)

# ----------------------------------------------------------------------------
# Arg parsing
# ----------------------------------------------------------------------------
DRY_RUN=false
FROM_EPIC=""
EPICS=()

while [ $# -gt 0 ]; do
  case "${1:-}" in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --from)
      FROM_EPIC="${2:-}"
      if ! [[ "$FROM_EPIC" =~ ^[0-9]+$ ]]; then
        echo "ERROR: --from requires a numeric epic id" >&2
        exit 1
      fi
      shift 2
      ;;
    -h|--help)
      cat <<EOF
Usage: $0 [--dry-run] [--from N] [epic_ids...]

  --dry-run         Pass through to run-epic.sh (no model calls, no commits).
  --from N          Start from epic N and continue through the default tail.
  epic_ids...       Whitespace-separated epic numbers. Defaults to: ${DEFAULT_EPICS[*]}

Examples:
  $0                      # runs ${DEFAULT_EPICS[*]}
  $0 1 2                  # runs epics 1 then 2
  $0 --from 3             # runs epics 3 4 (of the default set)
  $0 --dry-run 1          # smoke test the wrapper + run-epic.sh

Exit codes:
  0 — all epics in the list finished successfully
  1 — wrapper argument or environment error
  2 — one of the epics failed (COMPLETED / FAILED fields are in the status file)
EOF
      exit 0
      ;;
    --)
      shift
      break
      ;;
    *)
      if ! [[ "$1" =~ ^[0-9]+$ ]]; then
        echo "ERROR: unexpected argument '$1' (expected a number or a flag)" >&2
        exit 1
      fi
      EPICS+=("$1")
      shift
      ;;
  esac
done

# Apply defaults / --from
if [ "${#EPICS[@]}" -eq 0 ]; then
  EPICS=("${DEFAULT_EPICS[@]}")
fi

if [ -n "$FROM_EPIC" ]; then
  FILTERED=()
  for e in "${EPICS[@]}"; do
    if [ "$e" -ge "$FROM_EPIC" ]; then
      FILTERED+=("$e")
    fi
  done
  if [ "${#FILTERED[@]}" -eq 0 ]; then
    echo "ERROR: --from $FROM_EPIC filtered out every epic in [${EPICS[*]}]" >&2
    exit 1
  fi
  EPICS=("${FILTERED[@]}")
fi

# ----------------------------------------------------------------------------
# Preconditions
# ----------------------------------------------------------------------------
RUN_EPIC="$SCRIPT_DIR/run-epic.sh"
if [ ! -x "$RUN_EPIC" ]; then
  echo "ERROR: $RUN_EPIC is not executable" >&2
  exit 1
fi

mkdir -p "$LOG_BASE"
MASTER_STATUS="$LOG_BASE/epics-batch-status"

# ----------------------------------------------------------------------------
# Status helpers (matches epic-status / task-status KEY="VALUE" format)
# ----------------------------------------------------------------------------
_write_status() {
  local tmp="${MASTER_STATUS}.tmp"
  {
    echo "PROJECT_NAME=\"$PROJECT_NAME\""
    echo "EPICS_LIST=\"${EPICS[*]}\""
    echo "EPICS_TOTAL=${#EPICS[@]}"
    echo "START_EPOCH=$START_EPOCH"
    echo "CURRENT_INDEX=${CURRENT_INDEX:-0}"
    echo "CURRENT_EPIC=\"${CURRENT_EPIC:-}\""
    echo "COMPLETED=\"${COMPLETED[*]:-}\""
    echo "FAILED=\"${FAILED:-}\""
    echo "DRY_RUN=$DRY_RUN"
  } > "$tmp"
  mv "$tmp" "$MASTER_STATUS"
}

# ----------------------------------------------------------------------------
# Banner
# ----------------------------------------------------------------------------
START_EPOCH=$(date +%s)
CURRENT_INDEX=0
CURRENT_EPIC=""
COMPLETED=()
FAILED=""
_write_status

echo ""
echo -e "${CYAN}════════════════════════════════════════${NC}"
echo -e "${CYAN}  RUN-EPICS batch${NC}"
echo -e "${CYAN}  Project:  ${PROJECT_NAME}${NC}"
echo -e "${CYAN}  Epics:    ${EPICS[*]}${NC}"
echo -e "${CYAN}  Dry run:  ${DRY_RUN}${NC}"
echo -e "${CYAN}  Status:   ${MASTER_STATUS}${NC}"
echo -e "${CYAN}════════════════════════════════════════${NC}"
echo ""

# ----------------------------------------------------------------------------
# Run each epic
# ----------------------------------------------------------------------------
for E in "${EPICS[@]}"; do
  CURRENT_INDEX=$((CURRENT_INDEX + 1))
  CURRENT_EPIC="$E"
  _write_status

  echo -e "${CYAN}════════════════════════════════════════${NC}"
  echo -e "${CYAN}  Epic ${E}  —  ${CURRENT_INDEX} of ${#EPICS[@]}${NC}"
  echo -e "${CYAN}════════════════════════════════════════${NC}"

  CMD=("$RUN_EPIC")
  if [ "$DRY_RUN" = true ]; then
    CMD+=("--dry-run")
  fi
  CMD+=("Epic ${E}")

  # Let run-epic.sh failures propagate so we can report cleanly.
  set +e
  "${CMD[@]}"
  RC=$?
  set -e

  if [ "$RC" -ne 0 ]; then
    FAILED="$E"
    _write_status
    echo ""
    echo -e "${RED}════════════════════════════════════════${NC}"
    echo -e "${RED}  BATCH HALTED at Epic ${E}  (exit ${RC})${NC}"
    echo -e "${RED}  Completed:  ${COMPLETED[*]:-none}${NC}"
    REMAINING=("${EPICS[@]:$CURRENT_INDEX}")
    echo -e "${RED}  Remaining:  ${REMAINING[*]:-none}${NC}"
    echo -e "${RED}  Logs:       ${LOG_BASE}/latest/${NC}"
    echo -e "${RED}  Resume:     ./scripts/run-epics.sh --from ${E}${NC}"
    echo -e "${RED}════════════════════════════════════════${NC}"
    exit 2
  fi

  COMPLETED+=("$E")
  _write_status
done

# ----------------------------------------------------------------------------
# Done
# ----------------------------------------------------------------------------
END_EPOCH=$(date +%s)
ELAPSED=$((END_EPOCH - START_EPOCH))
MINS=$((ELAPSED / 60))

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  ALL EPICS COMPLETE${NC}"
echo -e "${GREEN}  Completed:  ${COMPLETED[*]}${NC}"
echo -e "${GREEN}  Elapsed:    ${MINS}m${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
