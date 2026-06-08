alter function public.set_updated_at() set search_path = public;
alter function public.match_kb_articles(vector, float, int) set search_path = public;

drop policy if exists "No direct client access to kb_articles" on public.kb_articles;
create policy "No direct client access to kb_articles"
  on public.kb_articles
  for select
  to anon, authenticated
  using (false);

do $$
declare
  restricted_function regprocedure;
begin
  foreach restricted_function in array array[
    to_regprocedure('public.check_document_access(uuid, integer)'),
    to_regprocedure('public.consume_document_access(uuid, integer)'),
    to_regprocedure('public.grant_single_document_use(uuid, integer)'),
    to_regprocedure('public.record_imss_usage(uuid, integer)'),
    to_regprocedure('public.use_audit_credit(uuid)'),
    to_regprocedure('public.use_chat_credit(uuid)'),
    to_regprocedure('public.use_draft_credit(uuid, text)'),
    to_regprocedure('public.handle_new_user()')
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
