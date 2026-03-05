import { atom } from "jotai";
import type { EditorSettings } from "@/types/editor"; // または '@/types'

// 1. エディタで現在編集中のテキスト
export const editorContentAtom = atom<string>("");

// 2. エディタで現在編集中のタイトル
export const editorTitleAtom = atom<string>("");

// 3. エディタの設定（Vimモードか標準モードか）
export const editorSettingsAtom = atom<EditorSettings>({
  type: "standard", // デフォルトは標準モード
});
