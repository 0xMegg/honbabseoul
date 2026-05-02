# Verification Plan

## Task
Epic 3 / Slice 2 — Supabase types autogen

## Status
Deferred. This file is no longer an active verification plan.

## Reason
Epic 3 / Slice 2 was only planned as an old-harness trial. The user decided to leave it unimplemented in the current harness and rerun it under the new harness.

## Verification State
- Not run.
- No implementation files exist for this slice.
- No pass/fail result should be inferred from the previous old-harness verification checklist.

## Required Future Verification
When the new harness picks this up, it should verify at minimum:
- generated Supabase `Database` types exist and include the live `restaurants` schema,
- `package.json` exposes `db:types`,
- the decision log records the generated-types decision,
- typecheck, lint, tests, build, and type regeneration pass under the new harness rules.

Treat this as a placeholder marker only.
