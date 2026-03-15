"use client";

import { useAtomValue } from "jotai";
import { EditorRoot } from "@/components/editor/EditorRoot";
import { ExploreViewer } from "@/components/explore/ExploreViewer";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { currentViewAtom } from "@/store/models";

export default function Home() {
  const currentView = useAtomValue(currentViewAtom);

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-white">
      <AppSidebar />
      {/* ★ ここに bookmarks の時の表示条件を追加しました！ */}
      {(currentView === "timeline" || currentView === "explore" || currentView === "bookmarks") && <ExploreViewer />}
      {currentView === "editor" && <EditorRoot />}
    </main>
  );
}