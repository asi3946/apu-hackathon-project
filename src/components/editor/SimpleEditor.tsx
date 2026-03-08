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
  redoAtom,
  saveHistoryAtom,
  undoAtom,
} from "@/store/models";

export function SimpleEditor() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // State
  const [content, setContent] = useAtom(editorContentAtom);
  const [vimMode, setVimMode] = useAtom(modeAtom);
  const [cursor, setCursor] = useAtom(cursorAtom);
  const settings = useAtomValue(editorSettingsAtom);
  const deleteChar = useSetAtom(deleteCharAtom);
  const deleteLine = useSetAtom(deleteLineAtom);
  const saveHistory = useSetAtom(saveHistoryAtom);
  const undo = useSetAtom(undoAtom);
  const redo = useSetAtom(redoAtom);

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
  }, [cursor, vimMode, settings.type, content.length]);

  // Key Handlers
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (settings.type === "standard") return;

    if (vimMode === "insert") {
      if (e.key === "Escape") {
        e.preventDefault();
        setVimMode("normal");
        saveHistory(); // Insertモードを抜ける時に履歴を保存
      }
      return;
    }

    if (vimMode === "normal") {
      e.preventDefault();

      // Ctrl + R (Redo)
      if (e.ctrlKey && e.key.toLowerCase() === "r") {
        redo();
        setPendingCommand("");
        return;
      }

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
          saveHistory(); // 削除する「直前の状態」を保存！
          deleteChar();
          saveHistory(); // 削除した「直後の状態」も保存！
          setPendingCommand("");
          break;
        case "d":
          if (pendingCommand === "d") {
            saveHistory(); // 削除する「直前の状態」を保存！
            deleteLine();
            saveHistory(); // 削除した「直後の状態」も保存！
            setPendingCommand("");
          } else {
            setPendingCommand("d");
          }
          break;
        case "u":
          undo();
          setPendingCommand("");
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
        "w-full h-full resize-none outline-none bg-transparent",
        "font-mono text-lg leading-relaxed",
        "text-[#1f1f1f] placeholder:text-gray-300",
        settings.type === "vim" && vimMode === "normal"
          ? "selection:bg-green-200 selection:text-black"
          : "selection:bg-blue-100 selection:text-black",
      )}
      spellCheck={false}
    />
  );
}
