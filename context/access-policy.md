# AI Tool Access Policy

The purpose of this document is not legalistic language,
but to quickly draw the line between what is automated convenience and what requires human approval.

## Allowed by Default (Automatically Permitted)
- Read, Edit, Write within approved work folders
- lint, test, build commands
- git add, commit, push (after Reviewer APPROVE)
- approved plugins from managed marketplace

## Requires Human Approval
- Production deployment
- Sending customer-facing emails/messages
- Scheduled tasks with external side effects
- Production database writes
- New MCP server connections
- Adding new dependencies (packages)

## Blocked
- Reading/modifying `.env*` files
- Destructive shell commands (rm -rf, git push --force, git reset --hard)
- Unapproved MCP servers
- Editing files outside approved repositories
- Hardcoding secrets/API keys in code

## Permission Scope
- Managed (IT/org-enforced) > Command line > Local > Project > User
- Team shared: CLAUDE.md + .claude/settings.json
- Personal local: CLAUDE.local.md + .claude/settings.local.json
- Why this distinction matters: to avoid mixing team standards with personal convenience settings

## High-Risk Operation Approval Thresholds
- Tasks modifying 3+ files → Planner must create a plan first
- Tasks affecting production → must have human approval
- Accessing sensitive data → test in an isolated environment first

## 4-Layer Enforcement Structure
| Layer | Role |
|----|------|
| Documentation | Team policies, approval criteria, prohibited paths, external sending rules |
| Configuration | managed settings, permission rules, plugin/MCP allowlist |
| Runtime Enforcement | hooks, path validation, approval UI, review steps |
| Post-Execution Trace | session trace, diff, review notes, usage records |

If any of these four layers is missing, the balance breaks down.
