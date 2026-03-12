create table public.memos (
id uuid not null default gen_random_uuid (),
user_id text not null default 'dummy-user',
title text not null default '',
content text not null default '',
tags text[] not null default '{}'::text[],
created_at timestamp with time zone not null default now(),
updated_at timestamp with time zone not null default now(),
constraint memos_pkey primary key (id)
);