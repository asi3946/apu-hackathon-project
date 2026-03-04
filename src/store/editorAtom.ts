import { atom } from "jotai";
import { EditorSettings } from "@/types";

// エディタで編集中のテキスト
export const editorContentAtom = atom<string>("");

// --- 追加: エディタの設定状態 ---
// デフォルトは 'standard' (一般ユーザー向け) に設定
export const editorSettingsAtom = atom<EditorSettings>({
  type: "standard",
});
