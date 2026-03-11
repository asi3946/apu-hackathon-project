import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * 渡されたテキストから弾幕コメントを生成するコアロジック
 */
export async function generateDanmaku(text: string): Promise<string[]> {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt =  `
    あなたはニコニコ動画の熱狂的な視聴者です。
    以下のメモの内容を読んで、動画の弾幕として流れるような短くて感情的なコメント（ツッコミ、感嘆、草、共感など）を5つ生成してください。
    必ず、文字列の配列形式（JSON）のみを出力してください。

    出力例: ["ｗｗｗｗ", "Vimは草", "天才かよ", "それな", "うぽつ"]

    メモの内容: ${text}`;
  
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}



// --- 1. RAG検索 (Search) ---

export interface AISearchRequest {
  query: string; // ユーザーの質問
  limit?: number; // (任意) 取得する関連メモの最大数。デフォルトは5とか
}

export interface AISearchResponse {
  answer: string; // AIが生成した回答
  references: {
    // 回答の根拠となったメモの情報（リンク用）
    id: string;
    title: string;
    similarity: number; // 類似度スコア (0.0 ~ 1.0)
  }[];
}

// --- 2. 自動タグ付け (Auto Tagging) ---

export interface AIAutoTagRequest {
  content: string; // メモの本文
  existing_tags?: string[]; // (任意) すでに存在するタグのリスト（表記ゆれ防止用）
}

export interface AIAutoTagResponse {
  suggested_tags: string[]; // 提案されたタグの配列（例: ["React", "Vim", "Frontend"]）
}

// --- 3. 自動タイトル生成 (Auto Title) ---

export interface AIGenerateTitleRequest {
  content: string; // メモの本文
}

export interface AIGenerateTitleResponse {
  suggested_title: string; // 生成されたタイトル（例: "Vimの基本操作まとめ"）
}

