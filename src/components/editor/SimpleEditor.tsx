"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  cursorAtom,
  deleteCharAtom,
  deleteLineAtom,
  editorContentAtom,
  editorSettingsAtom,
  jumpToLineEndAtom,
  jumpToLineStartAtom,
  modeAtom,
  moveDownAtom,
  moveLeftAtom,
  moveRightAtom,
  moveUpAtom,
} from "@/store/models";

export function SimpleEditor() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // State
  const [content, setContent] = useAtom(editorContentAtom);
  const [vimMode, setVimMode] = useAtom(modeAtom);
  const [cursor, setCursor] = useAtom(cursorAtom);
  const settings = useAtomValue(editorSettingsAtom); // 設定値を取得
  const deleteChar = useSetAtom(deleteCharAtom);
  const deleteLine = useSetAtom(deleteLineAtom);

  // 「d」などのコマンド待ち状態を保持するState
  const [pendingCommand, setPendingCommand] = useState<string>("");

  // Actions
  const moveDown = useSetAtom(moveDownAtom);
  const moveUp = useSetAtom(moveUpAtom);
  const moveLeft = useSetAtom(moveLeftAtom);
  const moveRight = useSetAtom(moveRightAtom);
  const jumpStart = useSetAtom(jumpToLineStartAtom);
  const jumpEnd = useSetAtom(jumpToLineEndAtom);

  // Sync: Atom -> DOM
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea && settings.type === "vim") {
      if (vimMode === "normal") {
        // Normalモード: 1文字だけ「選択状態」にしてブロックカーソルを偽装する
        // 最後の文字を超えないように Math.min でガード
        const endPos = Math.min(cursor + 1, content.length);
        textarea.setSelectionRange(cursor, endPos);
      } else {
        // Insertモード: 通常の縦線キャレット
        textarea.setSelectionRange(cursor, cursor);
      }
    }
  }, [cursor, vimMode, settings.type, content.length]); // 依存配列に vimMode と content.length を追加

  // Key Handlers
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (settings.type === "standard") return;

    if (vimMode === "insert") {
      if (e.key === "Escape") {
        e.preventDefault();
        setVimMode("normal");
      }
      return;
    }

    if (vimMode === "normal") {
      e.preventDefault();

      // Escを押したらコマンド待ちをキャンセル
      if (e.key === "Escape") {
        setPendingCommand("");
        return;
      }

      switch (e.key) {
        case "h":
          moveLeft(content);
          setPendingCommand("");
          break;
        case "j":
          moveDown(content);
          setPendingCommand("");
          break;
        case "k":
          moveUp(content);
          setPendingCommand("");
          break;
        case "l":
          moveRight(content);
          setPendingCommand("");
          break;
        case "0":
          jumpStart(content);
          setPendingCommand("");
          break;
        case "$":
          jumpEnd(content);
          setPendingCommand("");
          break;
        case "i":
          setVimMode("insert");
          setPendingCommand("");
          break;
        case "x":
          deleteChar();
          setPendingCommand("");
          break;
        case "d":
          if (pendingCommand === "d") {
            deleteLine();
            setPendingCommand("");
          } else {
            setPendingCommand("d");
          }
          break;
        default:
          setPendingCommand("");
          break;
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setCursor(e.target.selectionStart);
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    setCursor(e.currentTarget.selectionStart);
  };

  return (
    <textarea
      ref={textareaRef}
      value={content}
      onChange={handleChange}
      onSelect={handleSelect}
      onKeyDown={handleKeyDown}
      placeholder="ここにメモを入力..."
      className={cn(
        // ベーススタイル: 枠線なし、リサイズ不可、親要素いっぱいに広げる
        "w-full h-full resize-none outline-none bg-transparent",
        "font-mono text-lg leading-relaxed", // 行間を少し広げて読みやすく
        "text-[#1f1f1f] placeholder:text-gray-300", // Geminiカラー (ダークグレー文字)

        // Vimモード時の選択範囲（Selection）の色を変えてモード感を出す小技
        settings.type === "vim" && vimMode === "normal"
          ? "selection:bg-green-200 selection:text-black" // Normal: 緑っぽい選択色
          : "selection:bg-blue-100 selection:text-black", // Insert/Standard: 青っぽい選択色
      )}
      spellCheck={false}
    />
  );
}
