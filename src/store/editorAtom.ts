import { atom } from "jotai";

export type EditorType = "standard" | "vim";

export interface EditorSettings {
  type: EditorType;
  // 将来的な拡張性: fontSize?: number; など
}

// エディタで現在編集中のテキスト
export const editorContentAtom = atom<string>("");

// エディタで現在編集中のタイトル
export const editorTitleAtom = atom<string>("");

// エディタで現在編集中のタグリスト
export const editorTagsAtom = atom<string[]>([]);

// エディタの設定（Vimモードか標準モードか）
export const editorSettingsAtom = atom<EditorSettings>({
  type: "standard", // デフォルトは標準モード
});
