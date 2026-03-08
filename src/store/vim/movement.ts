import { atom } from "jotai";
import { cursorAtom, getLineLength, getLineStart } from "./core";

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

  const prevLineStart = getLineStart(text, lineStart - 1);
  const prevLineLength = getLineLength(text, prevLineStart);

  set(cursorAtom, prevLineStart + Math.min(col, prevLineLength));
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
  const nextNewLine = text.indexOf("\n", current);
  const lineEnd = nextNewLine === -1 ? text.length : nextNewLine;

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
