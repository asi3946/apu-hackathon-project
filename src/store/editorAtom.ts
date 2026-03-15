import { atom } from "jotai";
import type { Tag } from "@/types/db"; // ← 追加：データベースのTag型を読み込む
import { createClient } from "@/utils/supabase/client";

export type EditorType = "standard" | "vim";

export interface EditorSettings {
  type: EditorType;
  defaultIsPublic: boolean; // 新たに追加
}
// 画面の
export type ViewMode = "editor" | "explore" | "timeline";
export const currentViewAtom = atom<ViewMode>("editor");

// どこの入力欄がアクティブかを判定する型とAtom
export type ActiveEditor = "title" | "tags" | "content";
export const activeEditorAtom = atom<ActiveEditor>("content");

// エディタで現在編集中のテキスト
export const editorContentAtom = atom<string>("");

// エディタで現在編集中のタイトル
export const editorTitleAtom = atom<string>("");

// エディタで現在編集中のタグリスト（確定済みのタグ）
// ← 変更：単なる文字列から、DBのIDを持つオブジェクトの配列に変更しました
export const editorTagsAtom = atom<Tag[]>([]);

// データベースから取得した「利用可能な全タグ」のリストを保持する場所
// ← 追加：DBにあるタグをプルダウンなどで選べるようにするために追加しました
export const allTagsAtom = atom<Tag[]>([]);

// エディタで現在入力中のタグの文字列（Vim操作用に追加）
export const editorTagInputAtom = atom<string>("");

// エディタの設定（ローカルステート）
export const editorSettingsAtom = atom<EditorSettings>({
  type: "standard",
  defaultIsPublic: false,
});

// --- ここからDB連携用のアクションを追加 ---

// 1. 初回ロード時にDBから設定を読み込む
export const fetchUserSettingsAtom = atom(null, async (get, set) => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("設定の取得に失敗しました:", error);
    return;
  }

  if (data) {
    set(editorSettingsAtom, {
      type: data.use_vim_mode ? "vim" : "standard",
      defaultIsPublic: data.default_is_public,
    });
  }
});

// 2. 設定を更新し、DBに保存する
export const updateUserSettingsAtom = atom(
  null,
  async (get, set, update: Partial<EditorSettings>) => {
    const current = get(editorSettingsAtom);
    const next = { ...current, ...update };

    // UIのレスポンスを良くするため、先に画面のステートを更新（オプティミスティックUI）
    set(editorSettingsAtom, next);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("user_settings")
      .update({
        use_vim_mode: next.type === "vim",
        default_is_public: next.defaultIsPublic,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error("設定の保存に失敗しました:", error);
      // DB更新に失敗した場合は、画面を元の状態に戻す
      set(editorSettingsAtom, current);
    }
  },
);
