"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Loader2, Plus, Save, Tag as TagIcon, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useVimKeyHandler } from "@/hooks/useVimKeyHandler";
import { cn } from "@/lib/utils";
import { activeEditorAtom, editorTagInputAtom } from "@/store/editorAtom";
import {
  editorSettingsAtom,
  editorTagsAtom,
  editorTitleAtom,
  saveMemoAtom,
  selectedMemoIdAtom,
} from "@/store/models";
import { cursorAtom, modeAtom, visualStartAtom } from "@/store/vim/core";

export function EditorHeader() {
  const [title, setTitle] = useAtom(editorTitleAtom);
  const [tags, setTags] = useAtom(editorTagsAtom);
  const [tagInput, setTagInput] = useAtom(editorTagInputAtom);
  const [activeEditor, setActiveEditor] = useAtom(activeEditorAtom);
  const selectedId = useAtomValue(selectedMemoIdAtom);
  const saveMemo = useSetAtom(saveMemoAtom);
  const settings = useAtomValue(editorSettingsAtom);
  const vimMode = useAtomValue(modeAtom);
  const cursor = useAtomValue(cursorAtom);
  const visualStart = useAtomValue(visualStartAtom);
  const setCursor = useSetAtom(cursorAtom);

  const [isSaving, setIsSaving] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const ignoreSelectRef = useRef(false);

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

  const { handleKeyDown: handleTitleKeyDown } = useVimKeyHandler(
    titleInputRef,
    ignoreSelectRef,
    (direction) => {
      if (direction === "down") {
        document.getElementById("memo-tag-input")?.focus();
      }
    },
  );

  const { handleKeyDown: handleTagKeyDown } = useVimKeyHandler(
    tagInputRef,
    ignoreSelectRef,
    (direction) => {
      if (direction === "up") {
        document.getElementById("memo-title-input")?.focus();
      } else if (direction === "down") {
        document.querySelector("textarea")?.focus();
      }
    },
  );

  useEffect(() => {
    if (settings.type === "standard") return;
    const input =
      activeEditor === "title"
        ? titleInputRef.current
        : activeEditor === "tags"
          ? tagInputRef.current
          : null;
    if (!input) return;

    const value =
      activeEditor === "title"
        ? title
        : activeEditor === "tags"
          ? tagInput
          : "";

    if (vimMode === "visual" && visualStart !== null) {
      const start = Math.min(visualStart, cursor);
      const end = Math.max(visualStart, cursor) + 1;
      input.setSelectionRange(start, end);
    } else if (vimMode === "normal") {
      const endPos = Math.min(cursor + 1, value.length);
      if (value.length === 0) {
        input.setSelectionRange(0, 0);
      } else {
        input.setSelectionRange(cursor, endPos);
      }
    } else {
      input.setSelectionRange(cursor, cursor);
    }
    ignoreSelectRef.current = false;
  }, [
    cursor,
    vimMode,
    title,
    tagInput,
    visualStart,
    settings.type,
    activeEditor,
  ]);

  const handleTitleSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
    if (
      ignoreSelectRef.current ||
      settings.type === "standard" ||
      vimMode !== "insert" ||
      activeEditor !== "title"
    )
      return;
    setCursor(e.currentTarget.selectionStart || 0);
  };

  const handleTagSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
    if (
      ignoreSelectRef.current ||
      settings.type === "standard" ||
      vimMode !== "insert" ||
      activeEditor !== "tags"
    )
      return;
    setCursor(e.currentTarget.selectionStart || 0);
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput("");
  };

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
          readOnly={
            settings.type === "vim" &&
            activeEditor === "title" &&
            (vimMode === "normal" || vimMode === "visual")
          }
          onFocus={() => setActiveEditor("title")}
          onChange={(e) => {
            setTitle(e.target.value);
            setCursor(e.target.selectionStart || 0);
          }}
          onKeyDown={(e) => {
            if (settings.type === "standard") {
              if (e.key === "Enter" || e.key === "Escape") {
                e.preventDefault();
                document.querySelector("textarea")?.focus();
              }
            } else {
              handleTitleKeyDown(e);
            }
          }}
          onSelect={handleTitleSelect}
          placeholder="no title"
          className={cn(
            "text-4xl font-bold text-gray-800 placeholder:text-gray-200 outline-none flex-1 transition-all rounded-md px-2 -ml-2 bg-transparent",
            "border border-transparent hover:border-gray-200 hover:bg-gray-100 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-200",
            settings.type === "vim" &&
              activeEditor === "title" &&
              (vimMode === "normal" || vimMode === "visual")
              ? "caret-transparent selection:bg-gray-800 selection:text-white"
              : "",
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
            readOnly={
              settings.type === "vim" &&
              activeEditor === "tags" &&
              (vimMode === "normal" || vimMode === "visual")
            }
            onFocus={() => setActiveEditor("tags")}
            onChange={(e) => {
              setTagInput(e.target.value);
              setCursor(e.target.selectionStart || 0);
            }}
            onKeyDown={(e) => {
              if (settings.type === "standard") {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  document.querySelector("textarea")?.focus();
                }
              } else {
                handleTagKeyDown(e);
              }
            }}
            onSelect={handleTagSelect}
            placeholder="Add Tag"
            className={cn(
              "pl-6 pr-2 py-0.5 text-sm text-gray-600 placeholder:text-gray-400 border border-transparent rounded-md outline-none w-28 transition-all bg-transparent hover:border-gray-200 hover:bg-gray-100 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-200",
              settings.type === "vim" &&
                activeEditor === "tags" &&
                (vimMode === "normal" || vimMode === "visual")
                ? "caret-transparent selection:bg-gray-800 selection:text-white"
                : "",
            )}
          />
        </div>
      </div>

      <hr className="border-gray-100 mt-2 w-full" />
    </div>
  );
}
