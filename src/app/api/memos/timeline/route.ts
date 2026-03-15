import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. 自分の全メモのベクトルを取得
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

      // 2. 自分の思考（平均ベクトル）に近いメモを検索
      const { data: matchedMemos, error: rpcError } = await supabase.rpc(
        "match_memos",
        {
          query_embedding: averagedEmbedding,
          match_threshold: 0.1, // ★少し緩めの0.1に設定して、関連しそうなものを拾う
          match_count: 50,
        }
      );

      if (rpcError) throw rpcError;

      // 3. 自分以外 ＆ (公開中 または is_publicが未定義) のメモだけに絞り込む
timeline_memos = (matchedMemos || [])
  .filter((m: any) => {
    const isNotMe = String(m.user_id) !== String(user.id);
    
    // デバッグ用：is_publicがundefined（SQLから返ってきていない）場合も通す
    const isPublic = m.is_public === true || m.is_public === undefined;
    
    // どんなデータが来ているかコンソールで確認
    console.log(`Memo ID: ${m.id}, User: ${m.user_id}, Public: ${m.is_public}`);
    
    return isNotMe && isPublic;
  })
  .slice(0, 30);
    } else {
      // 自分のメモがない場合のフォールバック（他人の最新公開メモ）
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