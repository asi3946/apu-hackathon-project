"use client";

import { useAtomValue } from "jotai";
import { modeAtom } from "@/store/vimAtom";
import { editorSettingsAtom } from "@/store/editorAtom";
import { EditorHeader } from "./EditorHeader";
import { SimpleEditor } from "./SimpleEditor";
import { cn } from "@/lib/utils";

export function EditorRoot() {
  const vimMode = useAtomValue(modeAtom);
  const settings = useAtomValue(editorSettingsAtom);

  // Gemini Theme Colors
  // Normal: 落ち着いたグレー/黒
  // Insert: Geminiっぽい青紫のグラデーション
  const isVim = settings.type === "vim";
  const isInsert = isVim && vimMode === "insert";

  return (
    <div className="flex-1 h-screen flex flex-col bg-white relative overflow-hidden">
      {/* 1. ヘッダー (タイトル & タグ) */}
      <EditorHeader />

      {/* 2. エディタ本体 */}
      <div className="flex-1 overflow-y-auto px-8 pb-8 max-w-4xl mx-auto w-full relative">
        <SimpleEditor />
      </div>

      {/* 3. Gemini風ステータスボーダー (Insertモード時の演出) */}
      {/* 画面下部に、モードに応じたグラデーションラインを表示 */}
      <div
        className={cn(
          "absolute bottom-0 left-0 w-full h-1 transition-all duration-300",
          !isVim
            ? "bg-transparent"
            : isInsert
              ? "bg-gradient-to-r from-blue-500 via-purple-500 to-red-500"
              : // Gemini Gradient
                "bg-gray-800", // Normal Mode
        )}
      />

      {/* モードバッジ (右下に控えめに表示) */}
      {isVim && (
        <div
          className={cn(
            "absolute bottom-4 right-4 px-3 py-1 rounded-full text-xs font-bold shadow-md transition-colors",
            isInsert ? "bg-blue-600 text-white" : "bg-gray-800 text-white",
          )}
        >
          {vimMode.toUpperCase()}
        </div>
      )}
    </div>
  );
}
