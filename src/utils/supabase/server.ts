import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabaseの環境変数が設定されていません。");
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    // cookiesに関数を渡している.
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // サーバーコンポーネントからCookieをセットしようとした際のエラーをキャッチします。
          // ミドルウェアでセッションを更新するため、ここは安全に無視できます。
        }
      },
    },
  });
}
