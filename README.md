# Memovim

ハッカソンテーマ「越境と交流：テクノロジーとアイデアで未来をつなぐ」に向けて開発された、知識を共有し拡張するためのメモアプリケーション。

## 💡 プロジェクトの思想：見えない相手との交流

車が通っていなくても赤信号を守るように、私たちは相手が見えなくとも、相手を感じることができます。

現代のSNSは「いいね」や「リプライ」といった直接的なフィードバックに溢れていますが、その同調圧力や批判への恐怖を持つ人がいると考えられます。

本アプリは、**「誰かに見てもらいたいが、直接的な評価やフィードバックは欲しくない」**　という潜在的なニーズを満たすためのプラットフォームです。

* **いいね数やコメント機能の排除**: 承認欲求のノイズや批判の恐怖（境界線）を排除し、純粋な思考だけを安全に公開できる「個人のメモ帳」の体裁を保ちます。
* **ベクトル検索による思考の共鳴**: 公開された無数のメモの中から、自分の思考（文脈）と似たものをAIが引き合わせます。

直接言葉を交わさなくとも、自分のアイデアが誰かの思考と交差する。既存の「コミュニケーション」の定義を越境した、**心理的安全性の高い新しい「交流」**の形を保ちます。
## 主な機能

### 🧠 1. AIによる思考の拡張と文脈検索 (Gemini × pgvector)
* **AI自動生成**: メモの内容から、Geminiが「最適なタイトル」と「関連タグ」を瞬時に推論して提案します。
* **セマンティック検索**: AIが算出した特徴量（ベクトル）を元に、過去の自分のメモや、他ユーザーの公開メモの中から「意味や文脈が近いアイデア」を自動抽出して結びつけます。

### 🤝 2. 知識の越境と交流
* **公開タイムライン**: 自分のメモを公開し、他のユーザーのアイデアと交流するきっかけを作ります。
* **ブックマーク機能**: 他者の優れたメモや、振り返りたい自分のメモを保存・ストックできます。

### ⌨️ 3. マウスを捨てた完全キーボード駆動体験 (Vimモード)
思考のスピードを落とさないため、エンジニア向けにVimキーバインドを搭載。サイドバーの操作からAI生成、公開設定まで、一切マウスに触れずに操作可能です。

**【Memovim 独自コマンド】**（ノーマルモードで `:` を入力）
* `:ti` 👉 **AIタイトル自動生成**
* `:ta` 👉 **AIタグ自動生成**
* `:pb` 👉 **公開 / 未公開の切り替え** (即座にタイムラインへ反映)
* `:bm` 👉 **ブックマークの登録 / 解除**
* `:w` / `:wq` 👉 メモの保存
* `:e` 👉 新規メモ作成

**【エクスプローラー操作】**
* `Shift + H` でサイドバーへ移動し、`j / k` でリストを上下移動、`Enter` でメモを開く。
* サイドバー上で `/` を押すと即座に検索窓へフォーカス。
* `l` (エル)、`Shift + L`、または `Esc` でエディタへ瞬時に帰還。

**【基本操作】**
* 実装済み機能　h,j,k,l,i,a,A,o,O,v,V,y,x,dd,p,pp,u,ctrl+r

## 技術スタック

* **Frontend**: Next.js (App Router), TypeScript
* **State Management**: Jotai
* **Backend/DB**: Supabase (PostgreSQL, pgvector, Auth, RLS)
* **AI/LLM**: Google Gemini API (2.5-flash / embedding-001)
* **Styling**: Tailwind CSS
* **Icons**: Lucide React

## ディレクトリ構造

```text
.
├── public/               # 静的ファイル（ロゴ、アイコン等）
├── scripts/              # 初期データ投入スクリプト (seed-tags)
├── src/                  # アプリケーションソースコード
│   ├── app/              # App Router (APIルート、ページ、レイアウト)
│   ├── components/       # UIコンポーネント (エディタ、サイドバー等)
│   ├── hooks/            # カスタムフック (Vimキーバインド処理等)
│   ├── lib/              # 外部ライブラリ設定
│   ├── store/            # Jotai状態管理 (Vim状態、メモデータ、設定)
│   ├── types/            # TypeScript型定義
│   └── utils/            # 汎用ユーティリティ (Supabase初期化等)
├── supabase/             # データベース・バックエンド設定 (Migrations, Seed)
└── middleware.ts         # 認証・リダイレクト制御
```

## 開発環境のセットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/asi3946/apu-hackathon-project.git
cd apu-hackathon-project
```

### 2. 環境変数の設定

プロジェクトのルートディレクトリに `.env.local` ファイルを作成し、以下の項目を設定してください。

```text
# Supabase クライアント設定
NEXT_PUBLIC_SUPABASE_URL=あなたのSupabaseプロジェクトURL
NEXT_PUBLIC_SUPABASE_ANON_KEY=あなたのSupabase Anon Key

# Supabase サーバー/管理者設定 (※退会処理用)
SUPABASE_SERVICE_ROLE_KEY=あなたのSupabase Service Role Key

# Google Gemini API
GOOGLE_GENERATIVE_AI_API_KEY=あなたのGemini API Key
```

### 3. パッケージのインストール

```bash
npm install
```

### 4. データベースの構築（Supabase CLIを使用）

Dockerを起動した状態で、以下のコマンドを実行し、ローカルにSupabase環境を構築します。

```bash
npx supabase start
npx supabase migration up
npx supabase db reset
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開いて確認してください。

## ライセンス

MIT License
