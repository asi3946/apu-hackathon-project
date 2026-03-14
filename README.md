# Memovim

ハッカソンテーマ「越境と交流：テクノロジーとアイデアで未来をつなぐ」に向けて開発された、知識を共有し拡張するためのメモアプリケーション。

## プロジェクト概要

個人の頭の中にあるアイデアや記録を、他者と共有し交流するためのプラットフォームです。自分のメモを公開設定にすることで、個人的な記録の境界を越えて他のユーザーの知識と繋がり、新しいアイデアの創出を支援します。また、AIによるベクトル検索を活用することで、過去の知識と現在の課題を交差させ、思考の枠を拡張する体験を提供します。

## 主な機能

* 知識の共有と公開: メモの公開設定により、自分のアイデアを他のユーザーへ発信し、交流のきっかけを作る。
* AIによる文脈検索（実装中）: pgvectorを用いたベクトル検索により、単なるキーワードの一致という壁を越えて、文脈的に関連するメモを抽出し思考を繋ぐ。
* 思考を妨げない入力体験: Jotaiを用いた高速な状態管理によるシームレスな記録。エンジニア向けのオプションとしてVimキーバインドの有効化も可能。
* 安全なデータ管理: Supabase AuthとRow Level Security (RLS) による堅牢なユーザー認証とデータ保護。

## 技術スタック

* Frontend: Next.js (App Router), TypeScript
* State Management: Jotai
* Backend/DB: Supabase (PostgreSQL, pgvector, Auth, RLS)
* Styling: Tailwind CSS
* Icons: Lucide React

## ディレクトリ構造
```
.
├── public/               # 静的ファイル（ロゴ、アイコン等）
├── src/                  # アプリケーションソースコード
│   ├── app/              # App Router（ページ、レイアウト、ルーティング）
│   ├── components/       # UIコンポーネント（エディタ、サイドバー等）
│   ├── hooks/            # カスタムフック（Vimキーバインド処理等）
│   ├── lib/              # 外部ライブラリ設定（AI処理、APIクライアント）
│   ├── store/            # Jotaiによる状態管理（メモ、Vimの状態など）
│   ├── types/            # TypeScript型定義
│   └── utils/            # 汎用ユーティリティ（Supabase初期化等）
├── supabase/             # データベース・バックエンド設定
│   ├── migrations/       # SQLマイグレーションファイル
│   ├── seed.sql          # ローカル開発用テストデータ
│   └── config.toml       # Supabaseローカル設定
├── middleware.ts         # 認証・リダイレクト制御
├── .env.local.example    # 環境変数のサンプル
└── package.json          # プロジェクトの依存関係とスクリプト
```


## 開発環境のセットアップ

### 1. リポジトリのクローン

git clone https://github.com/asi3946/apu-hackathon-project.git
cd apu-hackathon-project

### 2. 環境変数の設定

プロジェクトのルートディレクトリに .env.local ファイルを作成し、以下の項目を設定してください。

NEXT_PUBLIC_SUPABASE_URL=あなたのSupabaseプロジェクトURL
NEXT_PUBLIC_SUPABASE_ANON_KEY=あなたのSupabase Anon Key

### 3. パッケージのインストール

npm install

### 4. データベースの構築（Supabase CLIを使用）

npx supabase start
npx supabase migration up
npx supabase db reset

### 5. 開発サーバーの起動

npm run dev

ブラウザで http://localhost:3000 を開いて確認してください。

## ライセンス

MIT License
