import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: myMemos } = await supabase
      .from("memos")
      .select("embedding")
      .eq("user_id", user.id)
      .not("embedding", "is", null);

    let timeline_memos = [];

    if (myMemos && myMemos.length > 0) {
      const firstEmb = typeof myMemos[0].embedding === 'string' 
        ? JSON.parse(myMemos[0].embedding) 
        : myMemos[0].embedding;
      
      const vectorLength = firstEmb.length;
      const combinedEmbedding = new Array(vectorLength).fill(0);

      myMemos.forEach(memo => {
        const emb = typeof memo.embedding === 'string' ? JSON.parse(memo.embedding) : memo.embedding;
        if (Array.isArray(emb)) {
          for (let i = 0; i < vectorLength; i++) {
            combinedEmbedding[i] += (emb[i] || 0);
          }
        }
      });

      const averagedEmbedding = combinedEmbedding.map(val => val / myMemos.length);

      const { data: matchedMemos, error: rpcError } = await supabase.rpc(
        "match_memos",
        {
          query_embedding: averagedEmbedding,
          match_threshold: 0.1,
          match_count: 50,
        }
      );

      if (rpcError) throw rpcError;

      // --- タグ情報の補完処理 ---
      const matchedIds = (matchedMemos || []).map((m: any) => m.id);
      const { data: memosWithTags } = await supabase
        .from("memos")
        .select("id, tags")
        .in("id", matchedIds);

      timeline_memos = (matchedMemos || [])
        .filter((m: any) => String(m.user_id) !== String(user.id))
        .map((m: any) => {
          const tagData = memosWithTags?.find(t => t.id === m.id);
          return {
            ...m,
            tags: tagData?.tags || [] // ★ タグを結合
          };
        })
        .slice(0, 30);
    } else {
      const { data: fallbackMemos } = await supabase
        .from("memos")
        .select("*")
        .eq("is_public", true)
        .neq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(30);
      timeline_memos = fallbackMemos || [];
    }

    return NextResponse.json({ timeline_memos });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}