// メモ保存時にバックエンド内部で実行するベクトル化処理用
export interface GenerateEmbeddingRequest {
  content: string;
}

export interface GenerateEmbeddingResponse {
  embedding: number[];
}

// 交流機能：指定した過去メモ(ID)に類似する、他ユーザーの公開メモを検索するAPI
export interface CrossUserSearchRequest {
  source_memo_id: string; // 検索の基準となる自分のメモID
  limit?: number; // 取得する件数
}

export interface CrossUserSearchResponse {
  related_memos: {
    id: string;
    title: string;
    content: string;
    similarity: number; // pgvectorで計算した類似度スコア
    user_id: string; // 作成者のID
  }[];
}
