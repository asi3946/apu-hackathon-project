import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// タグ生成で成功しているキー名を使用
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

export async function POST(request: Request) {
  try {
    const { content } = await request.json();
    
    if (!content) {
      return NextResponse.json({ title: "新しいメモ" });
    }

    if (!apiKey) {
      return NextResponse.json({ error: "API key error" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // モデルは 1.5-flash で統一
    const chatModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // ★トークン節約：タイトル生成には冒頭2000文字あれば十分です
    const truncatedContent = content.slice(0, 2000);

    const prompt = `
      以下のメモ内容を読み取り、内容を的確に表すタイトルを1つ作成してください。
      
      ルール:
      - 15文字以内。
      - タイトルの文字列のみを出力すること（「タイトル：」などは不要）。
      - メモの内容が一目で把握できるようにしてください。技術、作家、などメモの主題を含めるよう心掛けてください。
      - できるだけ文章で生成するようにし、単語の羅列は控えてください。
      
      メモ内容:
      ${truncatedContent}
    `;

    const aiResult = await chatModel.generateContent(prompt);
    const generatedTitle = aiResult.response.text().trim().replace(/^["'「]+|["'」]+$/g, '');

    return NextResponse.json({ title: generatedTitle });

  } catch (error: any) {
    console.error("API ERROR:", error.message);

    // 429 Too Many Requests (制限超過) の検知
    if (error.status === 429 || error.message?.includes("429 Too Many Requests")) {
      // エラー文から "retry in 57.56...s" の数字部分を抽出
      const match = error.message.match(/retry in ([\d.]+)s/);
      // 数字が見つかれば切り上げて秒数にする（見つからなければ安全のためデフォルト60秒）
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