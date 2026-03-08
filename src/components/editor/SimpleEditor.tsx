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
        "text-gray-800 placeholder:text-gray-300",
        settings.type === "vim" &&
          vimMode === "normal" &&
          "selection:bg-gray-800 selection:text-white",
      )}
      spellCheck={false}
    />
  );
}
