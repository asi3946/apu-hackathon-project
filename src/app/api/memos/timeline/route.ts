import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 自分以外の公開メモを確実に取得
    const { data: timelineMemos, error } = await supabase
      .from("memos")
      .select("id, title, content, updated_at, user_id, is_public")
      .eq("is_public", true)
      .neq("user_id", user.id) // DBレベルで自分を弾く
      .order("updated_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Timeline DB Error:", error.message);
      throw error;
    }

    return NextResponse.json({ timeline_memos: timelineMemos || [] });
  } catch (error: any) {
    console.error("TIMELINE API ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}