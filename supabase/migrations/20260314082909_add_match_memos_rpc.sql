-- 1. タグマスターテーブル
create table public.tags (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  embedding vector(768), -- タグ名のベクトル
  created_at timestamp with time zone default now()
);

-- 2. メモとタグの中間テーブル（多対多）
create table public.memo_tags (
  memo_id uuid references public.memos(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  primary key (memo_id, tag_id)
);

-- 3. タグ検索用のRPC関数
create or replace function match_tags (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns setof tags
language sql
as $$
  select *
  from tags
  where tags.embedding <=> query_embedding < 1 - match_threshold
  order by tags.embedding <=> query_embedding
  limit match_count;
$$;