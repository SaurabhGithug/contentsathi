import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text, language } = await req.json();

    if (!text || !language) {
      return NextResponse.json({ error: "Text and language are required" }, { status: 400 });
    }

    let score = 100;
    const issues: string[] = [];
    const suggestions: string[] = [];

    const normalizedLang = language.toLowerCase();

    // Word count basic check
    const words = text.split(/\s+/).length;
    if (words < 10) {
      score -= 10;
      issues.push("Post is very short (under 10 words).");
    }

    // Script character checks for Marathi/Hindi
    if (normalizedLang === "marathi" || normalizedLang === "hindi") {
      // Check if it's mostly written in Latin/Roman script instead of Devanagari
      const latinRegex = /[a-zA-Z]/g;
      const devanagariRegex = /[\u0900-\u097F]/g;
      
      const latinCount = (text.match(latinRegex) || []).length;
      const devanagariCount = (text.match(devanagariRegex) || []).length;

      // If there are more Latin characters than Devanagari in a native language post
      if (latinCount > devanagariCount * 2) {
        score -= 20;
        issues.push(`The ${language} post contains too much English/Roman script.`);
        suggestions.push("Ensure the post uses the correct Devanagari script for authenticity, or switch the language to Hinglish.");
      }
    }

    if (normalizedLang === "hinglish") {
      const devanagariRegex = /[\u0900-\u097F]/g;
      const devanagariCount = (text.match(devanagariRegex) || []).length;
      
      if (devanagariCount > 20) {
        score -= 15;
        issues.push("Hinglish post contains too much Devanagari script.");
        suggestions.push("Hinglish should primarily use the Roman alphabet. Simplify the script.");
      }
    }

    // Emoji check
    // Emoji check using codePoint (avoids ES6 regex flag requirement)
    const emojiCount = (Array.from(text) as string[]).filter((c: string) => {
      const cp = c.codePointAt(0) || 0;
      return cp > 0x1F000;
    }).length;
    if (emojiCount === 0) {
      score -= 5;
      suggestions.push("Consider adding 1-2 emojis to make the post more engaging.");
    } else if (emojiCount > 10) {
      score -= 10;
      issues.push("Too many emojis. It looks unprofessional.");
    }

    return NextResponse.json({
      score: Math.max(0, score),
      issues,
      suggestions,
    });

  } catch (error: any) {
    console.error("[QUALITY_CHECK_ERROR]", error);
    return NextResponse.json({ error: "Failed to run quality check" }, { status: 500 });
  }
}
