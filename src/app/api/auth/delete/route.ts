import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function DELETE() {
  try {
    // 1. セッションから現在のログインユーザーを確認
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 特権（Service Role Key）を持ったAdminクライアントを初期化
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 3. 外部キー制約エラーを防ぐため、ユーザーに関連するデータを先に削除する
    // ※ 順番は問わないが、ユーザーIDに紐づくものをすべて消す
    await supabaseAdmin.from("bookmarks").delete().eq("user_id", user.id);
    await supabaseAdmin.from("memos").delete().eq("user_id", user.id);
    await supabaseAdmin.from("user_settings").delete().eq("id", user.id);

    // 4. auth.users からアカウント本体を削除
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}