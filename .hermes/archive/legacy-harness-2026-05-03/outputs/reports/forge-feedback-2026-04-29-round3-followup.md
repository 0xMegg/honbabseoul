# Forge Feedback — 2026-04-29 — round 3 (`d27eaaa`) downstream sync findings

> Source session: honbabseoul Epic 3 / Slice 1 review-only run + round 3 absorption.
> Forge HEAD when collected: `d27eaaa` (round 3 stamp). Template repo:
> `templates/claude-code-harness-template/.harness-version` confirmed at the
> same stamp.
> Cross-repo policy: this file is the input to a separate forge-cwd session.
> No forge changes are made from the honbabseoul session.

## Summary

Round 3 successfully closed the scope-leak grep regression and the 10-minute
Bash-tool ceiling that triggered honbab's Slice 1 silent abort
(`outputs/plans/task-slice-1-{plan,verify}.md` + working tree intact, but
`PHASE 3/3 REVIEW` never entered until round 3's `--phase review` was used).
Slice 1 review reached APPROVE on the first review-only run.

In the course of the absorption + the review-only run, 5 follow-up issues
surfaced — 2 break round 3's own contract (P1), 2 will keep regressing across
future syncs (P2), 1 is a UX guard (P3). All are infrastructure-only and do
not affect the Slice 1 outcome.

## P1 — round 3 contract violations

### 1. New wrappers are missing from `.harness-manifest [managed]`

**What:** `e2ee114.md` "Manifest classification" section explicitly states
that `src/scripts/run-plan.sh`, `src/scripts/run-develop.sh`,
`src/scripts/run-review.sh`, and `src/scripts/check-harness-regression.sh`
are `[managed]`. The actual `.harness-manifest` shipped with `d27eaaa` has
none of them.

**Repro:**
```
$ bash scripts/upgrade-harness.sh --dry-run
...
Unclassified template files (coverage gap — update .harness-manifest):
    ?  scripts/run-plan.sh
    ?  scripts/run-review.sh
    ?  scripts/run-develop.sh
    ?  scripts/check-harness-regression.sh
```

**Impact:** downstream upgrade walks them, classifies them as `unknown`,
and skips the copy. Any project relying on the new wrapper API
(`bash scripts/run-review.sh "$TASK"` is the documented form in
`role-developer.md`'s "Slice Sizing" section) does not receive the
wrappers. honbab's review-only run worked only because we called
`bash scripts/run-task.sh --phase review "$TASK"` directly (the
underlying script *was* in the manifest).

**Suggested fix:** add the four entries under `[managed]` in
`src/.harness-manifest`. Alternatively, register a glob like
`scripts/run-*.sh` if the convention is intended to be wildcarded —
but be aware that `scripts/` already enumerates explicitly to avoid
overwriting project-local scripts (see manifest header comment), so
a glob would change that policy.

### 2. `upgrade-harness.sh` self-update aborts via line-offset shift

**What:** Applying round 3 ran the cp loop to completion, bumped
`.harness-version`, and only then aborted with:

```
scripts/upgrade-harness.sh: line 243: syntax error near unexpected token `;;'
```

Root cause: bash follows the inode of the script being executed; partway
through the cp pass, the script overwrote itself, and the running bash
re-read line 243 from the *new* file at the *old* offset, hitting a
`;;` that the new layout puts at a different line. The loop body had
already finished so no [managed] copy was lost, but the trailing
`[deprecated]` removal pass never ran. honbab happened to have all 5
deprecated paths "already gone", so no actual deletion was missed —
this issue silently ate a real cleanup pass on a project where the
deprecated set is non-empty.

**Repro on any downstream still on round 2:** observe the abort at line
~243 (varies with how much round 2 → round 3 line drift accumulates).

**Suggested fix:** one of —
- Move the self-replacement of `scripts/upgrade-harness.sh` to the very
  last cp action (after `[deprecated]` processing) so the abort, if it
  still happens, fires after all real work is done.
- Atomic-replace via a temp + `mv` — write to
  `scripts/upgrade-harness.sh.new`, then `mv` over the original at the
  end. The running shell's inode is preserved.
- `exec` the new copy at the start of the run if a self-update is
  detected (heavy-handed, but bulletproof).

I'd lean toward (a) or (b) — (c) creates a re-entry path that's hard
to reason about during a bad sync.

## P2 — recurring regression vectors

### 3. `{{PROJECT_NAME}}` substitution is too broad — eats doc body literals

**What:** `upgrade-harness.sh`'s post-copy substitution applies
`sed s/{{PROJECT_NAME}}/$PROJECT_NAME_RESOLVED/g` to every managed
`*.md` and `*.sh`. That includes `docs/updates/*.md`, where the
update-changelog body intentionally *quotes* `{{PROJECT_NAME}}` as
documentation (the round 1 update doc `24070b5.md` lists it as a
known issue and shows the literal in code comments).

The honbab sync history shows this:
- An earlier sync replaced the literal in `24070b5.md` with the empty
  string (the local upgrade-harness.sh's pre-fix sed pattern was
  matching the empty marker `''`, so substitution produced an empty
  string).
- Round 3's correctly-quoted sed restored the literal.
- The next round 3 sync, if doc bodies still match `{{PROJECT_NAME}}`,
  will replace the literal with `honbabseoul` again.

**Suggested fix:** exclude `docs/updates/**` from the substitution case,
or restrict substitution to file regions outside fenced code blocks.
The simplest version:

```bash
case "$rel" in
  docs/updates/*.md) ;;       # don't substitute changelog bodies
  *.md|*.sh)
    if grep -q '{{PROJECT_NAME}}' "$dst"; then
      ...
    fi
    ;;
esac
```

### 4. macOS `cp -p` leaves 0-byte staging artefacts on overwrite

**What:** On APFS, `cp -p` writing to an existing destination occasionally
leaves a sibling file named `.!<PID>!<filename>` with size 0 (atomic-replace
staging). Round 3's apply produced 63 such files in honbab's working tree
across `.claude/commands/`, `.claude/hooks/`, `.claude/rules/base/`,
`.claude/scripts/`, `.claude/skills/**`, `docs/`, `docs/updates/`,
`scripts/`, `skills/`, and `templates/`. The syntax-error abort (P1 #2)
likely contributed by skipping `cp` cleanup, but I observed at least some
of these files in directories that the syntax error never reached, so the
behaviour is not 100% conditional on the abort.

honbab's session cleaned them with `find PROJECT -name '.!*!*' -size 0
-type f -delete`.

**Suggested fix:** add a final cleanup step at the end of
`upgrade-harness.sh` (`--apply` only):

```bash
if $APPLY; then
  find "$PROJECT_DIR" -name '.!*!*' -size 0 -type f -delete 2>/dev/null || true
fi
```

The `-size 0` filter is important — if a real file ever happened to
match the pattern, this would protect it.

## P3 — UX guard

### 5. `run-task.sh --help` is treated as a task description

**What:** `bash scripts/run-task.sh --help` does not print Usage and
exit; instead `--help` falls through the case parser to the positional
TASK, and the script enters `PHASE 1/3: PLAN`. The `claude -p` invocation
that follows happens to be `/plan --help`, which Claude Code interprets
as the slash-command help and returns immediately, so no real Plan ran
in honbab's case — but only because of a lucky SIGPIPE (the caller
piped the output through `head -25`, which closed stdin and killed the
pipeline). Without the pipe, PHASE 2 DEVELOP would have started.

**Repro:**
```
$ bash scripts/run-task.sh --help
[phase-mode] all
PHASE 1/3: PLAN
Running: claude -p "/plan --help"
```

**Suggested fix:** add an explicit case before the positional parse:

```bash
case "${1:-}" in
  -h|--help)
    echo "Usage: $0 [--task-id <id>] [--no-commit] [--dry-run] [--max-iter N] [--phase plan|develop|review|all] [--resume] <task description>"
    ...
    exit 0
    ;;
esac
```

Same for the new `run-plan.sh` / `run-develop.sh` / `run-review.sh`
wrappers if they're added per P1 #1.

## Round 4 candidate ordering

If ranking by impact + cost:

1. P1 #1 (manifest entries) — single-line manifest fix, immediately unblocks the wrapper API.
2. P1 #2 (self-update abort) — reorder cp pass; defensive against silent deprecated-cleanup misses.
3. P2 #3 (sed scope) — case-statement carve-out; protects all future doc-body literals.
4. P2 #4 (staging cleanup) — one-line trailing find; macOS-only but free.
5. P3 #5 (help guard) — pure UX, but fast.

None of the five are tied to round 3's headline contract (the grep trap
fix + `--phase` + `--resume` + decision-protocol all worked correctly in
honbab's session), so they group cleanly into a single follow-up round.

## Verification status (honbab side, 2026-04-29)

- `.harness-version` = `FORGE_COMMIT=d27eaaa` (active).
- `scripts/run-task.sh` byte-identical to template.
- Slice 1 review-only run reached APPROVE.
- Slice 1 + chore branch merged into `dev` (= `7a976fb`).
- main left at `4c514e4` per honbab release policy.
- Working tree clean post-merge; staging artefacts cleaned.
