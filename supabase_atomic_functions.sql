-- Funciones atómicas para Lex Laboral
-- Modelo vigente:
-- - mensualidad / trimestralidad: acceso al generador y a IMSS mientras access_until > now()
-- - documento suelto: consume 1 uso de documento

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

grant execute on function public.check_document_access(uuid, integer) to service_role;
grant execute on function public.grant_single_document_use(uuid, integer) to service_role;
grant execute on function public.consume_document_access(uuid, integer) to service_role;
grant execute on function public.record_imss_usage(uuid, integer) to service_role;
