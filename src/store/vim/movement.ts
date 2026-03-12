import { atom } from "jotai";
import {
  activeTextAtom,
  cursorAtom,
  getLineLength,
  getLineStart,
  modeAtom,
} from "./core";

// --- Vim Logic (Actions) ---

// j (下移動)
export const moveDownAtom = atom(null, (get, set) => {
  const text = get(activeTextAtom);
  const currentPos = get(cursorAtom);
  const mode = get(modeAtom);
  const lineStart = getLineStart(text, currentPos);
  // カーソルが左から何番目かを示す.
  const col = currentPos - lineStart;

  const nextNewLine = text.indexOf("\n", currentPos);
  if (nextNewLine === -1) return; // 次の行がない

  // '\n'の次の位置.
  const nextLineStart = nextNewLine + 1;
  const nextLineLength = getLineLength(text, nextLineStart);

  // ノーマルモードの場合、移動先の行が空行でなければ最後の文字（長さ-1）で止める
  // 空行の時はmax(0,-1)となるため、maxColに0が入る.
  // visualモードの時は改行を含めたいため,nextLineLengthをそのまま採用.
  const maxCol =
    mode === "normal" ? Math.max(0, nextLineLength - 1) : nextLineLength;

  // 次の行のどの位置に動くかをminで判定.col採用の時はそのまま下.maxColの時は次の行の一番後ろにカーソルが来る.
  set(cursorAtom, nextLineStart + Math.min(col, maxCol));
});

// k (上移動)
export const moveUpAtom = atom(null, (get, set) => {
  const text = get(activeTextAtom);
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
export const moveLeftAtom = atom(null, (get, set) => {
  const text = get(activeTextAtom);
  const current = get(cursorAtom);
  const lineStart = getLineStart(text, current);
  // 行をまたいで移動しないための記述.
  if (current > lineStart) {
    set(cursorAtom, current - 1);
  }
});

// l (右移動)
export const moveRightAtom = atom(null, (get, set) => {
  const text = get(activeTextAtom);
  const current = get(cursorAtom);
  const mode = get(modeAtom);

  // 次の改行位置を求める.
  const nextNewLine = text.indexOf("\n", current);
  const lineEnd = nextNewLine === -1 ? text.length : nextNewLine;

  // ノーマルモードなら、行末の1文字手前が限界
  const maxPos = mode === "normal" ? Math.max(0, lineEnd - 1) : lineEnd;

  if (current < maxPos) {
    set(cursorAtom, current + 1);
  }
});

// 0 (行頭へジャンプ)
export const jumpToLineStartAtom = atom(null, (get, set) => {
  const text = get(activeTextAtom);
  const current = get(cursorAtom);
  set(cursorAtom, getLineStart(text, current));
});

// $ (行末へジャンプ)
export const jumpToLineEndAtom = atom(null, (get, set) => {
  const text = get(activeTextAtom);
  const current = get(cursorAtom);
  const mode = get(modeAtom);
  const lineStart = getLineStart(text, current);
  const length = getLineLength(text, lineStart);

  // ノーマルモードなら1文字手前
  const target =
    mode === "normal"
      ? // Math.maxの第一引数はlengthが0のとき-1の位置に行くのを防ぐ.
        Math.max(lineStart, lineStart + length - 1)
      : lineStart + length;

  set(cursorAtom, target);
});
