import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // こちらの名前に合わせる
);

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

const TAG_NAMES = [
  "React",
  "TypeScript",
  "Next.js",
  "TailwindCSS",
  "Supabase",
  "PostgreSQL",
  "Vector Database",
  "Gemini API",
  "AI",
  "LLM",
  "Jotai",
  "State Management",
  "Frontend",
  "Backend",
  "Vim",
  "Git",
  "GitHub",
  "Web Development",
  "UI Design",
  "UX",
  "API Development",
  "Serverless",
  "Authentication",
  "Fullstack",
  "Node.js",
  "Vercel",
  "Markdown",
  "RAG",
  "Embedding",
  "SQL",
];

async function seedTags() {
  console.log("🚀 タグのベクトル化と登録を開始します...");

  for (const name of TAG_NAMES) {
    try {
      // 1. ベクトル化 (あなたの魔法のロジック)
      const result = await model.embedContent(name);
      const embedding = result.embedding.values.slice(0, 768);

      // 2. DBへ保存
      const { error } = await supabase
        .from("tags")
        .upsert({ name, embedding }, { onConflict: "name" });

      if (error) throw error;
      console.log(`✅ 登録完了: ${name}`);
    } catch (err) {
      console.error(`❌ 失敗: ${name}`, err.message);
    }
  }

  console.log("✨ すべてのタグの登録が完了しました！");
}

seedTags();
