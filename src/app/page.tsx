import { AppSidebar } from "@/components/layout/AppSidebar";
import { EditorRoot } from "@/components/editor/EditorRoot";

export default function Home() {
  return (
    <main className="flex h-screen w-screen overflow-hidden bg-white">
      {/* 左サイドバー */}
      <AppSidebar />

      {/* メインエリア */}
      <EditorRoot />
    </main>
  );
}
