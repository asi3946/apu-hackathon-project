import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("bookmarks")
      .select("memo_id, memos(id, title, content, updated_at, user_id, tags)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    const bookmarks = data.map((b: any) => b.memos).filter(Boolean);
    return NextResponse.json({ bookmarks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { memo_id } = await request.json();
    if (!memo_id) return NextResponse.json({ error: "memo_id required" }, { status: 400 });

    const { data: existing } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", user.id)
      .eq("memo_id", memo_id)
      .single();

    if (existing) {
      await supabase.from("bookmarks").delete().eq("id", existing.id);
      return NextResponse.json({ bookmarked: false });
    } else {
      await supabase.from("bookmarks").insert([{ user_id: user.id, memo_id }]);
      return NextResponse.json({ bookmarked: true });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}