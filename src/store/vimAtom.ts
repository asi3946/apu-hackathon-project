import { atom } from "jotai";
import { VimMode, CursorPosition } from "@/types";

// --- State ---
export const modeAtom = atom<VimMode>("normal");
export const cursorAtom = atom<CursorPosition>(0);

// --- 物理法則 (Core Helpers) ---

/**
 * 指定した位置(pos)が含まれる行の「開始インデックス」を返す。
 * 全ての移動ロジックの基底となる関数。
 */
const getLineStart = (text: string, pos: number) => {
  const searchPos = pos - 1;
  if (searchPos < 0) return 0;
  const lastNewLine = text.lastIndexOf("\n", searchPos);
  return lastNewLine === -1 ? 0 : lastNewLine + 1;
};

/**
 * 指定した行頭(lineStart)から、その行の「文字数」を返す。
 */
const getLineLength = (text: string, lineStart: number) => {
  const nextNewLine = text.indexOf("\n", lineStart);
  const lineEnd = nextNewLine === -1 ? text.length : nextNewLine;
  return lineEnd - lineStart;
};

// --- Vim Logic (Actions) ---

// j (下移動)
export const moveDownAtom = atom(null, (get, set, text: string) => {
  const currentPos = get(cursorAtom);
  const lineStart = getLineStart(text, currentPos);
  const col = currentPos - lineStart;

  const nextNewLine = text.indexOf("\n", currentPos);
  if (nextNewLine === -1) return; // 次の行がない

  const nextLineStart = nextNewLine + 1;
  const nextLineLength = getLineLength(text, nextLineStart);

  set(cursorAtom, nextLineStart + Math.min(col, nextLineLength));
});

// k (上移動)
export const moveUpAtom = atom(null, (get, set, text: string) => {
  const currentPos = get(cursorAtom);
  const lineStart = getLineStart(text, currentPos);
  const col = currentPos - lineStart;

  if (lineStart === 0) return; // 1行目なら何もしない

  // 前の行の行頭を探す
  const prevLineStart = getLineStart(text, lineStart - 1);
  const prevLineLength = getLineLength(text, prevLineStart);

  set(cursorAtom, prevLineStart + Math.min(col, prevLineLength));
});

// h (左移動)
export const moveLeftAtom = atom(null, (get, set, text: string) => {
  const current = get(cursorAtom);
  const lineStart = getLineStart(text, current);

  // 現在地が行頭より大きければ移動できる（行頭なら動かない）
  if (current > lineStart) {
    set(cursorAtom, current - 1);
  }
});

// l (右移動)
export const moveRightAtom = atom(null, (get, set, text: string) => {
  const current = get(cursorAtom);
  const nextNewLine = text.indexOf("\n", current);
  const lineEnd = nextNewLine === -1 ? text.length : nextNewLine;

  // 現在地が行末(改行の手前)より小さければ移動できる
  if (current < lineEnd) {
    set(cursorAtom, current + 1);
  }
});

// 0 (行頭へジャンプ)
export const jumpToLineStartAtom = atom(null, (get, set, text: string) => {
  const current = get(cursorAtom);
  set(cursorAtom, getLineStart(text, current));
});

// $ (行末へジャンプ)
export const jumpToLineEndAtom = atom(null, (get, set, text: string) => {
  const current = get(cursorAtom);
  const lineStart = getLineStart(text, current);
  const length = getLineLength(text, lineStart);
  set(cursorAtom, lineStart + length);
});
