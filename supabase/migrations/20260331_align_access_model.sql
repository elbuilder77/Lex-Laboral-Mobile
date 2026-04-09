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

alter table public.users enable row level security;
alter table public.user_entitlements enable row level security;
alter table public.user_usage_monthly enable row level security;

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

create or replace function public.grant_single_document_use(
  p_user_id uuid,
  p_quantity integer default 1
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_remaining integer;
begin
  insert into public.user_entitlements (user_id, single_document_uses_remaining)
  values (p_user_id, greatest(p_quantity, 0))
  on conflict (user_id) do update
    set single_document_uses_remaining = public.user_entitlements.single_document_uses_remaining + greatest(p_quantity, 0),
        updated_at = now()
  returning single_document_uses_remaining into v_remaining;

  return coalesce(v_remaining, 0);
end;
$$;

create or replace function public.consume_document_access(
  p_user_id uuid,
  p_monthly_limit integer default 100
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_premium boolean;
  v_access_until timestamptz;
  v_current_month text := to_char(now(), 'YYYY-MM');
  v_current_count integer;
  v_remaining integer;
begin
  select is_premium, access_until
  into v_is_premium, v_access_until
  from public.users
  where id = p_user_id;

  if not found then
    raise exception 'Usuario no encontrado';
  end if;

  if v_is_premium and v_access_until is not null and v_access_until > now() then
    insert into public.user_usage_monthly (user_id, month, documents_generated_count)
    values (p_user_id, v_current_month, 1)
    on conflict (user_id, month) do update
      set documents_generated_count = public.user_usage_monthly.documents_generated_count + 1,
          updated_at = now()
      where public.user_usage_monthly.documents_generated_count < p_monthly_limit
    returning documents_generated_count into v_current_count;

    if v_current_count is null then
      return jsonb_build_object(
        'allowed', false,
        'reason', 'fair_use_limit',
        'currentCount', p_monthly_limit
      );
    end if;

    return jsonb_build_object(
      'allowed', true,
      'reason', 'subscription',
      'currentCount', v_current_count
    );
  end if;

  update public.user_entitlements
  set single_document_uses_remaining = single_document_uses_remaining - 1,
      updated_at = now()
  where user_id = p_user_id
    and single_document_uses_remaining > 0
  returning single_document_uses_remaining into v_remaining;

  if v_remaining is not null then
    return jsonb_build_object(
      'allowed', true,
      'reason', 'single_document',
      'remaining', v_remaining
    );
  end if;

  return jsonb_build_object(
    'allowed', false,
    'reason', 'no_access'
  );
end;
$$;

create or replace function public.record_imss_usage(
  p_user_id uuid,
  p_monthly_limit integer default 250
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_premium boolean;
  v_access_until timestamptz;
  v_current_month text := to_char(now(), 'YYYY-MM');
  v_current_count integer;
begin
  select is_premium, access_until
  into v_is_premium, v_access_until
  from public.users
  where id = p_user_id;

  if not found then
    raise exception 'Usuario no encontrado';
  end if;

  if not (v_is_premium and v_access_until is not null and v_access_until > now()) then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'no_subscription'
    );
  end if;

  insert into public.user_usage_monthly (user_id, month, imss_calculations_count)
  values (p_user_id, v_current_month, 1)
  on conflict (user_id, month) do update
    set imss_calculations_count = public.user_usage_monthly.imss_calculations_count + 1,
        updated_at = now()
    where public.user_usage_monthly.imss_calculations_count < p_monthly_limit
  returning imss_calculations_count into v_current_count;

  if v_current_count is null then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'fair_use_limit',
      'currentCount', p_monthly_limit
    );
  end if;

  return jsonb_build_object(
    'allowed', true,
    'reason', 'subscription',
    'currentCount', v_current_count
  );
end;
$$;

grant execute on function public.grant_single_document_use(uuid, integer) to service_role;
grant execute on function public.consume_document_access(uuid, integer) to service_role;
grant execute on function public.record_imss_usage(uuid, integer) to service_role;
