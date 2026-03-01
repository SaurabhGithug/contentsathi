import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { callGemini } from "@/lib/gemini";
import { SYSTEM_PROMPT_BASE, buildRepurposeSourcePrompt } from "@/lib/prompts";

import { YoutubeTranscript } from "youtube-transcript";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sourceType, rawContent, sourceUrl, platforms, languages, primaryLanguage, generateBlog, generateScript } = body;

    let actualContent = rawContent;

    if (!rawContent && !sourceUrl) {
      return NextResponse.json({ error: "Source content or URL is required" }, { status: 400 });
    }

    if (sourceType === "url" && sourceUrl) {
      if (sourceUrl.includes("youtube.com") || sourceUrl.includes("youtu.be")) {
        try {
          const transcript = await YoutubeTranscript.fetchTranscript(sourceUrl);
          actualContent = transcript.map(t => t.text).join(" ");
        } catch (e) {
          console.error("[YT_TRANSCRIPT_ERROR]", e);
          return NextResponse.json({ error: "Could not fetch YouTube transcript. Ensure the video has captions enabled." }, { status: 400 });
        }
      } else {
        actualContent = sourceUrl;
      }
    }

    let brain: any = null;
    try {
      const session = await getServerSession();
      if (session?.user?.email) {
        const { prisma } = await import("@/lib/prisma");
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (user) brain = await prisma.contentBrain.findUnique({ where: { userId: user.id } });
      }
    } catch { /* guest mode */ }

    const ctaList = brain?.ctaList ? JSON.parse(brain.ctaList) : [];

    const userPrompt = buildRepurposeSourcePrompt({
      sourceContent: actualContent,
      platforms: platforms || ["Instagram", "LinkedIn"],
      languages: languages || ["English", "Hinglish"],
      primaryLanguage: primaryLanguage || brain?.primaryLanguage || "English",
      brandName: brain?.brandName || undefined,
      brandVoice: brain?.tone || undefined,
      niche: brain?.niche || undefined,
      ctaList,
      generateBlog: generateBlog ?? false,
      generateScript: generateScript ?? false,
    });

    const result = await callGemini(SYSTEM_PROMPT_BASE, userPrompt, { platforms, languages });

    return NextResponse.json({ posts: result.posts });
  } catch (error) {
    console.error("[GENERATE_FROM_SOURCE_ERROR]", error);
    return NextResponse.json({ error: "Generation failed. Check server logs." }, { status: 500 });
  }
}
