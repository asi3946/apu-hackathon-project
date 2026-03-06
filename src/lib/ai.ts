// --- 1. RAG検索 (Search) ---

export interface AISearchRequest {
  query: string; // ユーザーの質問
  limit?: number; // (任意) 取得する関連メモの最大数。デフォルトは5とか
}

export interface AISearchResponse {
  answer: string; // AIが生成した回答
  references: {
    // 回答の根拠となったメモの情報（リンク用）
    id: string;
    title: string;
    similarity: number; // 類似度スコア (0.0 ~ 1.0)
  }[];
}

// --- 2. 自動タグ付け (Auto Tagging) ---

export interface AIAutoTagRequest {
  content: string; // メモの本文
  existing_tags?: string[]; // (任意) すでに存在するタグのリスト（表記ゆれ防止用）
}

export interface AIAutoTagResponse {
  suggested_tags: string[]; // 提案されたタグの配列（例: ["React", "Vim", "Frontend"]）
}

// --- 3. 自動タイトル生成 (Auto Title) ---

export interface AIGenerateTitleRequest {
  content: string; // メモの本文
}

export interface AIGenerateTitleResponse {
  suggested_title: string; // 生成されたタイトル（例: "Vimの基本操作まとめ"）
}
