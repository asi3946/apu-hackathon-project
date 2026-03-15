import { atom } from "jotai";
import type { Memo, Tag } from "@/types/models";
import { createClient } from "@/utils/supabase/client";
import {
  allTagsAtom,
  editorContentAtom,
  editorTagsAtom,
  editorTitleAtom,
  editorEmbeddingCacheAtom,
  tagSearchQueryAtom,   // ★追加
  isTagSearchingAtom,   // ★追加
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

// タグ一覧をDBから取得するAction
export const fetchAllTagsAtom = atom(null, async (get, set) => {
  const { data, error } = await supabase
    .from("tags")
    .select("id, name")
    .order("name");

  if (!error && data) {
    set(allTagsAtom, data);
  }
});

// ★追加：タグをセマンティック検索（意味検索）するAction
export const searchTagsSemanticAtom = atom(null, async (get, set) => {
  const query = get(tagSearchQueryAtom);

  // 検索ワードが空の場合は、通常の全タグ取得に戻す
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
    // 1. 検索ワードをベクトル化
    const res = await fetch("/api/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: query }),
    });

    if (!res.ok) throw new Error("Embedding failed");
    const { embedding } = await res.json();

    // 2. Supabase RPC 'match_tags' を呼び出して関連タグを抽出
    const { data, error } = await supabase.rpc("match_tags", {
      query_embedding: embedding,
      match_threshold: 0.1, // 関連度順に並べるため低めに設定
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
  const { data, error } = await supabase
    .from("memos")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching memos:", error);
    return;
  }

  if (data) {
    set(memoListAtom, data as Memo[]);
    if (data.length > 0 && !get(selectedMemoIdAtom)) {
      set(selectedMemoIdAtom, data[0].id);
    }
  }
});

// メモを保存するAction
export const saveMemoAtom = atom(null, async (get, set) => {
  const id = get(selectedMemoIdAtom);
  const title = get(editorTitleAtom);
  const content = get(editorContentAtom);
  const tags = get(editorTagsAtom);
  const cache = get(editorEmbeddingCacheAtom);

  if (!id) return;

  try {
    let currentEmbedding: number[] = [];

    if (cache && cache.text === content) {
      console.log("♻️ ベクトルキャッシュを使い回して保存します（API料金 ¥0）");
      currentEmbedding = cache.embedding;
    } else {
      console.log("⚡ 新しくベクトルを生成して保存します");
      const res = await fetch("/api/embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: `${title}\n${content}` }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch embedding");
      }
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
        updated_at,
        embedding: currentEmbedding,
      })
      .eq("id", id);

    if (error) {
      console.error("Error saving memo to Supabase:", error);
      return;
    }

    set(memoListAtom, (prev) =>
      prev.map((memo) =>
        memo.id === id
          ? {
              ...memo,
              title,
              content,
              tags: tagNames,
              updated_at,
              embedding: JSON.stringify(currentEmbedding),
            }
          : memo,
      ),
    );

    const syncRes = await fetch("/api/memos/tags/sync", {
      method: "POST",
      body: JSON.stringify({
        memo_id: id,
        tag_ids: tags.map((t: Tag) => t.id),
      }),
      headers: { "Content-Type": "application/json" },
    });

    if (!syncRes.ok) {
      console.error("Tags sync failed");
    }
  } catch (err) {
    console.error("Error in saveMemoAtom:", err);
  }
});

export const createMemoAtom = atom(null, async (get, set) => {
  const { data, error } = await supabase
    .from("memos")
    .insert([{}])
    .select()
    .single();

  if (error) {
    console.error("メモの作成に失敗しました:", error);
    return;
  }

  if (data) {
    const currentList = get(memoListAtom);
    set(memoListAtom, [data as Memo, ...currentList]);
    set(selectedMemoIdAtom, data.id);
  }
});

export const deleteMemoAtom = atom(null, async (get, set, memoId: string) => {
  const { error } = await supabase.from("memos").delete().eq("id", memoId);

  if (error) {
    console.error("メモの削除に失敗しました:", error);
    return;
  }

  const currentList = get(memoListAtom);
  const filteredList = currentList.filter((memo) => memo.id !== memoId);
  set(memoListAtom, filteredList);

  const selectedId = get(selectedMemoIdAtom);
  if (selectedId === memoId) {
    set(selectedMemoIdAtom, null);
  }
});

export type TimelineMemo = Pick<
  Memo,
  "id" | "title" | "content" | "updated_at" | "user_id"
>;

export const timelineMemosAtom = atom<TimelineMemo[]>([]);

export const fetchTimelineMemosAtom = atom(null, async (get, set) => {
  try {
    const response = await fetch("/api/memos/timeline");
    if (response.ok) {
      const data = await response.json();
      if (data.timeline_memos) {
        set(timelineMemosAtom, data.timeline_memos as TimelineMemo[]);
      }
    } else {
      console.error("Timeline API error:", await response.text());
    }
  } catch (error) {
    console.error("Timeline fetch error:", error);
  }
});