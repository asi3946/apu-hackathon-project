export type VimMode = "normal" | "insert" | "visual" | "visualLine";
export type CursorPosition = number;

// --- 追記：弾幕の定義 ---
export type DanmakuType = "ai_comment" | "shared_memo";

export type Danmaku = {
  id: string; // 弾幕消去用のID
  text: string; // 流れるテキスト（感想やタイトル）
  top: number; // 表示する高さ（%）
  speed: number; // 流れる速度（秒）
  type: DanmakuType; // 種類
  sourceMemoId?: string; // リンク先のメモID（shared_memo用）
};
