# Work Plan

## Task
Epic 3 / Slice 2 — Supabase types autogen

## Status
Deferred. This file is no longer an active work plan.

## Reason
This Slice 2 plan was produced as an old-harness trial before a planned harness overhaul. The user decided not to proceed with Epic 3 / Slice 2 in the current harness and to run it later under the new harness.

## Current Implementation State
- `src/lib/supabase/types.gen.ts` has not been created.
- `package.json` has no `db:types` script.
- `context/decision-log.md` has no `Supabase generated types` entry.
- No verification gates for this slice have been run.

## Next Owner
The new harness should re-plan and execute this slice from scratch.

## Historical Note
The previous long-form old-harness plan described:
- generating `src/lib/supabase/types.gen.ts` from the live Supabase project,
- adding a `db:types` script,
- recording generated types as a static-side backstop in `context/decision-log.md`,
- verifying typecheck, lint, tests, build, and idempotent regeneration.

Treat that as context only, not as an active plan.
