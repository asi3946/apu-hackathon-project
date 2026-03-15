"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  ArrowLeft,
  Compass,
  FileText,
  Globe,
  Loader2,
  Plus,
  Search,
  Settings,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SidebarAuth } from "@/components/auth/SidebarAuth";
import { cn } from "@/lib/utils";
// 先ほど作成したタイムライン用のAtomをインポート
import { fetchTimelineMemosAtom, timelineMemosAtom } from "@/store/memoAtom";
import {
  createMemoAtom,
  currentViewAtom,
  deleteMemoAtom,
  editorSettingsAtom,
  fetchMemosAtom,
  fetchUserSettingsAtom,
  memoListAtom,
  searchedMemosAtom,
  selectedMemoIdAtom,
  selectedSearchedMemoAtom,
  updateUserSettingsAtom,
} from "@/store/models";

export function AppSidebar() {
  const [settings] = useAtom(editorSettingsAtom);
  const updateSettings = useSetAtom(updateUserSettingsAtom);
  const fetchUserSettings = useSetAtom(fetchUserSettingsAtom);

  const [memos] = useAtom(memoListAtom);
  const [selectedId, setSelectedId] = useAtom(selectedMemoIdAtom);
  const fetchMemos = useSetAtom(fetchMemosAtom);
  const createMemo = useSetAtom(createMemoAtom);
  const deleteMemo = useSetAtom(deleteMemoAtom);

  const [currentView, setCurrentView] = useAtom(currentViewAtom);

  const [searchedMemos, setSearchedMemos] = useAtom(searchedMemosAtom);
  const [selectedSearchedMemo, setSelectedSearchedMemo] = useAtom(
    selectedSearchedMemoAtom,
  );
  const [isSearching, setIsSearching] = useState(false);

  // タイムライン用の状態を取得
  const timelineMemos = useAtomValue(timelineMemosAtom);
  const fetchTimeline = useSetAtom(fetchTimelineMemosAtom);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMemos();
    fetchUserSettings();
  }, [fetchMemos, fetchUserSettings]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setIsSettingsOpen(false);
      }
    };
    if (isSettingsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSettingsOpen]);

  // Exploreモードの通信
  useEffect(() => {
    if (currentView !== "explore") return;

    const fetchRelatedMemos = async () => {
      if (!selectedId) {
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch("/api/memos/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ source_memo_id: selectedId }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.related_memos) {
            setSearchedMemos(data.related_memos);
            if (data.related_memos.length > 0) {
              setSelectedSearchedMemo(data.related_memos[0]);
            } else {
              setSelectedSearchedMemo(null);
            }
          }
        } else {
          console.error("検索APIがエラーを返しました", await response.text());
        }
      } catch (error) {
        console.error("検索通信エラー:", error);
      } finally {
        setIsSearching(false);
      }
    };

    fetchRelatedMemos();
  }, [currentView, selectedId, setSearchedMemos, setSelectedSearchedMemo]);

  // Timelineモードの通信
  useEffect(() => {
    if (currentView === "timeline") {
      fetchTimeline();
      setSelectedSearchedMemo(null); // 切り替えた時は一旦画面をクリア
    }
  }, [currentView, fetchTimeline, setSelectedSearchedMemo]);

  const toggleVimMode = () => {
    updateSettings({ type: settings.type === "standard" ? "vim" : "standard" });
  };

  const toggleDefaultPublic = () => {
    updateSettings({ defaultIsPublic: !settings.defaultIsPublic });
  };

  const handleCreateMemo = async () => {
    setCurrentView("editor");
    await createMemo();
  };

  const handleKeyDownSidebar = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.target instanceof HTMLInputElement) {
      if (e.key === "Escape") {
        e.preventDefault();
        document.querySelector("textarea")?.focus();
      }
      return;
    }

    if (e.key === "Escape" || e.key === "l" || e.key === "L") {
      e.preventDefault();
      document.querySelector("textarea")?.focus();
      return;
    }

    if (e.key === "j" || e.key === "k") {
      e.preventDefault();

      const memoBtns = Array.from(
        document.querySelectorAll('[data-memo-btn="true"]'),
      ) as HTMLElement[];
      if (memoBtns.length === 0) return;

      const currentIndex = memoBtns.findIndex(
        (btn) => btn === document.activeElement,
      );

      if (currentIndex === -1) {
        const activeBtn = document.querySelector(
          '[data-active="true"]',
        ) as HTMLElement;
        (activeBtn || memoBtns[0]).focus();
      } else {
        let nextIndex = e.key === "j" ? currentIndex + 1 : currentIndex - 1;
        if (nextIndex >= memoBtns.length) nextIndex = memoBtns.length - 1;
        if (nextIndex < 0) nextIndex = 0;
        memoBtns[nextIndex].focus();
      }
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLElement>) => {
    if (e.target === e.currentTarget) {
      const activeBtn = document.querySelector(
        '[data-active="true"]',
      ) as HTMLElement;
      const firstBtn = document.querySelector(
        '[data-memo-btn="true"]',
      ) as HTMLElement;
      (activeBtn || firstBtn)?.focus();
    }
  };

  return (
    <aside
      id="app-sidebar"
      tabIndex={-1}
      onKeyDown={handleKeyDownSidebar}
      onFocus={handleFocus}
      className="w-77 h-screen bg-[#e9eef6] flex flex-col border-r border-gray-200 text-gray-600 outline-none transition-shadow shrink-0"
    >
      <div className="p-4 space-y-4">
        <SidebarAuth></SidebarAuth>

        {currentView !== "editor" ? (
          <button
            type="button"
            onClick={() => setCurrentView("editor")}
            className="flex items-center gap-2 hover:bg-gray-200 text-gray-700 pl-6 py-3 rounded-full transition-colors font-medium text-sm w-full border border-gray-300 bg-white"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="pr-2">自分のメモに戻る</span>
          </button>
        ) : (
          <>
            <div className="relative group">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500 group-focus-within:text-blue-600" />
              <input
                type="text"
                placeholder="検索"
                className="w-full bg-transparent border border-transparent hover:bg-white hover:shadow-sm focus:bg-white focus:shadow-md focus:border-blue-200 rounded-full py-2 pl-10 pr-4 text-sm outline-none transition-all"
              />
            </div>

            <button
              type="button"
              onClick={handleCreateMemo}
              className="flex items-center gap-2  hover:bg-gray-200 pl-6 py-3 rounded-full transition-colors font-medium text-sm w-full"
            >
              <Plus className="w-5 h-5" />
              <span className="pr-2">メモを新規作成</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentView("explore")}
              className="flex items-center gap-2 hover:bg-blue-100 text-blue-700 pl-6 py-3 rounded-full transition-colors font-medium text-sm w-full"
            >
              <Compass className="w-5 h-5" />
              <span className="pr-2">関連する公開メモを探す</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentView("timeline")}
              className="flex items-center gap-2 hover:bg-green-100 text-green-700 pl-6 py-3 rounded-full transition-colors font-medium text-sm w-full"
            >
              <Globe className="w-5 h-5" />
              <span className="pr-2">公開タイムライン</span>
            </button>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {currentView === "explore" ? (
          <>
            <div className="text-xs font-medium px-4 mb-2 text-blue-600">
              検索結果
            </div>
            <div className="space-y-1">
              {isSearching ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mb-4" />
                  <span className="text-xs">関連メモを検索中...</span>
                </div>
              ) : searchedMemos.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  関連するメモが見つかりません
                </div>
              ) : (
                searchedMemos.map((memo) => (
                  <button
                    key={memo.id}
                    type="button"
                    className={cn(
                      "w-full rounded-2xl flex flex-col p-3 transition-colors cursor-pointer border text-left",
                      selectedSearchedMemo?.id === memo.id
                        ? "bg-blue-50 border-blue-200"
                        : "bg-white border-transparent hover:border-gray-200",
                    )}
                    onClick={() => setSelectedSearchedMemo(memo)}
                  >
                    <div className="text-xs text-blue-600 mb-1 font-medium">
                      マッチ度 {Math.round(memo.similarity * 100)}%
                    </div>
                    <div className="truncate text-sm font-medium text-gray-800">
                      {memo.title || "無題のメモ"}
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        ) : currentView === "timeline" ? (
          <>
            <div className="text-xs font-medium px-4 mb-2 text-green-600">
              タイムライン
            </div>
            <div className="space-y-1">
              {timelineMemos.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  公開メモがありません
                </div>
              ) : (
                timelineMemos.map((memo) => (
                  <button
                    key={memo.id}
                    type="button"
                    className={cn(
                      "w-full rounded-2xl flex flex-col p-3 transition-colors cursor-pointer border text-left",
                      selectedSearchedMemo?.id === memo.id
                        ? "bg-green-50 border-green-200"
                        : "bg-white border-transparent hover:border-gray-200",
                    )}
                    onClick={() =>
                      setSelectedSearchedMemo({
                        ...memo,
                        similarity: 0,
                        created_at: memo.updated_at,
                        embedding: null,
                        is_public: true,
                        tags: [],
                      })
                    }
                  >
                    <div className="text-xs text-green-600 mb-1 font-medium">
                      {new Date(memo.updated_at).toLocaleDateString()}
                    </div>
                    <div className="truncate text-sm font-medium text-gray-800">
                      {memo.title || "無題のメモ"}
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div className="text-xs font-medium px-4 mb-2">
              最近の自分のメモ
            </div>
            <div className="space-y-1">
              {memos.map((memo) => (
                <div
                  key={memo.id}
                  className={cn(
                    "w-full rounded-full flex items-center transition-colors group relative",
                    selectedId === memo.id && currentView === "editor"
                      ? "bg-blue-100 text-[#0e42a0] font-medium"
                      : "hover:bg-[#d3e3fd] text-gray-700",
                    "focus-within:ring-2 focus-within:ring-blue-400",
                  )}
                >
                  <button
                    type="button"
                    data-memo-btn="true"
                    data-active={
                      selectedId === memo.id && currentView === "editor"
                    }
                    onClick={() => {
                      setSelectedId(memo.id);
                      setCurrentView("editor");
                    }}
                    className="flex-1 min-w-0 flex items-center gap-2 pl-8 py-2 rounded-l-full text-left outline-none"
                  >
                    <FileText className="w-4 h-4 opacity-50 shrink-0" />
                    <span className="truncate text-sm font-medium">
                      {memo.title || "無題のメモ"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMemo(memo.id);
                    }}
                    className="hidden group-hover:flex shrink-0 text-red-400 pr-3 pl-2 py-2 hover:text-red-600 rounded-r-full items-center justify-center transition-colors outline-none focus:ring-2 focus:ring-red-400"
                    title="削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div
        className="p-4 mt-auto border-t border-gray-200 relative"
        ref={settingsRef}
      >
        {isSettingsOpen && (
          <div className="absolute bottom-full left-4 mb-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-50 animate-in fade-in slide-in-from-bottom-2">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">
              エディタ設定
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Vimモード</span>
                <button
                  type="button"
                  onClick={toggleVimMode}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                    settings.type === "vim" ? "bg-blue-500" : "bg-gray-300",
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      settings.type === "vim"
                        ? "translate-x-4"
                        : "translate-x-0",
                    )}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">デフォルトで公開</span>
                <button
                  type="button"
                  onClick={toggleDefaultPublic}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                    settings.defaultIsPublic ? "bg-blue-500" : "bg-gray-300",
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      settings.defaultIsPublic
                        ? "translate-x-4"
                        : "translate-x-0",
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className={cn(
            "flex items-center gap-3 w-full p-2 text-xs rounded-lg transition-colors",
            isSettingsOpen
              ? "bg-[#d3e3fd] text-[#0e42a0]"
              : "text-gray-500 hover:text-gray-900 hover:bg-[#e1e5ea]",
          )}
        >
          <Settings className="w-4 h-4" />
          <span>設定</span>
        </button>
      </div>
    </aside>
  );
}
