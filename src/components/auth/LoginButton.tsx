"use client";

import { supabase } from "@/lib/supabase";

export function LoginButton() {
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        // config.tomlのsite_urlに合わせてリダイレクト先を指定します
        redirectTo: "http://127.0.0.1:3000",
      },
    });

    if (error) {
      console.error("ログインエラー:", error.message);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogin}
      className="px-4 py-2 bg-[#24292e] text-white text-sm rounded-md hover:bg-[#2f363d] transition-colors"
    >
      GitHubでログイン
    </button>
  );
}
