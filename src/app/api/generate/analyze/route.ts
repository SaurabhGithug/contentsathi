import { NextResponse } from "next/server";
import { analyzeContent } from "@/lib/quality-checker";

export async function POST(req: Request) {
  try {
    const { content, platform, targetTone } = await req.json();

    if (!content || !platform) {
      return NextResponse.json({ error: "Content and platform are required" }, { status: 400 });
    }

    const result = analyzeContent(content, platform, targetTone);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[ANALYZE_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
