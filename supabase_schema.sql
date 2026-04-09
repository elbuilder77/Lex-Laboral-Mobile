-- Lex Laboral - Supabase schema aligned to production access model
-- Products:
-- 1) mensualidad: generador + IMSS mientras la suscripción esté activa
-- 2) trimestralidad: generador + IMSS mientras la suscripción esté activa
-- 3) documento suelto: derecho a generar 1 documento
--
-- Nota:
-- Este archivo evita cambios destructivos automáticos. Las tablas legacy no se eliminan aquí.

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  is_premium boolean not null default false,
  license_type text,
  access_until timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_license_type_check
    check (license_type is null or license_type in ('mensualidad', 'trimestralidad'))
);

alter table public.users
  add column if not exists is_premium boolean not null default false,
  add column if not exists license_type text,
  add column if not exists access_until timestamptz,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists idx_users_stripe_customer_id
  on public.users (stripe_customer_id)
  where stripe_customer_id is not null;

create unique index if not exists idx_users_stripe_subscription_id
  on public.users (stripe_subscription_id)
  where stripe_subscription_id is not null;

create table if not exists public.user_entitlements (
  user_id uuid primary key references public.users(id) on delete cascade,
  single_document_uses_remaining integer not null default 0 check (single_document_uses_remaining >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_entitlements
  add column if not exists single_document_uses_remaining integer not null default 0,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.user_usage_monthly (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  month text not null,
  documents_generated_count integer not null default 0 check (documents_generated_count >= 0),
  imss_calculations_count integer not null default 0 check (imss_calculations_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_usage_monthly_unique unique (user_id, month)
);

alter table public.user_usage_monthly
  add column if not exists documents_generated_count integer not null default 0,
  add column if not exists imss_calculations_count integer not null default 0,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists idx_user_usage_monthly_user_month
  on public.user_usage_monthly (user_id, month);

create index if not exists idx_user_usage_monthly_month
  on public.user_usage_monthly (month);

create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  status text not null default 'processing'
    check (status in ('processing', 'processed')),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.stripe_webhook_events
  add column if not exists event_type text,
  add column if not exists status text not null default 'processing',
  add column if not exists processed_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_stripe_webhook_events_status
  on public.stripe_webhook_events (status);

-- =========================
-- Legacy data migration
-- =========================
insert into public.users (id, email)
select au.id, au.email
from auth.users au
on conflict (id) do update
set email = excluded.email;

insert into public.user_entitlements (user_id, single_document_uses_remaining)
select u.id, 0
from public.users u
on conflict (user_id) do nothing;

do $$
begin
  if to_regclass('public.user_credits') is not null then
    insert into public.user_entitlements (user_id, single_document_uses_remaining)
    select uc.user_id, greatest(coalesce(uc.draft_basic_balance, 0), 0)
    from public.user_credits uc
    on conflict (user_id) do update
    set single_document_uses_remaining = greatest(public.user_entitlements.single_document_uses_remaining, excluded.single_document_uses_remaining),
        updated_at = now();
  end if;
end;
$$;

do $$
begin
  if to_regclass('public.user_usage') is not null then
    insert into public.user_usage_monthly (user_id, month, documents_generated_count, imss_calculations_count)
    select
      uu.user_id,
      uu.month,
      sum(coalesce(uu.draft_basic_month_count, 0)) as documents_generated_count,
      sum(coalesce(uu.calculators_count, 0)) as imss_calculations_count
    from public.user_usage uu
    where uu.month is not null
    group by uu.user_id, uu.month
    on conflict (user_id, month) do update
    set documents_generated_count = greatest(public.user_usage_monthly.documents_generated_count, excluded.documents_generated_count),
        imss_calculations_count = greatest(public.user_usage_monthly.imss_calculations_count, excluded.imss_calculations_count),
        updated_at = now();
  end if;
end;
$$;

-- =========================
-- RLS
-- =========================
alter table public.users enable row level security;
alter table public.user_entitlements enable row level security;
alter table public.user_usage_monthly enable row level security;
alter table public.stripe_webhook_events enable row level security;

drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.users;

drop policy if exists "Users can view own entitlements" on public.user_entitlements;
create policy "Users can view own entitlements" on public.user_entitlements
  for select using (auth.uid() = user_id);

drop policy if exists "Users can view own monthly usage" on public.user_usage_monthly;
create policy "Users can view own monthly usage" on public.user_usage_monthly
  for select using (auth.uid() = user_id);

-- =========================
-- Helpers
-- =========================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row execute procedure public.set_updated_at();

drop trigger if exists set_user_entitlements_updated_at on public.user_entitlements;
create trigger set_user_entitlements_updated_at
before update on public.user_entitlements
for each row execute procedure public.set_updated_at();

drop trigger if exists set_user_usage_monthly_updated_at on public.user_usage_monthly;
create trigger set_user_usage_monthly_updated_at
before update on public.user_usage_monthly
for each row execute procedure public.set_updated_at();

drop trigger if exists set_stripe_webhook_events_updated_at on public.stripe_webhook_events;
create trigger set_stripe_webhook_events_updated_at
before update on public.stripe_webhook_events
for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  insert into public.user_entitlements (user_id, single_document_uses_remaining)
  values (new.id, 0)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
