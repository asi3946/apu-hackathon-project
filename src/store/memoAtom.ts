"use client";

import { atom } from "jotai";
import type { Memo, Tag } from "@/types/models";
import { createClient } from "@/utils/supabase/client";
import {
  aiCooldownAtom,
  allTagsAtom,
  currentViewAtom,
  editorContentAtom,
  editorEmbeddingCacheAtom,
  editorIsPublicAtom,
  editorSettingsAtom,
  editorTagsAtom,
  editorTitleAtom,
  isTagAiLoadingAtom,
  isTagSearchingAtom,
  isTitleAiLoadingAtom,
  tagSearchQueryAtom,
} from "./editorAtom";

export interface SearchedMemo extends Memo {
  similarity: number;
}

export const isExploreModeAtom = atom(false);
export const searchedMemosAtom = atom<SearchedMemo[]>([]);
export const selectedSearchedMemoAtom = atom<SearchedMemo | null>(null);

const supabase = createClient();

export const memoListAtom = atom<Memo[]>([]);
export const selectedMemoIdAtom = atom<string | null>(null);

export const currentMemoAtom = atom((get) => {
  const memos = get(memoListAtom);
  const selectedId = get(selectedMemoIdAtom);
  return memos.find((m) => m.id === selectedId) || null;
});

export const fetchAllTagsAtom = atom(null, async (get, set) => {
  const { data } = await supabase.from("tags").select("id, name").order("name");
  if (data) set(allTagsAtom, data);
});

export const searchTagsSemanticAtom = atom(null, async (get, set) => {
  const query = get(tagSearchQueryAtom);
  if (!query.trim()) {
    set(isTagSearchingAtom, false);
    const { data } = await supabase
      .from("tags")
      .select("id, name")
      .order("name");
    if (data) set(allTagsAtom, data);
    return;
  }
  set(isTagSearchingAtom, true);
  try {
    const res = await fetch("/api/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: query }),
    });
    const { embedding } = await res.json();
    const { data, error } = await supabase.rpc("match_tags", {
      query_embedding: embedding,
      match_threshold: 0.1,
      match_count: 50,
    });
    if (data) set(allTagsAtom, data as Tag[]);
  } catch (err) {
    console.error(err);
  } finally {
    set(isTagSearchingAtom, false);
  }
});

export const fetchMemosAtom = atom(null, async (get, set) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const { data } = await supabase
    .from("memos")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });
  if (data) set(memoListAtom, data as Memo[]);
});

export const saveMemoAtom = atom(null, async (get, set) => {
  const id = get(selectedMemoIdAtom);
  const title = get(editorTitleAtom);
  const content = get(editorContentAtom);
  const tags = get(editorTagsAtom);
  const isPublic = get(editorIsPublicAtom);
  const cache = get(editorEmbeddingCacheAtom);
  if (!id) return;
  try {
    let currentEmbedding =
      cache && cache.text === content ? cache.embedding : null;
    if (!currentEmbedding) {
      const res = await fetch("/api/embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: `${title}\n${content}` }),
      });
      const data = await res.json();
      currentEmbedding = data.embedding;
    }
    const tagNames = tags.map((t: Tag) => t.name);
    await supabase
      .from("memos")
      .update({
        title,
        content,
        tags: tagNames,
        is_public: isPublic,
        updated_at: new Date().toISOString(),
        embedding: currentEmbedding,
      })
      .eq("id", id);
    set(memoListAtom, (prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, title, content, tags: tagNames, is_public: isPublic }
          : m,
      ),
    );
  } catch (err) {
    console.error(err);
  }
});

export const createMemoAtom = atom(null, async (get, set) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const settings = get(editorSettingsAtom);
  const { data } = await supabase
    .from("memos")
    .insert([
      {
        user_id: user?.id,
        title: "",
        content: "",
        tags: [],
        is_public: settings.defaultIsPublic,
      },
    ])
    .select()
    .single();
  if (data) {
    set(memoListAtom, [data as Memo, ...get(memoListAtom)]);
    set(selectedMemoIdAtom, data.id);
  }
});

export const deleteMemoAtom = atom(null, async (get, set, memoId: string) => {
  await supabase.from("memos").delete().eq("id", memoId);
  set(
    memoListAtom,
    get(memoListAtom).filter((m) => m.id !== memoId),
  );

  if (get(selectedMemoIdAtom) === memoId) {
    set(selectedMemoIdAtom, null);
    set(editorTitleAtom, "");
    set(editorContentAtom, "");
    set(editorTagsAtom, []);
    set(editorIsPublicAtom, false);
  }
});

export type TimelineMemo = Pick<
  Memo,
  "id" | "title" | "content" | "updated_at" | "user_id" | "tags"
>;
export const timelineMemosAtom = atom<TimelineMemo[]>([]);

