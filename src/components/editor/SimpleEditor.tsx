"use client";

import { useSetAtom } from "jotai";
import { useVimEditor } from "@/hooks/useVimEditor";
import { cn } from "@/lib/utils";
import { activeEditorAtom } from "@/store/editorAtom";

export function SimpleEditor() {
  const {
    textareaRef,
    content,
    vimMode,
    settings,
    handleChange,
    handleSelect,
    handleKeyDown,
  } = useVimEditor();

  const setActiveEditor = useSetAtom(activeEditorAtom);

  return (
    <textarea
      ref={textareaRef}
      value={content}
      onChange={handleChange}
      onSelect={handleSelect}
      onKeyDown={handleKeyDown}
      onFocus={() => setActiveEditor("content")}
      placeholder="ここにメモを入力..."
      className={cn(
        "w-full h-full resize-none outline-none bg-transparent",
        "font-mono text-lg leading-relaxed",
        "text-gray-800 placeholder:text-gray-300",
        settings.type === "vim" &&
          vimMode === "normal" &&
          "selection:bg-gray-800 selection:text-white",
      )}
      spellCheck={false}
    />
  );
}
