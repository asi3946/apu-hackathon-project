import { atom } from "jotai";
import { supabase } from "@/lib/supabase";
import type { Memo } from "@/types/schema";

// メモのリストを保持するAtom.atomはAtomを定義するときにつかう.
// atom(初期値,書き込み用関数)
export const memoListAtom = atom<Memo[]>([]);
export const selectedMemoIdAtom = atom<string | null>(null);

// 選択中のメモを取得する派生Atom.読み取り専用.
export const currentMemoAtom = atom((get) => {
  const memos = get(memoListAtom);
  const selectedId = get(selectedMemoIdAtom);
  return memos.find((m) => m.id === selectedId) || null;
});

// --- Actions (非同期処理) ---

// 1. メモ一覧を取得するAction.派生Atom.書き込み専用.
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
    // リストが空でなければ、最初のメモを選択状態にする
    if (data.length > 0 && !get(selectedMemoIdAtom)) {
      set(selectedMemoIdAtom, data[0].id);
    }
  }
});

// 2. メモを保存するAction
export const saveMemoAtom = atom(
  null,
  async (get, set, payload: { id: string; title: string; content: string }) => {
    const { id, title, content } = payload;
    const updated_at = new Date().toISOString();

    const { error } = await supabase
      .from("memos")
      .update({ title, content, updated_at })
      .eq("id", id);

    if (error) {
      console.error("Error saving memo:", error);
      return;
    }

    // 成功したらローカルのStateも更新する
    set(memoListAtom, (prev) =>
      prev.map((memo) =>
        memo.id === id ? { ...memo, title, content, updated_at } : memo,
      ),
    );
  },
);
