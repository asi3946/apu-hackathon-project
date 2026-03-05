"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Plus, Save, Tag as TagIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  editorContentAtom,
  editorTitleAtom,
  memoListAtom,
  saveMemoAtom,
  selectedMemoIdAtom,
} from "@/store";

export function EditorHeader() {
  // --- State ---
  // useAtomeはstateのどちらもを取得.useAtomeValueは値だけ.useSetAtomは関数だけ.
  const [title, setTitle] = useAtom(editorTitleAtom);
  const content = useAtomValue(editorContentAtom);
  const selectedId = useAtomValue(selectedMemoIdAtom);
  const memos = useAtomValue(memoListAtom);

  // --- Actions ---
  const saveMemo = useSetAtom(saveMemoAtom);

  // 現在選択されているメモからタグを取得（まだStoreが未完成なら一旦空配列）
  const currentMemo = memos.find((m) => m.id === selectedId);
  const tags = currentMemo?.tags || [];

  const handleSave = async () => {
    if (selectedId) {
      await saveMemo({ id: selectedId, title, content });
      // 保存完了のフィードバック（本来はトースト通知などが望ましい）
      console.log("Saved successfully");
    }
  };

  return (
    <div className="flex flex-col gap-4 mb-6 px-8 pt-8 max-w-4xl mx-auto w-full group">
      {/* 1. タイトル行 */}
      <div className="flex justify-between items-center gap-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="無題"
          className="text-4xl font-bold text-[#1f1f1f] placeholder:text-gray-200 outline-none bg-transparent flex-1"
        />

        {/* 保存ボタン (Gemini風) */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!selectedId}
          className={cn(
            "p-2 rounded-full transition-all duration-200",
            selectedId
              ? "text-gray-400 hover:bg-blue-50 hover:text-blue-600"
              : "text-gray-200 cursor-not-allowed",
          )}
          title="保存 (Ctrl+S)"
        >
          <Save className="w-6 h-6" />
        </button>
      </div>

      {/* 2. タグエリア (Notion風長方形) */}
      <div className="flex flex-wrap items-center gap-2 min-h-8">
        {tags.length > 0 ? (
          tags.map((tag) => (
            <div
              key={tag}
              className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-sm rounded-md border border-gray-200 hover:bg-gray-200 transition-colors cursor-default"
            >
              <TagIcon className="w-3 h-3 opacity-70" />
              <span>{tag}</span>
            </div>
          ))
        ) : (
          <span className="text-sm text-gray-300 italic">タグなし</span>
        )}

        {/* タグ追加ボタン */}
        <button
          type="button"
          className="flex items-center gap-1 px-2 py-0.5 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all border border-transparent hover:border-gray-200"
        >
          <Plus className="w-3 h-3" />
          <span>Add Tag</span>
        </button>
      </div>

      {/* セパレーター */}
      <hr className="border-gray-100 mt-2 w-full" />
    </div>
  );
}