export const fetchTimelineMemosAtom = atom(null, async (get, set) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const response = await fetch("/api/memos/timeline");
  if (response.ok) {
    const data = await response.json();
    if (data.timeline_memos) {
      set(
        timelineMemosAtom,
        data.timeline_memos.filter(
          (m: any) => String(m.user_id) !== String(user?.id),
        ),
      );
    }
  }
});

export const isSearchingAtom = atom(false);
export const fetchRelatedMemosAtom = atom(null, async (get, set) => {
  const selectedId = get(selectedMemoIdAtom);
  if (!selectedId) return;
  set(isSearchingAtom, true);
  try {
    await set(saveMemoAtom);
    const res = await fetch("/api/memos/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source_memo_id: selectedId, limit: 10 }),
    });
    if (res.ok) {
      const data = await res.json();
      set(searchedMemosAtom, data.related_memos || []);
    }
  } catch (error) {
    console.error(error);
  } finally {
    set(isSearchingAtom, false);
  }
});

// ==========================================
// ★ ブックマーク機能
// ==========================================
export const bookmarkedMemosAtom = atom<TimelineMemo[]>([]);
export const bookmarkedMemoIdsAtom = atom<string[]>([]);

export const fetchBookmarkedMemosAtom = atom(null, async (get, set) => {
  try {
    const res = await fetch("/api/memos/bookmarks");
    if (res.ok) {
      const data = await res.json();
      set(bookmarkedMemosAtom, data.bookmarks || []);
      set(
        bookmarkedMemoIdsAtom,
        (data.bookmarks || []).map((m: any) => m.id),
      );
    }
  } catch (error) {
    console.error("Bookmark fetch error:", error);
  }
});

export const toggleBookmarkAtom = atom(
  null,
  async (get, set, memoId: string) => {
    const currentIds = get(bookmarkedMemoIdsAtom);
    const isBookmarked = currentIds.includes(memoId);

    // クリックした瞬間にUIの見た目を切り替える
    set(
      bookmarkedMemoIdsAtom,
      isBookmarked
        ? currentIds.filter((id) => id !== memoId)
        : [memoId, ...currentIds],
    );

    // ★ 追加: ブックマーク画面を開いている時に解除した場合、右側の表示を空にする
    const currentView = get(currentViewAtom);
    if (isBookmarked && currentView === "bookmarks") {
      const selected = get(selectedSearchedMemoAtom);
      if (selected?.id === memoId) {
        set(selectedSearchedMemoAtom, null);
      }
    }

    try {
      const res = await fetch("/api/memos/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memo_id: memoId }),
      });

      if (!res.ok) throw new Error("Failed to toggle bookmark");

      await set(fetchBookmarkedMemosAtom);
    } catch (error) {
      console.error(error);
      set(bookmarkedMemoIdsAtom, currentIds);
    }
  },
);

// --- src/store/memoAtom.ts の末尾に追加 ---
export const autoTitleAtom = atom(null, async (get, set) => {
  const content = get(editorContentAtom);
  if (!content || get(isTitleAiLoadingAtom) || get(aiCooldownAtom) > 0) return;

  set(isTitleAiLoadingAtom, true);
  try {
    const res = await fetch("/api/memos/title/auto", {
      method: "POST",
      body: JSON.stringify({ content }),
      headers: { "Content-Type": "application/json" },
    });
    if (res.status === 429) {
      const data = await res.json();
      set(aiCooldownAtom, data.retryAfter || 60);
      return;
    }
    const data = await res.json();
    if (data.title) {
      set(editorTitleAtom, data.title);
      setTimeout(() => set(saveMemoAtom), 100); // 自動保存
    }
  } catch (err) {
    console.error("AI Auto-title failed:", err);
  } finally {
    set(isTitleAiLoadingAtom, false);
  }
});

export const autoTagAtom = atom(null, async (get, set) => {
  const content = get(editorContentAtom);
  if (!content || get(isTagAiLoadingAtom) || get(aiCooldownAtom) > 0) return;

  set(isTagAiLoadingAtom, true);
  try {
    const res = await fetch("/api/memos/tags/auto", {
      method: "POST",
      body: JSON.stringify({ content }),
      headers: { "Content-Type": "application/json" },
    });
    if (res.status === 429) {
      const data = await res.json();
      set(aiCooldownAtom, data.retryAfter || 60);
      return;
    }
    const data = await res.json();
    if (data.suggestedTags) {
      set(editorTagsAtom, data.suggestedTags);
      await set(fetchAllTagsAtom);
      if (data.embedding) {
        set(editorEmbeddingCacheAtom, {
          text: content,
          embedding: data.embedding,
        });
      }
      setTimeout(() => set(saveMemoAtom), 100); // 自動保存
    }
  } catch (err) {
    console.error("AI Auto-tag failed:", err);
  } finally {
    set(isTagAiLoadingAtom, false);
  }
});
