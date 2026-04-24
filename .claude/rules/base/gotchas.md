# Project Gotchas

Project-specific pitfalls that cause repeated mistakes.
Add entries as you discover them — each bug fix or unexpected behavior is a candidate.

## Known Pitfalls
- Run existing tests before modifying code — if they already fail, fix or flag before starting your task
- When lint or tests fail, paste the full error output into your next fix attempt — never guess the cause from the test name alone
- Implement one function or feature at a time — verify it works before moving to the next. Large-scope changes produce jumbled, undebuggable output
- Reference real file paths and symbol names in task specs — never describe code by concept alone. Vague references produce hallucinated paths and wasted cycles
- If the same fix fails 3 times, stop — reassess the approach instead of retrying. Endless retry loops waste tokens and context
- Run lint/test before requesting code review — computational checks (lint, type-check, test) must pass before LLM-based review. Never waste review cycles on code with syntax errors
- When context nears 70% capacity, proactively /compact or start a fresh session — degraded context produces hallucinations and forgotten instructions. Write handoff before resetting
- When the topic changes, run `/clear` to drop accumulated context — long mixed sessions burn quota on unrelated history every turn
- When the agent heads in the wrong direction, press `ESC` immediately and use `/rewind` to restore a clean checkpoint — do not let a bad trajectory keep spending tokens
- For complex tasks, enter Plan Mode (`Shift+Tab`) to validate the approach before implementation — rework costs far more than upfront planning
- In long sessions, check usage with `/context` and `/cost` — judge by numbers, not by feel; plan session splits based on actual consumption
- Model selection is handled by command frontmatter (`/plan` + `/review` → Opus, `/develop` + `/task` + `/epic` → Sonnet). Opus consumes quota meaningfully faster — do not override to Opus for routine implementation
