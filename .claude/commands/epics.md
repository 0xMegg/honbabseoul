---
model: sonnet
description: Run all MVP epics (1→2→3→4) sequentially as a batch
---

Run the multi-epic batch script.

Defaults to epics **1 → 2 → 3 → 4** (the full MVP roadmap captured in
`outputs/plans/roadmap.md`). Each epic internally runs Plan → Develop → Review
for every slice via `scripts/run-epic.sh`; on success the epic branch is
ff-merged into `dev` and pushed, then the next epic begins.

Accepts optional arguments (passed through to `scripts/run-epics.sh`):
- `/epics` — full roadmap (1 2 3 4)
- `/epics 2 3` — run only epics 2 and 3
- `/epics --from 2` — resume from epic 2 after an earlier halt
- `/epics --dry-run 1` — smoke test the wrapper with no model spend

## Instructions

1. Start the batch in background:

```bash
./scripts/run-epics.sh $ARGUMENTS
```
Use `run_in_background: true`.

2. Tell the user, once:
   "Epic batch started. I'll monitor via the existing epic-monitor every ~45s. Wall time estimate: 4–6 hours for all four epics end-to-end. The script halts on the first failure with a `--from N` hint to resume."

3. Register a progress monitor via CronCreate:
   - cron: `*/1 * * * *`
   - recurring: true
   - prompt: `Run "bash ./scripts/epic-monitor.sh" and report the one-line output. Then run "cat /tmp/honbabseoul-run/epics-batch-status 2>/dev/null | grep -E '^(CURRENT_EPIC|CURRENT_INDEX|COMPLETED|FAILED)='" and append a short summary. If the run-epics background task has completed, delete this cron job with CronDelete.`

4. Do NOT run additional Bash commands, file reads, or edits while the batch is running. The background task owns the workflow — interrupting it can corrupt the epic branch state. Only respond to user questions in plain text.

5. When the background task completes (automatic notification):
   - Delete the CronCreate monitor.
   - Read the final stdout from the background task and report concisely:
     - Per-epic verdict line (e.g. `Epic 1 ✓ · Epic 2 ✓ · Epic 3 ✗ halted`)
     - For any failure: include the failing slice id and the log path under `/tmp/honbabseoul-run/latest/`
     - For success: list the merged commit hashes from the most recent `git log --oneline -n 10` on `dev`
   - If the batch halted mid-way, suggest the exact resume command: `/epics --from <N>`.

## Approvals

Batch-run patterns (scripts, pnpm, git subcommands, `/tmp/<project>-run/`
reads) are pre-allowed in `.claude/settings.json` — that file is the seed
permission set for this project and survives harness upgrades. No user
action needed before the first `/epics` run.

Operations outside that set still prompt — `pnpm dev` in the foreground,
arbitrary `rm`, `git push --force`, and the other entries under
`permissions.deny` in `.claude/settings.json` are intentional gates, not
noise.
