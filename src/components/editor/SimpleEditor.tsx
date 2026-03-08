"use client";

import { useVimEditor } from "@/hooks/useVimEditor";
import { cn } from "@/lib/utils";

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

  return (
    <textarea
      ref={textareaRef}
      value={content}
      onChange={handleChange}
      onSelect={handleSelect}
      onKeyDown={handleKeyDown}
      placeholder="ここにメモを入力..."
      className={cn(
        "w-full h-full resize-none outline-none bg-transparent",
        "font-mono text-lg leading-relaxed",
        "text-[#1f1f1f] placeholder:text-gray-300",
        settings.type === "vim" && vimMode === "normal"
          ? "selection:bg-green-200 selection:text-black"
          : "selection:bg-blue-100 selection:text-black",
      )}
      spellCheck={false}
    />
  );
}
