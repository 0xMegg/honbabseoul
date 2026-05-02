# Hermes Log

Append important decisions, execution traces, and verification results here.

## 2026-05-03 — Cut Over Honbabseoul To Hermes Core

Decision:

- Archived the legacy Claude/Codex harness from active paths into `.hermes/archive/legacy-harness-2026-05-03/`.
- Installed Hermes Core policy, wiki baseline, skills placeholder, and operating structure.
- Added tracked root `AGENTS.md` as the active entrypoint.
- Rewrote `CLAUDE.md` as a thin adapter to `AGENTS.md` and `.hermes/`.
- Adopted Core `policy/harness-review.md` as active local policy after clean Core cutover.

Reason:

- The previous mixed adoption state applied Core propagation before Hermes itself was fully active in honbabseoul.
- Active authority must be tracked and unambiguous: `AGENTS.md` plus `.hermes/`.
- Legacy `.claude/`, `handoff/`, `outputs/`, `templates/`, `scripts/`, and old skills surfaces could otherwise revive the old workflow.

Source Evidence:

- Baseline commit: `216e9c6`.
- Mixed-state snapshot branch: `snapshot/pre-hermes-cutover-20260503`.
- Mixed-state tag: `snapshot-pre-hermes-20260503`.
- Ignored-file tarballs under `/private/tmp/honbabseoul-hermes-snapshots/`.

Verification:

- Snapshot branch and tag resolve to the mixed pre-cutover state.
- Runtime source diff from `216e9c6` is empty for `src/`, configs, Supabase, messages, E2E, public assets, package files, and lockfile.
- Legacy active surfaces were moved under `.hermes/archive/legacy-harness-2026-05-03/`.
- Root `AGENTS.md` is tracked and no longer ignored by `.git/info/exclude`.
- `CLAUDE.md` is a thin adapter to `AGENTS.md` and `.hermes/`.
- Claude final review initially returned required fixes for `.harness-manifest`, `docs/assumptions.md`, and `docs/plugin-guide.md`; those legacy harness files were archived and source provenance was corrected.
- Claude re-review returned required fixes for `.hermes/wiki/pages/honbabseoul-state.md` provenance and branch labels; those lines were corrected.
- Claude final quick re-review accepted the cutover with no further required fixes.
