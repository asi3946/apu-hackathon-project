export type VimMode = "normal" | "insert";
export type CursorPosition = number;

// --- 追加: エディタの動作モード ---
export type EditorType = "standard" | "vim";

// --- 追加: エディタ全体の設定スキーマ ---
export interface EditorSettings {
  type: EditorType;
  // 将来的な拡張性: fontSize: number; など
}
