# Honbabseoul Hermes Source Manifest

This manifest lists source material used to initialize the Honbabseoul Hermes operating layer.

## Hermes Core Sources

- Hermes Core root: `/Users/mero/Dev/13.claude/templates/hermes-essence/`.
- Core automation policy: `/Users/mero/Dev/13.claude/templates/hermes-essence/policy/automation.md`.
- Core promotion policy: `/Users/mero/Dev/13.claude/templates/hermes-essence/policy/promotion.md`.
- Core harness review policy: `/Users/mero/Dev/13.claude/templates/hermes-essence/policy/harness-review.md`.
- Core operating model: `/Users/mero/Dev/13.claude/templates/hermes-essence/wiki/pages/hermes-operating-model.md`.
- Core rejected options: `/Users/mero/Dev/13.claude/templates/hermes-essence/wiki/pages/hermes-rejected-options.md`.

## Cutover Sources

- Baseline commit before clean cutover: `216e9c6`.
- Mixed-state snapshot branch: `snapshot/pre-hermes-cutover-20260503`.
- Mixed-state tag: `snapshot-pre-hermes-20260503`.
- Ignored-file snapshots: `/private/tmp/honbabseoul-hermes-snapshots/`.
- Legacy harness archive: `.hermes/archive/legacy-harness-2026-05-03/`.

## Honbabseoul Local Sources

- Product context: `context/about-me.md`.
- Access policy: `context/access-policy.md`.
- MCP policy: `context/mcp-policy.md`.
- Decision log: `context/decision-log.md`.
- Product docs: `docs/project-plan.md`, `docs/deployment.md`.

## Use Rule

Use Hermes Core for reusable operating-layer policy. Use the legacy harness archive only as source material when reconstructing pre-cutover project state. Use Honbabseoul local sources for product conventions, current product state, restrictions, and verification defaults.
