import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { callGemini } from "@/lib/gemini";
import { SYSTEM_PROMPT_BASE } from "@/lib/prompts";
import { authOptions } from "@/lib/auth";
import { sanitizeText } from "@/lib/sanitize";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { originalText: rawText, targetLanguage, platform } = body;

    const originalText = rawText ? sanitizeText(rawText, 5000) : "";

    if (!originalText || !targetLanguage) {
      return NextResponse.json({ error: "originalText and targetLanguage are required" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    let brandVoice = "Professional but warm";
    
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({ 
        where: { email: session.user.email },
        include: { contentBrain: true }
      });
      if (user?.contentBrain?.tone) {
        brandVoice = user.contentBrain.tone;
      }
    }

    const prompt = `
Translate and culturally adapt the following social media post into ${targetLanguage}.
This is for the platform: ${platform || "General"}.

## Original Post
${originalText}

## Guidelines for ${targetLanguage}
- Maintain the brand voice: ${brandVoice}
- Do not just translate literally. Adapt the hook, idioms, and flow so it sounds like it was natively written by a fluent local speaker.
- Keep English terms for technical real-estate words (like "Investment", "ROI", "BHK", "Carpet Area", "Amenities") if a pure translation sounds too formal or bookish.
- For Marathi: Use conversational Nagpur/Pune style. Avoid heavy Sanskrit words.
- For Hindi: Use modern conversational Hindi.
- For Hinglish: Mix English facts with Hindi/Marathi emotions naturally.
- Ensure the formatting (newlines, emojis, bullet points) aligns with the original post.

Return ONLY a valid JSON object exactly matching this schema (no markdown formatting, no code blocks):
{
  "translatedText": "The fully translated and adapted text here"
}
`;

    const result = await callGemini(SYSTEM_PROMPT_BASE, prompt, {
      languages: [targetLanguage],
      platforms: [platform || "instagram"]
    });

    const r = result as any;
    return NextResponse.json({ translatedText: r.translatedText || r.body || r.posts?.[0]?.body });
  } catch (error: any) {
    console.error("[TRANSLATE_ERROR]", error?.message || error);
    return NextResponse.json({ error: error?.message || "Translation failed" }, { status: 500 });
  }
}
