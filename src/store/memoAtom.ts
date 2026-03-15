import { atom } from "jotai";
import type { Memo, Tag } from "@/types/models";
import { createClient } from "@/utils/supabase/client";
import {
  allTagsAtom, // ← 追加：全タグリストのAtom
  editorContentAtom,
  editorTagsAtom,
  editorTitleAtom,
} from "./editorAtom";

// 検索結果専用の型を定義（既存のMemo型を拡張）
export interface SearchedMemo extends Memo {
  similarity: number;
}

export const isExploreModeAtom = atom(false);

export const searchedMemosAtom = atom<SearchedMemo[]>([]);
export const selectedSearchedMemoAtom = atom<SearchedMemo | null>(null);

const supabase = createClient();

// メモのリストを保持するAtom
export const memoListAtom = atom<Memo[]>([]);
export const selectedMemoIdAtom = atom<string | null>(null);

// 選択中のメモを取得する派生Atom
export const currentMemoAtom = atom((get) => {
  const memos = get(memoListAtom);
  const selectedId = get(selectedMemoIdAtom);
  return memos.find((m) => m.id === selectedId) || null;
});

// --- Actions (非同期処理) ---

// 【追加】全タグ一覧をDBから取得するAction
export const fetchAllTagsAtom = atom(null, async (get, set) => {
  const { data, error } = await supabase
    .from("tags")
    .select("id, name")
    .order("name");

  if (!error && data) {
    set(allTagsAtom, data);
  }
});

// 1. メモ一覧を取得するAction
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

// 2. メモを保存するAction (修正版)
export const saveMemoAtom = atom(null, async (get, set) => {
  const id = get(selectedMemoIdAtom);
  const title = get(editorTitleAtom);
  const content = get(editorContentAtom);
  const tags = get(editorTagsAtom); // ← 現在は Tag[] 型 (オブジェクトの配列)

  if (!id) return;

  try {
    // あなたが作成したAPIを叩いてベクトルを取得する (既存の処理そのまま)
    const res = await fetch("/api/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: `${title}\n${content}` }),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch embedding");
    }

    const { embedding } = await res.json();
    const updated_at = new Date().toISOString();

    // 【エラー対策】DB(memos)とローカル状態には、オブジェクトから「名前(文字)」だけを抽出して渡す
    const tagNames = tags.map((t: Tag) => t.name);

    // embeddingと一緒にDB(memos)に保存する
    const { error } = await supabase
      .from("memos")
      .update({
        title,
        content,
        tags: tagNames, // ← Tag[] ではなく string[] を渡すのでエラーが消えます！
        updated_at,
        embedding,
      })
      .eq("id", id);

    if (error) {
      console.error("Error saving memo to Supabase:", error);
      return;
    }

    // 成功したらローカルのリスト（Jotaiの状態）も更新
    set(memoListAtom, (prev) =>
      prev.map((memo) =>
        memo.id === id
          ? { ...memo, title, content, tags: tagNames, updated_at, embedding } // ← ここも string[] を渡す
          : memo,
      ),
    );

    // 【追加】タグの中間テーブル(memo_tags)同期APIを叩く
    const syncRes = await fetch("/api/memos/tags/sync", {
      method: "POST",
      body: JSON.stringify({
        memo_id: id,
        tag_ids: tags.map((t: Tag) => t.id), // こっちはDBのIDの配列を送る
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
