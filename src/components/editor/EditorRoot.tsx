"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
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

  return (
    <div className="flex-1 h-screen flex flex-col bg-white relative overflow-hidden">
      <EditorHeader />
      <div className="flex-1 overflow-y-auto px-8 pb-8 max-w-6xl mx-auto w-full relative [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <SimpleEditor />
      </div>
      {isVim && (
        <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full text-xs font-mono font-bold shadow-md transition-colors bg-gray-800 text-white">
          {vimMode.toUpperCase()}
        </div>
      )}
    </div>
  );
}
