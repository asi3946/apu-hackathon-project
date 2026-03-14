import { NextResponse } from "next/server";
import type {
  CrossUserSearchRequest,
  CrossUserSearchResponse,
} from "@/types/search";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    // 1. 型定義通りにリクエストを受け取る
    const body = (await request.json()) as CrossUserSearchRequest;
    const { source_memo_id, limit = 5 } = body; // limitがない場合はデフォルト5件

    if (!source_memo_id) {
      return NextResponse.json(
        { error: "source_memo_id is required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

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

    // 3. pgvectorで類似検索（自分自身が含まれるので limit + 1 件取得する）
    const { data: matchedMemos, error: rpcError } = await supabase.rpc(
      "match_memos",
      {
        query_embedding: sourceMemo.embedding,
        match_threshold: 0.1, // 閾値
        match_count: limit + 1,
      },
    );

    if (rpcError) throw rpcError;

    // 4. 型定義に合わせてデータを整形する
    const related_memos = (matchedMemos || [])
      .filter((memo: any) => memo.id !== source_memo_id) // 自分自身を除外
      .slice(0, limit) // 指定された件数に絞る
      .map((memo: any) => ({
        id: memo.id,
        title: memo.title,
        content: memo.content,
        // SQL側で計算した similarity が無ければ 0 を入れる安全対策
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
