"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Loader2, Plus, Save, Tag as TagIcon, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSingleLineVim } from "@/hooks/useSingleLineVim";
import { cn } from "@/lib/utils";
import {
  editorTagsAtom,
  editorTitleAtom,
  saveMemoAtom,
  selectedMemoIdAtom,
} from "@/store/models";

export function EditorHeader() {
  const [title, setTitle] = useAtom(editorTitleAtom);
  const [tags, setTags] = useAtom(editorTagsAtom);
  const selectedId = useAtomValue(selectedMemoIdAtom);
  const saveMemo = useSetAtom(saveMemoAtom);

  const [isSaving, setIsSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const handleSave = useCallback(async () => {
    if (selectedId && !isSaving) {
      setIsSaving(true);
      await saveMemo();

      setTimeout(() => {
        setIsSaving(false);
      }, 500);
    }
  }, [selectedId, isSaving, saveMemo]);

  const saveRef = useRef(handleSave);
  useEffect(() => {
    saveRef.current = handleSave;
  }, [handleSave]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveRef.current();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
  // タイトルvim操作で移動するための記述.
  const {
    inputRef: titleInputRef,
    vimMode: titleVimMode,
    handleKeyDown: handleTitleKeyDown,
    handleChange: handleTitleChange,
    handleSelect: handleTitleSelect,
  } = useSingleLineVim(
    title,
    setTitle,
    () => {
      document.querySelector("textarea")?.focus();
    },
    (direction) => {
      if (direction === "down") {
        document.getElementById("memo-tag-input")?.focus();
      }
    },
  );

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput("");
  };

  const {
    inputRef: tagInputRef,
    vimMode: tagVimMode,
    handleKeyDown: handleTagKeyDown,
    handleChange: handleTagChange,
    handleSelect: handleTagSelect,
  } = useSingleLineVim(
    tagInput,
    setTagInput,
    () => {
      if (tagInput.trim()) {
        handleAddTag();
      } else {
        document.querySelector("textarea")?.focus();
      }
    },
    (direction) => {
      if (direction === "up") {
        document.getElementById("memo-title-input")?.focus();
      } else if (direction === "down") {
        document.querySelector("textarea")?.focus();
      }
    },
  );

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="flex flex-col gap-4 w-full group">
      <div className="flex justify-between items-center gap-4">
        <input
          id="memo-title-input"
          ref={titleInputRef}
          type="text"
          value={title}
          readOnly={titleVimMode === "normal" || titleVimMode === "visual"}
          onChange={handleTitleChange}
          onKeyDown={handleTitleKeyDown}
          onSelect={handleTitleSelect}
          placeholder="no title"
          className={cn(
            "text-4xl font-bold text-gray-800 placeholder:text-gray-200 outline-none flex-1 transition-all rounded-md px-2 -ml-2",
            titleVimMode === "normal" || titleVimMode === "visual"
              ? "caret-transparent bg-transparent selection:bg-gray-800 selection:text-white"
              : "bg-white border-b-2 border-blue-300",
          )}
        />

        <button
          type="button"
          onClick={handleSave}
          disabled={!selectedId || isSaving}
          className={cn(
            "p-2 rounded-full transition-all duration-200",
            selectedId
              ? "text-gray-400 hover:bg-blue-50 hover:text-blue-600"
              : "text-gray-200 cursor-not-allowed",
          )}
          title="保存 (Ctrl+S)"
        >
          {isSaving ? (
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          ) : (
            <Save className="w-6 h-6" />
          )}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 min-h-8">
        {tags.length > 0 ? (
          tags.map((tag) => (
            <div
              key={tag}
              className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-sm rounded-md border border-gray-200 cursor-default group/tag"
            >
              <TagIcon className="w-3 h-3 opacity-70" />
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="opacity-0 group-hover/tag:opacity-100 hover:text-red-500 transition-opacity ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))
        ) : (
          <span className="text-sm text-gray-300 italic">タグなし</span>
        )}

        <div className="relative flex items-center">
          <Plus className="absolute left-2 w-3 h-3 text-gray-400 pointer-events-none" />
          <input
            id="memo-tag-input"
            ref={tagInputRef}
            type="text"
            value={tagInput}
            readOnly={tagVimMode === "normal" || tagVimMode === "visual"}
            onChange={handleTagChange}
            onKeyDown={handleTagKeyDown}
            onSelect={handleTagSelect}
            placeholder="Add Tag"
            className={cn(
              "pl-6 pr-2 py-0.5 text-sm text-gray-600 placeholder:text-gray-400 border rounded-md outline-none w-28 transition-all",
              tagVimMode === "normal" || tagVimMode === "visual"
                ? "caret-transparent border-transparent hover:border-gray-200 hover:bg-gray-100 bg-transparent focus:bg-blue-50 focus:ring-2 focus:ring-blue-200 selection:bg-gray-800 selection:text-white"
                : "bg-white border-blue-300 shadow-sm focus:ring-2 focus:ring-blue-200",
            )}
          />
        </div>
      </div>

      <hr className="border-gray-100 mt-2 w-full" />
    </div>
  );
}
