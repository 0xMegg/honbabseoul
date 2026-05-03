-- Migration: 0002_submission_reason
-- Stores the submitter-provided UGC recommendation reason on pending rows.

begin;

alter table restaurants
  add column if not exists reason text;

commit;
