import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import type { Database } from "@/types/supabase";
import { createClient } from "@/utils/supabase/server";

// 型定義が反映されるまでの安全策として any を許容する型指定
type TagTable = Database["public"]["Tables"] extends { tags: any }
  ? Database["public"]["Tables"]["tags"]["Row"]
  : any;

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

export async function POST(request: Request) {
  try {
    const { content } = await request.json();
    if (!content)
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 },
      );
    if (!apiKey)
      return NextResponse.json({ error: "API key error" }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    const embeddingModel = genAI.getGenerativeModel({
      model: "gemini-embedding-001",
    });
    const supabase = await createClient();

    // 1. メモ内容をベクトル化（★ここで計算したデータを後で再利用します）
    const embResult = await embeddingModel.embedContent(content);
    const queryEmbedding = embResult.embedding.values.slice(0, 768);

    // 2. 関連タグ検索 (match_tags RPCを呼ぶ)
    const { data: candidates, error: rpcError } = await supabase.rpc(
      "match_tags",
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.1,
        match_count: 20,
      },
    );

    if (rpcError) {
      console.error("RPC Error (match_tags):", rpcError);
    }

    const candidateNames = (candidates as any[])?.map((t) => t.name) || [];

    // 3. Geminiによる提案（★モデルを 2.5-flash に変更しました）
    const chatModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });
    const prompt = `
      以下のメモ内容に最適なタグを3個以内で提案してください。
      既存タグ候補: [${candidateNames.join(", ")}]
      
      ルール:
      - 既存候補に適切なものがあればそれを優先。
      - なければ新しいタグを生成。
      - カンマ区切りのタグ名のみ出力してください（余計な説明は不要）。
      
      メモ: ${content}
    `;

    const aiResult = await chatModel.generateContent(prompt);
    const aiText = aiResult.response.text();
    const suggestedTagNames = aiText
      .split(",")
      .map((s) => s.trim().replace(/[#.]/g, ""))
      .filter(Boolean);

    // 4. タグの確定（DB照合 ＆ 新規作成）
    const finalTags: any[] = [];

    for (const tagName of suggestedTagNames) {
      const { data: existingTag } = await supabase
        .from("tags")
        .select("*")
        .eq("name", tagName)
        .maybeSingle();

      if (existingTag) {
        finalTags.push(existingTag);
      } else {
        try {
          const tagEmb = await embeddingModel.embedContent(tagName);
          const { data: newTag, error: insErr } = await supabase
            .from("tags")
            .insert({
              name: tagName,
              embedding: tagEmb.embedding.values.slice(0, 768),
            })
            .select()
            .single();

          if (!insErr && newTag) finalTags.push(newTag);
        } catch (e) {
          console.error(`Failed to create new tag: ${tagName}`, e);
        }
      }
    }

    // ★ 変更点: suggestedTags に加えて、計算済みの embedding もフロントに返す！
    return NextResponse.json({ 
      suggestedTags: finalTags,
      embedding: queryEmbedding 
    });

  } catch (error: any) {
    console.error("API ERROR:", error.message);

    if (error.status === 429 || error.message?.includes("429 Too Many Requests")) {
      const match = error.message.match(/retry in ([\d.]+)s/);
      const retryAfter = match ? Math.ceil(parseFloat(match[1])) : 60;
      
      return NextResponse.json(
        { error: "Rate limit exceeded", retryAfter },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}