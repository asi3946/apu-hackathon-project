"use client";

import { atom } from "jotai";
import type { Memo, Tag } from "@/types/models";
import { createClient } from "@/utils/supabase/client";
import {
  allTagsAtom,
  editorContentAtom,
  editorTagsAtom,
  editorTitleAtom,
  editorEmbeddingCacheAtom,
  tagSearchQueryAtom,
  isTagSearchingAtom,
  editorSettingsAtom,
  editorIsPublicAtom,
} from "./editorAtom";

export interface SearchedMemo extends Memo {
  similarity: number;
}

export const isExploreModeAtom = atom(false);
export const searchedMemosAtom = atom<SearchedMemo[]>([]);
export const selectedSearchedMemoAtom = atom<SearchedMemo | null>(null);

const supabase = createClient();

export const memoListAtom = atom<Memo[]>([]);
export const selectedMemoIdAtom = atom<string | null>(null);

export const currentMemoAtom = atom((get) => {
  const memos = get(memoListAtom);
  const selectedId = get(selectedMemoIdAtom);
  return memos.find((m) => m.id === selectedId) || null;
});

export const fetchAllTagsAtom = atom(null, async (get, set) => {
  const { data, error } = await supabase.from("tags").select("id, name").order("name");
  if (!error && data) set(allTagsAtom, data);
});

export const searchTagsSemanticAtom = atom(null, async (get, set) => {
  const query = get(tagSearchQueryAtom);
  if (!query.trim()) {
    set(isTagSearchingAtom, false);
    const { data } = await supabase.from("tags").select("id, name").order("name");
    if (data) set(allTagsAtom, data);
    return;
  }
  set(isTagSearchingAtom, true);
  try {
    const res = await fetch("/api/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: query }),
    });
    const { embedding } = await res.json();
    const { data, error } = await supabase.rpc("match_tags", {
      query_embedding: embedding,
      match_threshold: 0.1,
      match_count: 50,
    });
    if (data) set(allTagsAtom, data as Tag[]);
  } catch (err) { console.error(err); } finally { set(isTagSearchingAtom, false); }
});

export const fetchMemosAtom = atom(null, async (get, set) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data } = await supabase.from("memos").select("*").eq("user_id", user.id).order("updated_at", { ascending: false });
  if (data) set(memoListAtom, data as Memo[]);
});

export const saveMemoAtom = atom(null, async (get, set) => {
  const id = get(selectedMemoIdAtom);
  const title = get(editorTitleAtom);
  const content = get(editorContentAtom);
  const tags = get(editorTagsAtom);
  const isPublic = get(editorIsPublicAtom);
  const cache = get(editorEmbeddingCacheAtom);
  if (!id) return;
  try {
    let currentEmbedding = (cache && cache.text === content) ? cache.embedding : null;
    if (!currentEmbedding) {
      const res = await fetch("/api/embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: `${title}\n${content}` }),
      });
      const data = await res.json();
      currentEmbedding = data.embedding;
    }
    const tagNames = tags.map((t: Tag) => t.name);
    await supabase.from("memos").update({
      title, content, tags: tagNames, is_public: isPublic, updated_at: new Date().toISOString(), embedding: currentEmbedding,
    }).eq("id", id);
    set(memoListAtom, (prev) => prev.map((memo) => memo.id === id ? { ...memo, title, content, tags: tagNames, is_public: isPublic } : memo));
  } catch (err) { console.error(err); }
});

export const createMemoAtom = atom(null, async (get, set) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const settings = get(editorSettingsAtom);
  const { data } = await supabase.from("memos").insert([{ user_id: user.id, title: "", content: "", tags: [], is_public: settings.defaultIsPublic }]).select().single();
  if (data) {
    set(memoListAtom, [data as Memo, ...get(memoListAtom)]);
    set(selectedMemoIdAtom, data.id);
  }
});

export const deleteMemoAtom = atom(null, async (get, set, memoId: string) => {
  await supabase.from("memos").delete().eq("id", memoId);
  set(memoListAtom, get(memoListAtom).filter((m) => m.id !== memoId));
});

// ★ Pick に tags を追加
export type TimelineMemo = Pick<Memo, "id" | "title" | "content" | "updated_at" | "user_id" | "tags">;
export const timelineMemosAtom = atom<TimelineMemo[]>([]);

export const fetchTimelineMemosAtom = atom(null, async (get, set) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  try {
    const response = await fetch("/api/memos/timeline");
    if (response.ok) {
      const data = await response.json();
      if (data.timeline_memos) {
        set(timelineMemosAtom, data.timeline_memos.filter((m: any) => String(m.user_id) !== String(user.id)));
      }
    }
  } catch (error) { console.error(error); }
});

export const isSearchingAtom = atom(false);
export const fetchRelatedMemosAtom = atom(null, async (get, set) => {
  const selectedId = get(selectedMemoIdAtom);
  if (!selectedId) return;
  set(isSearchingAtom, true);
  try {
    await set(saveMemoAtom);
    const res = await fetch("/api/memos/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source_memo_id: selectedId, limit: 10 }),
    });
    if (res.ok) {
      const data = await res.json();
      set(searchedMemosAtom, data.related_memos || []);
    }
  } catch (error) { console.error(error); } finally { set(isSearchingAtom, false); }
});