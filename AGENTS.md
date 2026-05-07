# Honbabseoul Hermes Entry

Read order for fresh agents:

1. `.hermes/SOUL.md` — judgment posture.
2. `.hermes/USER.md` — user and collaboration preferences.
3. `.hermes/NEXT.md` — active handoff pointer and next action.
4. `.hermes/MEMORY.md` — operational memory boundary and current observations.
5. `.hermes/policy/automation.md` — change classification and human-gate rules.
6. `.hermes/policy/agent-workflow.md` — Claude/Codex plan, verification, implementation, and closeoff workflow.
7. `.hermes/policy/promotion.md` — Core/project rule propagation.
8. `.hermes/policy/harness-review.md` — operating-layer review boundary.
9. `.hermes/policy/claude-cli.md` — Claude CLI invocation boundary.
10. `.hermes/wiki/pages/hermes-operating-model.md` — full Hermes model.
11. `.hermes/wiki/pages/hermes-rejected-options.md` — decisions not to re-derive.
12. `.hermes/wiki/index.md` — project knowledge index.
13. `.hermes/wiki/pages/honbabseoul-conventions.md` — project-specific development conventions.
14. `.hermes/wiki/pages/honbabseoul-state.md` — current project state and carry-over.

Precedence: `AGENTS.md` > `.hermes/policy/` > `.hermes/SOUL.md` > `.hermes/USER.md` > `.hermes/NEXT.md` > `.hermes/MEMORY.md` > `.hermes/wiki/`.

1. Verification is the completion condition. An unverified result is not done.
2. Auto-apply only additive, reversible, measurable changes.
3. Behavior, ownership, permission, execution-flow, or project-judgment changes require a human gate.
4. Destructive or hard-to-reverse actions are blocked unless the user explicitly approves a scoped plan.
5. Decision trace is part of the artifact. Record important decisions in `.hermes/logs/log.md`.
6. Keep boundaries clean: source/provenance in `.hermes/raw/`, knowledge in `.hermes/wiki/`, procedures in `.hermes/skills/`, policy in `.hermes/policy/`, operational memory in `.hermes/MEMORY.md`.
7. Wiki pages require raw provenance. Do not create durable knowledge without a source.
8. The legacy Claude/Codex harness is retired as active authority. Use `.hermes/archive/legacy-harness-2026-05-03/` only as source material.

Active handoff authority is `.hermes/NEXT.md`. Chat history and legacy handoff files are not durable handoff state.
