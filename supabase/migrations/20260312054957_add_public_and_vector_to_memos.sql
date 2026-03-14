-- 1. pgvector拡張機能の有効化
create extension if not exists vector with schema public;

-- 2. memosテーブルにカラムを追加
alter table public.memos
add column is_public boolean not null default false,
add column embedding vector(768);

-- 3. 公開メモを誰でも閲覧できるようにするRLSポリシーの追加
create policy "Public memos are viewable by everyone"
on public.memos for select
using ( is_public = true );