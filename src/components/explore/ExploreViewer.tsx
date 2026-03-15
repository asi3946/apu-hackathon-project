"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { FileText, Bookmark, BookmarkMinus } from "lucide-react";
import { selectedSearchedMemoAtom, bookmarkedMemoIdsAtom, toggleBookmarkAtom } from "@/store/memoAtom";
import { currentViewAtom } from "@/store/editorAtom";
import { cn } from "@/lib/utils";

export function ExploreViewer() {
  const selectedSearchedMemo = useAtomValue(selectedSearchedMemoAtom);
  const currentView = useAtomValue(currentViewAtom);

  const bookmarkedIds = useAtomValue(bookmarkedMemoIdsAtom);
  const toggleBookmark = useSetAtom(toggleBookmarkAtom);
  const isBookmarked = selectedSearchedMemo ? bookmarkedIds.includes(selectedSearchedMemo.id) : false;

  const isTimeline = currentView === "timeline";
  const isBookmarks = currentView === "bookmarks";
  
  const tagColorClass = isBookmarks ? "bg-yellow-50 text-yellow-700 border-yellow-200"
    : isTimeline ? "bg-green-50 text-green-700 border-green-200"
    : "bg-blue-50 text-blue-600 border-blue-200";

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      {selectedSearchedMemo ? (
        <div className="flex-1 overflow-y-auto p-12 max-w-4xl mx-auto w-full">
          <div className="mb-8 border-b pb-6">
            
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-3xl font-bold text-gray-900">
                {selectedSearchedMemo.title || "無題のメモ"}
              </h1>
              
              {isBookmarks ? (
                <button
                  type="button"
                  onClick={() => selectedSearchedMemo && toggleBookmark(selectedSearchedMemo.id)}
                  className="px-4 py-2 rounded-full transition-all border shadow-sm shrink-0 flex items-center gap-2 bg-white text-red-500 border-red-200 hover:bg-red-50"
                >
                  <BookmarkMinus className="w-4 h-4" />
                  <span className="text-xs font-bold">ブックマーク解除</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => selectedSearchedMemo && toggleBookmark(selectedSearchedMemo.id)}
                  className={cn(
                    "px-4 py-2 rounded-full transition-all border shadow-sm shrink-0 flex items-center gap-2",
                    isBookmarked 
                      ? "bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100" 
                      : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700"
                  )}
                >
                  <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-current")} />
                  <span className="text-xs font-bold">{isBookmarked ? "保存済み" : "ブックマークに保存"}</span>
                </button>
              )}
            </div>

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