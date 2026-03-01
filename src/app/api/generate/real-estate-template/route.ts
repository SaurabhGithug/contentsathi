import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { callGemini } from "@/lib/gemini";
import { SYSTEM_PROMPT_BASE, buildRealEstateTemplatePrompt } from "@/lib/prompts";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { templateId, propertyName, location, startingPrice, usps, platforms, languages, primaryLanguage } = body;

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

    return NextResponse.json(result);
  } catch (error) {
    console.error("[GENERATE_REAL_ESTATE_ERROR]", error);
    return NextResponse.json({ error: "Generation failed. Check server logs." }, { status: 500 });
  }
}
