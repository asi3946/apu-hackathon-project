"use client";

import { useAtomValue } from "jotai";
import { FileText } from "lucide-react";
import { selectedSearchedMemoAtom } from "@/store/memoAtom";
import { currentViewAtom } from "@/store/editorAtom"; // ★ 追加: 現在のビューを取得

export function ExploreViewer() {
  const selectedSearchedMemo = useAtomValue(selectedSearchedMemoAtom);
  const currentView = useAtomValue(currentViewAtom); // ★ 追加

  // ★ 現在のビューが「タイムライン」かどうかでタグの色を判定
  const isTimeline = currentView === "timeline";
  const tagColorClass = isTimeline
    ? "bg-green-50 text-green-700 border-green-200" // タイムラインなら緑
    : "bg-blue-50 text-blue-600 border-blue-200";   // 関連メモなら青

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      {selectedSearchedMemo ? (
        <div className="flex-1 overflow-y-auto p-12 max-w-4xl mx-auto w-full">
          <div className="mb-8 border-b pb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {selectedSearchedMemo.title || "無題のメモ"}
            </h1>

            {/* ★ タグ表示エリア（色が動的に変わります） */}
            <div className="flex flex-wrap items-center gap-2">
              {selectedSearchedMemo.tags && selectedSearchedMemo.tags.length > 0 ? (
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
    </div>
  );
}