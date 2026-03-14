// 自動タイトル生成
export interface GenerateTitleRequest {
  content: string;
}

export interface GenerateTitleResponse {
  title: string;
}

// 自動タグ生成
export interface GenerateTagsRequest {
  content: string;
  existing_tags?: string[];
}

export interface GenerateTagsResponse {
  tags: string[];
}

export async function suggestTags(
  memoContent: string,
  candidateTags: string[],
) {
  // Geminiに「候補の中から選ぶか、新しく作れ」と指示するプロンプト
  const prompt = `
    以下のメモ内容に最適なタグを3個以内で出力してください。
    既存のタグ候補: [${candidateTags.join(", ")}]
    
    ルール:
    1. 既存のタグに適切なものがあればそれを優先してください。
    2. 既存のタグにない場合のみ、新しいタグを生成してください。
    3. 出力はタグ名のみをカンマ区切りで返してください。
    
    メモ内容:
    ${memoContent}
  `;
  // ... Gemini APIを叩く処理
}
