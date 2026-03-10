"use client";

import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export function SidebarAuth() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 初回マウント時にセッションを確認
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    // ログイン状態の変化を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // 読み込み中は何も表示しない（チラつき防止）
  if (loading) return <div className="h-10"></div>;

  // --- ログイン済みの表示 ---
  if (user) {
    const avatarUrl = user.user_metadata?.avatar_url;
    const userName =
      user.user_metadata?.preferred_username ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "ユーザー";

    return (
      <div className="flex items-center justify-between p-3 mt-auto">
        <div className="flex items-center gap-2 overflow-hidden">
          {avatarUrl && (
            <Image
              src={avatarUrl}
              alt={userName}
              width={24}
              height={24}
              className="rounded-full shrink-0"
            />
          )}
          <span className="text-sm font-medium text-gray-700 truncate">
            {userName}
          </span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="ml-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200 transition-all shrink-0"
        >
          ログアウト
        </button>
      </div>
    );
  }

  // --- 未ログインの表示 ---
  return (
    <div className="p-3 mt-auto">
      <Link
        href="/login"
        className="block w-full text-center px-3 py-2 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
      >
        ログイン / 登録
      </Link>
    </div>
  );
}
