import type { Tables, TablesInsert, TablesUpdate } from "./supabase";

/**
 * データベースの 'memos' テーブルに対応するメインモデル
 */
export type Memo = Tables<"memos">;

/**
 * 新規作成用（IDや日付が自動生成されるため、それらがオプショナルになった型）
 */
export type CreateMemoInput = TablesInsert<"memos">;

/**
 * 更新用（すべての項目が任意だが、安全のためにIDだけは必須とした型）
 */
export type UpdateMemoInput = TablesUpdate<"memos"> & { id: string };

// 今後、'users' や 'tags' テーブルをDBに追加したら、ここに同様の抽出コードを追記します。
