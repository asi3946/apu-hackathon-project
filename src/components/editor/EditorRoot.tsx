"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import {
  createMemoAtom,
  currentMemoAtom,
  editorContentAtom,
  editorSettingsAtom,
  editorTagsAtom,
  editorTitleAtom,
  saveMemoAtom,
} from "@/store/models";
import { commandTextAtom, modeAtom } from "@/store/vim/core";
import { EditorHeader } from "./EditorHeader";
import { SimpleEditor } from "./SimpleEditor";

export function EditorRoot() {
  const currentMemo = useAtomValue(currentMemoAtom);
  const setEditorContent = useSetAtom(editorContentAtom);
  const setEditorTitle = useSetAtom(editorTitleAtom);
  const setEditorTags = useSetAtom(editorTagsAtom);

  const [vimMode, setVimMode] = useAtom(modeAtom);
  const [commandText, setCommandText] = useAtom(commandTextAtom);
  const settings = useAtomValue(editorSettingsAtom);

  const saveMemo = useSetAtom(saveMemoAtom);
  const createMemo = useSetAtom(createMemoAtom);

  useEffect(() => {
    if (currentMemo) {
      setEditorContent(currentMemo.content || "");
      setEditorTitle(currentMemo.title || "");
      setEditorTags(currentMemo.tags || []);
    } else {
      setEditorContent("");
      setEditorTitle("");
      setEditorTags([]);
    }
  }, [currentMemo, setEditorContent, setEditorTitle, setEditorTags]);

  const isVim = settings.type === "vim";

  const handleCommandKeyDown = async (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setVimMode("normal");
      setCommandText("");
      document.querySelector("textarea")?.focus();
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const cmd = commandText.trim();

      if (cmd === "w") {
        await saveMemo();
      } else if (cmd === "e") {
        await createMemo();
      } else if (cmd === "wq") {
        await saveMemo();
        // 終了や一覧へ戻る処理が必要な場合はここに追加します
      }

      setVimMode("normal");
      setCommandText("");
      document.querySelector("textarea")?.focus();
    }
  };

  return (
    <div className="flex-1 h-screen flex flex-col bg-white relative overflow-hidden">
      <div className="w-full max-w-3xl ml-auto mr-70 px-8 pt-12 mb-6">
        <EditorHeader />
      </div>
      <div className="flex-1 overflow-y-auto px-8 pb-8 max-w-4xl ml-auto mr-50 w-full relative [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <SimpleEditor />
      </div>

      {isVim && vimMode === "command" ? (
        <div className="absolute bottom-0 left-0 right-0 bg-gray-800 text-white px-4 py-1 flex items-center font-mono text-sm z-50">
          <span className="mr-1">:</span>
          <input
            id="vim-command-input"
            type="text"
            value={commandText}
            onChange={(e) => setCommandText(e.target.value)}
            onKeyDown={handleCommandKeyDown}
            className="bg-transparent outline-none flex-1"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      ) : (
        isVim && (
          <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full text-xs font-mono font-bold shadow-md transition-colors bg-gray-800 text-white z-50">
            {vimMode.toUpperCase()}
          </div>
        )
      )}
    </div>
  );
}
