"use client";

import type { Session } from "@supabase/supabase-js";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function AuthSection() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // 1. 初回レンダリング時に現在のセッションを取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // 2. ログイン/ログアウトなどの状態変化を監視してStateを更新
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // クリーンアップ関数
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: "http://localhost:3000",
      },
    });

    if (error) {
      console.error("ログインエラー:", error.message);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("ログアウトエラー:", error.message);
    }
  };

  // セッションがない（未ログイン）場合の表示
  if (!session) {
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

  // セッションがある（ログイン済み）場合の表示
  const user = session.user;
  // GitHubプロバイダの場合、user_metadataにアイコンや名前が自動で入ります
  const avatarUrl = user.user_metadata?.avatar_url;
  const userName =
    user.user_metadata?.preferred_username ||
    user.user_metadata?.full_name ||
    "ユーザー";

  return (
    <div className="flex items-center gap-3">
      {avatarUrl && (
        <Image
          src={avatarUrl}
          alt={userName}
          width={32}
          height={32}
          className="rounded-full border border-gray-200"
        />
      )}
      <span className="text-sm font-medium text-gray-700">{userName}</span>
      <button
        type="button"
        onClick={handleLogout}
        className="px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
      >
        ログアウト
      </button>
    </div>
  );
}
