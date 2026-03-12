import { createBrowserClient } from "@supabase/ssr";

// ブラウザのCookieを使うための記述

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabaseの環境変数が設定されていません。");
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
