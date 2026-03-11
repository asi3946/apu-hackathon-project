import { atom } from "jotai";
import { modeAtom } from "../models"; // 適切なパスからmodeAtomをインポートしてください
import { cursorAtom, getLineLength, getLineStart } from "./core";

// --- Vim Logic (Actions) ---

// j (下移動)
export const moveDownAtom = atom(null, (get, set, text: string) => {
  const currentPos = get(cursorAtom);
  const mode = get(modeAtom);
  const lineStart = getLineStart(text, currentPos);
  const col = currentPos - lineStart;

  const nextNewLine = text.indexOf("\n", currentPos);
  if (nextNewLine === -1) return; // 次の行がない

  const nextLineStart = nextNewLine + 1;
  const nextLineLength = getLineLength(text, nextLineStart);

  // ノーマルモードの場合、移動先の行が空行でなければ最後の文字（長さ-1）で止める
  const maxCol =
    mode === "normal" ? Math.max(0, nextLineLength - 1) : nextLineLength;

  set(cursorAtom, nextLineStart + Math.min(col, maxCol));
});

// k (上移動)
export const moveUpAtom = atom(null, (get, set, text: string) => {
  const currentPos = get(cursorAtom);
  const mode = get(modeAtom);
  const lineStart = getLineStart(text, currentPos);
  const col = currentPos - lineStart;

  if (lineStart === 0) return; // 1行目なら何もしない

  const prevLineStart = getLineStart(text, lineStart - 1);
  const prevLineLength = getLineLength(text, prevLineStart);

  // ノーマルモードの場合、移動先の行が空行でなければ最後の文字（長さ-1）で止める
  const maxCol =
    mode === "normal" ? Math.max(0, prevLineLength - 1) : prevLineLength;

  set(cursorAtom, prevLineStart + Math.min(col, maxCol));
});

// h (左移動)
export const moveLeftAtom = atom(null, (get, set, text: string) => {
  const current = get(cursorAtom);
  const lineStart = getLineStart(text, current);

  if (current > lineStart) {
    set(cursorAtom, current - 1);
  }
});

// l (右移動)
export const moveRightAtom = atom(null, (get, set, text: string) => {
  const current = get(cursorAtom);
  const mode = get(modeAtom);
  const nextNewLine = text.indexOf("\n", current);
  const lineEnd = nextNewLine === -1 ? text.length : nextNewLine;

  // ノーマルモードなら、行末の1文字手前が限界
  const maxPos = mode === "normal" ? Math.max(0, lineEnd - 1) : lineEnd;

  if (current < maxPos) {
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
  const mode = get(modeAtom);
  const lineStart = getLineStart(text, current);
  const length = getLineLength(text, lineStart);

  // ノーマルモードなら1文字手前
  const target =
    mode === "normal"
      ? Math.max(lineStart, lineStart + length - 1)
      : lineStart + length;

  set(cursorAtom, target);
});
