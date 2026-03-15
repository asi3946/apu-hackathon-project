"use client";

import type { Session } from "@supabase/supabase-js";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client"; // 新しいクライアントをインポート

export function AuthSection() {
  const supabase = createClient(); // コンポーネント内でクライアントを初期化
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  // メールアドレス認証用のState
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      // ★ 追加：ログイン済みならトップページへ移動
      if (session) {
        router.push("/");
        router.refresh();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // ★ 追加：ログイン状態が変化したときもトップページへ移動
      if (session) {
        router.push("/");
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, router]); // ← ★ routerを依存配列に追加

  // GitHubログイン処理
  const handleGithubLogin = async () => {
    setErrorMsg("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        // ★ 確認：クォーテーションなしの変数になっているので完璧です！
        redirectTo: window.location.origin,
      },
    });
    if (error) setErrorMsg(error.message);
  };

  // メールアドレスで新規登録 or ログイン処理
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setErrorMsg(error.message);
      } else {
        router.push("/");
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setErrorMsg("ログインに失敗しました。認証情報を確認してください。");
      } else {
        router.push("/");
        router.refresh();
      }
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("ログアウトエラー:", error.message);
  };

  // --- ログイン済み（セッションあり）の表示 ---
  if (session) {
    const user = session.user;
    const avatarUrl = user.user_metadata?.avatar_url;
    const userName =
      user.user_metadata?.preferred_username ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
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

  // --- 未ログイン（セッションなし）の表示 ---
  return (
    <div className="flex flex-col gap-4 p-4 border border-gray-200 rounded-md bg-white w-full max-w-sm">
      <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          // ★ text-gray-900 と placeholder:text-gray-400 を追加
          className="px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-md outline-none focus:border-blue-500"
        />
        <input
          type="password"
          placeholder="パスワード (6文字以上)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          // ★ text-gray-900 と placeholder:text-gray-400 を追加
          className="px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-md outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
        >
          {isSignUp ? "新規登録" : "ログイン"}
        </button>
      </form>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-xs text-blue-600 hover:underline"
        >
          {isSignUp
            ? "すでにアカウントをお持ちの方はこちら"
            : "アカウントをお持ちでない方はこちら"}
        </button>
      </div>

      {errorMsg && (
        <p className="text-xs text-red-600 text-center">{errorMsg}</p>
      )}

      <hr className="border-gray-200" />

      <button
        onClick={handleGithubLogin}
        type="button"
        className="px-4 py-2 bg-[#24292e] text-white text-sm rounded-md hover:bg-[#2f363d] transition-colors"
      >
        GitHubでログイン
      </button>
    </div>
  );
}