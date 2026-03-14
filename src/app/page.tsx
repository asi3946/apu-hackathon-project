"use client";

import { useAtomValue } from "jotai";
import { EditorRoot } from "@/components/editor/EditorRoot";
import { ExploreViewer } from "@/components/explore/ExploreViewer";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { isExploreModeAtom } from "@/store/models";

export default function Home() {
  const isExploreMode = useAtomValue(isExploreModeAtom);

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-white">
      <AppSidebar />
      {isExploreMode ? <ExploreViewer /> : <EditorRoot />}
    </main>
  );
}
