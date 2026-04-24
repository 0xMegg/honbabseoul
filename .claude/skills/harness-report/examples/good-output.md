# Example: Harness Report Good Output

## Request
"Check harness score"

## Result
```
Harness quality score: 67/100

Per-area breakdown:
- Rules:       13/20 (5 files, solid content)
- Skills:      15/20 (3 skills, 2 with examples)
- Hooks:       15/15 (4 hooks, all executable) ✓ perfect score
- Templates:   11/15 (11 templates, 4 filled)
- Evaluations:  4/10 (2 records)
- Test/Lint:    9/20 (lint pass, tests partial)

Improvement priorities:
1. Evaluations (+6): Write 2 more evaluation.md entries after completing tasks
2. Skills (+5): Add examples/ to code-review skill
3. Test/Lint (+11): Expand test coverage

Baseline updated: harvest/baseline.json
```
