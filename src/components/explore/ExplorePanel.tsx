"use client";

import { useAtomValue } from "jotai";
import { CheckCircle2, FileText, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { editorContentAtom, editorTitleAtom } from "@/store/editorAtom";

// APIから返ってくるメモの型
type SearchedMemo = {
  id: string;
  title: string;
  content: string;
  similarity: number;
  user_id: string;
};

export function ExplorePanel() {
  const [memos, setMemos] = useState<SearchedMemo[]>([]);
  const [selectedMemo, setSelectedMemo] = useState<SearchedMemo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 現在エディタに書かれている内容を取得（検索のクエリとして使用）
  const currentContent = useAtomValue(editorContentAtom);
  const currentTitle = useAtomValue(editorTitleAtom);

  // コンポーネントが表示された時、またはエディタの内容が変わった時に検索を実行
  useEffect(() => {
    const fetchRelatedMemos = async () => {
      // 検索するためのテキストが空の場合は実行しない
      const queryText = `${currentTitle}\n${currentContent}`.trim();
      if (!queryText) return;

      setIsLoading(true);
      try {
        const response = await fetch("/api/memos/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: queryText }),
        });

        if (!response.ok) {
          throw new Error("検索APIのエラー");
        }

        const data = await response.json();
        // search/route.ts の仕様に合わせて data.memos をセット
        if (data.memos) {
          setMemos(data.memos);
          // 最初の一件を自動で選択状態にする
          if (data.memos.length > 0) {
            setSelectedMemo(data.memos[0]);
          }
        }
      } catch (error) {
        console.error("検索に失敗しました:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelatedMemos();
  }, [currentContent, currentTitle]);

  return (
    <div className="flex-1 flex h-screen bg-white">
      {/* 検索結果リスト (左側) */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
        <div className="p-6 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-semibold text-gray-800">
            関連する公開メモ
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            あなたの現在のメモに類似するアイデアです
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p className="text-sm">AIが関連メモを検索中...</p>
            </div>
          ) : memos.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              関連するメモが見つかりませんでした。
            </div>
          ) : (
            memos.map((memo) => (
              <button
                type="button"
                key={memo.id}
                onClick={() => setSelectedMemo(memo)}
                className={cn(
                  "w-full text-left p-4 rounded-xl border transition-all duration-200",
                  selectedMemo?.id === memo.id
                    ? "bg-blue-50 border-blue-200 shadow-sm"
                    : "bg-white border-gray-200 hover:border-blue-300 hover:shadow",
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    マッチ度 {Math.round(memo.similarity * 100)}%
                  </span>
                </div>
                <h3 className="font-medium text-gray-800 line-clamp-1 mb-1">
                  {memo.title || "無題のメモ"}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2">
                  {memo.content}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* メモの閲覧ビュー (右側) */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedMemo ? (
          <div className="flex-1 overflow-y-auto p-12 max-w-4xl mx-auto w-full">
            <div className="mb-8 border-b pb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {selectedMemo.title || "無題のメモ"}
              </h1>
            </div>

            <div className="prose prose-gray max-w-none text-gray-700 whitespace-pre-wrap">
              {selectedMemo.content}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <FileText className="w-16 h-16 mb-4 opacity-20" />
            <p>ほかの人のメモ</p>
          </div>
        )}
      </div>
    </div>
  );
}
