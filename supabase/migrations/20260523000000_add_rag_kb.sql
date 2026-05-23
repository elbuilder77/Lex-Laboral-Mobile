-- Habilitar la extensión de vectores si no está habilitada
create extension if not exists vector;

-- Tabla para almacenar artículos de la base de conocimiento legal
create table if not exists public.kb_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  embedding vector(768), -- Gemini text-embedding-004 utiliza 768 dims
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Habilitar RLS
alter table public.kb_articles enable row level security;

-- Crear política de lectura pública para la base de conocimiento
drop policy if exists "Cualquiera puede leer articulos de la base de conocimiento" on public.kb_articles;
create policy "Cualquiera puede leer articulos de la base de conocimiento"
  on public.kb_articles
  for select
  using (true);

-- Agregar trigger para actualizar updated_at
drop trigger if exists set_kb_articles_updated_at on public.kb_articles;
create trigger set_kb_articles_updated_at
before update on public.kb_articles
for each row execute procedure public.set_updated_at();

-- Función RPC para búsqueda semántica por similitud de coseno
create or replace function public.match_kb_articles (
  query_embedding vector(768),
  match_threshold float default 0.3,
  match_count int default 3
)
returns table (
  id uuid,
  title text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    id,
    title,
    content,
    1 - (embedding <=> query_embedding) as similarity
  from public.kb_articles
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- Dar permisos de ejecución de la función
grant execute on function public.match_kb_articles(vector, float, int) to service_role;
grant execute on function public.match_kb_articles(vector, float, int) to authenticated;
grant execute on function public.match_kb_articles(vector, float, int) to anon;
