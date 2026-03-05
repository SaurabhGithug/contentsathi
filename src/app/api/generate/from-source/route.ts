import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { callGemini } from "@/lib/gemini";
import { SYSTEM_PROMPT_BASE, buildRepurposeSourcePrompt } from "@/lib/prompts";
import { sanitizeText } from "@/lib/sanitize";
import { transcreateWithSarvam, isSarvamSupported } from "@/lib/sarvam";

import { YoutubeTranscript } from "youtube-transcript";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sourceType, rawContent, sourceUrl, platforms, languages, primaryLanguage, generateBlog, generateScript } = body;

    let actualContent = rawContent ? sanitizeText(rawContent, 5000) : undefined;

    if (!actualContent && !sourceUrl) {
      return NextResponse.json({ error: "Source content or URL is required" }, { status: 400 });
    }

    if (sourceType === "url" && sourceUrl) {
      const sanitizedUrl = sanitizeText(sourceUrl, 1000);
      if (sanitizedUrl.includes("youtube.com") || sanitizedUrl.includes("youtu.be")) {
        try {
          const transcript = await YoutubeTranscript.fetchTranscript(sanitizedUrl);
          actualContent = transcript.map(t => t.text).join(" ");
        } catch (e) {
          console.error("[YT_TRANSCRIPT_ERROR]", e);
          return NextResponse.json({ error: "Could not fetch YouTube transcript. Ensure the video has captions enabled." }, { status: 400 });
        }
      } else {
        actualContent = sanitizedUrl;
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
      sourceContent: actualContent ?? "",
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

    // ── Sarvam Transcreation ─────────────────────────────────────────────
    if (result.posts && result.posts.length > 0) {
      await Promise.all(
        result.posts.map(async (post: any) => {
          const targetLang = post.language || primaryLanguage || "English";
          if (isSarvamSupported(targetLang)) {
            try {
              const context = `Repurposed content from ${sourceType}. Brand Voice: ${brain?.tone || "Professional"}. Niche: ${brain?.niche || "Real Estate"}.`;
              const transcreatedBody = await transcreateWithSarvam(post.body, targetLang, context);
              if (transcreatedBody && transcreatedBody !== post.body) {
                post.body = transcreatedBody;
                post.isTranscreated = true;
                post.engine = "sarvam-m";
              }
            } catch (err) {
              console.error("[SARVAM_REPURPOSE_ERROR]", err);
            }
          }
        })
      );
    }

    return NextResponse.json({ posts: result.posts });
  } catch (error) {
    console.error("[GENERATE_FROM_SOURCE_ERROR]", error);
    return NextResponse.json({ error: "Generation failed. Check server logs." }, { status: 500 });
  }
}
