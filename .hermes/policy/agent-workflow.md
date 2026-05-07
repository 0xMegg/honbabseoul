# Honbabseoul Agent Workflow Policy

Status: Local, adopted by direct user request on 2026-05-07.

Honbabseoul uses a split Claude/Codex workflow for product and operating-layer work when both agents are available.

## Source Provenance

- User request on 2026-05-07: "혼밥에서도 claude가 plan하고 codex가 검증, claude가 구현, closeoff는 codex가 하는 업무 흐름을 갖고 싶어."
- Existing automation boundary: `.hermes/policy/automation.md`.
- Existing peer review boundary: `.hermes/policy/harness-review.md`.
- Existing Claude invocation boundary: `.hermes/policy/claude-cli.md`.

## Default Flow

1. Claude plans.
2. Codex verifies the plan.
3. Claude implements the approved plan.
4. Codex performs closeoff.

This is the preferred operating flow, not a permission bypass. All work remains subject to `AGENTS.md`, `.hermes/policy/automation.md`, and destructive-change approval rules.

## Claude Plan

Claude should produce a scoped plan before implementation when the task affects source behavior, workflow, ownership, permissions, project judgment, deployment, data, or user-facing product flow.

The plan should identify:

- Target files or surfaces.
- Risk classification.
- Human gates, if any.
- Verification required for completion.
- Expected closeoff evidence.

## Codex Plan Verification

Codex verifies the Claude plan before implementation by checking:

- Fit with `AGENTS.md` and `.hermes/policy/`.
- Whether the plan crosses a human gate.
- Whether the plan scope is narrower than the requested outcome.
- Whether verification is concrete and sufficient.
- Whether current project state in `.hermes/NEXT.md` changes the next action.

If the plan is incomplete, Codex should ask Claude to revise or narrow it. If the plan crosses a human gate, Codex asks the user before implementation.

## Claude Implementation

Claude implements the verified plan when available and able to edit the required workspace files.

For pull-request work, Claude's implementation boundary ends at a reviewable branch or PR-ready state. Claude may prepare code, tests, documentation, and a PR package, but should not merge into the protected base branch or trigger the final deployment path.

Claude should not expand scope beyond the verified plan without returning to plan verification.

## Codex Closeoff

Codex owns closeoff. Closeoff means:

- Inspect the final diff.
- Run or confirm the agreed verification.
- Merge the PR when merge is the approved completion path.
- Confirm deployment status when merge triggers deployment.
- Run deployed smoke verification when the task affects deployed behavior.
- Check whether documentation, handoff, or logs need updates.
- Record important decisions and verification results in `.hermes/logs/log.md`.
- Report the final state to the user.

Merge is not an implementation step. A merged but unverified PR is not closed.

## Blocked Claude Exception

If Claude is unavailable, blocked by permissions, or hangs without producing useful output, Codex may continue only when at least one is true:

- The user explicitly asks Codex to proceed.
- The work is additive, reversible, low-risk, and within the already approved scope.
- The work is narrowly needed to restore verification or unblock the requested closeoff without expanding product or operating authority.

When using this exception, Codex follows `.hermes/policy/claude-cli.md` diagnostic order and records the Claude failure layer and the reason for continuing in `.hermes/logs/log.md`.
