"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { FileText, PlusCircle } from "lucide-react"; // ガイド用のアイコン
import { useEffect, useRef } from "react";
import {
  allTagsAtom,
  autoTagAtom,
  autoTitleAtom,
  createMemoAtom,
  currentMemoAtom,
  editorContentAtom,
  editorIsPublicAtom,
  editorSettingsAtom,
  editorTagsAtom,
  editorTitleAtom,
  saveMemoAtom,
  selectedMemoIdAtom,
  toggleBookmarkAtom,
} from "@/store/models";
import { commandTextAtom, modeAtom } from "@/store/vim/core";
import { EditorHeader } from "./EditorHeader";
import { SimpleEditor } from "./SimpleEditor";

export function EditorRoot() {
  const currentMemo = useAtomValue(currentMemoAtom);
  const setEditorContent = useSetAtom(editorContentAtom);
  const setEditorTitle = useSetAtom(editorTitleAtom);
  const setEditorTags = useSetAtom(editorTagsAtom);
  const setEditorIsPublic = useSetAtom(editorIsPublicAtom);
  const autoTag = useSetAtom(autoTagAtom);
  const autoTitle = useSetAtom(autoTitleAtom);
  const toggleBookmark = useSetAtom(toggleBookmarkAtom);
  const selectedId = useAtomValue(selectedMemoIdAtom);
  const [isPublic, setIsPublic] = useAtom(editorIsPublicAtom);

  const allTags = useAtomValue(allTagsAtom);

  const [vimMode, setVimMode] = useAtom(modeAtom);
  const [commandText, setCommandText] = useAtom(commandTextAtom);
  const settings = useAtomValue(editorSettingsAtom);

  const saveMemo = useSetAtom(saveMemoAtom);
  const createMemo = useSetAtom(createMemoAtom);

  const loadedMemoIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentMemo) {
      if (loadedMemoIdRef.current !== null) {
        setEditorContent("");
        setEditorTitle("");
        setEditorTags([]);
        loadedMemoIdRef.current = null;
      }
      return;
    }

    if (currentMemo.id !== loadedMemoIdRef.current) {
      setEditorContent(currentMemo.content || "");
      setEditorTitle(currentMemo.title || "");

      const memoTags = currentMemo.tags || [];
      const tagsAsObjects = memoTags.map((t: any) => {
        const nameStr = typeof t === "string" ? t : t?.name || "";
        const found = allTags.find((tag) => tag.name === nameStr);
        return found ? found : { id: nameStr, name: nameStr };
      });

      setEditorTags(tagsAsObjects);
      setEditorIsPublic(!!currentMemo.is_public);
      loadedMemoIdRef.current = currentMemo.id;
    }
  }, [
    currentMemo,
    allTags,
    setEditorContent,
    setEditorTitle,
    setEditorTags,
    setEditorIsPublic,
  ]);

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

      if (cmd === "w" || cmd === "wq") {
        await saveMemo();
      } else if (cmd === "e") {
        await createMemo();
      } else if (cmd === "ta") {
        await autoTag();
      } else if (cmd === "ti") {
        await autoTitle();
      } else if (cmd === "bm") {
        // ★修正: await をつけてDBの更新を確実に待つ！
        if (selectedId) {
          await toggleBookmark(selectedId);
        }
      } else if (cmd === "pb") {
        // ★修正: 古い状態を参照しないように `prev => !prev` の関数型アップデートを使用！
        setIsPublic((prev) => !prev);

        // ★修正: Jotaiの内部状態が確実に切り替わった直後にDBへ保存させる
        setTimeout(async () => {
          await saveMemo();
        }, 150);
      }

      setVimMode("normal");
      setCommandText("");
      document.querySelector("textarea")?.focus();
    }
  };

  // メモが選択されていない時の表示 (ログイン直後など)
  if (!currentMemo) {
    return (
      <div className="flex-1 h-screen flex flex-col bg-white relative overflow-hidden">
        {/* ロゴは常に表示 */}
        <img
          src="/images/app-logo.png"
          alt="アプリロゴ"
          className="absolute top-8 left-8 w-12 h-12 rounded-xl object-cover shadow-sm z-10"
        />

        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
          <div className="flex flex-col items-center max-w-sm text-center space-y-4">
            <div className="relative">
              <FileText className="w-20 h-20 opacity-10" />
              <PlusCircle className="w-8 h-8 text-blue-400 absolute -bottom-2 -right-2 bg-white rounded-full" />
            </div>
            <div className="space-y-2 px-4">
              <h2 className="text-xl font-semibold text-gray-600">
                メモを作成しましょう
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed">
                左のリストからメモを選択するか、
                <br />
                「新規作成」ボタンから新しいメモを作成してください。
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 通常のエディタ表示
  return (
    <div className="flex-1 h-screen flex flex-col bg-white relative overflow-hidden">
      <img
        src="/images/app-logo.png"
        alt="アプリロゴ"
        className="absolute top-8 left-8 w-12 h-12 rounded-xl object-cover shadow-sm z-10"
      />

      <div className="w-full max-w-4xl ml-auto mr-50 px-8 pt-12 mb-6">
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
