# Component Assumption Registry

> "Every component in a harness encodes an assumption about model limitations.
> Those assumptions are worth stress-testing."
> — [Harness Design for Long-Running Apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)

As models improve, assumptions must be re-evaluated.
Remove components **one at a time** and measure the impact (never multiple at once).

---

## Registry

| Component | Assumption | Invalidation Test | Valid? | Last Checked |
|-----------|------|-------------|-------|----------|
| **3-Role separation** (Planner/Developer/Reviewer) | The model cannot objectively evaluate while simultaneously generating (GAN pattern) | Run generation + evaluation in a single session -> compare issue detection rates | ✅ Valid | 2026-04 |
| **Separate `claude -p` sessions** | Context contamination in long sessions degrades quality | Run 3-Role in a single session -> compare quality | ⚠️ Weakened (Opus 4.6 handles 2+ hours OK, but GAN separation itself remains valid) | 2026-04 |
| **Context Reset first** | Compaction causes "context anxiety" | /compact usage vs new session -> compare premature wrap-up frequency | ✅ Valid | 2026-04 |
| **Anti-Dismissal Rule** | The model silently dismisses issues it found itself | With vs without anti-dismissal prompt -> compare issue detection/reporting rates | ✅ Valid | 2026-04 |
| **Live Verification** | Static code review alone misses runtime bugs | Static review only vs including live verification -> compare issues found | ✅ Valid | 2026-04 |
| **Epic Stage decomposition** | The model cannot handle 10+ files with multiple concerns in a single session | Run a 10-file task without decomposition -> measure success rate | ⚠️ Weakened (Epic Lite introduced) | 2026-04 |
| **ITERATE verdict** | Design/UI quality does not converge in a single pass | 0 iterations vs 3 iterations -> compare design quality | ✅ Valid (blog: 5-15 iterations are effective) | 2026-04 |
| **post-edit-lint hook** | The model forgets or skips lint | Remove hook -> measure lint failure frequency found during review | ✅ Valid (low-cost insurance) | 2026-04 |
| **post-edit-test hook** | The model skips running related tests | Remove hook -> measure test failure frequency found during review | ✅ Valid (low-cost insurance) | 2026-04 |
| **Secret detection hook** | The model may accidentally commit secrets | Defensive measure — maintained regardless of model capability | ✅ Always valid | 2026-04 |
| **Quality Criteria weighting** | Without weighting, generic results that only pass functionality get APPROVE | With vs without weighting -> compare design quality | ✅ Valid (blog experiment results) | 2026-04 |
| **Handoff overwrite model** | In a context-reset environment, cumulative handoffs waste context | Cumulative vs overwrite -> compare read time/tokens at session start | ✅ Valid | 2026-04 |

---

## Review Cadence
- On model major updates (e.g., Opus 5.x)
- On harness version upgrades
- When the same failure repeats 3+ times

## Review Method
1. Remove **only one** suspected component
2. Run the same task before and after removal
3. Compare using 5 key metrics (success rate, human edit volume, time, tokens, failure types)
4. Update the "Valid?" column based on results
