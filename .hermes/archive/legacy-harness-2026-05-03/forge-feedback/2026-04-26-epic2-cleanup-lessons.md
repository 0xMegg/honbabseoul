# Forge Feedback — 2026-04-26 (Epic 2 cleanup lessons)

> Target repo: **`harness-forge`** (`/Users/mero/Dev/13.claude/templates/harness-forge`)
> Source path prefix: `src/scripts/`, `src/templates/`
> Companion: `docs/forge-feedback/2026-04-25-bash3-noop-install.md` (previous round, applied as forge `bcb8cf9` → built into harness-template `7f96dd4`)
> Status: **proposal — no patches written**. This document describes 4 fix candidates surfaced by Epic 2 retrospective. Forge owner picks scope.

---

## TL;DR
Epic 1 retrospective produced 3 forge fixes (bash 3 compat, develop noop guard, install-before-import) — all merged. Epic 2 ran cleaner thanks to those, but surfaced **4 new failure modes** that the forge can defend against. The same hybrid-completion + Reviewer-empirical-test pattern that saved Epic 2's Slice 1 should be encoded as harness rules so the next project isn't reliant on a strong Reviewer reading every diff.

---

## Epic 2 retrospective — what happened

Epic 2 (data layer & repositories) ran via `/epic 2` against forge `7f96dd4`. 4 slices in 2 stages.

| Slice | Outcome |
|---|---|
| Slice 1 (schema migration + RLS policies) | 🟥 REQUEST_CHANGES — critical RLS weakening + 9-script scope leak |
| Slice 2 (seed data) | ✅ APPROVE |
| Slice 3 (read repository) | ✅ APPROVE |
| Slice 4 (submissions repo + storage helper) | ✅ APPROVE |

