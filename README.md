# プロジェクト概要: 高機能共有ブロックエディタ

テーマ「越境と交流」に対し、直感的な操作性と強力な共同編集機能を備えたWebメモ帳を開発します。既存のツールを超えるスムーズな情報共有を目指し、以下のコア機能を通じてユーザー間のシームレスな交流を実現します。

---

## 主要機能

* ブロックベースのエディタ
* マウス操作を基本とした直感的な編集体験
* 複数人でのリアルタイム共同編集（ブロック単位の排他制御付き）
* AIを用いた自動タイトル・タグ生成による情報整理

---

## 画面構成とUI仕様

* レイアウト: 左サイドバー（ナビゲーション・設定）と右メインエリア（エディタ）の2ペイン構成
* 左サイドバー: メモ内検索ボタン、新規作成ボタン、メモ一覧、設定ボタンを配置
* テーマ: 白を基調としたクリーンなデザインを採用し、情報の視認性と清潔感を重視
* エディタ構成: 上から順に「タイトル」「タグ欄（カード形式）」「本文（行ごとのブロックリスト）」を配置

---

## ディレクトリ構造

本プロジェクトは Next.js (App Router) を採用しています。主なロジックは src ディレクトリ配下に集約します。

.
├── biome.json                 # Linter/Formatter 設定
├── next.config.js             # Next.js 設定
├── package.json
├── postcss.config.js
├── tailwind.config.ts         # Tailwind CSS 設定
├── tsconfig.json
│
├── public/                    # 静的ファイル
│
├── supabase/                  # Supabase 関連
│   ├── functions/             # Edge Functions (AI処理など)
│   └── migrations/            # DBマイグレーションファイル
│
└── src/
    ├── app/                   # App Router
    │   ├── (auth)/            # 認証関連
    │   │   ├── login/
    │   │   └── signup/
    │   ├── (dashboard)/       # メインアプリ画面
    │   │   ├── layout.tsx     # サイドバーを含む2ペインレイアウト
    │   │   ├── page.tsx       # ダッシュボード
    │   │   └── memos/
    │   │       └── [id]/      # メモ編集画面
    │   ├── api/               # API Routes
    │   ├── globals.css        # グローバルスタイル
    │   ├── layout.tsx         # ルートレイアウト
    │   └── page.tsx           # LP
    │
    ├── components/            # UIコンポーネント
    │   ├── ui/                # 汎用 UI パーツ
    │   ├── layout/            # レイアウト用
    │   │   ├── AppSidebar.tsx
    │   │   └── SidebarItem.tsx
    │   ├── editor/            # エディタコンポーネント
    │   │   ├── EditorRoot.tsx
    │   │   ├── BlockList.tsx
    │   │   ├── BlockItem.tsx  # 個別の行
    │   │   └── TagList.tsx    # タグ入力欄
    │   └── command/           # コマンド・検索UI
    │       └── CommandMenu.tsx
    │
    ├── hooks/                 # カスタムフック
    │   ├── useBlockOps.ts     # ブロックの分割・結合・移動ロジック
    │   ├── useAuth.ts         # ユーザー認証
    │   └── useRealtime.ts     # Supabase Realtime 連携
    │
    ├── lib/                   # ユーティリティ
    │   ├── supabase/          # Supabase クライアント
    │   ├── utils.ts           # ヘルパー関数
    │   └── constants.ts       # 定数
    │
    ├── store/                 # Jotai Atoms
    │   ├── editorAtom.ts      # ブロックデータ管理
    │   ├── selectionAtom.ts   # 選択中のブロック状態
    │   └── uiAtom.ts          # サイドバー等のUI状態
    │
    └── types/                 # 型定義
        ├── database.types.ts  # Supabase自動生成型
        └── editor.ts          # Block, BlockType等の定義

---

## 技術スタック

* Next.js: Reactフレームワーク
* Jotai: 状態管理
* Lucide-react: アイコン
* Zod: バリデーション
* cmdk: 検索・コマンドUI
* Supabase: Backend (Auth, DB, Realtime)
* Biome: Linter / Formatter

---

## 共同編集の詳細仕様（ブロックレベルロック方式）

データ競合を避けるため、ブロック単位での排他ロック方式を採用します。

1. ロックの取得: ユーザーが特定のブロックを選択（フォーカス）した瞬間、そのブロックを排他ロックし、他ユーザーの編集を制限します。
2. ロック時のUI: 他者が編集中のブロックは背景色を変化させ、編集者のアイコンを表示します。
3. ロックの解除: フォーカスが外れた際、またはブラウザを閉じた際にロックを自動解除し、最新のデータを同期します。
4. 強制解除: 一定時間更新がない場合や、オーナーによる操作でロックを解除できる仕組みを設けます。

---

## AI自動生成の実行トリガー

API負荷を抑えるため、以下のタイミングで実行します。

* メモ画面からの離脱時
* 初回入力時: タイトルが空かつ本文が一定量を超えた状態で、最初のフォーカスアウト時
* 手動実行: ユーザーがメニューから明示的に要求した時

---

## 開発ルール

1. Biomeによる整形: 保存時の自動フォーマットを推奨します。
2. Git戦略: developブランチからissue/番号でブランチを作成し、PRを介してマージします。
3. コミットメッセージ: feat:, fix:, ui:, refactor:, docs:, chore: の接頭辞を使用し、最後にissue番号を記述してください。
