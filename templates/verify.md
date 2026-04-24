# Verification Plan

## Task
[Task N] — [Task name]

## Completion Criteria
Coordinates so both model and human see the same finish line.
- [ ] [Functional completion criterion 1]
- [ ] [Functional completion criterion 2]

## Automated Checks
Run in order. Stop on first failure.
1. Lint/Analyze: `pnpm lint`
2. Type check: `pnpm exec tsc --noEmit`
3. Targeted test (changed area): `pnpm test <path>` (Vitest)
4. Full test suite: `pnpm test`
5. Build: `pnpm build`
6. E2E (UI-touching tasks only): `pnpm test:e2e` (Playwright, needs dev server or preview server)

## Live Verification (UI/API tasks)
Reviewer verifies against a running app to catch runtime bugs invisible in static review.
1. Start dev server: `pnpm dev` (use `run_in_background: true` and kill before marking done)
2. Happy path:
   - [ ] [Normal scenario — e.g., "valid email/password signup → redirects to main"]
3. Edge cases:
   - [ ] [Edge 1 — e.g., "empty form submit shows error"]
   - [ ] [Edge 2 — e.g., "duplicate email shows conflict"]
4. API endpoints (if applicable):
   - [ ] [curl/Postman: valid request returns expected response]
   - [ ] [Invalid input returns proper error]

For pure logic/refactoring tasks, mark this section "N/A — pure logic change".

## Quality Criteria (design/creative tasks)
Even if functional, subpar quality → ITERATE verdict.
Skip this section for non-design tasks.

1-10 scale, weighted:
- Design Quality (×3): visual hierarchy, spacing, typography consistency
- Originality (×3): avoids generic/template patterns, unique character
- Craft (×2): detail polish, transitions, responsiveness
- Functionality (×2): correctness, edge case handling

Weighted sum below 70/100 → ITERATE (must specify improvement targets)

## Constraints
- Do NOT modify tests to make them pass
- Do NOT touch protected files: [list]
- Task is not complete until live verification passes

## Rollback Point
- Revert target: [specific files or git revert strategy]
- Safe to keep: [files that survive rollback]

## Report
After verification, record:
- What changed:
- What passed:
- What failed:
- What needs human confirmation:
- Confidence level: HIGH / MEDIUM / LOW
