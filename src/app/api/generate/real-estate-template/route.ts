import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { callGemini } from "@/lib/gemini";
import { SYSTEM_PROMPT_BASE, buildRealEstateTemplatePrompt } from "@/lib/prompts";
import { sanitizeText } from "@/lib/sanitize";
import { transcreateWithSarvam, isSarvamSupported } from "@/lib/sarvam";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { templateId, platforms, languages, primaryLanguage } = body;

    const propertyName = body.propertyName ? sanitizeText(body.propertyName, 200) : undefined;
    const location = body.location ? sanitizeText(body.location, 200) : undefined;
    const startingPrice = body.startingPrice ? sanitizeText(body.startingPrice, 100) : undefined;
    
    // Sanitize USPs whether it's an array or string
    let usps = body.usps;
    if (Array.isArray(usps)) {
      usps = usps.map(u => sanitizeText(u, 200)).filter(Boolean).join(", ");
    } else if (typeof usps === "string") {
      usps = sanitizeText(usps, 1000) || "";
    } else {
      usps = "";
    }

    if (!templateId || !propertyName) {
      return NextResponse.json({ error: "Template category and project name are required" }, { status: 400 });
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

    const userPrompt = buildRealEstateTemplatePrompt({
      templateCategory: templateId,
      projectName: propertyName,
      location: location || "",
      startingPrice: startingPrice || "",
      usps: Array.isArray(usps) ? usps.join(", ") : usps || "",
      platforms: platforms || ["Instagram", "WhatsApp", "LinkedIn"],
      languages: languages || ["English", "Hinglish"],
      primaryLanguage: primaryLanguage || brain?.primaryLanguage || "English",
      brandName: brain?.brandName || undefined,
      brandVoice: brain?.tone || undefined,
      ctaList,
      contactInfo: [brain?.phoneNumber, brain?.websiteUrl].filter(Boolean).join(" | "),
    });

    const result = await callGemini(SYSTEM_PROMPT_BASE, userPrompt, { platforms, languages });

    // ── Sarvam Transcreation ─────────────────────────────────────────────
    if (result.posts && result.posts.length > 0) {
      await Promise.all(
        result.posts.map(async (post: any) => {
          const targetLang = post.language || primaryLanguage || "English";
          if (isSarvamSupported(targetLang)) {
            try {
              const context = `Real estate template: ${templateId}. Project: ${propertyName}. Location: ${location}. Brand Voice: ${brain?.tone || "Professional"}.`;
              const transcreatedBody = await transcreateWithSarvam(post.body, targetLang, context);
              if (transcreatedBody && transcreatedBody !== post.body) {
                post.body = transcreatedBody;
                post.isTranscreated = true;
                post.engine = "sarvam-m";
              }
            } catch (err) {
              console.error("[SARVAM_TEMPLATE_ERROR]", err);
            }
          }
        })
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[GENERATE_REAL_ESTATE_ERROR]", error);
    return NextResponse.json({ error: "Generation failed. Check server logs." }, { status: 500 });
  }
}
