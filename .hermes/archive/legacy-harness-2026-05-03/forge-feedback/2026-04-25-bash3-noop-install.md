# Forge Feedback — 2026-04-25

> Target repo: **`harness-forge`** (`/Users/mero/Dev/13.claude/templates/harness-forge`)
> Source files in forge layout: `src/scripts/run-epic.sh`, `src/scripts/run-task.sh`, `src/templates/role-developer.md`
> Built-output equivalent: `claude-code-harness-template/scripts/...` and `templates/role-developer.md`
> Companion file: [`2026-04-25-patch.diff`](./2026-04-25-patch.diff) — apply with `git apply` against the **forge** `src/` paths after rebasing the diff (see "Apply" section below).

---

## TL;DR
honbabseoul Epic 1 (`/epic 1`) ran overnight and halted at Stage 2 with two `REQUEST_CHANGES` slices that all traced back to **three independent forge-side defects**. This document describes what was observed, what was patched (against the *built output*, not forge — see "Rollback" below), why the patches address the root causes, and how forge should ingest them.

---

## What honbabseoul ran

```
$ /epic 1                       (sonnet model, run_in_background)
  → ./scripts/run-epic.sh 1     (uses outputs/plans/epic-1-plan.md, no /plan call)
```

Epic plan: 6 slices in 4 stages.

```
Stage 1 (1 slice)         Stage 1 — Slice 1 → APPROVE          97afa96
Stage 2 (3 slices │ ║ │)  Stage 2 — Slice 2 → APPROVE          6ba6cbf
                          Stage 2 — Slice 3 → REQUEST_CHANGES  (no commit)
                          Stage 2 — Slice 4 → REQUEST_CHANGES  (no commit)
Stage 3 — never reached
Stage 4 — never reached
```

`/tmp/honbabseoul-run/1-20260425-133941/` log dir. Notable failure traces in `task-slice-2/review-iter1.log` (Slice 3) and `task-slice-3/review-iter1.log` (Slice 4) preserved.

---

## Three independent root causes

