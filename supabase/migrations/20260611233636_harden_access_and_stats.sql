create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;
grant usage on schema private to service_role;

create index if not exists idx_users_created_at_desc
  on public.users (created_at desc);

create index if not exists idx_users_active_premium_access_until
  on public.users (access_until)
  where is_premium = true and access_until is not null;

create index if not exists idx_user_entitlements_remaining_positive
  on public.user_entitlements (single_document_uses_remaining)
  where single_document_uses_remaining > 0;

create or replace function private.grant_single_document_use(
  p_user_id uuid,
  p_quantity integer default 1
)
returns integer
language plpgsql
security definer
set search_path = ''
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

create or replace function private.check_document_access(
  p_user_id uuid,
  p_monthly_limit integer default 100
)
returns jsonb
language plpgsql
security definer
set search_path = ''
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

create or replace function private.consume_document_access(
  p_user_id uuid,
  p_monthly_limit integer default 100
)
returns jsonb
language plpgsql
security definer
set search_path = ''
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

create or replace function private.refund_document_access(
  p_user_id uuid,
  p_consumed_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_month text := to_char(now(), 'YYYY-MM');
  v_current_count integer;
  v_remaining integer;
begin
  if p_consumed_reason = 'single_document' then
    insert into public.user_entitlements (user_id, single_document_uses_remaining)
    values (p_user_id, 1)
    on conflict (user_id) do update
      set single_document_uses_remaining = public.user_entitlements.single_document_uses_remaining + 1,
          updated_at = now()
    returning single_document_uses_remaining into v_remaining;

    return jsonb_build_object(
      'refunded', true,
      'reason', p_consumed_reason,
      'remaining', coalesce(v_remaining, 0)
    );
  end if;

  if p_consumed_reason = 'subscription' then
    update public.user_usage_monthly
    set documents_generated_count = greatest(documents_generated_count - 1, 0),
        updated_at = now()
    where user_id = p_user_id
      and month = v_current_month
    returning documents_generated_count into v_current_count;

    return jsonb_build_object(
      'refunded', true,
      'reason', p_consumed_reason,
      'currentCount', coalesce(v_current_count, 0)
    );
  end if;

  raise exception 'Motivo de consumo no reembolsable: %', p_consumed_reason;
end;
$$;

create or replace function private.record_imss_usage(
  p_user_id uuid,
  p_monthly_limit integer default 250
)
returns jsonb
language plpgsql
security definer
set search_path = ''
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

create or replace function private.get_access_snapshot(
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_premium boolean := false;
  v_license_type text := null;
  v_access_until timestamptz := null;
  v_single_document_uses_remaining integer := 0;
begin
  select is_premium, license_type, access_until
  into v_is_premium, v_license_type, v_access_until
  from public.users
  where id = p_user_id;

  if not found then
    return jsonb_build_object(
      'isPremium', false,
      'licenseType', null,
      'accessUntil', null,
      'hasActiveSubscription', false,
      'singleDocumentUsesRemaining', 0
    );
  end if;

  select coalesce(single_document_uses_remaining, 0)
  into v_single_document_uses_remaining
  from public.user_entitlements
  where user_id = p_user_id;

  if v_single_document_uses_remaining is null
     and to_regclass('public.user_credits') is not null then
    execute 'select coalesce(draft_basic_balance, 0) from public.user_credits where user_id = $1'
      into v_single_document_uses_remaining
      using p_user_id;
  end if;

  return jsonb_build_object(
    'isPremium', coalesce(v_is_premium, false),
    'licenseType', v_license_type,
    'accessUntil', v_access_until,
    'hasActiveSubscription', coalesce(v_is_premium, false) and v_access_until is not null and v_access_until > now(),
    'singleDocumentUsesRemaining', coalesce(v_single_document_uses_remaining, 0)
  );
end;
$$;

create or replace function private.get_ceo_stats()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_current_month text := to_char(v_now, 'YYYY-MM');
  v_total_users bigint := 0;
  v_premium_users bigint := 0;
  v_documents_this_month bigint := 0;
  v_calculators_this_month bigint := 0;
  v_one_time_documents_available bigint := 0;
  v_recent_users jsonb := '[]'::jsonb;
  v_monthly_usage jsonb := '[]'::jsonb;
begin
  select count(*) into v_total_users from public.users;

  select count(*) into v_premium_users
  from public.users
  where is_premium = true
    and access_until > v_now;

  select
    coalesce(sum(documents_generated_count), 0),
    coalesce(sum(imss_calculations_count), 0)
  into v_documents_this_month, v_calculators_this_month
  from public.user_usage_monthly
  where month = v_current_month;

  select coalesce(sum(single_document_uses_remaining), 0)
  into v_one_time_documents_available
  from public.user_entitlements;

  select coalesce(jsonb_agg(row_payload), '[]'::jsonb)
  into v_recent_users
  from (
    select jsonb_build_object(
      'id', u.id,
      'email', u.email,
      'is_premium', u.is_premium,
      'license_type', u.license_type,
      'access_until', u.access_until,
      'created_at', u.created_at,
      'isPremiumActive', u.is_premium and u.access_until is not null and u.access_until > v_now
    ) as row_payload
    from public.users u
    order by u.created_at desc
    limit 20
  ) recent;

  select coalesce(jsonb_agg(to_jsonb(monthly_rows)), '[]'::jsonb)
  into v_monthly_usage
  from (
    select *
    from public.user_usage_monthly
    where month = v_current_month
    order by updated_at desc
    limit 30
  ) monthly_rows;

  return jsonb_build_object(
    'overview', jsonb_build_object(
      'totalUsers', coalesce(v_total_users, 0),
      'premiumUsers', coalesce(v_premium_users, 0),
      'documentsThisMonth', coalesce(v_documents_this_month, 0),
      'calculatorsThisMonth', coalesce(v_calculators_this_month, 0),
      'oneTimeDocumentsAvailable', coalesce(v_one_time_documents_available, 0)
    ),
    'recentUsers', v_recent_users,
    'monthlyUsage', v_monthly_usage,
    'generatedAt', v_now
  );
end;
$$;

revoke all on all functions in schema private from public, anon, authenticated;

grant execute on function private.grant_single_document_use(uuid, integer) to service_role;
grant execute on function private.check_document_access(uuid, integer) to service_role;
grant execute on function private.consume_document_access(uuid, integer) to service_role;
grant execute on function private.refund_document_access(uuid, text) to service_role;
grant execute on function private.record_imss_usage(uuid, integer) to service_role;
grant execute on function private.get_access_snapshot(uuid) to service_role;
grant execute on function private.get_ceo_stats() to service_role;

do $$
declare
  restricted_function regprocedure;
begin
  foreach restricted_function in array array[
    to_regprocedure('public.check_document_access(uuid, integer)'),
    to_regprocedure('public.consume_document_access(uuid, integer)'),
    to_regprocedure('public.grant_single_document_use(uuid, integer)'),
    to_regprocedure('public.record_imss_usage(uuid, integer)'),
    to_regprocedure('public.get_access_snapshot(uuid)')
  ]
  loop
    if restricted_function is not null then
      execute format('revoke execute on function %s from public', restricted_function);
      execute format('revoke execute on function %s from anon', restricted_function);
      execute format('revoke execute on function %s from authenticated', restricted_function);
      execute format('grant execute on function %s to service_role', restricted_function);
    end if;
  end loop;
end;
$$;

