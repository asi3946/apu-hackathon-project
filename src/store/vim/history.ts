import { atom } from "jotai";
import { activeEditorAtom } from "../editorAtom";
import { activeTextAtom, cursorAtom } from "./core";

export interface HistoryRecord {
  text: string;
  cursor: number;
}

// 履歴の配列と、現在のインデックス（-1は初期状態）
// --- 個別の履歴ステート ---
const contentHistoryAtom = atom<HistoryRecord[]>([]);
const contentHistoryIndexAtom = atom<number>(-1);

const titleHistoryAtom = atom<HistoryRecord[]>([]);
const titleHistoryIndexAtom = atom<number>(-1);

const tagHistoryAtom = atom<HistoryRecord[]>([]);
const tagHistoryIndexAtom = atom<number>(-1);

// --- ルーティング用履歴Atom ---
export const historyAtom = atom(
  (get) => {
    const active = get(activeEditorAtom);
    if (active === "title") return get(titleHistoryAtom);
    if (active === "tags") return get(tagHistoryAtom);
    return get(contentHistoryAtom);
  },
  (get, set, newHistory: HistoryRecord[]) => {
    const active = get(activeEditorAtom);
    if (active === "title") set(titleHistoryAtom, newHistory);
    else if (active === "tags") set(tagHistoryAtom, newHistory);
    else set(contentHistoryAtom, newHistory);
  },
);

export const historyIndexAtom = atom(
  (get) => {
    const active = get(activeEditorAtom);
    if (active === "title") return get(titleHistoryIndexAtom);
    if (active === "tags") return get(tagHistoryIndexAtom);
    return get(contentHistoryIndexAtom);
  },
  (get, set, newIndex: number) => {
    const active = get(activeEditorAtom);
    if (active === "title") set(titleHistoryIndexAtom, newIndex);
    else if (active === "tags") set(tagHistoryIndexAtom, newIndex);
    else set(contentHistoryIndexAtom, newIndex);
  },
);

// --- Actions ---

// 現在の状態を履歴に積む
export const saveHistoryAtom = atom(null, (get, set) => {
  const text = get(activeTextAtom);
  const cursor = get(cursorAtom);
  const history = get(historyAtom);
  const currentIndex = get(historyIndexAtom);

  // 連続で同じ内容が保存されるのを防ぐ
  if (currentIndex >= 0 && history[currentIndex].text === text) {
    return;
  }

  // もしUndoして過去に戻っている状態で新しい操作をしたら、それ以降の未来（Redo履歴）は捨てる
  const newHistory = history.slice(0, currentIndex + 1);
  newHistory.push({ text, cursor });

  // メモリ肥大化を防ぐため最大100件に制限
  if (newHistory.length > 100) {
    newHistory.shift();
  }

  set(historyAtom, newHistory);
  // lengthは0以上だからIndexに合わせるため、-1.
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
    set(activeTextAtom, record.text);
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
    set(activeTextAtom, record.text);
    set(cursorAtom, record.cursor);
  }
});
