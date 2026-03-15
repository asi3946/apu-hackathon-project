"use client";

import { useAtomValue } from "jotai";
import { FileText } from "lucide-react";
import { selectedSearchedMemoAtom } from "@/store/memoAtom"; // ← 追加

export function ExploreViewer() {
  // ダミーを消して、Jotaiのグローバル状態（選択された検索結果）を読み込む
  const selectedSearchedMemo = useAtomValue(selectedSearchedMemoAtom);

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      {selectedSearchedMemo ? (
        <div className="flex-1 overflow-y-auto p-12 max-w-4xl mx-auto w-full">
          <div className="mb-8 border-b pb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {/* 実際のタイトルを表示 */}
              {selectedSearchedMemo.title || "無題のメモ"}
            </h1>
          </div>

          <div className="prose prose-gray max-w-none text-gray-700 whitespace-pre-wrap">
            {/* 実際の本文を表示 */}
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
