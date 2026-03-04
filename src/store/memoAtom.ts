import { atom } from "jotai";
import { Memo } from "@/types";

// ダミーデータ (Schema準拠)
const initialMemos: Memo[] = [
  {
    id: "memo-1",
    user_id: "dummy-user",
    title: "Vim操作チートシート",
    content:
      "h: 左\nj: 下\nk: 上\nl: 右\n0: 行頭\n$: 行末\ni: インサートモード",
    tags: ["vim", "help"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const memoListAtom = atom<Memo[]>(initialMemos);
export const selectedMemoIdAtom = atom<string | null>("memo-1");

// 選択中のメモを取得する派生Atom
export const currentMemoAtom = atom((get) => {
  const memos = get(memoListAtom);
  const selectedId = get(selectedMemoIdAtom);
  return memos.find((m) => m.id === selectedId) || null;
});