### Cause 1 — `declare -A` aborts on macOS bash 3.2
`scripts/run-epic.sh` lines 1122–1123 use bash 4+ associative arrays:
```bash
declare -A _pid_done=()
declare -A _pid_rc=()
```
macOS ships **bash 3.2.57** by default. `declare -A` is bash 4+ only. The function body that owns those declarations is the parallel-stage progress monitor (Stage 2's 3-slice spawn). On bash 3 the script crashes mid-monitor, which manifests as a silent loss of slice progress reporting **and** is plausibly the upstream of Slice 4's "Developer phase never produced anything" outcome (the spawn race got into a state where one of the three child claude sessions exited 0 without doing work, but the parent monitor could no longer track that fact).

### Cause 2 — `run-task.sh` has no develop-phase output verification
`scripts/run-task.sh` calls `run_claude "develop-iter${ITER}"` and immediately proceeds to `/review` if the inner exit code is 0. There is **no check that the develop session actually produced any artefact**.

In the honbabseoul run, Slice 4's `/develop` exited 0 with no code, no `package.json` change, and no `## Developer Handoff` section in the slice's handoff file. Reviewer arrived to a tree byte-identical to the slice's start point and naturally returned `REQUEST_CHANGES`. A full Reviewer session was burned to surface a failure that could have been caught at the develop boundary.

### Cause 3 — Developer prompt does not enforce install-before-import
Slice 3 wrote correct next-intl glue files (`src/i18n/`, `messages/`, `[locale]/...`) but **never ran `pnpm add next-intl@^4`**. Result: every `import` line failed module resolution; lint, typecheck, and build all crashed; Reviewer issued `REQUEST_CHANGES`.

The current `templates/role-developer.md` describes a **Follow-up Call-Sites** rule (when a new symbol is added, list every plausible consumer) but has no symmetric guidance for the **dependency** side. If the model writes `import { X } from "pkg"`, there is no rule pinning that the slice is incomplete until `pkg` lands in the lockfile.

---

## Patches that were attempted

**Important:** these patches were applied to the *built-output* repo `claude-code-harness-template/`, not to `harness-forge/src/`. They have since been rolled back (see "Rollback" below). The diff is preserved in [`2026-04-25-patch.diff`](./2026-04-25-patch.diff) and the rationale below explains how to port them to the forge `src/` layout.

### Patch 1 — `src/scripts/run-epic.sh` (forge path) — bash 3 compat

Replace bash 4+ associative arrays with parallel index-aligned regular arrays. The dictionaries are only ever indexed by `pid`, but `pid` is uniquely 1:1 with `p_idx` (the index into the existing `pids[]` array), so an index-aligned array provides identical semantics on bash 3.2.

```diff
-      declare -A _pid_done=()   # track which PIDs have been reaped
-      declare -A _pid_rc=()     # exit codes
+      # Parallel-to-pids[] flag/code arrays. Indexed by p_idx (the same
+      # index as pids[]), NOT by PID — keeps bash 3.2 compatibility, since
+      # macOS ships bash 3.2 and `declare -A` is bash 4+ only.
+      local _pid_done=()  # "1" once we have already reaped this slot
+      local _pid_rc=()    # exit code captured at reap time (informational)
@@
-          [ -n "${_pid_done[$pid]:-}" ] && continue  # already reaped
+          [ "${_pid_done[$p_idx]:-0}" = "1" ] && continue  # already reaped
@@
-            _pid_done[$pid]=1
-            _pid_rc[$pid]=$wait_rc
+            _pid_done[$p_idx]=1
+            _pid_rc[$p_idx]=$wait_rc
```

Verified: `bash -n` passes on `/bin/bash` 3.2.57 after the change.

### Patch 2 — `src/scripts/run-task.sh` (forge path) — develop noop guard

Snapshot the working tree + HEAD before `/develop`, compare after. Identical state ⇒ raise `VERDICT=DEVELOP_NOOP` and exit 1. This catches the "claude session exited 0 but did nothing" mode at its source instead of letting Review burn a session diagnosing it.

```diff
   DEVELOP_LOG="${LOG_DIR}/develop-iter${ITER}.log"
+
+  # Snapshot working-tree + HEAD before Develop, so we can detect a silent
+  # no-op (claude session that exited 0 without touching anything — the
+  # Slice 4 "Developer phase never ran" failure mode observed in the wild).
+  DEVELOP_PRE_STATE="$(git -C "$PROJECT_DIR" status --porcelain 2>/dev/null)|$(git -C "$PROJECT_DIR" rev-parse HEAD 2>/dev/null)"
+
   # Override log file for iteration tracking
   if ! run_claude "develop-iter${ITER}" "$DEVELOP_PROMPT"; then
     log_fail "Develop phase failed (iter ${ITER}). Check ${DEVELOP_LOG}"
     write_status "ROLE=failed" "VERDICT=DEVELOP_FAILED"
     log_task_entry
     exit 1
   fi
+
+  # Detect develop-phase no-op: same working-tree porcelain + same HEAD.
+  # Empty PRE_STATE (e.g. PROJECT_DIR not in a git repo) skips the check
+  # so non-git workspaces are not falsely flagged.
+  DEVELOP_POST_STATE="$(git -C "$PROJECT_DIR" status --porcelain 2>/dev/null)|$(git -C "$PROJECT_DIR" rev-parse HEAD 2>/dev/null)"
+  if [ -n "$DEVELOP_PRE_STATE" ] && [ "$DEVELOP_PRE_STATE" = "$DEVELOP_POST_STATE" ]; then
+    log_fail "Develop phase exited cleanly but produced NO observable changes."
+    log_fail "  Working tree + HEAD identical pre/post — likely a silent claude session failure."
+    log_fail "  See ${DEVELOP_LOG}."
+    write_status "ROLE=failed" "VERDICT=DEVELOP_NOOP"
+    log_task_entry
+    exit 1
+  fi
+
   log_success "Develop phase complete (iter ${ITER})"
```

Edge case considered: a deliberate "doc-only" develop with no working-tree changes would be flagged. In practice every harness slice produces at least a handoff write or a `git rm`, so empty diff is genuinely a failure signal. If there is concern about false positives, a fallback could be added that checks `handoff/` mtime as a secondary signal.

Multi-repo workspaces are NOT handled — the snapshot uses `PROJECT_DIR` only. A multi-repo extension is straightforward but was deferred.

### Patch 3 — `src/templates/role-developer.md` (forge path) — install-before-import

Add an "Install Before Import" section that mirrors the existing "Follow-up Call-Sites" rule but for the dependency direction.

```diff
+## Install Before Import (dependency hygiene)
+A new `import` statement requires a matching dependency in `package.json`
+(or the equivalent `pyproject.toml`, `pubspec.yaml`, `go.mod`, etc.). The
+slice is NOT done until both sides land:
+
+1. **Run the install command first.** When the plan says "use library X",
+   run `pnpm add X` / `npm install X` / `flutter pub add X` / `pip install X`
+   *before* writing the import. This produces a real lockfile diff the
+   Reviewer can verify, and prevents the failure mode where the code
+   compiles in the editor (TypeScript LSP resolves stale node_modules)
+   but `pnpm lint` / `pnpm build` fail with `Cannot find module …`.
+
+2. **Verify the install actually landed.** After installing, glance at the
+   `package.json#dependencies` (or `devDependencies`) entry — many
+   parallel-execution failures trace back to "the model wrote the import
+   line but the dependency never reached the lockfile".
+
+3. **Bundle install + import in the same commit.** Splitting "install in
+   commit A, import in commit B" creates a window where `commit A` has a
+   dependency nobody uses (Reviewer's dead-code guard) and `commit B`
+   imports something that does not exist (Reviewer's lint check).
+
+This mirrors the spirit of the **Follow-up Call-Sites** rule above: when
+you add a new symbol or import, the matching obligation lands in the same
+slice, not "in a follow-up Task".
```

---

## Verification before rollback
- `/bin/bash -n` passed on every script in `claude-code-harness-template/scripts/*.sh` and `claude-code-harness-template/.claude/hooks/*.sh` (19 files, system bash 3.2.57).
- `--help` smoke on `run-epic.sh` and `run-task.sh` reached the expected pre-flight gate (working-tree-dirty error from a clean state — that's the script working, not failing).
- Patches were committed on a branch `fix/bash3-and-develop-noop`, fast-forward merged into `main`, and stamped via `.claude/.harness-version` bump. Total 2 commits: `e5a01e9` (fix) + `b5b2f15` (stamp).

---

## Rollback (what currently exists vs. what the patches did)

The patches were applied to the **wrong repository**: `claude-code-harness-template` (the *built output*), not `harness-forge` (the *source*). The user asked for an immediate rollback because the forge layout is the canonical source-of-truth and unsolicited writes to either side violated their working policy.

```bash
cd /Users/mero/Dev/13.claude/templates/claude-code-harness-template
git checkout -B main e4ef9b1   # main HEAD restored to its pre-patch tip
git status                     # clean
cat .claude/.harness-version   # FORGE_COMMIT=d78bdcb (original)
```

- `claude-code-harness-template` `main` HEAD: **`e4ef9b1`** (original).
- Patch commits `e5a01e9` and `b5b2f15`: orphaned, reachable only via reflog. They will be garbage-collected by the next `git gc`.
- `git push` was **never invoked** during the attempt — origin was not touched.
- `harness-forge`: **completely untouched throughout** (no commits, no stage, no working-tree changes).

The patch content is preserved in `docs/forge-feedback/2026-04-25-patch.diff` (109 lines, `git diff` format) so it can be replayed against the forge `src/` paths.

---

## How to apply against `harness-forge`

The diff was generated against the built-output paths. To apply on the forge layout:

```bash
cd /Users/mero/Dev/13.claude/templates/harness-forge

# Option A — apply with path prefix rewriting
sed -E 's|^(--- a/|+++ b/)|\1src/|' /Users/mero/Dev/13.claude/workouts/honbabseoul/docs/forge-feedback/2026-04-25-patch.diff | git apply --check
# If the dry-run is clean, drop --check and apply.

# Option B — apply manually slice by slice using the diff blocks above as a guide.
```

Either way, the three forge files involved are:
- `src/scripts/run-epic.sh` (Patch 1)
- `src/scripts/run-task.sh` (Patch 2)
- `src/templates/role-developer.md` (Patch 3)

After applying, run forge's normal build → bumped `claude-code-harness-template` carries `FORGE_COMMIT=<new hash>`.

---

## Recommended next steps (forge-side judgement)

1. **Apply Patch 1 unconditionally** — bash 3 compatibility is a hard correctness fix on macOS, the harness's primary target platform. No behaviour change on bash 4/5.

2. **Apply Patch 2 with caution** — the noop guard is correct but worth a second look on:
   - Multi-repo handoff (currently checks only `$PROJECT_DIR`).
   - Doc-only or refactor-only slices that legitimately produce no diff (rare but possible).
   - Whether `DEVELOP_NOOP` should auto-iterate (`ITER < MAX_ITER`) before failing, instead of immediate exit.

3. **Apply Patch 3 verbatim** — pure documentation in the role file. Zero runtime risk. Sharpens an existing failure mode in a readable way.

4. **Investigate beyond these three** — Slice 4 had a deeper root cause than just "no noop guard". Patch 2 catches the symptom; the underlying question is *why* the spawn-3-children-and-monitor-them code path produced a child that exited 0 without working. Suspects: claude CLI rate limiting, env var loss in the spawn, transient network, or a real bug in `run_claude` for parallel mode. Worth tracing the next time it happens.

---

## Companion files
- [`2026-04-25-patch.diff`](./2026-04-25-patch.diff) — full diff captured from orphaned commits before rollback. 109 lines. `git apply` ready (with the path prefix rewrite shown above).
