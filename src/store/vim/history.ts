import { atom } from "jotai";
import { editorContentAtom } from "@/store/models";
import { cursorAtom } from "./core";

export interface HistoryRecord {
  content: string;
  cursor: number;
}

// 履歴の配列と、現在のインデックス（-1は初期状態）
export const historyAtom = atom<HistoryRecord[]>([]);
export const historyIndexAtom = atom<number>(-1);

// --- Actions ---

// 現在の状態を履歴に積む
export const saveHistoryAtom = atom(null, (get, set) => {
  const content = get(editorContentAtom);
  const cursor = get(cursorAtom);
  const history = get(historyAtom);
  const currentIndex = get(historyIndexAtom);

  // 連続で同じ内容が保存されるのを防ぐ
  if (currentIndex >= 0 && history[currentIndex].content === content) {
    return;
  }

  // もしUndoして過去に戻っている状態で新しい操作をしたら、それ以降の未来（Redo履歴）は捨てる
  const newHistory = history.slice(0, currentIndex + 1);
  newHistory.push({ content, cursor });

  // メモリ肥大化を防ぐため最大100件に制限
  if (newHistory.length > 100) {
    newHistory.shift();
  }

  set(historyAtom, newHistory);
  set(historyIndexAtom, newHistory.length - 1);
});

// u (Undo)
export const undoAtom = atom(null, (get, set) => {
  const history = get(historyAtom);
  const currentIndex = get(historyIndexAtom);

  // 1つ以上過去の履歴がある場合のみ戻る
  if (currentIndex > 0) {
    const prevIndex = currentIndex - 1;
    const record = history[prevIndex];

    set(historyIndexAtom, prevIndex);
    set(editorContentAtom, record.content);
    set(cursorAtom, record.cursor);
  }
});

// Ctrl+R (Redo)
export const redoAtom = atom(null, (get, set) => {
  const history = get(historyAtom);
  const currentIndex = get(historyIndexAtom);

  // 現在より未来の履歴がある場合のみ進む
  if (currentIndex < history.length - 1) {
    const nextIndex = currentIndex + 1;
    const record = history[nextIndex];

    set(historyIndexAtom, nextIndex);
    set(editorContentAtom, record.content);
    set(cursorAtom, record.cursor);
  }
});
