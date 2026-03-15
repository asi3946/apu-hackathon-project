import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: recentMemos, error: fetchError } = await supabase
      .from("memos")
      .select("embedding")
      .eq("user_id", user.id)
      .not("embedding", "is", null)
      .order("updated_at", { ascending: false })
      .limit(10);

    if (fetchError) throw fetchError;

    if (!recentMemos || recentMemos.length === 0) {
      const { data: fallbackMemos, error: fallbackError } = await supabase
        .from("memos")
        .select("id, title, content, updated_at, user_id")
        .eq("is_public", true)
        //.neq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(20);

      if (fallbackError) throw fallbackError;
      return NextResponse.json({ timeline_memos: fallbackMemos || [] });
    }

    const firstEmb =
      typeof recentMemos[0].embedding === "string"
        ? JSON.parse(recentMemos[0].embedding)
        : recentMemos[0].embedding;
    const vectorLength = firstEmb.length;
    let averageEmbedding = new Array(vectorLength).fill(0);

    for (const memo of recentMemos) {
      const emb =
        typeof memo.embedding === "string"
          ? JSON.parse(memo.embedding)
          : memo.embedding;
      for (let i = 0; i < vectorLength; i++) {
        averageEmbedding[i] += emb[i];
      }
    }

    const count = recentMemos.length;
    averageEmbedding = averageEmbedding.map((val: number) => val / count);

    const { data: matchedMemos, error: rpcError } = await supabase.rpc(
      "match_memos",
      {
        query_embedding: averageEmbedding,
        match_threshold: 0.6,
        match_count: 30,
      },
    );

    if (rpcError) throw rpcError;

    const timeline_memos = (matchedMemos || [])
      //.filter((memo: any) => memo.user_id !== user.id)
      .slice(0, 20)
      .map((memo: any) => ({
        id: memo.id,
        title: memo.title,
        content: memo.content,
        updated_at: new Date().toISOString(),
        user_id: memo.user_id,
      }));

    return NextResponse.json({ timeline_memos });
  } catch (error: any) {
    console.error("TIMELINE API ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 },
    );
  }
}
