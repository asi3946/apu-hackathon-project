-- 1. 古い関数を一度削除する（戻り値の型が変わるため必須）
drop function if exists match_memos(vector(768), float, int);

-- 2. 新しい関数を作成する（similarityを含める）
create function match_memos (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  title text,
  content text,
  user_id uuid,
  similarity float
)
language sql stable
as $$
  select
    memos.id,
    memos.title,
    memos.content,
    memos.user_id,
    1 - (memos.embedding <=> query_embedding) as similarity
  from memos
  where memos.embedding <=> query_embedding < 1 - match_threshold
  order by memos.embedding <=> query_embedding
  limit match_count;
$$;