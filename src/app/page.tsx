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
      {/* timelineの時もExploreViewerを使い回す */}
      {currentView === "timeline" && <ExploreViewer />}
      {currentView === "explore" && <ExploreViewer />}
      {currentView === "editor" && <EditorRoot />}
    </main>
  );
}
