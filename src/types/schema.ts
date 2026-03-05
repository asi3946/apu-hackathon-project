import type { Database } from "./supabase";

// 1. 読み取り用の型（DBの実際の構造と完全一致）
export type Memo = Database["public"]["Tables"]["memos"]["Row"];

// 2. 新規作成用の型（idやcreated_atなど、DB側で自動生成される項目がオプショナルになる）
export type CreateMemoInput = Database["public"]["Tables"]["memos"]["Insert"];

// 3. 更新用の型（変更したい項目だけを渡せるように全てオプショナルになるが、idだけは必須にする）
export type UpdateMemoInput =
  Database["public"]["Tables"]["memos"]["Update"] & { id: string };
