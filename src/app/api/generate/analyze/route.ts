import { NextResponse } from "next/server";
import { analyzeContent } from "@/lib/utils/quality-checker";
import { sanitizeText } from "@/lib/utils/sanitize";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const content = body.content ? sanitizeText(body.content, 5000) : undefined;
    const platform = body.platform;
    const targetTone = body.targetTone ? sanitizeText(body.targetTone, 100) : undefined;


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
