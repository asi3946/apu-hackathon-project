import { atom } from "jotai";
import type { Memo, Tag } from "@/types/models";
import { createClient } from "@/utils/supabase/client";
import {
  allTagsAtom,
  editorContentAtom,
  editorTagsAtom,
  editorTitleAtom,
  editorEmbeddingCacheAtom,
  tagSearchQueryAtom,
  isTagSearchingAtom,
  editorSettingsAtom,
  editorIsPublicAtom,
} from "./editorAtom";

// 検索結果専用の型を定義
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

// --- Actions (非同期処理) ---

export const fetchAllTagsAtom = atom(null, async (get, set) => {
  const { data, error } = await supabase
    .from("tags")
    .select("id, name")
    .order("name");

  if (!error && data) {
    set(allTagsAtom, data);
  }
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

    if (!res.ok) throw new Error("Embedding failed");
    const { embedding } = await res.json();

    const { data, error } = await supabase.rpc("match_tags", {
      query_embedding: embedding,
      match_threshold: 0.1,
      match_count: 50,
    });

    if (error) throw error;
    if (data) set(allTagsAtom, data as Tag[]);
  } catch (err) {
    console.error("Tag semantic search failed:", err);
  } finally {
    set(isTagSearchingAtom, false);
  }
});

export const fetchMemosAtom = atom(null, async (get, set) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from("memos")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching memos:", error);
    return;
  }

  if (data) {
    const memoData = data as Memo[];
    set(memoListAtom, memoData);
    
    const selectedId = get(selectedMemoIdAtom) || (memoData.length > 0 ? memoData[0].id : null);
    if (selectedId) {
      if (!get(selectedMemoIdAtom)) set(selectedMemoIdAtom, selectedId);
      const current = memoData.find((m) => m.id === selectedId);
      if (current) set(editorIsPublicAtom, !!current.is_public);
    }
  }
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
    let currentEmbedding: number[] = [];

    if (cache && cache.text === content) {
      currentEmbedding = cache.embedding;
    } else {
      const res = await fetch("/api/embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: `${title}\n${content}` }),
      });

      if (!res.ok) throw new Error("Failed to fetch embedding");
      const data = await res.json();
      currentEmbedding = data.embedding;
    }

    const updated_at = new Date().toISOString();
    const tagNames = tags.map((t: Tag) => t.name);

    const { error } = await supabase
      .from("memos")
      .update({
        title,
        content,
        tags: tagNames,
        is_public: isPublic,
        updated_at,
        embedding: currentEmbedding,
      })
      .eq("id", id);

    if (error) return;

    set(memoListAtom, (prev) =>
      prev.map((memo) =>
        memo.id === id
          ? {
              ...memo,
              title,
              content,
              tags: tagNames,
              is_public: isPublic,
              updated_at,
              embedding: JSON.stringify(currentEmbedding),
            }
          : memo,
      ),
    );

    await fetch("/api/memos/tags/sync", {
      method: "POST",
      body: JSON.stringify({
        memo_id: id,
        tag_ids: tags.map((t: Tag) => t.id),
      }),
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in saveMemoAtom:", err);
  }
});

export const createMemoAtom = atom(null, async (get, set) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const settings = get(editorSettingsAtom);

  const { data, error } = await supabase
    .from("memos")
    .insert([{ 
      user_id: user.id,
      title: "",
      content: "",
      tags: [],
      is_public: settings.defaultIsPublic
    }])
    .select()
    .single();

  if (!error && data) {
    const newMemo = data as Memo;
    const currentList = get(memoListAtom);
    set(memoListAtom, [newMemo, ...currentList]);
    set(selectedMemoIdAtom, newMemo.id);
    set(editorIsPublicAtom, !!newMemo.is_public);
  }
});

export const deleteMemoAtom = atom(null, async (get, set, memoId: string) => {
  const { error } = await supabase.from("memos").delete().eq("id", memoId);
  if (error) return;

  const currentList = get(memoListAtom);
  set(memoListAtom, currentList.filter((memo) => memo.id !== memoId));

  if (get(selectedMemoIdAtom) === memoId) {
    set(selectedMemoIdAtom, null);
  }
});

export type TimelineMemo = Pick<
  Memo,
  "id" | "title" | "content" | "updated_at" | "user_id"
>;

export const timelineMemosAtom = atom<TimelineMemo[]>([]);

export const fetchTimelineMemosAtom = atom(null, async (get, set) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    const response = await fetch("/api/memos/timeline");
    if (response.ok) {
      const data = await response.json();
      
      if (data.timeline_memos) {
        const othersMemos = data.timeline_memos.filter((m: any) => {
          const memoUserId = String(m.user_id);
          const currentUserId = String(user.id);
          return memoUserId !== currentUserId;
        });

        set(timelineMemosAtom, othersMemos);
      }
    }
  } catch (error) {
    console.error("Timeline fetch error:", error);
  }
});

// ==========================================
// ★ 関連公開メモ検索の機能
// ==========================================

export const isSearchingAtom = atom(false);

export const fetchRelatedMemosAtom = atom(null, async (get, set) => {
  const selectedId = get(selectedMemoIdAtom);
  if (!selectedId) return;

  set(isSearchingAtom, true);
  try {
    // ★ 検索前に自動で最新状態を保存（ベクトル化）する！
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
    console.error("Related search error:", error);
  } finally {
    set(isSearchingAtom, false);
  }
});