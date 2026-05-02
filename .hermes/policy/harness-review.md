# Hermes Harness Review Policy

Status: Adopted from Hermes Core Incubating policy on 2026-05-03.

Harness or Hermes operating-layer changes should receive available peer-agent review before the change takes effect, after any required human gate.

Current peer-agent reviewers for this workspace are Claude and Codex. This reviewer set is operational, not part of the invariant.

## Source Provenance

- Hermes Core policy: `/Users/mero/Dev/13.claude/templates/hermes-essence/policy/harness-review.md`.
- Hermes Core promotion policy: `/Users/mero/Dev/13.claude/templates/hermes-essence/policy/promotion.md`.
- Honbabseoul cutover log: `.hermes/logs/log.md`.
- Mixed-state snapshot branch: `snapshot/pre-hermes-cutover-20260503`.
- Claude and Codex review on 2026-05-03.

## Scope

This policy applies to:

- Edits to `.hermes/policy/`, `AGENTS.md`, `.hermes/SOUL.md`, `.hermes/skills/`, hooks, or adapters.
- Any change, wherever located, that affects permissions, ownership, execution flow, handoff structure, project memory boundaries, automation boundaries, or agent operating authority.

Typo-only documentation or wiki edits are excluded unless they affect authority, procedure, or active operating guidance.

## Review Standard

Peer-agent review checks:

- Whether the change stays inside the human-approved scope.
- Whether it fits `.hermes/policy/automation.md` and `.hermes/policy/promotion.md`.
- Whether it changes behavior, ownership, permissions, execution flow, or project judgment.
- Whether verification and logging are sufficient for the changed operating surface.

## Recording

Record the decision, source evidence, review result, and verification in `.hermes/logs/log.md`.

Future local changes to this policy follow `.hermes/policy/promotion.md` and `.hermes/policy/automation.md`.
