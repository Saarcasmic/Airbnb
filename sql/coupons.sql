-- Coupons for pyari-kunj.in — run once in the Supabase SQL editor.
--
-- SECURITY NOTE, read before changing anything here:
-- RLS is ON and there are deliberately NO policies. That means the public anon
-- key (which is embedded in js/app.js and is safe to be) can read NOTHING from
-- this table. If you add a "read for anon" policy, every code you have ever
-- created — including ones you only sent to a single guest — becomes readable
-- by anyone who opens the browser console. Guest-facing reads go through
-- /api/coupon, which answers about one code at a time using the service_role
-- key and never lists.

create extension if not exists pgcrypto;

create table if not exists public.coupons (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,               -- always stored UPPERCASE
  percent_off int  not null check (percent_off between 1 and 99),
  label       text not null default 'Festive offer',  -- shown on the site banner
  active      boolean not null default true,      -- false = paused, stops working immediately
  featured    boolean not null default false,     -- true = advertised in the homepage banner
  created_at  timestamptz not null default now()
);

alter table public.coupons enable row level security;

-- Only one coupon may be advertised on the site at a time. The admin API
-- clears the previous one before setting a new one; this index is the
-- backstop that makes a second one impossible even if that ever races.
create unique index if not exists coupons_single_featured
  on public.coupons (featured) where featured;
