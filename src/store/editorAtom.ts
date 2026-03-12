import { atom } from "jotai";

export type EditorType = "standard" | "vim";

export interface EditorSettings {
  type: EditorType;
  // 将来的な拡張性: fontSize?: number; など
}

// どこの入力欄がアクティブかを判定する型とAtom
export type ActiveEditor = "title" | "tags" | "content";
export const activeEditorAtom = atom<ActiveEditor>("content");

// エディタで現在編集中のテキスト
export const editorContentAtom = atom<string>("");

// エディタで現在編集中のタイトル
export const editorTitleAtom = atom<string>("");

// エディタで現在編集中のタグリスト（確定済みのタグ）
export const editorTagsAtom = atom<string[]>([]);

// エディタで現在入力中のタグの文字列（Vim操作用に追加）
export const editorTagInputAtom = atom<string>("");

// エディタの設定（Vimモードか標準モードか）
export const editorSettingsAtom = atom<EditorSettings>({
  type: "standard", // デフォルトは標準モード
});
