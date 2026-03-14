import { atom } from "jotai";
import type { Memo } from "@/types/models";
import { createClient } from "@/utils/supabase/client";
import {
  editorContentAtom,
  editorTagsAtom,
  editorTitleAtom,
} from "./editorAtom";

export const isExploreModeAtom = atom(false);

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
  const tags = get(editorTagsAtom);

  if (!id) return;

  try {
    // 【追加】あなたが作成したAPIを叩いてベクトルを取得する
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

    // 【修正】embeddingも一緒にDBに保存する
    const { error } = await supabase
      .from("memos")
      .update({
        title,
        content,
        tags,
        updated_at,
        embedding, // ここでベクトルデータを保存
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
          ? { ...memo, title, content, tags, updated_at, embedding }
          : memo,
      ),
    );
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
