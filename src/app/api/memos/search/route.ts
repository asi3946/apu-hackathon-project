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

    // 1. 現在のユーザーを取得（自分のメモを弾くために必要）
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 検索元のメモのベクトルを取得
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

    // 3. pgvectorで類似検索
    // ※自分のメモが上位を占めても大丈夫なように、多め（50件）に取得しておきます
    const { data: matchedMemos, error: rpcError } = await supabase.rpc(
      "match_memos",
      {
        query_embedding: sourceMemo.embedding,
        match_threshold: 0.1, // 他人のメモも引っかかりやすいように閾値を下げる
        match_count: 50,
      },
    );

    if (rpcError) throw rpcError;

    // 4. データ整形: 「自分以外のメモ」だけに厳密に絞り込む
    const related_memos = (matchedMemos || [])
      .filter((memo: any) => {
        // ★ ここが一番重要！自分の作成したメモはすべて除外する
        const isNotMe = String(memo.user_id) !== String(user.id); 
        const isNotSource = String(memo.id) !== String(source_memo_id); 
        
        // （他人の非公開メモはSupabaseのRLS機能で元々弾かれているため、
        // ここに残るのは「他人の公開メモ」だけになります）
        return isNotMe && isNotSource;
      })
      .slice(0, limit) // 指定された件数（10件）に絞る
      .map((memo: any) => ({
        id: memo.id,
        title: memo.title,
        content: memo.content,
        similarity: typeof memo.similarity === "number" ? memo.similarity : 0,
        user_id: memo.user_id,
      }));

    // 5. レスポンスを返す
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