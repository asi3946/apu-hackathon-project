"use client";

import { useAtom } from "jotai";
import { Plus } from "lucide-react";
import { editorTitleAtom } from "@/store/editorAtom"; // まだ作ってないので後で追加
import { cn } from "@/lib/utils";

// 仮のタグデータ（後でStoreに移します）
const tempTags = ["React", "Idea", "Frontend"];

export function EditorHeader() {
  // タイトルはまだAtomを作っていないので、一時的にローカルステートかダミーを使用
  // 本来は: const [title, setTitle] = useAtom(editorTitleAtom);

  return (
    <div className="flex flex-col gap-4 mb-6 px-8 pt-8 max-w-4xl mx-auto w-full">
      {/* タイトル入力 (Notionライクな巨大文字) */}
      <input
        type="text"
        placeholder="無題"
        className="text-4xl font-bold text-[#1f1f1f] placeholder:text-gray-300 outline-none bg-transparent w-full"
        defaultValue="Vim操作チートシート" // ダミー
      />

      {/* タグエリア (Notionライクな長方形) */}
      <div className="flex flex-wrap items-center gap-2">
        {tempTags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 bg-gray-100 text-gray-600 text-sm rounded-md border border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors"
          >
            #{tag}
          </span>
        ))}

        {/* タグ追加ボタン */}
        <button
          type="button"
          className="flex items-center gap-1 px-2 py-0.5 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add Tag
        </button>
      </div>

      {/* 区切り線 */}
      <hr className="border-gray-100 mt-2" />
    </div>
  );
}
