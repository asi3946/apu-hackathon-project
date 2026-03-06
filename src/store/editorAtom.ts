import { atom } from "jotai";

export type VimMode = "normal" | "insert";
export type EditorType = "standard" | "vim";

export interface EditorSettings {
  type: EditorType;
  // 将来的な拡張性: fontSize?: number; など
}

// 1. エディタで現在編集中のテキスト
export const editorContentAtom = atom<string>("");

// 2. エディタで現在編集中のタイトル
export const editorTitleAtom = atom<string>("");

// 3. エディタの設定（Vimモードか標準モードか）
export const editorSettingsAtom = atom<EditorSettings>({
  type: "standard", // デフォルトは標準モード
});
