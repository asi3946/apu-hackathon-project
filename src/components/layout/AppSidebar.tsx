"use client";

import { useAtom, useSetAtom } from "jotai";
import { FileText, Plus, Search, Settings } from "lucide-react"; // アイコン
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  editorSettingsAtom,
  fetchMemosAtom,
  memoListAtom,
  selectedMemoIdAtom,
} from "@/store";

export function AppSidebar() {
  const [settings, setSettings] = useAtom(editorSettingsAtom);
  const [memos] = useAtom(memoListAtom);
  const [selectedId, setSelectedId] = useAtom(selectedMemoIdAtom);

  const fetchMemos = useSetAtom(fetchMemosAtom);
  useEffect(() => {
    fetchMemos();
  }, [fetchMemos]);

  const toggleEditorType = () => {
    setSettings((prev) => ({
      ...prev,
      type: prev.type === "standard" ? "vim" : "standard",
    }));
  };

  return (
    <aside className="w-64 h-screen bg-[#f0f4f9] flex flex-col border-r border-gray-200 text-[#444746]">
      {/* 上部: 新規作成 & 検索 */}
      <div className="p-4 space-y-4">
        <button
          type="button"
          className="flex items-center gap-2 bg-[#dde3ea] hover:bg-[#d0d7de] text-[#1f1f1f] px-4 py-3 rounded-2xl transition-colors font-medium text-sm w-fit"
        >
          <Plus className="w-5 h-5" />
          <span className="pr-2">新しいメモ</span>
        </button>

        {/* Gemini風の検索バー */}
        <div className="relative group">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500 group-focus-within:text-blue-600" />
          <input
            type="text"
            placeholder="検索"
            className="w-full bg-transparent border border-transparent hover:bg-white hover:shadow-sm focus:bg-white focus:shadow-md focus:border-blue-200 rounded-full py-2 pl-10 pr-4 text-sm outline-none transition-all"
          />
        </div>
      </div>

      {/* 中部: メモリスト (タイトルのみ) */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="text-xs font-medium text-gray-500 px-4 mb-2">最近</div>
        <div className="space-y-1">
          {memos.map((memo) => (
            <button
              type="button"
              key={memo.id}
              onClick={() => setSelectedId(memo.id)}
              className={cn(
                "w-full text-left px-4 py-2 rounded-full text-sm truncate flex items-center gap-2 transition-colors",
                selectedId === memo.id
                  ? "bg-[#c2e7ff] text-[#001d35] font-medium" // 選択中 (Gemini Blue)
                  : "hover:bg-[#e1e5ea]",
              )}
            >
              <FileText className="w-4 h-4 shrink-0 opacity-50" />
              {memo.title || "無題のメモ"}
            </button>
          ))}
        </div>
      </div>

      {/* 下部: 設定 (Vimモード切替) */}
      <div className="p-4 mt-auto border-t border-gray-200">
        <button
          type="button"
          onClick={toggleEditorType}
          className="flex items-center gap-3 w-full p-2 text-xs text-gray-500 hover:text-gray-900 hover:bg-[#e1e5ea] rounded-lg transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>Mode: {settings.type === "vim" ? "Vim (ON)" : "Standard"}</span>
        </button>
      </div>
    </aside>
  );
}
