-- Migration: 0001_restaurants
-- Creates the restaurants table with restaurant_status + price_range enums and RLS policies.
-- Wrapped in a single transaction so any DDL failure rolls back cleanly.

begin;

-- pgcrypto provides gen_random_uuid(); Supabase enables it by default
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- Enum types
-- ─────────────────────────────────────────────────────────────────────────────

create type restaurant_status as enum ('pending', 'approved', 'rejected');
create type price_range as enum ('low', 'mid', 'high');

-- ─────────────────────────────────────────────────────────────────────────────
-- Core table
-- ─────────────────────────────────────────────────────────────────────────────

create table restaurants (
  id               uuid          primary key default gen_random_uuid(),
  name_ja          text,
  name_ko          text,
  address_ja       text,
  address_ko       text,
  latitude         double precision,
  longitude        double precision,
  price_range      price_range,
  status           restaurant_status not null default 'pending',
  is_solo_default  boolean       not null default true,
  has_jp_menu      boolean       not null default false,
  is_late_night    boolean       not null default false,
  naver_url        text,
  photo_url        text,
  created_at       timestamptz   not null default now(),
  updated_at       timestamptz   not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Trigger: keep updated_at current on every row update
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function set_updated_at()
  returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger restaurants_set_updated_at
  before update on restaurants
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Trigger: silently coerce anon INSERT status to 'pending'
--
-- auth.role() reads request.jwt.role, which PostgREST sets per-request.
-- Returns 'anon' for unauthenticated REST calls; NULL for direct psql
-- connections (so seed/admin inserts are not affected).
-- NOTE: PostgreSQL evaluates RLS WITH CHECK *after* BEFORE INSERT triggers
-- (the same model as table CHECK constraints). The trigger above coerces
-- `new.status` to 'pending' first, and the policy below then verifies the
-- post-trigger row really is 'pending' — defense-in-depth, so a future
-- migration that drops/breaks the trigger still cannot let anon write a
-- non-pending row. Verified empirically 2026-04-25.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function force_pending_for_anon()
  returns trigger as $$
begin
  if auth.role() = 'anon' then
    new.status := 'pending';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger restaurants_force_pending_for_anon
  before insert on restaurants
  for each row execute function force_pending_for_anon();

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────

alter table restaurants enable row level security;

-- Anon users see only approved restaurants
create policy "anon read approved"
  on restaurants for select
  to anon
  using (status = 'approved');

-- Anon users may insert; the trigger above forces status = 'pending' first
-- (BEFORE INSERT runs first), then this WITH CHECK verifies the post-trigger
-- row. Both guards are required: the trigger normalises the value, the
-- WITH CHECK enforces the invariant if the trigger ever regresses.
create policy "anon insert pending only"
  on restaurants for insert
  to anon
  with check (status = 'pending');

-- No anon UPDATE or DELETE policies → RLS denies by default.

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes for the public read path
-- (Slice 3 always filters status='approved', frequently filters is_solo_default)
-- ─────────────────────────────────────────────────────────────────────────────

create index restaurants_status_idx      on restaurants (status);
create index restaurants_status_solo_idx on restaurants (status, is_solo_default);

commit;
