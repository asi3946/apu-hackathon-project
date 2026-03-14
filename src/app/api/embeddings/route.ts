import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GenerateEmbeddingRequest, GenerateEmbeddingResponse } from '@/types/search';

// 環境変数からAPIキーを取得
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

export async function POST(request: Request) {
  try {
    if (!apiKey) {
      console.error("APIキーが設定されていません。");
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // リクエストボディを型付きで取得だぜ
    const body = (await request.json()) as GenerateEmbeddingRequest;

    if (!body.content || body.content.trim() === '') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Gemini APIの初期化とモデルの指定
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" }); // 最新モデルに変更
    const result = await model.embedContent(body.content);
    
    // 💡 魔法の1行：データベースの箱に合わせて先頭の768個だけを切り取る
    const embedding = result.embedding.values.slice(0, 768);

    // 型定義通りのレスポンスを作成
    const response: GenerateEmbeddingResponse = { embedding };

    return NextResponse.json(response);

  } catch (error) {
    console.error('ベクトル化エラー:', error);
    return NextResponse.json({ error: 'Failed to generate embedding' }, { status: 500 });
  }
}