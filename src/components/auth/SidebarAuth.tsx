"use client";

import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export function SidebarAuth() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ▼ メニュー開閉用のStateとRefを追加
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // ▼ 外側クリックでメニューを閉じる処理を追加
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // ★ 修正：強制的にログイン画面へ！
    window.location.href = "/login";
  };

  // ▼ アカウント削除処理を追加（バックエンドのAPIを叩く）
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "本当にアカウントを削除しますか？\nこれまでに作成したすべてのメモやデータが完全に削除され、復元することはできません。",
    );
    if (!confirmed) return;

    try {
      const res = await fetch("/api/auth/delete", { method: "DELETE" });

      if (res.ok) {
        // 成功したらフロント側でもログアウト状態にしてログイン画面へ
        await supabase.auth.signOut();
        // ★ 修正：強制的にログイン画面へ！
        window.location.href = "/login";
      } else {
        const errorData = await res.json();
        alert(
          `アカウントの削除に失敗しました: ${errorData.message || errorData.error}`,
        );
      }
    } catch (error) {
      console.error("削除エラー:", error);
      alert("通信エラーが発生しました。");
    }
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
      <div className="p-3 mt-auto relative" ref={menuRef}>
        {/* ▼ ユーザー名をボタン化 */}
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center justify-between w-full hover:bg-gray-200 p-2 rounded-md transition-colors outline-none focus:ring-2 focus:ring-blue-300"
        >
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
        </button>

        {/* ▼ ドロップダウンメニュー */}
        {isMenuOpen && (
          <div className="absolute top-full left-3 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden z-50">
            <button
              type="button"
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors outline-none focus:bg-gray-100"
            >
              ログアウト
            </button>
            <button
              type="button"
              onClick={handleDeleteAccount}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100 outline-none focus:bg-red-50"
            >
              アカウントを削除
            </button>
          </div>
        )}
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
