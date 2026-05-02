# Epic Plan

## Epic
[Epic number] — [Epic name]

## Goal
[What this feature looks like when fully complete, 2-3 sentences]

## Context
- User need: [what problem this solves for the user]
- Related docs: [design docs, specs, references]
- Dependencies: [external APIs, DB changes, other epics]

## Stages & Slices
Break the epic into independently deliverable slices, grouped into stages.
- **Stages** run sequentially (Stage 2 waits for Stage 1 to finish).
- **Slices within the same Stage** run in parallel and must NOT modify the same files or depend on each other.

If parallelism is not needed, put all slices in a single stage or omit Stage headings entirely (backward compatible — treated as sequential).

**Epic Lite:** 6-9 modified files + single concern → write as a single Slice with no Stage decomposition.
Opus 4.6 can handle this scale consistently within a single session.
(See "Epic Lite" in `docs/epic-guide.md` for detailed criteria)

### Stage 1
#### Slice 1: [name]
- **What:** [what this slice delivers]
- **Repo:** [target repo name — omit for single-repo]
- **Files:** [expected files to create/modify — multi-repo: use repo prefix e.g. `backend/src/...`]
- **Depends on:** (none)
- **Done when:** [specific acceptance criteria]

#### Slice 2: [name]
- **What:** [what this slice delivers]
- **Repo:** [target repo name]
- **Files:** [expected files]
- **Depends on:** (none)
- **Done when:** [specific acceptance criteria]

### Stage 2
#### Slice 3: [name]
- **What:** [what this slice delivers]
- **Repo:** [target repo name]
- **Files:** [expected files]
- **Depends on:** Stage 1
- **Done when:** [specific acceptance criteria]

### Stage N
#### Slice N: [name]
- **What:** [what this slice delivers]
- **Repo:** [target repo name]
- **Files:** [expected files]
- **Depends on:** [Stage number or "none"]
- **Done when:** [specific acceptance criteria]

## Slicing Principles
- Each slice is independently testable and reviewable
- Data layer before UI (repository → provider → widget)
- Shared/core changes before feature-specific ones
- No slice should touch more than ~5 files

### Parallel Rules (same Stage)
- Slices in the same Stage must NOT modify the same files (across the entire workspace, not per-repo)
- Multi-repo: Slices that only modify different repos cannot have file overlaps, so they are parallel-safe
- Slices in the same Stage must NOT have data dependencies on each other
- Each parallel slice must have independent tests
- When in doubt, put slices in separate Stages (sequential is always safe)

## Terminal Audit / Verification Slice
If the final slice is verification, audit, or QA (rather than shipping new code), its **Done-when** MUST bake in the Epic gate — not just "report produced":

- Required form: `outputs/reviews/epic-<N>-audit.md` contains `Verdict: PASS` **and** `Blocker=0` (or the equivalent machine-checkable fields your audit template uses).
- Reviewer rule: if the audit report yields `Verdict: ITERATE|FAIL` or `Blocker>0`, the slice verdict MUST be REVISE — even when the report itself is well-written. Otherwise the Epic wrapper marks "all slices approved → success" while unresolved blockers remain.

Without this, a slice can approve for producing a good report whose content says FAIL, and the Epic finalizes green with real acceptance misses.

## Epic Acceptance Criteria
- [ ] All slices completed and reviewed
- [ ] Lint/analyze passes
- [ ] Tests pass
- [ ] Terminal audit slice (if present) reports `Verdict: PASS` and `Blocker=0`
- [ ] [end-to-end user flow description]

## Open Questions
- [Undecided items that may affect slice scope]

## Rollback Strategy
If the epic must be abandoned mid-way: [which slices are safe to keep, which to revert]
