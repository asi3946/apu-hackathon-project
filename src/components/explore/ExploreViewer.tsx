"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Bookmark, BookmarkMinus, FileText } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { currentViewAtom, editorSettingsAtom } from "@/store/editorAtom";
import {
  bookmarkedMemoIdsAtom,
  selectedSearchedMemoAtom,
  toggleBookmarkAtom,
} from "@/store/memoAtom";
import { commandTextAtom, modeAtom } from "@/store/vim/core";

export function ExploreViewer() {
  const selectedSearchedMemo = useAtomValue(selectedSearchedMemoAtom);
  const currentView = useAtomValue(currentViewAtom);
  const setCurrentView = useSetAtom(currentViewAtom);

  const bookmarkedIds = useAtomValue(bookmarkedMemoIdsAtom);
  const toggleBookmark = useSetAtom(toggleBookmarkAtom);
  const isBookmarked = selectedSearchedMemo
    ? bookmarkedIds.includes(selectedSearchedMemo.id)
    : false;

  // --- Vimモードのコマンド制御 ---
  const settings = useAtomValue(editorSettingsAtom);
  const isVim = settings.type === "vim";
  const [vimMode, setVimMode] = useAtom(modeAtom);
  const [commandText, setCommandText] = useAtom(commandTextAtom);

  useEffect(() => {
    if (!isVim) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (e.key === ":") {
        e.preventDefault();
        setVimMode("command");
        setCommandText("");
        setTimeout(() => {
          document.getElementById("explore-vim-command-input")?.focus();
        }, 0);
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isVim, setVimMode, setCommandText]);

  // ★追加：コマンド終了後にサイドバーへフォーカスを戻す必殺技
  const restoreSidebarFocus = () => {
    setTimeout(() => {
      if (selectedSearchedMemo) {
        document
          .getElementById(`searched-memo-btn-${selectedSearchedMemo.id}`)
          ?.focus();
      } else {
        document.getElementById("app-sidebar")?.focus();
      }
    }, 50);
  };

  const handleCommandKeyDown = async (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setVimMode("normal");
      setCommandText("");
      restoreSidebarFocus(); // ★追加
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const cmd = commandText.trim();

      if (cmd === "bm" && selectedSearchedMemo) {
        await toggleBookmark(selectedSearchedMemo.id);
      } else if (cmd === "q") {
        setCurrentView("editor");
      }

      setVimMode("normal");
      setCommandText("");
      restoreSidebarFocus(); // ★追加
    }
  };
  // -------------------------------------

  const isTimeline = currentView === "timeline";
  const isBookmarks = currentView === "bookmarks";

  const tagColorClass = isBookmarks
    ? "bg-yellow-50 text-yellow-700 border-yellow-200"
    : isTimeline
      ? "bg-green-50 text-green-700 border-green-200"
      : "bg-blue-50 text-blue-600 border-blue-200";

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
      {selectedSearchedMemo ? (
        <div className="flex-1 overflow-y-auto p-12 max-w-4xl mx-auto w-full [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="mb-8 border-b pb-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-3xl font-bold text-gray-900">
                {selectedSearchedMemo.title || "無題のメモ"}
              </h1>

              {isBookmarks ? (
                <button
                  type="button"
                  onClick={() =>
                    selectedSearchedMemo &&
                    toggleBookmark(selectedSearchedMemo.id)
                  }
                  className="px-4 py-2 rounded-full transition-all border shadow-sm shrink-0 flex items-center gap-2 bg-white text-red-500 border-red-200 hover:bg-red-50"
                >
                  <BookmarkMinus className="w-4 h-4" />
                  <span className="text-xs font-bold">ブックマーク解除</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    selectedSearchedMemo &&
                    toggleBookmark(selectedSearchedMemo.id)
                  }
                  className={cn(
                    "px-4 py-2 rounded-full transition-all border shadow-sm shrink-0 flex items-center gap-2",
                    isBookmarked
                      ? "bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100"
                      : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700",
                  )}
                >
                  <Bookmark
                    className={cn("w-4 h-4", isBookmarked && "fill-current")}
                  />
                  <span className="text-xs font-bold">
                    {isBookmarked ? "保存済み" : "ブックマークに保存"}
                  </span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {selectedSearchedMemo.tags &&
              selectedSearchedMemo.tags.length > 0 ? (
                selectedSearchedMemo.tags.map((tagName: string) => (
                  <span
                    key={tagName}
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${tagColorClass}`}
                  >
                    #{tagName}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-300 italic">タグなし</span>
              )}
            </div>
          </div>

          <div className="prose prose-gray max-w-none text-gray-700 whitespace-pre-wrap">
            {selectedSearchedMemo.content || "本文がありません。"}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
          <FileText className="w-16 h-16 mb-4 opacity-20" />
          <p>左のリストから気になるメモを選択してください</p>
        </div>
      )}

      {isVim && vimMode === "command" ? (
        <div className="absolute bottom-0 left-0 right-0 bg-gray-800 text-white px-4 py-1 flex items-center font-mono text-sm z-50">
          <span className="mr-1">:</span>
          <input
            id="explore-vim-command-input"
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
