/**
 * データベースの 'memos' テーブルに対応する型
 * ブロック構造を廃止し、シンプルな1つのテキストとして管理
 */
export interface Memo {
  id: string;          // UUID
  user_id: string;     // 作成者 (Supabase Auth UID)
  title: string;       // タイトル
  content: string;     // 本文（巨大な文字列、装飾なし）
  tags: string[];      // タグの配列
  created_at: string;  // ISO 8601 string
  updated_at: string;  // ISO 8601 string
}

/**
 * 新規作成時に必要なデータ（IDや日付は自動生成されるため除外）
 */
export type CreateMemoInput = Pick<Memo, 'title' | 'content' | 'tags'>;

/**
 * 更新時に必要なデータ（IDは必須、他は任意）
 */
export type UpdateMemoInput = Partial<CreateMemoInput> & { id: string };