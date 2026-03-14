import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// 環境変数からAPIキーを取得だぜ
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

export async function POST(request: Request) {
  try {
    const { content } = await request.json();

    if (!content || content.trim() === "") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 },
      );
    }

    if (!apiKey) {
      console.error("APIキーが設定されていません。");
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 },
      );
    }

    // 1. あなたの「魔法の1行」と同じロジックでクエリをベクトル化
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const result = await model.embedContent(content);

    // データベースの箱に合わせて先頭の768個だけを切り取る
    const embedding = result.embedding.values.slice(0, 768);

    // 2. Supabaseサーバークライアントの作成
    const supabase = await createClient();

    // 3. SQLで定義したRPC関数（match_memos）を呼び出して類似検索
    const { data: similarMemos, error } = await supabase.rpc("match_memos", {
      query_embedding: embedding,
      match_threshold: 0.3, // 類似度のしきい値（0に近いほど似ている）
      match_count: 5, // 最大取得件数
    });

    if (error) {
      console.error("Supabase RPC Error:", error);
      return NextResponse.json(
        { error: "Failed to search similar memos" },
        { status: 500 },
      );
    }

    // 4. 検索結果をフロントエンドに返す
    return NextResponse.json({ memos: similarMemos });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
