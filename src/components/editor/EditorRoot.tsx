"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  editorContentAtom,
  editorSettingsAtom,
  editorTitleAtom,
} from "@/store/editorAtom";
import { currentMemoAtom } from "@/store/memoAtom";
import { modeAtom } from "@/store/vimAtom";
import { EditorHeader } from "./EditorHeader";
import { SimpleEditor } from "./SimpleEditor";

export function EditorRoot() {
  const currentMemo = useAtomValue(currentMemoAtom);
  const setEditorContent = useSetAtom(editorContentAtom);
  const setEditorTitle = useSetAtom(editorTitleAtom);
  const vimMode = useAtomValue(modeAtom);
  const settings = useAtomValue(editorSettingsAtom);

  // サイドバーで選択されたメモが変わるたびに、エディタの状態を更新する
  useEffect(() => {
    if (currentMemo) {
      setEditorContent(currentMemo.content);
      setEditorTitle(currentMemo.title);
    }
  }, [currentMemo, setEditorContent, setEditorTitle]);

  const isVim = settings.type === "vim";
  const isInsert = isVim && vimMode === "insert";

  return (
    <div className="flex-1 h-screen flex flex-col bg-white relative overflow-hidden">
      {/* 1. タイトルとタグを表示するヘッダー */}
      <EditorHeader />

      {/* 2. 実際に文字を入力するエリア */}
      <div className="flex-1 overflow-y-auto px-8 pb-8 max-w-4xl mx-auto w-full relative">
        <SimpleEditor />
      </div>

      {/* 3. モードに応じた視覚的フィードバック（下部のライン） */}
      <div
        className={cn(
          "absolute bottom-0 left-0 w-full h-1 transition-all duration-300",
          !isVim
            ? "bg-transparent"
            : isInsert
              ? "bg-gradient-to-r from-blue-500 via-purple-500 to-red-500"
              : "bg-gray-800",
        )}
      />

      {/* Vimモード時のみ右下に表示されるバッジ */}
      {isVim && (
        <div
          className={cn(
            "absolute bottom-4 right-4 px-3 py-1 rounded-full text-xs font-mono font-bold shadow-md transition-colors",
            isInsert ? "bg-blue-600 text-white" : "bg-gray-800 text-white",
          )}
        >
          {vimMode.toUpperCase()}
        </div>
      )}
    </div>
  );
}
