import { NextResponse } from "next/server";
import { generateDanmaku } from "@/lib/ai";

export async function POST(req: Request) {
    try { 
        const { text } = await req.json();
        // 認証チェックなどをここに書く

        // libの関数に丸投げ
        const comments = await generateDanmaku(text);

        return NextResponse.json({ comments });
    } catch (error) {
        return NextResponse.json({ error: "Failed" }, { status: 500});
    }
}