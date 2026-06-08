do $$
declare
  restricted_function regprocedure;
begin
  foreach restricted_function in array array[
    to_regprocedure('public.use_audit_credit(uuid)'),
    to_regprocedure('public.use_chat_credit(uuid)'),
    to_regprocedure('public.use_draft_credit(uuid, text)'),
    to_regprocedure('public.check_document_access(uuid, integer)'),
    to_regprocedure('public.consume_document_access(uuid, integer)'),
    to_regprocedure('public.grant_single_document_use(uuid, integer)'),
    to_regprocedure('public.record_imss_usage(uuid, integer)'),
    to_regprocedure('public.handle_new_user()')
  ]
  loop
    if restricted_function is not null then
      execute format('alter function %s set search_path = public', restricted_function);
    end if;
  end loop;
end;
$$;
