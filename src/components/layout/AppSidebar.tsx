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

import { 
  fetchMemosAtom, 
  createMemoAtom, 
  deleteMemoAtom, 
  memoListAtom, 
  selectedMemoIdAtom,
  fetchTimelineMemosAtom, 
  timelineMemosAtom,
  searchedMemosAtom,
  selectedSearchedMemoAtom
} from "@/store/memoAtom";

import {
  currentViewAtom,
  editorSettingsAtom,
  fetchUserSettingsAtom,
  updateUserSettingsAtom,
} from "@/store/editorAtom";

export function AppSidebar() {
  const [settings] = useAtom(editorSettingsAtom);
  const updateSettings = useSetAtom(updateUserSettingsAtom);
  const fetchUserSettings = useSetAtom(fetchUserSettingsAtom);

  const [memos] = useAtom(memoListAtom);
  const [selectedId, setSelectedId] = useAtom(selectedMemoIdAtom);
  const fetchMemos = useSetAtom(fetchMemosAtom);
  const createMemo = useSetAtom(createMemoAtom);
  const deleteMemo = useSetAtom(deleteMemoAtom);

  // 型エラー対策: 明示的に ViewMode として扱う
  const [currentView, setCurrentView] = useAtom(currentViewAtom);

  const [searchedMemos] = useAtom(searchedMemosAtom);
  const [selectedSearchedMemo, setSelectedSearchedMemo] = useAtom(selectedSearchedMemoAtom);
  const [isSearching, setIsSearching] = useState(false);
  
  // タイムライン（自分以外）のデータ
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
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    if (isSettingsOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSettingsOpen]);

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

  return (
    <aside className="w-77 h-screen bg-[#e9eef6] flex flex-col border-r border-gray-200 text-gray-600 outline-none shrink-0">
      <div className="p-4 space-y-4">
        <SidebarAuth />

        {/* 戻るボタンの表示 */}
        {currentView !== "editor" && (
          <button
            type="button"
            onClick={() => setCurrentView("editor")}
            className="flex items-center gap-2 hover:bg-gray-200 text-gray-700 pl-6 py-3 rounded-full transition-colors font-medium text-sm w-full border border-gray-300 bg-white shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>自分のメモに戻る</span>
          </button>
        )}

        {/* メインナビゲーション (editorモードの時だけ表示) */}
        {currentView === "editor" && (
          <div className="space-y-1">
            <div className="relative group mb-2">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="検索"
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
              onClick={() => setCurrentView("explore")}
              className="flex items-center gap-2 hover:bg-blue-50 text-blue-700 pl-6 py-3 rounded-full transition-colors font-medium text-sm w-full"
            >
              <Compass className="w-5 h-5" />
              <span>関連する公開メモを探す</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentView("timeline");
                fetchTimeline();
              }}
              className="flex items-center gap-2 hover:bg-green-50 text-green-700 pl-6 py-3 rounded-full transition-colors font-medium text-sm w-full"
            >
              <Globe className="w-5 h-5" />
              <span>公開タイムライン</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {/* リスト表示部分の出し分け */}
        {currentView === "explore" ? (
          <div className="space-y-1">
            <div className="text-xs font-medium px-4 mb-2 text-blue-600">検索結果</div>
            {isSearching ? (
              <div className="flex flex-col items-center py-10 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin mb-4" />
                <span>検索中...</span>
              </div>
            ) : searchedMemos.map((memo) => (
              <button
                key={memo.id}
                type="button"
                onClick={() => setSelectedSearchedMemo(memo)}
                className={cn(
                  "w-full rounded-2xl flex flex-col p-3 transition-colors border text-left",
                  selectedSearchedMemo?.id === memo.id ? "bg-blue-50 border-blue-200" : "bg-white border-transparent hover:border-gray-200"
                )}
              >
                <div className="text-[10px] text-blue-600 mb-1 font-bold">MATCH {Math.round(memo.similarity * 100)}%</div>
                <div className="truncate text-sm font-medium text-gray-800">{memo.title || "無題のメモ"}</div>
              </button>
            ))}
          </div>
        ) : currentView === "timeline" ? (
          <div className="space-y-1">
            <div className="text-xs font-medium px-4 mb-2 text-green-600">タイムライン (他人の公開メモ)</div>
            {timelineMemos.map((memo) => (
              <button
                key={memo.id}
                type="button"
                onClick={() => setSelectedSearchedMemo(memo as any)}
                className={cn(
                  "w-full rounded-2xl flex flex-col p-3 transition-colors border text-left",
                  selectedSearchedMemo?.id === memo.id ? "bg-green-50 border-green-200" : "bg-white border-transparent hover:border-gray-200"
                )}
              >
                <div className="text-[10px] text-green-600 mb-1 font-bold">{new Date(memo.updated_at).toLocaleDateString()}</div>
                <div className="truncate text-sm font-medium text-gray-800">{memo.title || "無題のメモ"}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-xs font-medium px-4 mb-2">自分のメモ</div>
            {memos.map((memo) => (
              <div key={memo.id} className={cn(
                "w-full rounded-full flex items-center transition-colors group px-2",
                selectedId === memo.id && currentView === "editor" ? "bg-blue-100 text-[#0e42a0]" : "hover:bg-[#d3e3fd]"
              )}>
                <button
                  type="button"
                  onClick={() => { setSelectedId(memo.id); setCurrentView("editor"); }}
                  className="flex-1 min-w-0 flex items-center gap-2 pl-4 py-2 text-left outline-none"
                >
                  <FileText className="w-4 h-4 opacity-50 shrink-0" />
                  <span className="truncate text-sm font-medium">{memo.title || "無題のメモ"}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); deleteMemo(memo.id); }}
                  className="hidden group-hover:flex shrink-0 text-red-400 pr-3 pl-2 py-2 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 mt-auto border-t border-gray-200 relative" ref={settingsRef}>
        {isSettingsOpen && (
          <div className="absolute bottom-full left-4 mb-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-50">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">エディタ設定</h3>
            <div className="space-y-4">
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
                  <span className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition duration-200",
                    settings.defaultIsPublic ? "translate-x-4" : "translate-x-0",
                  )} />
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
            isSettingsOpen ? "bg-[#d3e3fd] text-[#0e42a0]" : "text-gray-500 hover:text-gray-900 hover:bg-[#e1e5ea]",
          )}
        >
          <Settings className="w-4 h-4" />
          <span>設定</span>
        </button>
      </div>
    </aside>
  );
}