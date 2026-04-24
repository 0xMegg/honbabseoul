# Example: Fitness Filter Good Output

## Request
"/harvest add 'Block commit if there are 3+ TODO comments in pre-commit hook'"

## Result

### Fitness Score: 8/10

| Axis | Score | Rationale |
|------|-------|-----------|
| Automation | 2 | Currently post-edit-check.sh treats TODO as WARN only. Moving this to pre-commit enables automatic blocking before commit |
| Friction | 2 | No "TODO accumulation" pitfall in gotchas.md, but "TODO neglect" pattern found 2 times in evaluations |
| HARD conversion | 2 | `grep -c 'TODO' | [ $(cat) -gt 3 ] && exit 1` — directly enforceable via bash exit code |
| Token efficiency | 0 | No direct impact on token usage |
| Measurability | 2 | TODO count trackable via `grep -rc 'TODO' src/` |

### Proposal
- Change type: `hook`
- Target: `.claude/hooks/pre-commit-todo-check.sh`
- Risk: `low`
- Verdict: **Requires approval** (hook changes are not eligible for auto-apply)
