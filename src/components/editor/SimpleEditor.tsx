"use client";

import { useEffect, useRef } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  modeAtom,
  cursorAtom,
  moveDownAtom,
  moveUpAtom,
  moveLeftAtom,
  moveRightAtom,
  jumpToLineStartAtom,
  jumpToLineEndAtom,
} from "@/store/vimAtom";
import { editorContentAtom, editorSettingsAtom } from "@/store/editorAtom";
import { cn } from "@/lib/utils";

export function SimpleEditor() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // State
  const [content, setContent] = useAtom(editorContentAtom);
  const [vimMode, setVimMode] = useAtom(modeAtom);
  const [cursor, setCursor] = useAtom(cursorAtom);
  const settings = useAtomValue(editorSettingsAtom); // 設定値を取得

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
    // Vimモード時のみ、Atomのカーソル位置を強制適用
    if (textarea && settings.type === "vim") {
      textarea.setSelectionRange(cursor, cursor);
      // フォーカスが外れると入力できなくなるのを防ぐため、あえてfocus()は外すか、必要に応じて呼ぶ
      // textarea.focus();
    }
  }, [cursor, settings.type]);

  // Key Handlers
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;

    // Standardモードなら何もしない（ブラウザ標準動作）
    if (settings.type === "standard") return;

    // --- Vim Mode Logic ---
    if (vimMode === "insert") {
      if (e.key === "Escape") {
        e.preventDefault();
        setVimMode("normal");
      }
      return;
    }

    if (vimMode === "normal") {
      e.preventDefault(); // 文字入力をブロック

      switch (e.key) {
        case "h":
          moveLeft(content);
          break;
        case "j":
          moveDown(content);
          break;
        case "k":
          moveUp(content);
          break;
        case "l":
          moveRight(content);
          break;
        case "0":
          jumpStart(content);
          break;
        case "$":
          jumpEnd(content);
          break;
        case "i":
          setVimMode("insert");
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
