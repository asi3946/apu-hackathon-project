# 高機能Vimライク・共有メモ帳

## プロジェクト概要
テーマ「越境と交流」に対し、Vimの操作性と共同編集機能を備えたWebメモ帳を開発します。既存のメモ帳を超える使い勝手を目指し、以下のコア機能でユーザー間のシームレスな交流を実現します。

## 主要機能
- Notionライクなブロックベースのエディタ
- Vimライクなキーボード操作による高速な編集体験
- 複数人でのリアルタイム共同編集（排他制御付き）
- AIを用いた自動タイトル・タグ生成による情報整理

## 画面構成とUI仕様
- レイアウト: 左サイドバー（ナビゲーション・設定）と右メインエリア（エディタ）の2ペイン構成
- 左サイドバー: メモ内検索（チャット検索）ボタン、新規作成ボタン、メモ一覧、設定ボタンを配置
- テーマ: ダークモードを基準とし、長時間の作業でも目が疲れにくい配色を採用
- エディタ構成: 上から順に「タイトル」「タグ欄（カード形式）」「本文（行ごとのブロックリスト）」を配置

## ディレクトリ構造
## ディレクトリ構造 (Project Structure)

本プロジェクトは Next.js (App Router) を採用しています。
主なロジックは `src` ディレクトリ配下に集約します。

```text
.
├── biome.json                 # Linter/Formatter 設定
├── next.config.js             # Next.js 設定
├── package.json
├── postcss.config.js
├── tailwind.config.ts         # Tailwind CSS 設定
├── tsconfig.json
│
├── public/                    # 静的ファイル (画像, favicon等)
│
├── supabase/                  # Supabase 関連 (Backend担当領域)
│   ├── functions/             # Edge Functions (AI処理など)
│   └── migrations/            # DBマイグレーションファイル
│
└── src/
    ├── app/                   # App Router (ページ・ルーティング)
    │   ├── (auth)/            # 認証関連 (ログイン/登録) - Layout共有用グループ
    │   │   ├── login/
    │   │   └── signup/
    │   ├── (dashboard)/       # メインアプリ画面
    │   │   ├── layout.tsx     # サイドバーを含む2ペインレイアウト
    │   │   ├── page.tsx       # ダッシュボード (メモ一覧)
    │   │   └── memos/
    │   │       └── [id]/      # メモ編集画面 (エディタ本体)
    │   ├── api/               # Next.js API Routes (必要な場合のみ)
    │   ├── globals.css        # グローバルスタイル (Tailwind, Dark mode)
    │   ├── layout.tsx         # ルートレイアウト
    │   └── page.tsx           # LP (ランディングページ)
    │
    ├── components/            # UIコンポーネント
    │   ├── ui/                # 汎用 UI パーツ (Button, Dialog, Input等)
    │   ├── layout/            # レイアウト用 (Sidebar, ResizablePanel等)
    │   │   ├── AppSidebar.tsx # 左サイドバー
    │   │   └── SidebarItem.tsx
    │   ├── editor/            # エディタ特有のコンポーネント (核心部)
    │   │   ├── EditorRoot.tsx # エディタ全体ラッパー
    │   │   ├── BlockList.tsx  # ブロックのリスト描画
    │   │   ├── BlockItem.tsx  # 個別の行 (Text, H1, List等)
    │   │   ├── VimCursor.tsx  # ノーマルモード用の擬似カーソル
    │   │   └── TagList.tsx    # タグ入力欄
    │   └── command/           # コマンドパレット (cmdk)
    │       └── CommandMenu.tsx # Space+f, /検索 用
    │
    ├── hooks/                 # カスタムフック (ロジックの分離)
    │   ├── useVimKeydown.ts   # Vim操作のキイベントハンドリング
    │   ├── useBlockOps.ts     # ブロックの分割・結合・移動ロジック
    │   ├── useAuth.ts         # ユーザー認証状態
    │   └── useRealtime.ts     # Supabase Realtime 連携 (Presence/Broadcast)
    │
    ├── lib/                   # ユーティリティ・設定
    │   ├── supabase/          # Supabase クライアント初期化
    │   │   ├── client.ts      # Client Component用
    │   │   └── server.ts      # Server Component用
    │   ├── utils.ts           # cn() などのヘルパー関数
    │   └── constants.ts       # 定数 (デフォルト設定値など)
    │
    ├── store/                 # Jotai Atoms (状態管理)
    │   ├── editorAtom.ts      # ブロックデータ, splitAtom定義
    │   ├── cursorAtom.ts      # カーソル位置, モード(Normal/Insert)
    │   └── uiAtom.ts          # サイドバー開閉, ダイアログ状態
    │
    └── types/                 # TypeScript 型定義
        ├── database.types.ts  # Supabase CLIで生成した型
        └── editor.ts          # Block, BlockType, Cursor等の定義
```
## キーバインド一覧
- h, l: ブロック内で文字が存在する場合の左右カーソル移動
- j, k: エディタ内のブロック上下移動（ノーマルモード時）
- Shift + H: 左サイドバーへフォーカスを移動
- Shift + L: 左サイドバーから右側のメインエリアへフォーカスを戻す（元のエディタのカーソル位置へ復帰）
- / (スラッシュ): メモ内のページ検索
- Space + f: コマンドパレットの呼び出し・ファイル検索（Leaderキー方式）
- i, a など: インサートモードへの移行（特定ブロックの編集開始）
- Esc: ノーマルモードへの復帰（編集完了とデータの同期）

