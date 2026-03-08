import { atom } from "jotai";
import { editorContentAtom } from "@/store/models";
import { cursorAtom, getLineLength, getLineStart } from "./core";
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
    newCursor = lineStart; // カーソルはそのままの位置（＝押し上げられた次の行の先頭）
  }

  set(editorContentAtom, newText);
  set(cursorAtom, newCursor);

  // 削除完了後に履歴を保存
  set(saveHistoryAtom);
});
