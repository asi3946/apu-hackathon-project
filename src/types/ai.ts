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
