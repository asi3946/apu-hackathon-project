"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Loader2, Plus, Save, Tag as TagIcon, X } from "lucide-react"; // Loader2を追加
import type React from "react"; // useState, useEffectを追加
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  editorTagsAtom,
  editorTitleAtom,
  memoListAtom,
  saveMemoAtom,
  selectedMemoIdAtom,
} from "@/store/models";

export function EditorHeader() {
  const [title, setTitle] = useAtom(editorTitleAtom);
  const [tags, setTags] = useAtom(editorTagsAtom);
  const selectedId = useAtomValue(selectedMemoIdAtom);
  const memos = useAtomValue(memoListAtom);
  const saveMemo = useSetAtom(saveMemoAtom);

  // 保存中の状態を管理
  const [isSaving, setIsSaving] = useState(false);

  // タグ入力用のステート
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [tagInput, setTagInput] = useState("");
  // input要素を参照するためのref
  const inputRef = useRef<HTMLInputElement>(null);

  // useCallbackによってselectedId, isSaving, saveMemoのいずれかが変わった時だけ、関数の実体を更新する.
  const handleSave = useCallback(async () => {
    if (selectedId && !isSaving) {
      setIsSaving(true);
      await saveMemo();

      setTimeout(() => {
        setIsSaving(false);
      }, 500);
    }
  }, [selectedId, isSaving, saveMemo]);

  // この記述でuseRefはhandleSaveの位置を保持し続ける.
  const saveRef = useRef(handleSave);
  // handleSaveでsaveRefのcurrentを更新する.
  useEffect(() => {
    saveRef.current = handleSave;
  }, [handleSave]);

  // Ctrl+S / Cmd+S で保存するショートカット
  // useRefを使うことでaddEventListenerというカロリーの高いものを一度呼び出すだけでよくなった.
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

  // タグ追加処理
  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput("");
    setIsAddingTag(false);
  };

  // タグ入力中のキーボード操作
  const handleKeyDownTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === "Escape") {
      setTagInput("");
      setIsAddingTag(false);
    }
  };

  useEffect(() => {
    if (isAddingTag && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingTag]);

  // タグ削除処理
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="flex flex-col gap-4 mb-6 px-8 pt-8 max-w-4xl mx-auto w-full group">
      <div className="flex justify-between items-center gap-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="no title"
          className="text-4xl font-bold text-[#1f1f1f] placeholder:text-gray-200 outline-none bg-transparent flex-1"
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

        {isAddingTag ? (
          <input
            ref={inputRef}
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleKeyDownTag}
            onBlur={handleAddTag}
            placeholder="Add tag"
            className="px-2 py-0.5 text-sm border border-blue-300 rounded-md outline-none w-24 bg-white"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsAddingTag(true)}
            className="flex items-center gap-1 px-2 py-0.5 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all border border-transparent hover:border-gray-200"
          >
            <Plus className="w-3 h-3" />
            <span>Add Tag</span>
          </button>
        )}
      </div>

      <hr className="border-gray-100 mt-2 w-full" />
    </div>
  );
}
