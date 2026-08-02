do $$
declare
  restricted_function regprocedure;
begin
  foreach restricted_function in array array[
    to_regprocedure('public.match_kb_articles(vector, float, int)'),
    to_regprocedure('public.handle_new_user()')
  ]
  loop
    if restricted_function is not null then
      execute format('alter function %s set search_path = public', restricted_function);
    end if;
  end loop;
end;
$$;
