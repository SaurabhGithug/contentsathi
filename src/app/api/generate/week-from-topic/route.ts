import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { callGemini } from "@/lib/ai/gemini";
import { SYSTEM_PROMPT_BASE, buildWeekFromTopicPrompt } from "@/lib/ai/prompts";
import { authOptions } from "@/lib/utils/auth";
import { sanitizeText } from "@/lib/utils/sanitize";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/utils/rate-limiter";
import { transcreateWithSarvam, isSarvamSupported } from "@/lib/ai/sarvam";
import { performQualityCheck } from "@/lib/utils/quality";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.email || req.headers.get("x-forwarded-for") || "anonymous";
    
    // Rate Limit Check
    const limiter = rateLimit(`generate:${userId}`, RATE_LIMITS.generate);
    if (!limiter.success) {
      return NextResponse.json(rateLimitResponse(limiter.retryAfter), { status: 429 });
    }

    const body = await req.json();
    const { topic: rawTopic, niche: rawNiche, audience: rawAudience, platforms, languages, platformLanguages, primaryLanguage, researchContext: rawResearchContext } = body;

    const topic = sanitizeText(rawTopic, 500);
    const niche = rawNiche ? sanitizeText(rawNiche, 200) : undefined;
    const audience = rawAudience ? sanitizeText(rawAudience, 500) : undefined;
    const researchContext = rawResearchContext ? sanitizeText(rawResearchContext, 5000) : undefined;

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    let brain: any = null;
    let dbUserId: string | null = null;
    let transliterateRoman = false;

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({ where: { email: session.user.email } });
      if (user) {
        dbUserId = user.id;
        brain = await prisma.contentBrain.findUnique({ where: { userId: user.id } });
        if (user.platformLangPrefs) {
          transliterateRoman = (user.platformLangPrefs as any).transliterateRoman === true;
        }
      }
    }

    // ── E9: Fetch golden examples to inject into Gemini prompt ──────────────
    let goldenExamples: string[] = [];
    if (dbUserId) {
      const goldens = await prisma.generatedAsset.findMany({
        where: { userId: dbUserId },
        take: 3,
        orderBy: { createdAt: "desc" },
        select: { body: true },
      });
      goldenExamples = goldens.map((g: { body: string }) => g.body);
    }

    const ctaList = brain?.ctaList ? JSON.parse(brain.ctaList) : [];

    const userPrompt = buildWeekFromTopicPrompt({
      topic,
      brandName: brain?.brandName || undefined,
      niche: niche || brain?.niche || "Real Estate",
      audience: audience || brain?.audienceDescription || "First-time buyers and investors in India",
      platforms: platforms || ["Instagram", "LinkedIn", "WhatsApp"],
      languages: languages || ["English", "Hinglish"],
      platformLanguages: platformLanguages || undefined,
      primaryLanguage: primaryLanguage || brain?.primaryLanguage || "English",
      brandVoice: brain?.tone || undefined,
      ctaList: ctaList.length > 0 ? ctaList : undefined,
      contactInfo: brain?.phoneNumber || brain?.email || undefined,
      goldenExamples: goldenExamples.length > 0
        ? goldenExamples.join("\n\n---\n\n")
        : brain?.goldenExamples || undefined,
      researchContext: researchContext || undefined,
      transliterateRoman,
    });

    const result = await callGemini(SYSTEM_PROMPT_BASE, userPrompt, {
      platforms: platforms || ["Instagram", "LinkedIn", "WhatsApp"],
      languages: languages || ["English", "Hinglish"],
    });

    // ── Generate Image Prompts and handle Sarvam Transcreation ─────────────
    if (result.posts && result.posts.length > 0) {
      await Promise.all(
        result.posts.map(async (post: any) => {
          // 1. Image Prompt (Gemini)
          try {
            const apiKey = process.env.GEMINI_API_KEY;
            if (apiKey && apiKey.startsWith("AIza")) {
              const promptInstruction = "Write a Stable Diffusion image prompt for this Indian real estate social post. Under 50 words. Warm colours, professional, Indian context. Return ONLY the prompt text, no quotes or intro.";
              const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    contents: [{ role: "user", parts: [{ text: `${promptInstruction}\n\nPOST TEXT:\n${post.body}` }] }],
                    generationConfig: { temperature: 0.7, maxOutputTokens: 100 },
                  }),
                }
              );
              if (res.ok) {
                const data = await res.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) post.imagePrompt = text.trim();
              }
            }
          } catch (e) {
            console.error("Failed to generate image prompt", e);
          }

          // 2. Sarvam Transcreation (Only if supported regional language is requested)
          const targetLang = post.language || primaryLanguage || "English";
          if (isSarvamSupported(targetLang)) {
            try {
              const context = `Real estate social media post about ${topic}. Audience: ${audience || "Home buyers"}. Niche: ${niche || "Real Estate"}. Brand Voice: ${brain?.tone || "Professional"}.`;
              const transcreatedBody = await transcreateWithSarvam(post.body, targetLang, context);
              if (transcreatedBody && transcreatedBody !== post.body) {
                post.body = transcreatedBody;
                post.isTranscreated = true;
                post.engine = "sarvam-m";
              }
            } catch (sarvamErr) {
              console.error("[SARVAM_PIPELINE_ERROR]", sarvamErr);
            }
          }
        })
      );
    }

    // ── E5: Auto-save each post to GeneratedAsset DB ─────────────────────
    if (dbUserId && result.posts && result.posts.length > 0) {
      await Promise.allSettled(
        result.posts.map(async (post: any) => {
          try {
            let platform = (post.platform || "instagram").toLowerCase() as any;
            if (platform.includes("youtube")) platform = "youtube";
            else if (platform.includes("twitter") || platform === "x") platform = "x";
            else if (platform.includes("linkedin")) platform = "linkedin";
            else if (platform.includes("facebook")) platform = "facebook";
            else if (platform.includes("whatsapp")) platform = "whatsapp";
            else if (platform.includes("website")) platform = "website";
            else platform = "instagram";
            const lang = (post.language || primaryLanguage || "english").toLowerCase() as any;
            
            // ── Run Quality Check ───────────────────────────────────────
            const quality = performQualityCheck(post.body, lang);
            
            const saved = await prisma.generatedAsset.create({
              data: {
                userId: dbUserId!,
                type: "post",
                platform,
                language: lang,
                title: post.title || topic.slice(0, 100),
                body: post.body,
                tags: Array.isArray(post.tags) ? post.tags : [],
                cta: post.cta || null,
                notes: post.notes || null,
                imagePrompt: post.imagePrompt || null,
                qualityScore: quality.score,
                qualityIssues: quality.issues as any,
              },
            });
            // Attach DB id back so client can reference it
            post.assetId = saved.id;
          } catch (saveErr) {
            console.error("[E5_SAVE_ERROR]", saveErr);
          }
        })
      );
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("[GENERATE_WEEK_ERROR]", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Generation failed." },
      { status: 500 }
    );
  }
}
