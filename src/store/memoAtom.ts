import { atom } from "jotai";
import { supabase } from "@/lib/supabase";
import { editorContentAtom, editorTitleAtom } from "@/store/models";
import type { Memo } from "@/types/models";
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
// store/memoAtom.ts (または該当のファイル)
export const saveMemoAtom = atom(null, async (get, set) => {
  // コンポーネントからではなく、JotaiのAtomから直接最新の値を取得する
  const id = get(selectedMemoIdAtom);
  const title = get(editorTitleAtom);
  const content = get(editorContentAtom);

  // IDがない（メモが選択されていない）場合は何もしない
  if (!id) return;

  const updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("memos")
    .update({ title, content, updated_at })
    .eq("id", id);

  if (error) {
    console.error("Error saving memo:", error);
    return;
  }

  // 成功したらローカルのリストも更新
  set(memoListAtom, (prev) =>
    prev.map((memo) =>
      memo.id === id ? { ...memo, title, content, updated_at } : memo,
    ),
  );
});

export const createMemoAtom = atom(null, async (get, set) => {
  // DBの記述的に何も渡さなくてもメモデータが作られる.
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
    // 既存のメモリストを取得
    const currentList = get(memoListAtom);

    // 作成した新しいメモをリストの先頭に追加して状態を更新
    set(memoListAtom, [data as Memo, ...currentList]);

    // エディタの表示を新しく作成したメモに切り替える
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
