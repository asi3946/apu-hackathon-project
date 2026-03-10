"use client";

import { useAtom, useSetAtom } from "jotai";
import { Plus, Search, Settings, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { AuthSection } from "@/components/auth/AuthSection";
import { cn } from "@/lib/utils";
import {
  createMemoAtom,
  deleteMemoAtom,
  editorSettingsAtom,
  fetchMemosAtom,
  memoListAtom,
  selectedMemoIdAtom,
} from "@/store/models";

export function AppSidebar() {
  const [settings, setSettings] = useAtom(editorSettingsAtom);
  const [memos] = useAtom(memoListAtom);
  const [selectedId, setSelectedId] = useAtom(selectedMemoIdAtom);
  const fetchMemos = useSetAtom(fetchMemosAtom);
  const createMemo = useSetAtom(createMemoAtom);
  const deleteMemo = useSetAtom(deleteMemoAtom);

  useEffect(() => {
    fetchMemos();
  }, [fetchMemos]);

  const toggleEditorType = () => {
    setSettings((prev) => ({
      ...prev,
      type: prev.type === "standard" ? "vim" : "standard",
    }));
  };

  const handleCreateMemo = async () => {
    await createMemo();
  };

  return (
    <aside className="w-77 h-screen bg-[#e9eef6] flex flex-col border-r border-gray-200 text-gray-600">
      {/* 上部: 新規作成 & 検索 */}
      <div className="p-4 space-y-4">
        <AuthSection></AuthSection>
        {/* Gemini風の検索バー */}
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
      </div>

      {/* 中部: メモリスト */}
      <div className="flex-1 overflow-y-auto px-2 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="text-xs font-medium px-4 mb-2">最近</div>
        <div className="space-y-1">
          {memos.map((memo) => (
            <div
              key={memo.id}
              className={cn(
                "w-full rounded-full flex items-center transition-colors group relative", // justify-betweenを消し、配置を微調整
                selectedId === memo.id
                  ? "bg-blue-100 text-[#0e42a0] font-medium"
                  : "hover:bg-[#d3e3fd] text-gray-700",
              )}
            >
              <button
                type="button"
                onClick={() => setSelectedId(memo.id)}
                className="flex-1 min-w-0 flex items-center gap-2 pl-8 py-2 rounded-l-full text-left"
              >
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
                className="hidden group-hover:flex shrink-0 text-red-400 pr-3 pl-2 py-2 hover:text-red-600 rounded-r-full items-center justify-center transition-colors"
                title="削除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
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
