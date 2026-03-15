"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { FileText, PlusCircle } from "lucide-react";
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

  // ★追加：メモが開かれていない時に、画面のどこにいても `:` をキャッチする処理
  useEffect(() => {
    if (!isVim || currentMemo) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 検索窓など、他の入力欄にいる時は無視する
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === ":") {
        e.preventDefault();
        setVimMode("command");
        setCommandText("");
        setTimeout(() => {
          document.getElementById("vim-command-input")?.focus();
        }, 0);
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isVim, currentMemo, setVimMode, setCommandText]);

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
        if (selectedId) {
          await toggleBookmark(selectedId);
        }
      } else if (cmd === "pb") {
        setIsPublic((prev) => {
          const nextState = !prev;
          setTimeout(() => saveMemo(), 100);
          return nextState;
        });
      }

      setVimMode("normal");
      setCommandText("");

      // ★修正：`:e` で新規作成した直後は、エディタが画面に描画されるのを少し待ってからフォーカスを当てる
      setTimeout(() => {
        document.querySelector("textarea")?.focus();
      }, 50);
    }
  };

  // ★修正：if(!currentMemo)の早期returnをやめ、画面の構造を統一しました！
  return (
    <div className="flex-1 h-screen flex flex-col bg-white relative overflow-hidden">
      <img
        src="/images/app-logo.png"
        alt="アプリロゴ"
        className="absolute top-8 left-8 w-12 h-12 rounded-xl object-cover shadow-sm z-10"
      />

      {!currentMemo ? (
        // メモが選択されていない時の表示
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
      ) : (
        // 通常のエディタ表示
        <>
          <div className="w-full max-w-4xl ml-auto mr-50 px-8 pt-12 mb-6">
            <EditorHeader />
          </div>
          <div className="flex-1 overflow-y-auto px-8 pb-8 max-w-4xl ml-auto mr-50 w-full relative [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <SimpleEditor />
          </div>
        </>
      )}

      {/* ★修正：コマンドバーを外側に出したことで、メモを開いていなくてもコマンドが打てるようになりました！ */}
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
