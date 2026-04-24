---
name: code-review
description: >
  Code review workflow. Activate on requests like:
  "review this code", "is this safe to merge?", "is this code safe?",
  "check this PR", "review the changes", "review this code",
  "is this safe to merge", "check this PR"
  Do NOT activate on:
  "write code for me", "implement this", "build a new feature", "fix this bug"
version: 3.0.0
---

# Code Review Skill

## Objective
Review code changes and provide actionable feedback organized by severity.

## Inputs
- The diff or files to review
- Context about what the change is supposed to do

## Process

### 1. Understand Intent
- Read the Task description or plan
- Understand what problem the change solves

### 2. Read the Diff
- Read all changed files in full
- Note the scope of changes

### 3. Check for Issues (in priority order)

#### Critical (must fix)
- Security: hardcoded secrets, auth bypass
- Data loss risk
- Missing error handling on external calls
- Broken functionality (wrong routes, broken API)
- Supabase service-role key referenced from a `"use client"` module or shipped to the client bundle
- Public query missing `status='approved'` filter (leaks pending UGC onto the map)

#### Important (should fix)
- Architecture rule violations (see .claude/rules/base/ and .claude/rules/local/)
- Missing tests for new behavior — Vitest for pure logic/components, Playwright for user-visible flows
- Hardcoded values (config, URLs, colors, shadows, radii)
- Direct `@supabase/supabase-js` import outside `src/lib/repositories/*` or `src/lib/supabase/*`
- Naver Maps SDK imported outside a `next/dynamic({ ssr: false })` client module

#### Minor (nice to fix)
- Naming improvements
- Code organization
- Documentation gaps

### 4. Report Format
```
## Review Report

**Overall:** APPROVE / REQUEST_CHANGES / NEEDS_DISCUSSION

### Critical
- [file:line] description + suggested fix

### Important
- [file:line] description + suggested fix

### Minor
- [file:line] description

### Good
- What was done well (reinforce good patterns)
```

### 5. Verify
- Run lint/analyze and check the results
- Run tests and check the results
- Compare report findings against actual tool output

## Gotchas
- Do not mix style nitpicks with real issues
- Mark uncertain areas as "needs confirmation" — do not APPROVE/REJECT based on guesses
- The Reviewer must not modify code directly (report only)
- Record out-of-scope code quality issues as separate Tasks

## Project-Specific Checks
- [ ] Feature-local first: changes stay in one feature directory unless explicitly cross-cutting
- [ ] i18n discipline: no inline Japanese/Korean string literals in `.tsx`; every user-visible string flows through next-intl
- [ ] Token discipline: no hardcoded colors, shadows, or radii; Tailwind utilities only when mapped to `--hb-*` via config (or `bg-[var(--hb-*)]`)

## Verdict Criteria
- Any Critical → REQUEST_CHANGES
- Only Important → defer to Developer's judgment
- Only Minor → APPROVE
