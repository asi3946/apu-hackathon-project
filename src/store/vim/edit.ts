import { atom } from "jotai";
import { editorContentAtom } from "@/store/models";
import {
  cursorAtom,
  getLineLength,
  getLineStart,
  modeAtom,
  visualStartAtom,
} from "./core";
import { saveHistoryAtom } from "./history";

// x (1文字削除)
export const deleteCharAtom = atom(null, (get, set) => {
  const text = get(editorContentAtom);
  const pos = get(cursorAtom);

  if (text.length === 0 || pos >= text.length) return;

  // Vimの仕様：'x' は改行コード(\n)を削除して行を繋げることはしない
  if (text[pos] === "\n") return;

  // カーソル位置の文字を1つ抜いて結合
  // sliceは第一引数の位置から第二引数の手前までを取り出す.
  // 第一引数しかないときは、第一引数から最後まで.
  const newText = text.slice(0, pos) + text.slice(pos + 1);
  set(editorContentAtom, newText);

  // 行末の文字を消した場合、カーソルが「無い文字」の上に取り残されるのを防ぐため左へずらす
  const lineStart = getLineStart(newText, pos);
  const lineLength = getLineLength(newText, lineStart);
  if (pos > lineStart && pos >= lineStart + lineLength) {
    set(cursorAtom, pos - 1);
  }
  // 削除完了後に履歴を保存
  set(saveHistoryAtom);
});

// dd (1行削除)
export const deleteLineAtom = atom(null, (get, set) => {
  const text = get(editorContentAtom);
  const pos = get(cursorAtom);

  if (text.length === 0) return;

  const lineStart = getLineStart(text, pos);
  const nextNewLine = text.indexOf("\n", lineStart);

  let newText = "";
  let newCursor = 0;

  if (nextNewLine === -1) {
    // 最終行の場合
    if (lineStart === 0) {
      // ファイル全体が1行しかない場合は全消去
      newText = "";
      newCursor = 0;
    } else {
      // 1つ前の改行コードから最後までを削除（前の行の末尾へカーソル移動）
      newText = text.slice(0, lineStart - 1);
      newCursor = getLineStart(newText, lineStart - 2);
    }
  } else {
    // 途中の行の場合（行頭から改行コードまでを削除）
    newText = text.slice(0, lineStart) + text.slice(nextNewLine + 1);
    newCursor = lineStart;
  }

  set(editorContentAtom, newText);
  set(cursorAtom, newCursor);

  // 削除完了後に履歴を保存
  set(saveHistoryAtom);
});

// Visual / VisualLine モードの選択範囲を削除する
export const deleteVisualSelectionAtom = atom(null, (get, set) => {
  const text = get(editorContentAtom);
  const cursor = get(cursorAtom);
  const visualStart = get(visualStartAtom);
  const vimMode = get(modeAtom);

  if (visualStart === null) return;

  let start = 0;
  let end = 0;

  if (vimMode === "visual") {
    start = Math.min(visualStart, cursor);
    end = Math.max(visualStart, cursor) + 1;
  } else if (vimMode === "visualLine") {
    const pos1 = Math.min(visualStart, cursor);
    const pos2 = Math.max(visualStart, cursor);
    const searchPos = pos1 - 1;
    const lastNewLine = text.lastIndexOf("\n", searchPos < 0 ? 0 : searchPos);
    start = lastNewLine === -1 ? 0 : lastNewLine + 1;
    const nextNewLine = text.indexOf("\n", pos2);
    end = nextNewLine === -1 ? text.length : nextNewLine + 1;
  } else {
    return;
  }

  const newText = text.slice(0, start) + text.slice(end);

  set(editorContentAtom, newText);
  set(cursorAtom, start);
  set(visualStartAtom, null);
  set(modeAtom, "normal");
});

// Visual / VisualLine モードの選択範囲のテキストを取得してNormalモードに戻る (y用)
export const getVisualSelectionTextAtom = atom(null, (get, set) => {
  const text = get(editorContentAtom);
  const cursor = get(cursorAtom);
  const visualStart = get(visualStartAtom);
  const vimMode = get(modeAtom);

  if (visualStart === null) return "";

  let start = 0;
  let end = 0;

  if (vimMode === "visual") {
    start = Math.min(visualStart, cursor);
    end = Math.max(visualStart, cursor) + 1;
  } else if (vimMode === "visualLine") {
    const pos1 = Math.min(visualStart, cursor);
    const pos2 = Math.max(visualStart, cursor);
    const searchPos = pos1 - 1;
    const lastNewLine = text.lastIndexOf("\n", searchPos < 0 ? 0 : searchPos);
    start = lastNewLine === -1 ? 0 : lastNewLine + 1;
    const nextNewLine = text.indexOf("\n", pos2);
    end = nextNewLine === -1 ? text.length : nextNewLine + 1;
  }

  set(visualStartAtom, null);
  set(modeAtom, "normal");

  return text.slice(start, end);
});

// Normalモードの1行分のテキストを取得する (yy用)
export const getLineTextAtom = atom(null, (get, _set) => {
  const text = get(editorContentAtom);
  const cursor = get(cursorAtom);

  const searchPos = cursor - 1;
  const lastNewLine = text.lastIndexOf("\n", searchPos < 0 ? 0 : searchPos);
  const lineStart = lastNewLine === -1 ? 0 : lastNewLine + 1;
  const nextNewLine = text.indexOf("\n", lineStart);
  const lineEnd = nextNewLine === -1 ? text.length : nextNewLine + 1;

  return text.slice(lineStart, lineEnd);
});
