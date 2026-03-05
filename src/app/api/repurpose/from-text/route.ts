import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { callGemini } from "@/lib/gemini";
import { SYSTEM_PROMPT_BASE, buildRepurposeDetailedPrompt } from "@/lib/prompts";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { sanitizeText } from "@/lib/sanitize";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { rawText: rawInput, researchContext: rawCtx } = body;

    const rawText = rawInput ? sanitizeText(rawInput, 5000) : undefined;
    const researchContext = rawCtx ? sanitizeText(rawCtx, 5000) : undefined;

    if (!rawText && !researchContext) {
      return NextResponse.json({ error: "Source text or research context is required" }, { status: 400 });
    }

    let brain: any = null;
    let userId: string | null = null;
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({ where: { email: session.user.email } });
      if (user) {
        userId = user.id;
        brain = await prisma.contentBrain.findUnique({ where: { userId: user.id } });
      }
    }

    const ctaList = brain?.ctaList ? JSON.parse(brain.ctaList) : [];

    const userPrompt = buildRepurposeDetailedPrompt({
      sourceContent: rawText ?? researchContext ?? "",
      brandName: brain?.brandName || undefined,
      brandVoice: brain?.tone || undefined,
      niche: brain?.niche || undefined,
      ctaList,
      contactInfo: brain?.phoneNumber || brain?.email || undefined,
    });

    const result = await callGemini(SYSTEM_PROMPT_BASE, userPrompt);

    // ── Generate Image Prompts for each post ──────────────────────────────
    if (result.posts && result.posts.length > 0) {
      await Promise.all(
        result.posts.map(async (post: any) => {
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
            console.error("Failed to generate image prompt for post", e);
          }
        })
      );
    }

    // ── E6: Auto-save repurposed posts to GeneratedAsset DB ──────────────
    if (userId && result.posts && result.posts.length > 0) {
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
            const lang = (post.language || brain?.primaryLanguage || "english").toLowerCase() as any;
            const saved = await prisma.generatedAsset.create({
              data: {
                userId: userId!,
                type: "post",
                platform,
                language: lang,
                title: post.title || "Repurposed Post",
                body: post.body,
                tags: Array.isArray(post.tags) ? post.tags : [],
                cta: post.cta || null,
                notes: post.notes || null,
                imagePrompt: post.imagePrompt || null,
                qualityScore: post.qualityScore || null,
              },
            });
            post.assetId = saved.id;
          } catch (saveErr) {
            console.error("[E6_REPURPOSE_SAVE_ERROR]", saveErr);
          }
        })
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[REPURPOSE_TEXT_ERROR]", error);
    return NextResponse.json({ error: "Repurposing failed: " + error.message }, { status: 500 });
  }
}
