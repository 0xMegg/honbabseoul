---
name: harness-report
description: |
  Measures and reports harness quality scores.
  Activate on these requests:
  "harness score", "harness report", "harness status", "quality measurement", "check baseline",
  "score check", "harness report"
  Do NOT activate on:
  "collect trends", "harvest", "code review", "fix bug"
version: 1.0.0
---

# Harness Report Skill

Measures the current quality score of the harness.

## Trigger
- "check the harness score", "harness report", "update baseline", "measure quality"

## Workflow

### 1. Run Measurement
```bash
bash scripts/harness-report.sh quick
```
Or full measurement:
```bash
bash scripts/harness-report.sh
```

### 2. Interpret Results
- **80+**: Healthy harness. Rules/skills/hooks are robust and evaluation records exist
- **50-79**: Average. Some areas need reinforcement
- **Below 50**: Early stage. Prioritize reinforcing skills, evaluation records, etc.

### 3. Improvement Suggestions
Identify areas with low scores and suggest specific improvement actions:
- rules low → reinforce gotchas.md, add project-specific rules
- skills low → extract repetitive workflows into skills
- hooks low → add post-edit verification
- evaluations low → build the habit of writing evaluation.md after each task
- test_lint low → verify lint/test command configuration

### 4. Baseline Update
Measurement results are automatically saved to `harvest/baseline.json`.

## Output Format
Score in JSON format + per-area breakdown.

## Gotchas
- Quick mode skips test/lint, so 20 points are omitted
- Measurement is based on the project root, not template files (src/)
- Skills directory must be at .claude/skills/ to be recognized
