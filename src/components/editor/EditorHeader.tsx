"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  Check,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Tag as TagIcon,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useVimKeyHandler } from "@/hooks/useVimKeyHandler";
import { cn } from "@/lib/utils";
import {
  activeEditorAtom,
  allTagsAtom,
  editorContentAtom,
  editorTagInputAtom,
} from "@/store/editorAtom";
import { fetchAllTagsAtom, saveMemoAtom } from "@/store/memoAtom";
import {
  editorSettingsAtom,
  editorTagsAtom,
  editorTitleAtom,
  selectedMemoIdAtom,
} from "@/store/models";
import { cursorAtom, modeAtom, visualStartAtom } from "@/store/vim/core";
import type { Tag } from "@/types/db";

export function EditorHeader() {
  const [title, setTitle] = useAtom(editorTitleAtom);
  const [tags, setTags] = useAtom(editorTagsAtom);
  const [tagInput, setTagInput] = useAtom(editorTagInputAtom);
  const [activeEditor, setActiveEditor] = useAtom(activeEditorAtom);

  const allTags = useAtomValue(allTagsAtom);
  const content = useAtomValue(editorContentAtom);
  const fetchAllTags = useSetAtom(fetchAllTagsAtom);

  const selectedId = useAtomValue(selectedMemoIdAtom);
  const saveMemo = useSetAtom(saveMemoAtom);
  const settings = useAtomValue(editorSettingsAtom);
  const vimMode = useAtomValue(modeAtom);
  const cursor = useAtomValue(cursorAtom);
  const visualStart = useAtomValue(visualStartAtom);
  const setCursor = useSetAtom(cursorAtom);

  const [isSaving, setIsSaving] = useState(false);
  
  // ★重要：ローディング状態を分離して、ボタンが連動しないようにします
  const [isTitleAiLoading, setIsTitleAiLoading] = useState(false);
  const [isTagAiLoading, setIsTagAiLoading] = useState(false);
  
  const [showTagList, setShowTagList] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const ignoreSelectRef = useRef(false);

  const tagContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAllTags();
  }, [fetchAllTags]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tagContainerRef.current &&
        !tagContainerRef.current.contains(event.target as Node)
      ) {
        setShowTagList(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (activeEditor !== "tags") {
      setShowTagList(false);
    }
  }, [activeEditor]);

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

  // AI自動タグ付け機能
  const handleAutoTag = async () => {
    if (!content || isTagAiLoading) return;
    setIsTagAiLoading(true);
    try {
      const res = await fetch("/api/memos/tags/auto", {
        method: "POST",
        body: JSON.stringify({ content }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.suggestedTags) {
        setTags(data.suggestedTags);
        fetchAllTags();
      }
    } catch (err) {
      console.error("AI Auto-tag failed:", err);
    } finally {
      setIsTagAiLoading(false);
    }
  };

  // AI自動タイトル生成機能
  const handleAutoTitle = async () => {
    if (!content || isTitleAiLoading) return;
    setIsTitleAiLoading(true);
    try {
      const res = await fetch("/api/memos/title/auto", {
        method: "POST",
        body: JSON.stringify({ content }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.title) {
        setTitle(data.title);
      }
    } catch (err) {
      console.error("AI Auto-title failed:", err);
    } finally {
      setIsTitleAiLoading(false);
    }
  };

  const toggleTag = (tag: Tag) => {
    const isExists = tags.find((t) => t.id === tag.id);
    if (isExists) {
      setTags(tags.filter((t) => t.id !== tag.id));
    } else {
      setTags([...tags, tag]);
    }
  };

  const removeTag = (tagId: string) => {
    setTags(tags.filter((t) => t.id !== tagId));
  };

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

        <div className="flex items-center gap-2">
          {/* AIタイトル生成ボタン（独立したローディング状態を使用） */}
          <button
            type="button"
            onClick={handleAutoTitle}
            disabled={!content || isTitleAiLoading}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-bold transition-all",
              isTitleAiLoading
                ? "bg-gray-100 text-gray-400 cursor-wait"
                : "bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 hover:border-blue-300",
            )}
          >
            {isTitleAiLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>AI タイトル生成</span>
          </button>

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
      </div>

      <div className="flex flex-wrap items-center gap-2 min-h-8">
        {/* タグ表示...中略... */}
        {tags.length > 0 ? (
          tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-sm rounded-md border border-gray-200 cursor-default group/tag"
            >
              <TagIcon className="w-3 h-3 opacity-70" />
              <span>{tag.name}</span>
              <button
                type="button"
                onClick={() => removeTag(tag.id)}
                className="opacity-0 group-hover/tag:opacity-100 hover:text-red-500 transition-opacity ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))
        ) : (
          <span className="text-sm text-gray-300 italic">タグなし</span>
        )}

        <div className="relative flex items-center" ref={tagContainerRef}>
          <Plus className="absolute left-2 w-3 h-3 text-gray-400 pointer-events-none" />
          <input
            id="memo-tag-input"
            ref={tagInputRef}
            type="text"
            value={showTagList ? "選択中..." : tagInput}
            readOnly
            onClick={() => setShowTagList(true)}
            onFocus={() => {
              setActiveEditor("tags");
              setShowTagList(true);
            }}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (settings.type === "standard") {
                if (e.key === "Escape" || e.key === "Enter") {
                  e.preventDefault();
                  setShowTagList(false);
                  document.querySelector("textarea")?.focus();
                }
              } else {
                handleTagKeyDown(e);
              }
            }}
            onSelect={handleTagSelect}
            placeholder="Select Tag"
            className={cn(
              "pl-6 pr-2 py-0.5 text-sm text-gray-600 placeholder:text-gray-400 border border-transparent rounded-md outline-none w-28 transition-all bg-transparent hover:border-gray-200 hover:bg-gray-100 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-200 cursor-pointer",
              settings.type === "vim" &&
                activeEditor === "tags" &&
                (vimMode === "normal" || vimMode === "visual")
                ? "caret-transparent selection:bg-gray-800 selection:text-white"
                : "",
            )}
          />

          {showTagList && (
            <div className="absolute top-full left-0 mt-1 w-48 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
              <div className="px-3 py-1 text-xs font-bold text-gray-400 border-b border-gray-100">
                データベースのタグ
              </div>
              {allTags.map((tag) => (
                <button
                  type="button"
                  key={tag.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    toggleTag(tag);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors text-left"
                >
                  <span>{tag.name}</span>
                  {tags.find((t) => t.id === tag.id) && (
                    <Check className="w-4 h-4 text-blue-500" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* AI自動タグボタン（独立したローディング状態を使用） */}
        <button
          type="button"
          onClick={handleAutoTag}
          disabled={!content || isTagAiLoading}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all ml-1",
            isTagAiLoading
              ? "bg-gray-100 text-gray-400 cursor-wait"
              : "bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100 hover:border-purple-300",
          )}
          title="AIにタグを提案してもらう"
        >
          {isTagAiLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          <span>AI 自動タグ付け</span>
        </button>
      </div>

      <hr className="border-gray-100 mt-2 w-full" />
    </div>
  );
}