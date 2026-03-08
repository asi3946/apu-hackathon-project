"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  cursorAtom,
  deleteCharAtom,
  deleteLineAtom,
  deleteVisualSelectionAtom,
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
  visualStartAtom,
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
  const [visualStart, setVisualStart] = useAtom(visualStartAtom);
  const deleteVisualSelection = useSetAtom(deleteVisualSelectionAtom);

  // 「d」などのコマンド待ち状態を保持するState
  const [pendingCommand, setPendingCommand] = useState<string>("");
  const [insertPending, setInsertPending] = useState<string>("");

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
        const endPos = Math.min(cursor + 1, content.length);
        textarea.setSelectionRange(cursor, endPos);
      } else if (vimMode === "visual" && visualStart !== null) {
        // --- Visualモード: 開始位置と現在位置を計算して範囲選択 ---
        // カーソルが開始位置より上（前）に移動した場合も考慮して Math.min/max を使います
        const start = Math.min(visualStart, cursor);
        const end = Math.max(visualStart, cursor) + 1; // 最後の文字も含めるために +1
        textarea.setSelectionRange(start, end);
      } else {
        textarea.setSelectionRange(cursor, cursor);
      }
    }
  }, [cursor, vimMode, settings.type, content.length, visualStart]);

  // Key Handlers
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (settings.type === "standard") return;

    if (vimMode === "insert") {
      if (e.key === "Escape") {
        e.preventDefault();
        setVimMode("normal");
        saveHistory();
        setInsertPending("");
      } else if (e.key === "k" && insertPending === "j") {
        e.preventDefault(); // k の入力を防ぐ
        // 直前に入力された j を削除する
        const newText = content.slice(0, cursor - 1) + content.slice(cursor);
        setContent(newText);
        setCursor(cursor - 1);

        setVimMode("normal");
        saveHistory();
        setInsertPending("");
      } else if (e.key === "j") {
        setInsertPending("j");
      } else {
        setInsertPending("");
      }
      return;
    }

    // ▼ ここを normal と visual 両方で反応するように変更
    if (vimMode === "normal" || vimMode === "visual") {
      e.preventDefault();

      // Ctrl + R (Redo)
      if (e.ctrlKey && e.key.toLowerCase() === "r") {
        redo();
        setPendingCommand("");
        // Visualモード中にRedoした場合はNormalに戻す
        if (vimMode === "visual") {
          setVimMode("normal");
          setVisualStart(null);
        }
        return;
      }

      if (e.key === "Escape") {
        setPendingCommand("");
        // VisualモードならNormalに戻る
        if (vimMode === "visual") {
          setVimMode("normal");
          setVisualStart(null);
        }
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
        case "v":
          if (vimMode === "normal") {
            setVimMode("visual");
            setVisualStart(cursor); // 今のカーソル位置を選択開始位置として記録
          } else {
            // すでにVisualモードならNormalに戻る（トグル）
            setVimMode("normal");
            setVisualStart(null);
          }
          setPendingCommand("");
          break;
        case "i":
          setVimMode("insert");
          setPendingCommand("");
          break;
        case "x":
          saveHistory(); // 削除する直前を保存
          if (vimMode === "visual") {
            deleteVisualSelection();
          } else {
            deleteChar();
          }
          saveHistory(); // 削除した直後を保存
          setPendingCommand("");
          break;

        case "d":
          if (vimMode === "visual") {
            // Visualモード時は dd ではなく d 1回で選択範囲を削除する
            saveHistory();
            deleteVisualSelection();
            saveHistory();
            setPendingCommand("");
          } else if (pendingCommand === "d") {
            // Normalモード時で、前回も d が押されていたら行削除
            saveHistory();
            deleteLine();
            saveHistory();
            setPendingCommand("");
          } else {
            // Normalモード時で、1回目の d の場合
            setPendingCommand("d");
          }
          break;
        case "y":
          if (vimMode === "visual" && visualStart !== null) {
            const start = Math.min(visualStart, cursor);
            const end = Math.max(visualStart, cursor) + 1;
            const textToCopy = content.slice(start, end);
            navigator.clipboard.writeText(textToCopy);

            setVimMode("normal");
            setVisualStart(null);
            setPendingCommand("");
          } else if (pendingCommand === "y") {
            const searchPos = cursor - 1;
            const lastNewLine = content.lastIndexOf(
              "\n",
              searchPos < 0 ? 0 : searchPos,
            );
            const lineStart = lastNewLine === -1 ? 0 : lastNewLine + 1;
            const nextNewLine = content.indexOf("\n", lineStart);
            const lineEnd =
              nextNewLine === -1 ? content.length : nextNewLine + 1;

            const textToCopy = content.slice(lineStart, lineEnd);
            navigator.clipboard.writeText(textToCopy);

            setPendingCommand("");
          } else {
            setPendingCommand("y");
          }
          break;
        case "p":
          navigator.clipboard
            .readText()
            .then((clipText) => {
              if (!clipText) return;

              saveHistory();
              const newText =
                content.slice(0, cursor) + clipText + content.slice(cursor);
              setContent(newText);
              setCursor(cursor + clipText.length);
              saveHistory();
            })
            .catch((err) => {
              console.error("クリップボードの読み取りに失敗しました", err);
            });
          setPendingCommand("");
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
    // Visualモード中はAtomのカーソル計算が絶対。
    // ネイティブの選択イベントによるカーソルの強制上書きをブロックする。
    if (settings.type === "vim" && vimMode === "visual") return;

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
