import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const { memo_id, tag_ids } = await request.json() as { 
      memo_id: string; 
      tag_ids: string[] 
    };

    if (!memo_id) {
      return NextResponse.json({ error: "memo_id is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. 古い紐付けを一旦リセット（タグの更新・削除に対応するため）
    const { error: deleteError } = await supabase
      .from("memo_tags")
      .delete()
      .eq("memo_id", memo_id);

    if (deleteError) throw deleteError;

    // 2. 新しいタグが指定されている場合のみ、紐付けデータを作成して一括保存
    if (tag_ids && tag_ids.length > 0) {
      const insertData = tag_ids.map((tag_id) => ({
        memo_id: memo_id,
        tag_id: tag_id,
      }));

      const { error: insertError } = await supabase
        .from("memo_tags")
        .insert(insertData);

      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("SYNC TAGS API ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}