"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  currentMemoAtom,
  editorContentAtom,
  editorSettingsAtom,
  editorTagsAtom,
  editorTitleAtom,
  modeAtom,
} from "@/store/models";
import { EditorHeader } from "./EditorHeader";
import { SimpleEditor } from "./SimpleEditor";

export function EditorRoot() {
  const currentMemo = useAtomValue(currentMemoAtom);
  const setEditorContent = useSetAtom(editorContentAtom);
  const setEditorTitle = useSetAtom(editorTitleAtom);
  const setEditorTags = useSetAtom(editorTagsAtom);
  const vimMode = useAtomValue(modeAtom);
  const settings = useAtomValue(editorSettingsAtom);

  // エディタの更新（null対策を追加）
  useEffect(() => {
    if (currentMemo) {
      // nullの場合は空文字をセットしてReactのエラーを防ぐ
      setEditorContent(currentMemo.content || "");
      setEditorTitle(currentMemo.title || "");
      setEditorTags(currentMemo.tags || []);
    } else {
      // メモが選択されていない状態
      setEditorContent("");
      setEditorTitle("");
      setEditorTags([]);
    }
  }, [currentMemo, setEditorContent, setEditorTitle, setEditorTags]);

  const isVim = settings.type === "vim";
  const isInsert = isVim && vimMode === "insert";

  return (
    <div className="flex-1 h-screen flex flex-col bg-white relative overflow-hidden">
      <EditorHeader />
      <div className="flex-1 overflow-y-auto px-8 pb-8 max-w-4xl mx-auto w-full relative">
        <SimpleEditor />
      </div>
      <div
        className={cn(
          "absolute bottom-0 left-0 w-full h-1 transition-all duration-300",
          !isVim
            ? "bg-transparent"
            : isInsert
              ? "bg-linear-to-r from-blue-500 via-purple-500 to-red-500"
              : "bg-gray-800",
        )}
      />
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
