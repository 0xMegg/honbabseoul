# Plugin Guide

## Skill vs Plugin — When to Promote

| Promote to Plugin | Keep as Skill |
|---|---|
| When you need to reduce onboarding for the entire team | Still in the personal experimentation phase |
| When you need to bundle skill + hook + MCP + command for one-step installation | Single routine, preference-based settings |
| When deploying an entire workspace for a specific language/role | Unverified workflows |

Key principle: Real-world usage determines validation — not central planning.
Try it first in an experimental folder or sandbox repository,
then promote it to an install marketplace or shared plugin once the team shows real adoption.

## Plugin Structure

```
plugin-name/
├── PLUGIN.md           # Description, installation, dependencies
├── skills/             # Included Skills
├── hooks/              # Automated intervention rules
├── .mcp.json           # MCP connection settings
├── settings.json       # Permission settings
└── examples/           # Usage examples
```

A Plugin is heavier than a single Skill — because it can include skills, agents, hooks, MCP,
and configuration files together. Always verify the included files and permission scope before installation.

## External Plugin Security Checklist

1. **Look beyond SKILL.md** — Inspect contents of scripts/, assets/, references/
2. **Network calls** — Are there external URL fetches or API calls?
3. **Tool scope** — Is allowed-tools excessively broad?
4. **Required permission level** — Is read-only sufficient, or is write/execute needed?
5. **Isolated environment testing** — Test in an isolated environment first if handling customer data
6. **Use test accounts** — Test automation features with a test account + separate browser profile first
7. **Approval for team deployment** — Deploy to team-shared systems only after allowlist + approval process

## Trust Order

1. Official repositories or organization-managed assets
2. Community assets reviewed within the team
3. External/personal assets only in isolated test environments

## Deployment Strategy

- **Small teams**: Keep skills in `./.claude/skills` and version-control together (simple)
- **Growing teams**: Move to an internal marketplace or plugin distribution (curated)
- **Both**: Follow the flow of experimental folder -> team validation -> public deployment
