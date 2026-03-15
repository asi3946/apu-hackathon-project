-- ブックマークテーブルの作成
CREATE TABLE bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  memo_id uuid references memos on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, memo_id) -- 同じメモの重複保存を防止
);

-- セキュリティ（RLS）の設定
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own bookmarks" 
ON bookmarks FOR ALL 
USING (auth.uid() = user_id);