But the runner reported "all 4 APPROVED" despite Slice 1 being REQUEST_CHANGES. That mis-report is itself a fix candidate (#3 below).

The cleanup pass (`44f914c` on the honbabseoul `dev` branch) addressed all flags surgically:
- WITH CHECK restored (`(true)` → `(status = 'pending')`)
- 9 `scripts/db-*.sh` removed (none plan-mandated)
- `db:verify` / `db:smoke` package scripts removed
- `supabase/config.toml` `major_version` 15 → 17
- Seed re-applied; live DB sanity-checked

The cleanup itself was not the problem — it was easy. The problem is **why the four issues landed in commits at all**, which the forge can defend against.

---

## Five root causes (4 forge-addressable + 1 plan-level)

### 1. 🧠 Developer deviated from plan based on a wrong PostgreSQL semantics model — without empirical verification

**What happened:** Slice 1 plan specified `with check (status = 'pending')` as defense-in-depth alongside the BEFORE-INSERT trigger. Developer (claude-sonnet) wrote in handoff:
> PostgreSQL evaluates the RLS WITH CHECK expression against the original client-provided row values, before any BEFORE-trigger modifications take effect.

This is **wrong**. RLS WITH CHECK runs after BEFORE-INSERT triggers (same model as table CHECK constraints). Reviewer empirically falsified it during review by running the policy with the strict WITH CHECK + trigger intact, issuing the same anon INSERT that "should" have been rejected, and observing HTTP 201 with a `pending` row.

The Developer's mistake was acting on a **reasoned-only** belief about a database engine's runtime behaviour, then weakening the policy to `(true)`, leaving the trigger as the single point of failure for the security-critical UGC pending invariant.

### 2. 🪣 Scope leak: investigation/debug artefacts ended up in commits

**What happened:** Developer created 8 `scripts/db-*.sh` files (`db-debug.sh`, `db-grants.sh`, `db-trigger-test.sh`, etc.) while diagnosing the WITH CHECK question, plus 2 unplanned package.json scripts (`db:verify`, `db:smoke`). The plan only authorised `db:push` and `db:reset`.

Developer's handoff flagged 5 of the 8 scripts as "may delete" but never actually `git rm`'d them. The same pattern bit Epic 1 — the `nextscaffold/` 408MB temp directory + 4 dead exclude entries scattered across config files. **The harness has no automated guard against "develop session leaves scratch artefacts in the diff"**.

### 3. 📊 Runner mis-reported aggregate verdict

**What happened:** `/epic 2` summary said "all 4 slices APPROVED" but Slice 1's review file ended with `<!-- FINAL_VERDICT: REQUEST_CHANGES -->`. Stage integration commits (`8388728`, `fe47153`) landed despite the unresolved RC. The proximate gate is unclear without diving into the run logs, but at minimum:
- `run-task.sh` may have iterated Slice 1 and the second iteration produced an APPROVE (which was true verdict at run-end, but the RC review file was not removed)
- Or `run-epic.sh`'s stage commit logic doesn't re-cross-check verdict markers before committing
- Or the human-facing summary message reads from a different status source than the reviews directory

Either way, **a post-stage gate that re-greps every `outputs/reviews/task-slice-*-review.md` for `FINAL_VERDICT: REQUEST_CHANGES`** before letting the stage commit / ff-merge would catch this class of mismatch. The user only learned about the RC because they manually read review files during point-of-care.

### 4. 📋 Planner missed a spec invariant; Reviewer's verify checklist didn't catch it

**What happened:** Spec §5 lists 6 required UGC fields: name, naver_url, is_solo, has_jp_menu, is_late_night, **reason**. Epic 2 plan's Slice 1 column list enumerated 16 columns but **omitted `reason`**. Slice 4's submissions repository accepts `reason` via zod but does not persist it (TODO comment).

Reviewer's verify §29 checked column count (16, matched plan) and §30 checked package.json keys (matched plan), but neither step compared the plan's column list to the **upstream spec**. This is a one-grep-deep oversight that compounds across multiple roles — Planner missed it, Developer trusted the plan, Reviewer trusted the plan-vs-implementation match without going up to spec.

The data loss is hypothetical (no production submissions yet), but the gap is structural: **plans can drift from the spec they claim to implement, and nothing in the workflow enforces a 1:1 grep**.

### 5. 🤝 (Plan-level, not forge-addressable directly) Cross-slice empirical verification not specified

The Slice 1 plan said "verify RLS holds via psql + curl" but not "verify each guard independently — turn off the trigger and confirm WITH CHECK still rejects". Defense-in-depth was specified in the design but not in the verify steps. Reviewer ran the ablation test on their own initiative; without that, the regression would have shipped.

This is a **plan authoring habit** more than a harness rule — Plans for security-sensitive invariants should always specify ablation tests. Harness-side, the `templates/role-planner.md` could add a "Defense-in-depth verify" subsection prompt, but the responsibility ultimately rests on the Planner's discipline.

---

## Four forge fix candidates

### Patch 1 — `templates/role-developer.md` "Empirical-First Deviation" section

Add a new section after "Install Before Import":

```markdown
## Empirical-First Deviation

If you find yourself weakening, removing, or otherwise contradicting an
invariant the Plan explicitly specified, you MUST attach reproducible
empirical evidence to the handoff before you ship the deviation:

1. **Test the invariant under the plan's design** — write the smallest
   possible reproduction (a SQL block, a `curl` line, a unit test) that
   exercises the contested behaviour against the system as the plan
   specified it.
2. **Capture the actual output** — full stdout/stderr or HTTP response,
   not a paraphrase. Include the date and the command line.
3. **State the conclusion** — "The plan's design [holds / does not hold]
   because <observed behaviour> contradicts the prediction <stated
   prediction>."
4. **If the deviation is justified by observed behaviour, link the
   evidence in the handoff under `## Plan deviations` with the section
   title `<file:line> — <invariant>`.**

Reasoning alone — "I think Postgres does X" / "I'm pretty sure
TypeScript handles Y" — is NOT a basis for weakening a plan invariant.
The Reviewer's first move on a noticed deviation will be to run the
exact test you should have run yourself; if no evidence is in the
handoff, expect REQUEST_CHANGES with the empirical disagreement
attached.

This rule especially applies to: RLS / RBAC policies, security
constraints, build-time guards (e.g. `import "server-only"`), database
constraints, and anything labelled "defense-in-depth" in the plan.
```

**Why:** Encodes the exact failure mode of Epic 2 Slice 1 as a role expectation. Cheap to add, costless when not needed, decisive when it bites.

### Patch 2 — `scripts/run-task.sh` "scope leak" guard before review

After Develop completes and before `/review` runs, add a section that:

1. Parses the slice's plan file for `**Files:**` lines (already in epic-plan format).
2. Computes `git diff --name-only` since the slice started.
3. Diffs the two sets. Files in the diff that are NOT in the plan's Files list get listed under `## Unplanned changes (Developer to confirm before /review)` in the handoff.

If the Developer's session can edit the handoff, they explicitly mark each unplanned file as `keep — <reason>` or `drop — <reason>`. The Reviewer's existing scope check (verify §29) becomes a simple grep against this enumerated list rather than a manual diff exploration.

**Why:** The 9-script leak in Epic 2 and the `nextscaffold/` leak in Epic 1 had the same structural shape — Developer wrote scratch artefacts to do their job, never circled back to clean up. An automated pre-review enumerator forces the cleanup decision in writing.

This is the develop-side counterpart to Patch 1 of the previous forge round (the `DEVELOP_NOOP` guard). Same instinct: surface the omission at the source instead of pushing it downstream.

### Patch 3 — `scripts/run-epic.sh` "verdict cross-check" before stage commit

Inside `commit_stage()` (or wherever the stage integration commit is gated), before issuing `git commit` / `git push`:

```bash
# Cross-check every review file's FINAL_VERDICT marker against the slice's
# task-status file. Stage commit only proceeds if every slice in the stage
# has FINAL_VERDICT: APPROVE in its review file.
for slice_idx in "${stage_slices[@]}"; do
  review_file="outputs/reviews/task-slice-${slice_idx}-review.md"
  if ! grep -q '<!-- FINAL_VERDICT: APPROVE -->' "$review_file"; then
    echo "ERROR: slice $slice_idx review file does not carry APPROVE marker" >&2
    echo "  review_file: $review_file" >&2
    grep -E '<!-- FINAL_VERDICT' "$review_file" >&2
    return 1
  fi
done
```

The current behaviour can let a stage commit through if `task-status` records APPROVE but the review file says REQUEST_CHANGES (status drift). The grep is the source of truth for the human-facing verdict and should be the authoritative gate.

**Why:** Restores trust in the runner's "all approved" summary line. Without this, every Epic completion has to be manually verified by re-reading every review file, which negates the automation's value.

### Patch 4 — `templates/role-planner.md` "Spec invariant grep" pre-check

Add a new step in the Pre-Start Checklist:

```markdown
- **Spec invariant grep**: For every numbered list, table, or
  enumeration in the spec doc that the slice claims to implement
  (e.g. "spec §5 lists 6 required fields: …"), copy that enumeration
  verbatim into the plan's "Implements" subsection. Then list the
  matching plan output (column / field / file / endpoint) inline.
  If the count or names do not match 1:1, either revise the plan
  or document the omission as an explicit deferral — never let the
  plan and the spec silently disagree.
```

Concrete example for the Epic 2 case:
```markdown
## Implements (vs spec)
- Spec §5 — UGC required fields:
  1. name             → DB column `restaurants.name_ja`
  2. naver_url        → DB column `restaurants.naver_url`
  3. is_solo          → DB column `restaurants.is_solo_default`
  4. has_jp_menu      → DB column `restaurants.has_jp_menu`
  5. is_late_night    → DB column `restaurants.is_late_night`
  6. reason           → DEFERRED to Epic 4 schema delta
```

**Why:** Forces Planner to look at the spec while writing the plan, not just at memory of the spec. Reviewer's job becomes simpler too: "does the plan's `## Implements (vs spec)` section enumerate every spec invariant relevant to this slice, and does the implementation match each row?"

---

## How to apply

These four patches are **not yet written as code**. The Epic 1 round shipped diff files; this round ships specs because:
- Patches 1 and 4 are pure documentation (role .md files) — straightforward to author once the design is approved.
- Patches 2 and 3 are bash logic with multiple integration points — better to design once than diff blindly.

Suggested sequence:
1. Forge owner reviews the four sketches. Reject any that don't fit the harness philosophy.
2. For approved patches, author the actual diffs against `harness-forge/src/`.
3. Build → bump `claude-code-harness-template` → next downstream project's `upgrade-harness.sh` picks them up.

If all four ship, the next project will surface the same kind of failures earlier (Develop self-reports unplanned files; Reviewer auto-rejects mismatched verdicts; Planner pre-checks spec coverage; Developer can't silently weaken invariants).

---

## Companion / context
- This document continues the line started in [`2026-04-25-bash3-noop-install.md`](./2026-04-25-bash3-noop-install.md). Forge round 1 fixed the most-mechanical defects; round 2 (this) targets the next layer up — semantic and process-level slips.
- Epic 1 + Epic 2 together provide the empirical surface area; honbabseoul has no other epics in flight.
- Honbabseoul-side improvements (test stack pinning, Supabase type generation, branch protection, CI, Vercel preview, monitoring) live in `docs/improvements/2026-04-26-priority-roadmap.md` — separate concern, not forge-relevant.
