# Forge Feedback — 2026-04-26 (run-task.sh:828 scope-num pipefail regression)

> Target repo: **`harness-forge`** (`/Users/mero/Dev/13.claude/templates/harness-forge`)
> Source path: `src/scripts/run-task.sh` (line ~828)
> Companion docs: `2026-04-25-bash3-noop-install.md` (round 1, applied), `2026-04-26-epic2-cleanup-lessons.md` (round 2 sketches)
> Status: **bug report — emergency local patch applied in honbabseoul**, awaiting forge-side fix.

---

## TL;DR

The just-shipped forge round 2 patch 2 (scope-leak guard) introduced a **silent script abort** when `$TASK` does not contain the literal pattern `Task N`. Honbabseoul Epic 3 hit it on Slice 1 (`"Slice 1: vite + plugin-react pin"`). Develop completed all 6 verify gates green; the script then crashed at the scope-leak detector before invoking `/review`. No error message, no stage transition, just `set -euo pipefail` exiting 1.

Honbabseoul applied a local one-line patch (`|| true` on the failing assignment) to unblock Epic 3. Forge owner needs the proper upstream fix.

---

## Reproduce

1. Define an epic whose slices are named with the prefix `Slice` (not `Task`), e.g. `outputs/plans/epic-3-plan.md` carries `#### Slice 1: vite + plugin-react pin`.
2. Run `./scripts/run-epic.sh 3`. The runner correctly resolves Slice 1 and dispatches to `run-task.sh` with `TASK="Slice 1: vite + plugin-react pin"` (or similar).
3. Plan completes ✓. Develop completes ✓ (lint, tsc, tests, build, lockfile all green).
4. **Script aborts silently** between Develop and Review. No `review-iter1.log` produced. Logs at `/tmp/<project>-run/<epic-id>/`.

---

## Root cause — `scripts/run-task.sh` line 828

```bash
_scope_task_num=$(echo "$TASK" | grep -oE "[Tt]ask[[:space:]]+[0-9]+" | grep -oE "[0-9]+" | head -1)
```

When `$TASK="Slice 1: vite + plugin-react pin"`:
- `echo "$TASK"` emits the line.
- First `grep -oE "[Tt]ask[[:space:]]+[0-9]+"` finds no match → exits 1.
- `pipefail` propagates exit 1 to the entire pipeline.
- Command substitution `$(...)` returns exit 1 → assignment fails under `set -e` → script aborts.

**The author's intent was already correct for empty `_scope_task_num`** — the very next lines have `${_scope_task_num:-unknown}` fallback and `if [ -n "$_scope_task_num" ]` guards. The bug is that the assignment never reaches them because `pipefail` short-circuits at the failing grep.

---

## Why the regression slipped past the round-2 ship gate

The scope-leak guard (round 2 P2) was tested against `Task N`-named flows. Honbabseoul Epic 3 was the first project with `Slice N`-named slices to hit it. Two failure modes overlap:

1. **Naming convention mismatch** — slices use `Slice N:` prefix, not `Task N:`. The guard regex assumes the latter.
2. **Pipefail interaction** — even if the regex matched the wider `(Task|Slice) N` set, the no-match case still aborts the script under `pipefail`.

---

## Suggested upstream fix

Two-layer fix recommended (covers both naming and pipefail):

```bash
# Match Task or Slice; tolerate no match.
_scope_task_num=$(printf '%s' "$TASK" | grep -oE "([Tt]ask|[Ss]lice)[[:space:]]+[0-9]+" | grep -oE "[0-9]+" | head -1 || true)
```

Then update the plan-file lookup to also try the `task-slice-N-plan.md` form:

```bash
_scope_plan_file=""
if [ -n "$_scope_task_num" ]; then
  for _candidate in \
    "$PROJECT_DIR/outputs/plans/task-${_scope_task_num}-plan.md" \
    "$PROJECT_DIR/outputs/plans/task-slice-${_scope_task_num}-plan.md"; do
    if [ -f "$_candidate" ]; then
      _scope_plan_file="$_candidate"
      break
    fi
  done
fi
```

This preserves the guard's behavior for `Task N` flows and adds correct support for `Slice N` flows. The `|| true` is essential regardless — `pipefail + grep no-match` is a recurring footgun in this script (audit other `grep | ...` pipelines too).

---

## Local emergency patch applied (honbabseoul, this commit)

Just the one-line `|| true` to unblock — leaves the slice naming gap in place (the guard becomes a no-op for slices, not a false alarm). Acceptable degradation while waiting for the proper fix.

```bash
# scripts/run-task.sh:828 (after patch)
_scope_task_num=$(echo "$TASK" | grep -oE "[Tt]ask[[:space:]]+[0-9]+" | grep -oE "[0-9]+" | head -1 || true)
```

This patch will be **overwritten on the next harness upgrade** — that's intentional. The forge fix is the source of truth; honbabseoul's local patch is purely an unblock.

---

## Adjacent observation (out of scope for this fix)

The runner's slice plan/verify/review file naming reuses the same path across epics (`task-slice-N-{plan,verify,review}.md`). Epic 3 Slice 1's plan generation overwrote the on-disk Epic 2 Slice 1 plan. Git history preserves the prior version, but anyone reading the working tree sees only the latest. Not blocking, but worth a separate forge consideration — perhaps prefix with epic number (`task-epic-3-slice-1-plan.md`) or move per-epic outputs into `outputs/epic-N/`.

---

## Companion / context

- Round 2 patches landed via `8a8f0d5` (`docs/updates/8a8f0d5.md`). This regression is in patch 2 (scope-leak guard).
- This is the second round-2 follow-up (after `divebase` 5건, hash `24070b5`).
- Honbabseoul's Epic 3 hit it the day round 2 shipped. First production exposure.
