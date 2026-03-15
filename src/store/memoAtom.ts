import { atom } from "jotai";
import type { Memo, Tag } from "@/types/models";
import { createClient } from "@/utils/supabase/client";
import {
  allTagsAtom,
  editorContentAtom,
  editorTagsAtom,
  editorTitleAtom,
  editorEmbeddingCacheAtom,
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

// 2. メモを保存するAction (キャッシュ対応＆型エラー修正版)
export const saveMemoAtom = atom(null, async (get, set) => {
  const id = get(selectedMemoIdAtom);
  const title = get(editorTitleAtom);
  const content = get(editorContentAtom);
  const tags = get(editorTagsAtom);
  const cache = get(editorEmbeddingCacheAtom);

  if (!id) return;

  try {
    let currentEmbedding: number[] = [];

    // キャッシュがあり、かつ内容が一致していれば再利用（課金回避）
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

    // DB(Supabase)へ保存
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

    // ローカルのJotaiリストを更新
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

    // タグの中間テーブル(memo_tags)同期
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

    // ★ 修正点：ここにあったキャッシュクリアの set(editorEmbeddingCacheAtom, null) を削除しました。
    // これにより、内容が変わらない限りタイトル生成などの連続操作でもキャッシュが生き続けます。

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