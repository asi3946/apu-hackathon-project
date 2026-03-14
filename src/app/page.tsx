"use client"; // Jotaiを使うために追加

import { useAtomValue } from "jotai";
import { EditorRoot } from "@/components/editor/EditorRoot";
import { ExplorePanel } from "@/components/explore/ExplorePanel"; // 作成したコンポーネントをインポート
import { AppSidebar } from "@/components/layout/AppSidebar";
import { isExploreModeAtom } from "@/store/models"; // 作成したAtomをインポート

export default function Home() {
  // 交流モードがONかOFFかを取得
  const isExploreMode = useAtomValue(isExploreModeAtom);

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-white">
      {/* 左サイドバー */}
      <AppSidebar />

      {/* メインエリア（ここで状態に応じて表示を切り替える） */}
      {isExploreMode ? <ExplorePanel /> : <EditorRoot />}
    </main>
  );
}
