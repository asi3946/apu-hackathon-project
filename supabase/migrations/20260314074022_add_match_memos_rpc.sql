-- 類似度検索用のRPC関数
create or replace function match_memos (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns setof memos
language sql
as $$
  -- <=> はコサイン距離。1 - 距離 = 類似度としてフィルタリング
  select *
  from memos
  where memos.embedding <=> query_embedding < 1 - match_threshold
  order by memos.embedding <=> query_embedding
  limit match_count;
$$;