-- ユーザー設定テーブルの作成
CREATE TABLE public.user_settings (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  default_is_public BOOLEAN DEFAULT false NOT NULL,
  use_vim_mode BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS（行単位セキュリティ）の有効化
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- ユーザーが自分の設定のみ閲覧できるポリシー
CREATE POLICY "Users can view their own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = id);

-- ユーザーが自分の設定のみ更新できるポリシー
CREATE POLICY "Users can update their own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = id);

-- 新規ユーザー登録時に自動で設定レコードを作成する関数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_settings (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーの作成（auth.usersへのinsert後に実行）
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();