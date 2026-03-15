import { atom } from "jotai";
import type { Tag } from "@/types/db";
import { createClient } from "@/utils/supabase/client";

export type EditorType = "standard" | "vim";

export interface EditorSettings {
  type: EditorType;
  defaultIsPublic: boolean;
}

// ★ ここに "bookmarks" を追加しました！
export type ViewMode = "editor" | "explore" | "timeline" | "bookmarks";
export const currentViewAtom = atom<ViewMode>("editor");

export type ActiveEditor = "title" | "tags" | "content";
export const activeEditorAtom = atom<ActiveEditor>("content");

export const editorContentAtom = atom<string>("");
export const editorTitleAtom = atom<string>("");
export const editorTagsAtom = atom<Tag[]>([]);
export const editorIsPublicAtom = atom<boolean>(false);

export const allTagsAtom = atom<Tag[]>([]);
export const editorTagInputAtom = atom<string>("");

export const tagSearchQueryAtom = atom<string>("");
export const isTagSearchingAtom = atom<boolean>(false);

export const editorSettingsAtom = atom<EditorSettings>({
  type: "standard",
  defaultIsPublic: false,
});

export const editorEmbeddingCacheAtom = atom<{
  text: string;
  embedding: number[];
} | null>(null);

export const fetchUserSettingsAtom = atom(null, async (get, set) => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data, error } = await supabase.from("user_settings").select("*").eq("id", user.id).single();
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

export const updateUserSettingsAtom = atom(null, async (get, set, update: Partial<EditorSettings>) => {
    const current = get(editorSettingsAtom);
    const next = { ...current, ...update };
    set(editorSettingsAtom, next);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("user_settings").update({
        use_vim_mode: next.type === "vim",
        default_is_public: next.defaultIsPublic,
        updated_at: new Date().toISOString(),
      }).eq("id", user.id);
    if (error) {
      console.error("設定の保存に失敗しました:", error);
      set(editorSettingsAtom, current);
    }
  },
);