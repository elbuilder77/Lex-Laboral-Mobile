drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view own profile" on public.users
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "Users can view own entitlements" on public.user_entitlements;
create policy "Users can view own entitlements" on public.user_entitlements
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can view own monthly usage" on public.user_usage_monthly;
create policy "Users can view own monthly usage" on public.user_usage_monthly
  for select to authenticated using ((select auth.uid()) = user_id);

do $$
begin
  if to_regclass('public.user_usage') is not null then
    execute 'drop policy if exists "Users can view own usage" on public.user_usage';
    execute 'create policy "Users can view own usage" on public.user_usage for select to authenticated using ((select auth.uid()) = user_id)';

    execute 'drop policy if exists "Users can insert own usage" on public.user_usage';
    execute 'create policy "Users can insert own usage" on public.user_usage for insert to authenticated with check ((select auth.uid()) = user_id)';
  end if;

  if to_regclass('public.user_credits') is not null then
    execute 'drop policy if exists "Users can view own credits" on public.user_credits';
    execute 'create policy "Users can view own credits" on public.user_credits for select to authenticated using ((select auth.uid()) = user_id)';
  end if;

  if to_regclass('public.chat_sessions') is not null then
    execute 'drop policy if exists "Users can view own sessions" on public.chat_sessions';
    execute 'create policy "Users can view own sessions" on public.chat_sessions for select to authenticated using ((select auth.uid()) = user_id)';

    execute 'drop policy if exists "Users can insert own sessions" on public.chat_sessions';
    execute 'create policy "Users can insert own sessions" on public.chat_sessions for insert to authenticated with check ((select auth.uid()) = user_id)';

    execute 'drop policy if exists "Users can update own sessions" on public.chat_sessions';
    execute 'create policy "Users can update own sessions" on public.chat_sessions for update to authenticated using ((select auth.uid()) = user_id)';

    execute 'drop policy if exists "Users can delete own sessions" on public.chat_sessions';
    execute 'create policy "Users can delete own sessions" on public.chat_sessions for delete to authenticated using ((select auth.uid()) = user_id)';
  end if;
end;
$$;

drop index if exists public.idx_user_usage_monthly_user_month;

create or replace function public.get_access_snapshot(
  p_user_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = public
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

grant execute on function public.get_access_snapshot(uuid) to service_role;
