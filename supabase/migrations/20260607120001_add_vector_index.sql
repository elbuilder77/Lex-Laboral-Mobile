-- Create vector index for scalability
create index if not exists idx_kb_articles_embedding_hnsw
  on public.kb_articles
  using hnsw (embedding vector_cosine_ops);
