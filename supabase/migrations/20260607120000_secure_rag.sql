-- Securing match_kb_articles

alter function public.match_kb_articles(vector, float, int) security invoker;

drop policy if exists "Cualquiera puede leer articulos de la base de conocimiento" on public.kb_articles;

revoke all on table public.kb_articles from public;
revoke all on table public.kb_articles from authenticated;
revoke all on table public.kb_articles from anon;

revoke execute on function public.match_kb_articles(vector, float, int) from public;
revoke execute on function public.match_kb_articles(vector, float, int) from authenticated;
revoke execute on function public.match_kb_articles(vector, float, int) from anon;

grant select on table public.kb_articles to service_role;
grant execute on function public.match_kb_articles(vector, float, int) to service_role;
