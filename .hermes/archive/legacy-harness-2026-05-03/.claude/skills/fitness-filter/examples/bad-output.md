# Counterexample: Fitness Filter Rejected Cases

These are proposals that look reasonable on the surface but **must be rejected**. They exist to calibrate the filter against sycophantic over-scoring — when in doubt, score strictly and reject.

---

## Case 1: Abstract Proposal (Concreteness Gate Fail)

### Request
"/harvest add 'Improve error handling in scripts so failures are easier to debug'"

### Result: REJECTED — `abstract-proposal`

This proposal fails the **Pre-Filter: Concreteness Gate** before scoring even starts:

| Required | Provided? |
|---|---|
| Target file (exact path) | ✗ "scripts" is a directory, not a file |
| Triggering condition (observable event) | ✗ "failures" is not specific |
| Action (exact behavior) | ✗ "easier to debug" is aspirational |

**Common mistake**: An LLM might invent specifics to make this pass — e.g., "I'll interpret this as adding `set -euo pipefail` to all scripts in `scripts/`". **Do not do this.** The concreteness gate exists precisely to force the proposer to make these decisions, not the filter. Reject and ask the user to resubmit with concrete specifics.

### Why this matters
Vague proposals consume judgment cycles, produce low-quality applies, and bypass user intent. The gate is the cheapest place to stop them.

---

## Case 2: Plausible Documentation Proposal (Sub-threshold)

### Request
"/harvest add 'Add a CONTRIBUTING.md explaining how to submit harvest items, with sections on naming, scope, and review criteria'"

### Result: REJECTED — `low-fitness` (1/10)

This passes the concreteness gate (target file `CONTRIBUTING.md`, action "add document with 3 sections"), but fails 5-axis scoring:

| Axis | Score | Rationale |
|------|-------|-----------|
| Automation | 0 | A document does not eliminate any manual step |
| Friction | 0 | No "missing contribution guide" pitfall in `gotchas.md`; not addressing existing friction |
| HARD conversion | 0 | Documents cannot be enforced via `exit 1`. There is no mechanical check that "this PR followed CONTRIBUTING.md" |
| Token efficiency | 0 | Adds context cost on every session that loads it; no offsetting savings |
| Measurability | 1 | Indirect — "harvest item rejection rate" might move, but causality is weak |

**Total: 1/10** → below the 6-point threshold → rejected.

### Common mistake
An LLM trained to be helpful will instinctively score this around 5–7 ("docs are good, right?"). **Resist this.** The fitness filter is project-specific: "good in general" ≠ "fits this harness". If you cannot point to an axis where the proposal genuinely earns its points against the criteria, score 0.

### When this would be different
The same document **could** earn points if rebound to a friction it actually addresses — e.g., if `gotchas.md` contained "harvest items get re-submitted with the same vague description because there is no template". Then `templates/harvest-proposal.md` (a structured template, not prose) would earn Automation 1, Friction 2, HARD 1 (template structure can be lint-checked), Measurability 1 = 5/10. Still sub-threshold, but for a defensible reason.

---

## Case 3: Subjective Behavior Change (HARD = 0)

### Request
"/harvest add 'When reviewing PRs, the reviewer should think more carefully about edge cases before approving'"

### Result: REJECTED — `low-fitness` (1/10) + concreteness concern

Concreteness gate is borderline: "edge cases" is vague but "PR review" is a specific event. We give it the benefit of the doubt and proceed to scoring:

| Axis | Score | Rationale |
|------|-------|-----------|
| Automation | 0 | "Think more carefully" is not automatable |
| Friction | 1 | `gotchas.md` does mention "Run lint/test before requesting code review" but that already covers mechanical checks |
| HARD conversion | **0** | This is the disqualifying axis. There is no `exit 1` that means "the human thought hard enough" |
| Token efficiency | 0 | No prompt change |
| Measurability | 0 | "Carefulness" has no metric |

**Total: 1/10**

### Why HARD = 0 is decisive
Even if every other axis scored 2, a proposal with HARD = 0 is purely a behavior aspiration. The harness cannot enforce it — at best it becomes another rule to ignore. **Reject anything where HARD conversion is 0**, regardless of how virtuous the intent sounds. This is what `gotchas.md` warns: *"If HARD conversion is 0, it cannot be enforced as a rule, so effectiveness is low."*

---

## Calibration check
If you find yourself scoring 6+ on any of these three cases, stop and re-read the axis definitions. The filter is intentionally strict: a 6/10 means the proposal **earns** 3+ axes, not that it "seems okay".
