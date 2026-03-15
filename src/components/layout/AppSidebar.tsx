"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  ArrowLeft,
  Bookmark,
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
import {
  currentViewAtom,
  editorSettingsAtom,
  fetchUserSettingsAtom,
  updateUserSettingsAtom,
} from "@/store/editorAtom";
import {
  bookmarkedMemosAtom,
  createMemoAtom,
  currentMemoAtom,
  deleteMemoAtom,
  fetchBookmarkedMemosAtom,
  fetchMemosAtom,
  fetchRelatedMemosAtom,
  fetchTimelineMemosAtom,
  isSearchingAtom,
  memoListAtom,
  searchedMemosAtom,
  selectedMemoIdAtom,
  selectedSearchedMemoAtom,
  timelineMemosAtom,
} from "@/store/memoAtom";

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
  const [searchedMemos] = useAtom(searchedMemosAtom);
  const [selectedSearchedMemo, setSelectedSearchedMemo] = useAtom(
    selectedSearchedMemoAtom,
  );
  const isSearching = useAtomValue(isSearchingAtom);
  const fetchRelated = useSetAtom(fetchRelatedMemosAtom);
  const timelineMemos = useAtomValue(timelineMemosAtom);
  const fetchTimeline = useSetAtom(fetchTimelineMemosAtom);
  const currentMemo = useAtomValue(currentMemoAtom);

  const bookmarkedMemos = useAtomValue(bookmarkedMemosAtom);
  const fetchBookmarks = useSetAtom(fetchBookmarkedMemosAtom);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchMemos();
    fetchUserSettings();
    fetchBookmarks();
  }, [fetchMemos, fetchUserSettings, fetchBookmarks]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      )
        setIsSettingsOpen(false);
    };
    if (isSettingsOpen)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSettingsOpen]);

  useEffect(() => {
    if (settings.type === "vim" && currentView !== "editor") {
      // DOMの描画を少し待ってからフォーカスを当てる
      setTimeout(() => {
        document.getElementById("back-to-memos-btn")?.focus();
      }, 50);
    }
  }, [currentView, settings.type]);

  const toggleDefaultPublic = () =>
    updateSettings({ defaultIsPublic: !settings.defaultIsPublic });

  const toggleVimMode = () => {
    updateSettings({ type: settings.type === "standard" ? "vim" : "standard" });
  };

  const handleCreateMemo = async () => {
    setCurrentView("editor");
    await createMemo();
  };

  const filteredMemos = memos.filter((memo) => {
    const title = memo.title || "無題のメモ";
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // ==========================================
  // Vimモード時のサイドバーキーボード操作
  // ==========================================
  const handleSidebarKeyDown = (e: React.KeyboardEvent) => {
    if (settings.type !== "vim") return;

    // 検索窓(input)に入力中の時は j/k ナビゲーションを無効化
    if (document.activeElement?.tagName === "INPUT") {
      if (e.key === "Escape") {
        e.preventDefault();
        (e.currentTarget as HTMLElement).focus(); // 検索窓から抜けてサイドバー自体にフォーカスを戻す
      }
      return;
    }

    const focusableElements = Array.from(
      e.currentTarget.querySelectorAll('button:not([tabindex="-1"])'),
    ) as HTMLElement[];

    const currentIndex = focusableElements.indexOf(
      document.activeElement as HTMLElement,
    );

    if (e.key === "j") {
      e.preventDefault();
      // 下へ移動
      const nextIndex =
        currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
      focusableElements[nextIndex]?.focus();
    } else if (e.key === "k") {
      e.preventDefault();
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : 0;
      focusableElements[prevIndex]?.focus();
    } else if (e.key === "/") {
      e.preventDefault(); // / が文字として入力されるのを防ぐ
      document.getElementById("sidebar-search-input")?.focus();
    } else if (e.key === "l" || e.key === "L" || e.key === "Escape") {
      e.preventDefault();
      // l（右）または Escape でエディタにフォーカスを戻す
      (document.querySelector("textarea") as HTMLElement)?.focus();
    }
  };

  return (
    <aside
      id="app-sidebar"
      tabIndex={-1}
      onKeyDown={handleSidebarKeyDown}
      // ★修正2: Shift+H でサイドバーがフォーカスされた瞬間、現在のメモのボタンにフォーカスをリダイレクトする！
      onFocus={(e) => {
        if (e.target === e.currentTarget && selectedId) {
          const activeBtn = document.getElementById(`memo-btn-${selectedId}`);
          if (activeBtn) {
            activeBtn.focus();
          }
        }
      }}
      className="w-77 h-screen bg-[#e9eef6] flex flex-col border-r border-gray-200 text-gray-600 outline-none shrink-0 focus:ring-2 focus:ring-inset focus:ring-blue-300 transition-shadow"
    >
      <div className="p-4 space-y-4 ">
        <SidebarAuth />
        {currentView !== "editor" && (
          <button
            id="back-to-memos-btn" // ★追加: フォーカス用の目印
            type="button"
            onClick={() => setCurrentView("editor")}
            className="flex items-center gap-2 hover:bg-gray-200 text-gray-700 pl-6 py-3 rounded-full transition-colors font-medium text-sm w-full border border-gray-300 bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-400" // ★追加: outline-none と focus:ring を追加
          >
            <ArrowLeft className="w-5 h-5" />
            <span>自分のメモに戻る</span>
          </button>
        )}
        {currentView === "editor" && (
          <div className="space-y-1">
            <div className="relative group mb-2">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
              {/* input は j/k の対象から外れているため、マウスでクリックした時だけ使えます */}
              <input
                id="sidebar-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="自分のメモを検索..."
                className="w-full bg-transparent border border-transparent hover:bg-white focus:bg-white focus:border-blue-200 rounded-full py-2 pl-10 pr-4 text-sm outline-none transition-all"
              />
            </div>
            <button
              type="button"
              onClick={handleCreateMemo}
              className="flex items-center gap-2 hover:bg-gray-200 pl-6 py-3 rounded-full transition-colors font-medium text-sm w-full"
            >
              <Plus className="w-5 h-5 text-blue-500" />
              <span>メモを新規作成</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrentView("explore");
                setSelectedSearchedMemo(null);
                fetchRelated();
              }}
              className="flex items-center gap-2 hover:bg-blue-50 text-blue-700 pl-6 py-3 rounded-full transition-colors font-medium text-sm w-full"
            >
              <Compass className="w-5 h-5" />
              <span>関連する公開メモを探す</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrentView("timeline");
                setSelectedSearchedMemo(null);
                fetchTimeline();
              }}
              className="flex items-center gap-2 hover:bg-green-50 text-green-700 pl-6 py-3 rounded-full transition-colors font-medium text-sm w-full"
            >
              <Globe className="w-5 h-5" />
              <span>公開タイムライン</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrentView("bookmarks");
                setSelectedSearchedMemo(null);
                fetchBookmarks();
              }}
              className="flex items-center gap-2 hover:bg-yellow-50 text-yellow-700 pl-6 py-3 rounded-full transition-colors font-medium text-sm w-full"
            >
              <Bookmark className="w-5 h-5" />
              <span>ブックマーク</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {currentView === "explore" ? (
          <div className="space-y-1">
            <div className="px-4 mb-2">
              <div className="text-[10px] uppercase text-blue-500 font-bold">
                Related to
              </div>
              <div className="text-xs font-bold text-gray-800 truncate">
                {currentMemo?.title || "無題のメモ"}
              </div>
            </div>
            <div className="h-px bg-gray-200 mx-4 my-2" />
            {isSearching ? (
              <div className="text-center py-10 text-xs font-bold text-blue-500">
                思考を解析中...
              </div>
            ) : searchedMemos.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-xs">
                見つかりません
              </div>
            ) : (
              searchedMemos.map((memo) => (
                <button
                  type="button"
                  key={memo.id}
                  onClick={() => setSelectedSearchedMemo(memo)}
                  className={cn(
                    "w-full rounded-2xl flex flex-col p-3 transition-colors border text-left focus:ring-2 focus:ring-blue-300 outline-none",
                    selectedSearchedMemo?.id === memo.id
                      ? "bg-blue-50 border-blue-200"
                      : "bg-white border-transparent hover:border-gray-200",
                  )}
                >
                  <div className="text-[10px] text-blue-600 mb-1 font-bold">
                    MATCH {Math.round(memo.similarity * 100)}%
                  </div>
                  <div className="truncate text-sm font-medium text-gray-800">
                    {memo.title || "無題のメモ"}
                  </div>
                </button>
              ))
            )}
          </div>
        ) : currentView === "timeline" ? (
          <div className="space-y-1">
            <div className="text-xs font-medium px-4 mb-2 text-green-600 font-bold">
              タイムライン
            </div>
            {timelineMemos.map((memo) => (
              <button
                type="button"
                key={memo.id}
                onClick={() => setSelectedSearchedMemo(memo as any)}
                className={cn(
                  "w-full rounded-2xl flex flex-col p-3 transition-colors border text-left focus:ring-2 focus:ring-green-300 outline-none",
                  selectedSearchedMemo?.id === memo.id
                    ? "bg-green-50 border-green-200"
                    : "bg-white border-transparent hover:border-gray-200",
                )}
              >
                <div className="text-[10px] text-green-600 mb-1 font-bold">
                  {new Date(memo.updated_at).toLocaleDateString()}
                </div>
                <div className="truncate text-sm font-medium text-gray-800">
                  {memo.title || "無題のメモ"}
                </div>
              </button>
            ))}
          </div>
        ) : currentView === "bookmarks" ? (
          <div className="space-y-1">
            <div className="text-xs font-medium px-4 mb-2 text-yellow-600 font-bold">
              ブックマーク
            </div>
            {bookmarkedMemos.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-xs">
                まだ保存されていません
              </div>
            ) : (
              bookmarkedMemos.map((memo) => (
                <button
                  type="button"
                  key={memo.id}
                  onClick={() => setSelectedSearchedMemo(memo as any)}
                  className={cn(
                    "w-full rounded-2xl flex flex-col p-3 transition-colors border text-left focus:ring-2 focus:ring-yellow-300 outline-none",
                    selectedSearchedMemo?.id === memo.id
                      ? "bg-yellow-50 border-yellow-200"
                      : "bg-white border-transparent hover:border-gray-200",
                  )}
                >
                  <div className="text-[10px] text-yellow-600 mb-1 font-bold">
                    {new Date(memo.updated_at).toLocaleDateString()}
                  </div>
                  <div className="truncate text-sm font-medium text-gray-800">
                    {memo.title || "無題のメモ"}
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-xs font-medium px-4 mb-2">自分のメモ</div>
            {filteredMemos.map((memo) => (
              <div
                key={memo.id}
                className={cn(
                  "w-full rounded-full flex items-center transition-colors group px-2",
                  selectedId === memo.id && currentView === "editor"
                    ? "bg-blue-100 text-[#0e42a0]"
                    : "hover:bg-[#d3e3fd]",
                )}
              >
                <button
                  id={`memo-btn-${memo.id}`} // ★修正3: Shift+Hでここを狙い撃ちするためのID！
                  type="button"
                  onClick={() => {
                    setSelectedId(memo.id);
                    setCurrentView("editor");
                  }}
                  className="flex-1 min-w-0 flex items-center gap-2 pl-4 py-2 text-left outline-none focus:ring-2 focus:ring-blue-300 rounded-full"
                >
                  <FileText className="w-4 h-4 opacity-50 shrink-0" />
                  <span className="truncate text-sm font-medium">
                    {memo.title || "無題のメモ"}
                  </span>
                </button>
                <button
                  type="button"
                  tabIndex={-1} // ★これを追加！キーボード操作の対象から外す
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMemo(memo.id);
                  }}
                  className="hidden group-hover:flex text-red-400 pr-3 pl-2 py-2 hover:text-red-600 outline-none focus:ring-2 focus:ring-red-300 rounded-full"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className="p-4 mt-auto border-t border-gray-200 relative"
        ref={settingsRef}
      >
        {isSettingsOpen && (
          <div className="absolute bottom-full left-4 mb-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-50">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">設定</h3>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">デフォルトで公開</span>
              <button
                type="button"
                onClick={toggleDefaultPublic}
                className={cn(
                  "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                  settings.defaultIsPublic ? "bg-blue-500" : "bg-gray-300",
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition duration-200",
                    settings.defaultIsPublic
                      ? "translate-x-4"
                      : "translate-x-0",
                  )}
                />
              </button>
            </div>

            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-600">Vimモード</span>
              <button
                type="button"
                onClick={toggleVimMode}
                className={cn(
                  "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                  settings.type === "vim" ? "bg-blue-500" : "bg-gray-300",
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition duration-200",
                    settings.type === "vim" ? "translate-x-4" : "translate-x-0",
                  )}
                />
              </button>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className={cn(
            "flex items-center gap-3 w-full p-2 text-xs rounded-lg transition-colors outline-none focus:ring-2 focus:ring-blue-300",
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
