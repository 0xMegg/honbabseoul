#!/bin/bash
# verify-parallel-worktree.sh — Smoke-test the worktree isolation flow used by
# run-epic.sh when HARVEST_PARALLEL_WORKTREE=1.
#
# Why this exists
#   run-epic.sh disables the worktree path in dry-run mode (line ~449), so a
#   plain `--dry-run` execution proves nothing about the worktree mechanism.
#   This script reproduces the exact git command sequence that
#   setup_slice_worktree / finalize_slice_worktree run, but inside an isolated
#   throwaway repo. No effect on the host repo.
#
# What it checks
#   1. Single-slice round-trip: create worktree → modify file → patch → apply
#      to main → verify content → cleanup
#   2. Two parallel non-overlapping slices: both worktrees alive at once,
#      both patches apply cleanly, no branch leftovers
#   3. New file creation inside a worktree round-trips correctly (most common
#      regression in cross-worktree patches)
#
# Usage:
#   bash scripts/verify-parallel-worktree.sh           # run all tests
#   bash scripts/verify-parallel-worktree.sh --keep    # keep tmp dir on failure
#
# Exit:
#   0 — all checks pass
#   1 — one or more failures (details printed)
#   2 — environment problem (git missing, etc.)

set -euo pipefail

KEEP_ON_FAIL=0
[ "${1:-}" = "--keep" ] && KEEP_ON_FAIL=1

if [ -t 1 ]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[0;33m'
  CYAN='\033[0;36m'
  NC='\033[0m'
else
  RED='' GREEN='' YELLOW='' CYAN='' NC=''
fi

command -v git >/dev/null 2>&1 || { echo "git not found" >&2; exit 2; }

# Create isolated tmp git repo
TMP_ROOT=$(mktemp -d -t harvest-wt-verify.XXXXXX)
TEST_REPO="$TMP_ROOT/repo"
mkdir -p "$TEST_REPO"

PASS_COUNT=0
FAIL_COUNT=0
FAILURES=()

# shellcheck disable=SC2329  # called via trap below
cleanup() {
  local exit_code=$?
  if [ "$FAIL_COUNT" -gt 0 ] && [ "$KEEP_ON_FAIL" = "1" ]; then
    echo -e "${YELLOW}Tmp dir kept for inspection: $TMP_ROOT${NC}" >&2
  else
    rm -rf "$TMP_ROOT"
  fi
  exit "$exit_code"
}
trap cleanup EXIT

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  printf "  ${GREEN}✓${NC} %s\n" "$1"
}

fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  FAILURES+=("$1: $2")
  printf "  ${RED}✗${NC} %s ${RED}— %s${NC}\n" "$1" "$2" >&2
}

