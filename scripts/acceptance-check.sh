#!/bin/bash
# acceptance-check.sh — Enforce Terminal Audit Slice gates mechanically.
#
# Parses a Reviewer audit report (typically outputs/reviews/epic-*-audit.md
# or any markdown file with Verdict + Blocker fields) and exits 0 only
# when `Verdict: PASS` AND `Blocker=0` (or Blocker field omitted with
# Verdict=PASS). Exits 1 otherwise. Exits 2 on usage errors.
#
# Pairs with templates/epic-plan.md's "Terminal Audit / Verification
# Slice" convention — a slice that wrote a good report but reported
# ITERATE/FAIL must not be allowed to mark the Epic complete.
#
# Usage:
#   scripts/acceptance-check.sh path/to/audit.md
#   scripts/acceptance-check.sh --epic <run_id_or_name>   # auto-discover
#
# Exit codes:
#   0 — acceptance passed (Verdict=PASS, no blockers)
#   1 — acceptance failed (explain why on stderr)
#   2 — usage error (report missing, bad args, etc.)

set -euo pipefail

REPORT=""
EPIC=""

while [ $# -gt 0 ]; do
  case "$1" in
    --epic)
      [ -z "${2:-}" ] && { echo "ERROR: --epic requires a value" >&2; exit 2; }
      EPIC="$2"
      shift 2
      ;;
    -h|--help)
      sed -n '2,18p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    -*)
      echo "ERROR: unknown option: $1" >&2
      exit 2
      ;;
    *)
      REPORT="$1"
      shift
      ;;
  esac
done

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Auto-discover when --epic is given
if [ -z "$REPORT" ] && [ -n "$EPIC" ]; then
  # Newest matching file wins; -print0 / xargs -0 to survive odd filenames
  REPORT=$(find "$PROJECT_DIR/outputs/reviews" -type f -name "*${EPIC}*audit*" -print0 2>/dev/null \
    | xargs -0 ls -t 2>/dev/null | head -1 || true)
fi

if [ -z "$REPORT" ]; then
  echo "ERROR: no audit report specified" >&2
  echo "  Pass a path, or use --epic <run_id_or_name> for auto-discovery" >&2
  exit 2
fi

if [ ! -f "$REPORT" ]; then
  echo "ERROR: audit report not found: $REPORT" >&2
  exit 2
fi

# Extract Verdict (PASS | ITERATE | FAIL), case-insensitive, flexible spacing
VERDICT=$(grep -Eio 'Verdict[[:space:]]*[:=][[:space:]]*(PASS|ITERATE|FAIL|APPROVE|REVISE|REQUEST_CHANGES)' "$REPORT" \
  | head -1 \
  | grep -Eoi '(PASS|ITERATE|FAIL|APPROVE|REVISE|REQUEST_CHANGES)' \
  | tr '[:lower:]' '[:upper:]' || true)

# Also try the FINAL_VERDICT HTML comment format used by run-task
if [ -z "$VERDICT" ]; then
  VERDICT=$(grep -Eio '<!--[[:space:]]*FINAL_VERDICT:[[:space:]]*[A-Z_]+[[:space:]]*-->' "$REPORT" \
    | head -1 \
    | grep -Eoi 'FINAL_VERDICT:[[:space:]]*[A-Z_]+' \
    | awk '{print $2}' || true)
fi

# Extract Blocker count (Blocker=N or Blocker: N or Blockers: N)
BLOCKERS=$(grep -Eio 'Blocker(s)?[[:space:]]*[:=][[:space:]]*[0-9]+' "$REPORT" \
  | head -1 \
  | grep -Eo '[0-9]+' || true)

echo "Audit: $REPORT"
echo "  Verdict:  ${VERDICT:-<not found>}"
echo "  Blockers: ${BLOCKERS:-<not found>}"

# Gate 1: Verdict must be PASS (or APPROVE as equivalent)
if [ -z "$VERDICT" ]; then
  echo "FAIL: audit report missing a 'Verdict:' line" >&2
  exit 1
fi

case "$VERDICT" in
  PASS|APPROVE) ;;
  *)
    echo "FAIL: Verdict=$VERDICT (expected PASS or APPROVE)" >&2
    exit 1
    ;;
esac

# Gate 2: Blockers must be 0 when present
if [ -n "$BLOCKERS" ] && [ "$BLOCKERS" -gt 0 ]; then
  echo "FAIL: Blocker=$BLOCKERS (expected 0)" >&2
  exit 1
fi

echo "PASS"
exit 0
