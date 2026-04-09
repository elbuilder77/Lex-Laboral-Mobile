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

alter table public.stripe_webhook_events enable row level security;

drop trigger if exists set_stripe_webhook_events_updated_at on public.stripe_webhook_events;
create trigger set_stripe_webhook_events_updated_at
before update on public.stripe_webhook_events
for each row execute procedure public.set_updated_at();

create or replace function public.check_document_access(
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
  v_current_count integer := 0;
  v_remaining integer := 0;
begin
  select is_premium, access_until
  into v_is_premium, v_access_until
  from public.users
  where id = p_user_id;

  if not found then
    raise exception 'Usuario no encontrado';
  end if;

  if v_is_premium and v_access_until is not null and v_access_until > now() then
    select coalesce(documents_generated_count, 0)
    into v_current_count
    from public.user_usage_monthly
    where user_id = p_user_id
      and month = v_current_month;

    if coalesce(v_current_count, 0) >= p_monthly_limit then
      return jsonb_build_object(
        'allowed', false,
        'reason', 'fair_use_limit',
        'currentCount', p_monthly_limit
      );
    end if;

    return jsonb_build_object(
      'allowed', true,
      'reason', 'subscription',
      'currentCount', coalesce(v_current_count, 0)
    );
  end if;

  select coalesce(single_document_uses_remaining, 0)
  into v_remaining
  from public.user_entitlements
  where user_id = p_user_id;

  if coalesce(v_remaining, 0) > 0 then
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

grant execute on function public.check_document_access(uuid, integer) to service_role;