# Initialize repo with baseline content
init_repo() {
  cd "$TEST_REPO"
  rm -rf .git ./*
  git init --quiet -b main
  git config user.email "verify@harvest.local"
  git config user.name "Harvest Verify"
  echo "v1" > a.txt
  echo "v1" > b.txt
  git add -A
  git commit --quiet -m "baseline"
}

# Mirror of run-epic.sh setup_slice_worktree (simplified, no fallback)
make_worktree() {
  local label="$1"
  local wt_dir="$TEST_REPO/.harvest-wt/${label}"
  local wt_branch="harvest-wt/verify/${label}"
  mkdir -p "$(dirname "$wt_dir")"
  if [ -d "$wt_dir" ]; then
    git -C "$TEST_REPO" worktree remove --force "$wt_dir" >/dev/null 2>&1 || true
  fi
  git -C "$TEST_REPO" worktree add --quiet "$wt_dir" -b "$wt_branch" HEAD
  echo "$wt_dir"
}

# Mirror of finalize_slice_worktree
finalize_worktree() {
  local wt_dir="$1"
  local patch
  patch=$(mktemp -t harvest-slice-patch.XXXXXX)
  ( cd "$wt_dir" && git add -A && git diff --cached ) > "$patch" 2>/dev/null
  if [ -s "$patch" ]; then
    ( cd "$TEST_REPO" && git apply --index "$patch" )
  fi
  rm -f "$patch"
  local wt_branch
  wt_branch=$( ( cd "$wt_dir" && git symbolic-ref --short HEAD 2>/dev/null ) || true)
  git -C "$TEST_REPO" worktree remove --force "$wt_dir" >/dev/null 2>&1 || true
  [ -n "$wt_branch" ] && git -C "$TEST_REPO" branch -D "$wt_branch" >/dev/null 2>&1 || true
  # Mirror the fix in run-epic.sh's finalize_slice_worktree: tidy empty parents.
  rmdir "$(dirname "$wt_dir")" 2>/dev/null || true
  rmdir "$TEST_REPO/.harvest-wt" 2>/dev/null || true
}

# ─────────────────────────────────────────────────────────────
# Test 1: single-slice round-trip
# ─────────────────────────────────────────────────────────────
test_single_round_trip() {
  echo -e "${CYAN}Test 1: single slice round-trip${NC}"
  init_repo

  local wt
  wt=$(make_worktree "stage-1/slice-0")
  if [ ! -d "$wt" ]; then
    fail "T1.create" "worktree directory not created at $wt"
    return
  fi
  pass "T1.create — worktree created at $wt"

  echo "v2" > "$wt/a.txt"
  finalize_worktree "$wt"

  local actual
  actual=$(cat "$TEST_REPO/a.txt")
  if [ "$actual" = "v2" ]; then
    pass "T1.apply — main a.txt == v2"
  else
    fail "T1.apply" "main a.txt expected 'v2', got '$actual'"
  fi

  if [ -d "$wt" ]; then
    fail "T1.cleanup" "worktree dir $wt still present after finalize"
  else
    pass "T1.cleanup — worktree dir removed"
  fi

  if git -C "$TEST_REPO" branch --list | grep -q "harvest-wt/verify"; then
    fail "T1.branch" "leftover harvest-wt/verify branch"
  else
    pass "T1.branch — no leftover branch"
  fi
}

# ─────────────────────────────────────────────────────────────
# Test 2: two parallel non-overlapping worktrees
# ─────────────────────────────────────────────────────────────
test_parallel_non_overlap() {
  echo -e "${CYAN}Test 2: two parallel non-overlapping worktrees${NC}"
  init_repo

  local wt_a wt_b
  wt_a=$(make_worktree "stage-2/slice-0")
  wt_b=$(make_worktree "stage-2/slice-1")

  if [ -d "$wt_a" ] && [ -d "$wt_b" ]; then
    pass "T2.create — both worktrees coexist"
  else
    fail "T2.create" "worktrees missing: A=$wt_a B=$wt_b"
    return
  fi

  echo "edited-by-A" > "$wt_a/a.txt"
  echo "edited-by-B" > "$wt_b/b.txt"

  finalize_worktree "$wt_a"
  finalize_worktree "$wt_b"

  local got_a got_b
  got_a=$(cat "$TEST_REPO/a.txt")
  got_b=$(cat "$TEST_REPO/b.txt")
  if [ "$got_a" = "edited-by-A" ] && [ "$got_b" = "edited-by-B" ]; then
    pass "T2.apply — both patches landed"
  else
    fail "T2.apply" "expected (edited-by-A, edited-by-B), got ($got_a, $got_b)"
  fi

  if git -C "$TEST_REPO" branch --list | grep -q "harvest-wt/verify"; then
    fail "T2.branch" "leftover branches: $(git -C "$TEST_REPO" branch --list 'harvest-wt/verify*')"
  else
    pass "T2.branch — no leftover branches"
  fi

  local leftover
  leftover=$(find "$TEST_REPO/.harvest-wt" -mindepth 1 2>/dev/null | head -1 || true)
  if [ -n "$leftover" ]; then
    fail "T2.dir" "leftover worktree path: $leftover"
  else
    pass "T2.dir — .harvest-wt cleaned"
  fi
}

# ─────────────────────────────────────────────────────────────
# Test 3: new file creation inside worktree
# ─────────────────────────────────────────────────────────────
test_new_file_creation() {
  echo -e "${CYAN}Test 3: new file creation in worktree${NC}"
  init_repo

  local wt
  wt=$(make_worktree "stage-3/slice-0")
  echo "fresh" > "$wt/c.txt"
  finalize_worktree "$wt"

  if [ -f "$TEST_REPO/c.txt" ] && [ "$(cat "$TEST_REPO/c.txt")" = "fresh" ]; then
    pass "T3.newfile — c.txt landed in main with correct content"
  else
    fail "T3.newfile" "c.txt missing or wrong content in main worktree"
  fi
}

echo -e "${CYAN}Verifying parallel worktree isolation flow${NC}"
echo "  Test repo: $TEST_REPO"
echo ""

test_single_round_trip
echo ""
test_parallel_non_overlap
echo ""
test_new_file_creation

echo ""
TOTAL=$((PASS_COUNT + FAIL_COUNT))
if [ "$FAIL_COUNT" -eq 0 ]; then
  echo -e "${GREEN}WORKTREE FLOW OK: $PASS_COUNT/$TOTAL checks pass${NC}"
  exit 0
else
  echo -e "${RED}WORKTREE FLOW FAILED: $FAIL_COUNT/$TOTAL checks failed${NC}"
  for f in "${FAILURES[@]}"; do
    echo "  - $f"
  done
  exit 1
fi
