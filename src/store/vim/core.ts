import { atom } from "jotai";
import type { CursorPosition, VimMode } from "@/types/models";
import {
  activeEditorAtom,
  editorContentAtom,
  editorTagInputAtom,
  editorTitleAtom,
} from "../editorAtom";

// --- 各エディタごとに独立した状態（直接触ることはない裏側のAtom） ---

export const contentModeAtom = atom<VimMode>("normal");
export const titleModeAtom = atom<VimMode>("normal");
export const tagModeAtom = atom<VimMode>("normal");

export const contentCursorAtom = atom<CursorPosition>(0);
export const titleCursorAtom = atom<CursorPosition>(0);
export const tagCursorAtom = atom<CursorPosition>(0);

export const contentVisualStartAtom = atom<number | null>(null);
export const titleVisualStartAtom = atom<number | null>(null);
export const tagVisualStartAtom = atom<number | null>(null);

// --- ルーティング用（派生）Atom ---
// ロジック側は、以下のAtomだけを読み書きすれば、対象が自動で切り替わる

// 1. アクティブなエディタのモード
export const modeAtom = atom(
  (get) => {
    const active = get(activeEditorAtom);
    if (active === "title") return get(titleModeAtom);
    if (active === "tags") return get(tagModeAtom);
    return get(contentModeAtom);
  },
  (get, set, newMode: VimMode) => {
    const active = get(activeEditorAtom);
    if (active === "title") set(titleModeAtom, newMode);
    else if (active === "tags") set(tagModeAtom, newMode);
    else set(contentModeAtom, newMode);
  },
);

// 2. アクティブなエディタのカーソル位置
export const cursorAtom = atom(
  (get) => {
    const active = get(activeEditorAtom);
    if (active === "title") return get(titleCursorAtom);
    if (active === "tags") return get(tagCursorAtom);
    return get(contentCursorAtom);
  },
  (get, set, update: number | ((prev: number) => number)) => {
    const active = get(activeEditorAtom);
    const targetAtom =
      active === "title"
        ? titleCursorAtom
        : active === "tags"
          ? tagCursorAtom
          : contentCursorAtom;

    const newValue =
      typeof update === "function" ? update(get(targetAtom)) : update;
    set(targetAtom, newValue);
  },
);

// 3. アクティブなエディタのビジュアルモード開始位置
export const visualStartAtom = atom(
  (get) => {
    const active = get(activeEditorAtom);
    if (active === "title") return get(titleVisualStartAtom);
    if (active === "tags") return get(tagVisualStartAtom);
    return get(contentVisualStartAtom);
  },
  (get, set, newStart: number | null) => {
    const active = get(activeEditorAtom);
    if (active === "title") set(titleVisualStartAtom, newStart);
    else if (active === "tags") set(tagVisualStartAtom, newStart);
    else set(contentVisualStartAtom, newStart);
  },
);

// 4. アクティブなエディタのテキスト本体
export const activeTextAtom = atom(
  (get) => {
    const active = get(activeEditorAtom);
    if (active === "title") return get(editorTitleAtom);
    if (active === "tags") return get(editorTagInputAtom);
    return get(editorContentAtom);
  },
  (get, set, update: string | ((prev: string) => string)) => {
    const active = get(activeEditorAtom);
    const targetAtom =
      active === "title"
        ? editorTitleAtom
        : active === "tags"
          ? editorTagInputAtom
          : editorContentAtom;

    const newValue =
      typeof update === "function" ? update(get(targetAtom)) : update;
    set(targetAtom, newValue);
  },
);

// 行の情報取得.

export const getLineStart = (text: string, pos: number) => {
  // もしposが'\n'だった時lastIndexOfはpos自身に反応する.
  // そのため、一つ引いてpos以前の文を探索するようにしている.
  const searchPos = pos - 1;
  if (searchPos < 0) return 0;
  // lastIndexOfは目的のものがなかった時-1を返す.
  // lastIndexOfは第二引数の数を減らしながら最初の"\n"の位置をかえす.
  const lastNewLine = text.lastIndexOf("\n", searchPos);
  // 返値はその行の最初の文字の位置.
  return lastNewLine === -1 ? 0 : lastNewLine + 1;
};

// 新しく追加：行の末尾（改行文字の位置、またはEOF）を取得する
export const getLineEnd = (text: string, pos: number) => {
  const nextNewLine = text.indexOf("\n", pos);
  // trueの時はtext自体が1行しかない.
  // 例えば"やあ\nこんにちは\n"というtextの時、二行目の'こ'にいる際、posは3.
  // nextNewlineは8となる.8-3で5となり、正しい.
  // "やあ\nこんにちは"の時、二行目の'こ'にいるとき、posは3,nextNewLineは-1で
  // text.lenghtにより8が返され、8-3で5となり正しい.
  return nextNewLine === -1 ? text.length : nextNewLine;
};

export const getLineLength = (text: string, lineStart: number) => {
  const lineEnd = getLineEnd(text, lineStart);
  return lineEnd - lineStart;
};
