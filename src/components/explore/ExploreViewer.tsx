"use client";

import { FileText } from "lucide-react";

export function ExploreViewer() {
  const dummySelectedMemo = null;

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      {dummySelectedMemo ? (
        <div className="flex-1 overflow-y-auto p-12 max-w-4xl mx-auto w-full">
          <div className="mb-8 border-b pb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              タイトルがここに入ります
            </h1>
          </div>

          <div className="prose prose-gray max-w-none text-gray-700 whitespace-pre-wrap">
            本文がここに入ります。
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
