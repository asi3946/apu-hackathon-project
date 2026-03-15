import { NextResponse } from "next/server";
import type {
  CrossUserSearchRequest,
  CrossUserSearchResponse,
} from "@/types/search";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CrossUserSearchRequest;
    const { source_memo_id, limit = 10 } = body; 

    if (!source_memo_id) {
      return NextResponse.json(
        { error: "source_memo_id is required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: sourceMemo, error: fetchError } = await supabase
      .from("memos")
      .select("embedding")
      .eq("id", source_memo_id)
      .single();

    if (fetchError || !sourceMemo?.embedding) {
      return NextResponse.json(
        { error: "Source memo not found or has no embedding" },
        { status: 404 },
      );
    }

    const { data: matchedMemos, error: rpcError } = await supabase.rpc(
      "match_memos",
      {
        query_embedding: sourceMemo.embedding,
        match_threshold: 0.1,
        match_count: 50,
      },
    );

    if (rpcError) throw rpcError;

    // --- タグ情報の補完処理 ---
    const matchedIds = (matchedMemos || []).map((m: any) => m.id);
    const { data: memosWithTags } = await supabase
      .from("memos")
      .select("id, tags")
      .in("id", matchedIds);

    const related_memos = (matchedMemos || [])
      .filter((memo: any) => {
        const isNotMe = String(memo.user_id) !== String(user.id); 
        const isNotSource = String(memo.id) !== String(source_memo_id); 
        return isNotMe && isNotSource;
      })
      .slice(0, limit)
      .map((memo: any) => {
        const tagData = memosWithTags?.find(t => t.id === memo.id);
        return {
          id: memo.id,
          title: memo.title,
          content: memo.content,
          similarity: typeof memo.similarity === "number" ? memo.similarity : 0,
          user_id: memo.user_id,
          tags: tagData?.tags || [], // ★ タグを結合
        };
      });

    const response: CrossUserSearchResponse = { related_memos };
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("SEARCH API ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 },
    );
  }
}