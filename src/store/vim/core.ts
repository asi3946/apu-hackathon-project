import { atom } from "jotai";
import type { CursorPosition, VimMode } from "@/types/models"; // CursorPositionはnumber.

export const modeAtom = atom<VimMode>("normal");
export const visualStartAtom = atom<number | null>(null);
export const cursorAtom = atom<CursorPosition>(0);

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
