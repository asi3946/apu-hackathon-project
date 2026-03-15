"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  Check, Globe, Hourglass, Loader2, Lock, Plus, Save, Search, Sparkles, Tag as TagIcon, X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useVimKeyHandler } from "@/hooks/useVimKeyHandler";
import { cn } from "@/lib/utils";
import {
  activeEditorAtom, allTagsAtom, editorContentAtom, editorEmbeddingCacheAtom,
  editorIsPublicAtom, editorTagInputAtom, isTagSearchingAtom, tagSearchQueryAtom,
} from "@/store/editorAtom";
import {
  fetchAllTagsAtom, saveMemoAtom, searchTagsSemanticAtom,
} from "@/store/memoAtom";
import {
  editorSettingsAtom, editorTagsAtom, editorTitleAtom, selectedMemoIdAtom,
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

  const [tagSearchQuery, setTagSearchQuery] = useAtom(tagSearchQueryAtom);
  const isTagSearching = useAtomValue(isTagSearchingAtom);
  const searchTags = useSetAtom(searchTagsSemanticAtom);

  const [isPublic, setIsPublic] = useAtom(editorIsPublicAtom);
  const setEmbeddingCache = useSetAtom(editorEmbeddingCacheAtom);

  const selectedId = useAtomValue(selectedMemoIdAtom);
  const saveMemo = useSetAtom(saveMemoAtom);
  const settings = useAtomValue(editorSettingsAtom);
  const vimMode = useAtomValue(modeAtom);
  const cursor = useAtomValue(cursorAtom);
  const visualStart = useAtomValue(visualStartAtom);
  const setCursor = useSetAtom(cursorAtom);

  const [isSaving, setIsSaving] = useState(false);
  const [isTitleAiLoading, setIsTitleAiLoading] = useState(false);
  const [isTagAiLoading, setIsTagAiLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showTagList, setShowTagList] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const ignoreSelectRef = useRef(false);
  const tagContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (activeEditor !== "tags") setShowTagList(false);
  }, [activeEditor]);

  const handleSave = useCallback(async () => {
    if (selectedId && !isSaving) {
      setIsSaving(true);
      await saveMemo();
      setTimeout(() => setIsSaving(false), 500);
    }
  }, [selectedId, isSaving, saveMemo]);

  const togglePublic = async () => {
    const nextPublic = !isPublic;
    setIsPublic(nextPublic);
    setTimeout(() => handleSave(), 50);
  };

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

  const handleAutoTag = async () => {
    if (!content || isTagAiLoading || cooldown > 0) return;
    setIsTagAiLoading(true);
    try {
      const res = await fetch("/api/memos/tags/auto", {
        method: "POST",
        body: JSON.stringify({ content }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.status === 429) {
        const data = await res.json();
        setCooldown(data.retryAfter || 60);
        return;
      }
      const data = await res.json();
      if (data.suggestedTags) {
        setTags(data.suggestedTags);
        fetchAllTags();
        if (data.embedding)
          setEmbeddingCache({ text: content, embedding: data.embedding });
        setTimeout(() => saveRef.current(), 100);
      }
    } catch (err) {
      console.error("AI Auto-tag failed:", err);
    } finally {
      setIsTagAiLoading(false);
    }
  };

  const handleAutoTitle = async () => {
    if (!content || isTitleAiLoading || cooldown > 0) return;
    setIsTitleAiLoading(true);
    try {
      const res = await fetch("/api/memos/title/auto", {
        method: "POST",
        body: JSON.stringify({ content }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.status === 429) {
        const data = await res.json();
        setCooldown(data.retryAfter || 60);
        return;
      }
      const data = await res.json();
      if (data.title) {
        setTitle(data.title);
        setTimeout(() => saveRef.current(), 100);
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

  const removeTag = (tagId: string) =>
    setTags(tags.filter((t) => t.id !== tagId));

  const { handleKeyDown: handleTitleKeyDown } = useVimKeyHandler(
    titleInputRef,
    ignoreSelectRef,
    (direction) => {
      if (direction === "down")
        document.getElementById("memo-tag-input")?.focus();
    },
  );

  const { handleKeyDown: handleTagKeyDown } = useVimKeyHandler(
    tagInputRef,
    ignoreSelectRef,
    (direction) => {
      if (direction === "up")
        document.getElementById("memo-title-input")?.focus();
      else if (direction === "down")
        document.querySelector("textarea")?.focus();
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
      input.setSelectionRange(
        Math.min(visualStart, cursor),
        Math.max(visualStart, cursor) + 1,
      );
    } else if (vimMode === "normal") {
      input.setSelectionRange(
        cursor,
        value.length === 0 ? 0 : Math.min(cursor + 1, value.length),
      );
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
            } else handleTitleKeyDown(e);
          }}
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
          {/* 1. AIタイトルボタン */}
          <button
            type="button"
            onClick={handleAutoTitle}
            disabled={!content || isTitleAiLoading || cooldown > 0}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-bold transition-all whitespace-nowrap shrink-0",
              isTitleAiLoading || cooldown > 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 hover:border-blue-300",
            )}
          >
            {isTitleAiLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : cooldown > 0 ? (
              <Hourglass className="w-4 h-4" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{cooldown > 0 ? `${cooldown}秒` : "AIタイトル"}</span>
          </button>

          {/* 2. 保存ボタン */}
          <button
            type="button"
            onClick={handleSave}
            disabled={!selectedId || isSaving}
            className={cn(
              "p-2 rounded-full transition-all duration-200 shrink-0",
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

          {/* 3. 個別公開ボタン */}
          <button
            type="button"
            onClick={togglePublic}
            disabled={!selectedId}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm whitespace-nowrap shrink-0",
              !selectedId
                ? "opacity-30 cursor-not-allowed"
                : isPublic
                  ? "bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                  : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100",
            )}
          >
            {isPublic ? (
              <>
                <Globe className="w-3.5 h-3.5" /> 公開中
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" /> 未公開
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 min-h-8">
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
              } else handleTagKeyDown(e);
            }}
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
            <div className="absolute top-full left-0 mt-1 w-56 max-h-80 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg z-50 flex flex-col">
              <div className="sticky top-0 bg-white border-b border-gray-100 p-2 z-10">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={tagSearchQuery}
                    onChange={(e) => setTagSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        searchTags();
                      }
                    }}
                    placeholder="意味でタグを検索..."
                    className="w-full pl-8 pr-12 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 shadow-sm"
                  />
                  <Search className="absolute left-2.5 w-3.5 h-3.5 text-gray-400" />
                  <button
                    type="button"
                    onClick={searchTags}
                    disabled={isTagSearching}
                    className="absolute right-1 px-2 py-1 text-[10px] font-bold text-blue-600 hover:bg-blue-100 rounded disabled:text-gray-300"
                  >
                    {isTagSearching ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      "検索"
                    )}
                  </button>
                </div>
              </div>
              <div className="flex-1">
                <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {tagSearchQuery ? "関連度の高いタグ" : "すべてのタグ"}
                </div>
                {allTags.length === 0 ? (
                  <div className="px-3 py-6 text-xs text-center text-gray-400">
                    タグが見つかりません
                  </div>
                ) : (
                  allTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
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
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleAutoTag}
          disabled={!content || isTagAiLoading || cooldown > 0}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all ml-1",
            isTagAiLoading || cooldown > 0
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100 hover:border-purple-300",
          )}
          title="AIにタグを提案してもらう"
        >
          {isTagAiLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : cooldown > 0 ? (
            <Hourglass className="w-3.5 h-3.5" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          <span>{cooldown > 0 ? `${cooldown}秒` : "AI自動タグ"}</span>
        </button>
      </div>

      <hr className="border-gray-100 mt-2 w-full" />
    </div>
  );
}