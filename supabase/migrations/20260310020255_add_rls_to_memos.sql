-- 既存のダミーデータをリセット（型変換エラーを防ぐため）
TRUNCATE TABLE public.memos;

-- 既存のテキスト型の user_id カラムを削除
ALTER TABLE public.memos DROP COLUMN user_id;

-- UUID型で auth.users に紐づく user_id カラムを再作成
ALTER TABLE public.memos ADD COLUMN user_id uuid not null references auth.users(id) default auth.uid();

-- RLSの有効化
ALTER TABLE public.memos ENABLE ROW LEVEL SECURITY;

-- ポリシーの作成
CREATE POLICY "Users can view their own memos." ON public.memos FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memos." ON public.memos FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memos." ON public.memos FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memos." ON public.memos FOR DELETE USING (auth.uid() = user_id);