## 技術スタックとインストールパッケージ

Next.js環境構築後、以下のコマンドで必要なパッケージを一括インストールします。

npm install jotai lucide-react zod cmdk @supabase/supabase-js uuid
npm install -D @types/uuid

- Next.js: アプリケーション全体のUI構築 (react, react-domを含む)
- Jotai: splitAtomを用いたブロックごとの独立した状態管理（レンダリング最適化）
- Lucide (lucide-react): 軽量で統一感のあるUIアイコン
- Zod: AIやAPIからのレスポンスデータの型安全なバリデーション
- cmdk: コマンドパレット・検索UIの実装
- Supabase Client (@supabase/supabase-js): バックエンドのDatabase、Auth、Realtimeとの通信
- UUID (uuid): 新規ブロック作成時など、クライアント側での一意なID生成（標準のcrypto.randomUUIDのフォールバックとして安定稼働させるため）

## 共同編集の詳細仕様（ブロックレベルロック方式）
完全な同時編集時のデータ競合を避けるため、ブロック単位での排他ロック方式を採用します。

- ロックの取得: ユーザーが特定のブロックでインサートモードに入った瞬間、そのブロックを排他ロックし、他ユーザーの画面では編集不可状態とする
- ロック時のUI: ロックされたブロックは背景色を暗くし、現在編集しているユーザーの頭文字のアイコンを表示する。アイコンにホバーすると、そのユーザーのフルネーム（表示名）がツールチップで表示される
- ロックの解除と更新: ノーマルモードに戻った瞬間、テキストをデータベースに保存し、アンロックおよび更新イベントを送信する
- デッドロック対策（異常系の自動解除）:
  - Supabase Presenceのleaveイベントを検知し、オフラインになったユーザーのロックを自動解除
  - フロントエンドでのタイムアウト判定（一定時間更新がない場合は強制解除）
  - システム不具合時のエスケープハッチとして、メモオーナーによる強制手動アンロック機能

## AI自動生成（タグ・タイトル）の実行トリガー
APIの過剰な呼び出しや操作の競合を防ぐため、以下のタイミングに限定してEdge Functionsを実行します。

- メモ画面から離脱（ダッシュボード等へ画面遷移）した時
- 初回入力後: タイトルが空欄であり、かつ本文の総文字数が一定（例: 100文字）を超えた状態で、ノーマルモードに戻った最初の1回のみ
- 手動実行: ユーザーがコマンドパレットやボタンから明示的に要求した時

## 開発の進め方とルール

### 1. フォーマットとLint (Biome)
プロジェクトのLinterおよびFormatterとしてBiomeを採用しています。
基本的には各自のエディタの保存時自動フォーマット機能を使用してください。
設定がうまくいかない場合や、コミット前にプロジェクト全体を一括で整えたい場合は、ターミナルで以下のコマンドを実行してください。

npx biome check --write .

### 2. Gitブランチ戦略
- mainブランチ: 本番環境用です。直接のプッシュは禁止とします。
- developブランチ: 開発のベースラインです。各機能はこのブランチから派生させます。
- 作業ブランチ: developから派生させ、ブランチ名は issue/課題番号 としてください（例: issue/11）。

### 3. GitHub CLI (gh) の利用
日常的なGit操作（PRの作成やIssueの確認など）は、ブラウザを開かずに済むGitHub CLIの使用を標準とします。
PRを作成する際は、作業ブランチ（issue/番号）からdevelopブランチに向けて作成してください。

よく使うコマンド例:
- gh issue list : 割り当てられているIssueの一覧を確認
- gh pr create : 作業中のブランチからPRを作成
- gh pr view --web : ターミナルで扱っているPRのブラウザ画面を開く

### 4. コミットメッセージの規則
変更内容がひと目でわかるよう、コミットメッセージの先頭に以下のプレフィックスをつけてください。
issue番号を最後に記述してください。
- feat: 新機能の追加 #13
- fix: バグの修正 #79
- ui: デザインやUIコンポーネントのみの修正・変更 #24
- refactor: 機能追加やバグ修正を伴わないコードの整理 #35
- docs: READMEなどドキュメントの修正 #59
- chore: ビルドプロセスや設定ファイルなどの細かな変更 #28
