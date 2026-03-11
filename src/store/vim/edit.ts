import { atom } from "jotai";
import { editorContentAtom } from "@/store/models";
import {
  cursorAtom,
  getLineEnd,
  getLineLength,
  getLineStart,
  modeAtom,
  visualStartAtom,
} from "./core";

// x (1文字削除)
export const deleteCharAtom = atom(null, (get, set) => {
  const text = get(editorContentAtom);
  const pos = get(cursorAtom);
  // pos >= text.lengthの状況になることはvimではないが、
  // reactで問題が起きる可能性があるため、
  if (text.length === 0 || pos >= text.length) return;

  // Vimの仕様：'x' は改行コード(\n)を削除して行を繋げることはしない.
  // 空行の上にカーソルがあるときにこれが必要.
  if (text[pos] === "\n") return;

  // カーソル位置の文字を1つ抜いて結合
  // sliceは第一引数の位置から第二引数の手前までを取り出す.
  // 第一引数しかないときは、第一引数から最後まで.
  const newText = text.slice(0, pos) + text.slice(pos + 1);
  set(editorContentAtom, newText);

  // 行末の文字を消した場合、カーソルが「無い文字」の上に取り残されるのを防ぐため左へずらす.
  const lineStart = getLineStart(newText, pos);
  const lineLength = getLineLength(newText, lineStart);
  // pos > lineStartはpos = 0,lineStart + lineLength = 0 + 0の時
  // set (cursorAtom, - 1)となる事態を防ぐ.
  // pos >= lineStart + lineLengthの>=の理由は行末の文字を消したとき、
  // lineStartとlineLengthの値とposは等しくなるから.===でも成り立ちはする.
  if (pos > lineStart && pos >= lineStart + lineLength) {
    set(cursorAtom, pos - 1);
  }
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
      // 1つ前の改行コードから最後までを削除
      newText = text.slice(0, lineStart - 1);
      // 前の行の文字（lineStart - 2）を基準にして、その行の「先頭」へカーソルを移動
      newCursor = getLineStart(newText, lineStart - 2);
    }
  } else {
    // 途中の行の場合（行頭から改行コードまでを削除）
    newText = text.slice(0, lineStart) + text.slice(nextNewLine + 1);
    // 下の行が自動的に上がってくるため、CursorはlineStartにすればよい.
    newCursor = lineStart;
  }

  set(editorContentAtom, newText);
  set(cursorAtom, newCursor);
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
    // pos1 = visualStart,pos2=cursorとしないのは、
    // cursorが右、下ではなく、左、上のようにうごくことがあるから.
    const pos1 = Math.min(visualStart, cursor);
    const pos2 = Math.max(visualStart, cursor);

    start = getLineStart(text, pos1);

    const lineEndPos = getLineEnd(text, pos2);
    // visualLineの削除やコピーでは「改行文字(\n)」も含める必要があるため、
    // ファイル末尾(text.length)でなければ +1 して改行文字を範囲に含める
    end = lineEndPos === text.length ? text.length : lineEndPos + 1;
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

    start = getLineStart(text, pos1);

    const lineEndPos = getLineEnd(text, pos2);
    end = lineEndPos === text.length ? text.length : lineEndPos + 1;
  }

  set(visualStartAtom, null);
  set(modeAtom, "normal");

  return text.slice(start, end);
});

// Normalモードの1行分のテキストを取得する (yy用)
export const getLineTextAtom = atom(null, (get, _set) => {
  const text = get(editorContentAtom);
  const cursor = get(cursorAtom);

  // core.ts の関数を使って行の先頭と末尾を取得
  const lineStart = getLineStart(text, cursor);
  const lineEndPos = getLineEnd(text, cursor);

  // yy は改行文字も含めてコピーするため、ファイル末尾でなければ +1 する
  const end = lineEndPos === text.length ? text.length : lineEndPos + 1;

  return text.slice(lineStart, end);
});

// o (下の行にインサート)
export const insertNewLineBelowAtom = atom(null, (get, set) => {
  const text = get(editorContentAtom);
  const currentPos = get(cursorAtom);

  const insertPos = getLineEnd(text, currentPos);
  // "ABCDEF"という文字列でinsertPos=3の時、
  // 最初のtext.sliceでCまで切り取り、\nが追加.\nの添字が3となる.
  // Dの添字が4となり、"ABC\nDEF"という文字列となる.
  const newText = `${text.slice(0, insertPos)}\n${text.slice(insertPos)}`;

  set(editorContentAtom, newText);
  set(cursorAtom, insertPos + 1);
  set(modeAtom, "insert");
});

// O (上の行にインサート)
export const insertNewLineAboveAtom = atom(null, (get, set) => {
  const text = get(editorContentAtom);
  const currentPos = get(cursorAtom);

  const insertPos = getLineStart(text, currentPos);

  const newText = `${text.slice(0, insertPos)}\n${text.slice(insertPos)}`;

  set(editorContentAtom, newText);
  set(cursorAtom, insertPos);
  set(modeAtom, "insert");
});
