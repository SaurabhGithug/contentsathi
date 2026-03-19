import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { authOptions } from "@/lib/utils/auth";

// GET /api/content-brain
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const contentBrain = await prisma.contentBrain.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json(contentBrain || null);
  } catch (error) {
    console.error("[CONTENT_BRAIN_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/content-brain (upsert)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const {
      brandName, brandDescription, industry, audienceDescription,
      primaryLanguage, secondaryLanguage, languageMixRules, tone,
      ctas, contactWebsite, contactPhone, contactEmail, goldenExamples
    } = body;

    const contentBrain = await prisma.contentBrain.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        brandName: brandName || "My Brand",
        brandDescription,
        industry,
        audienceDescription,
        primaryLanguage: primaryLanguage || "english",
        secondaryLanguage,
        languageMixRules,
        tone: tone || "Professional but approachable",
        ctas: ctas ? JSON.parse(JSON.stringify(ctas)) : undefined,
        contactWebsite,
        contactPhone,
        contactEmail,
        goldenExamples: goldenExamples || [],
      },
      update: {
        brandName,
        brandDescription,
        industry,
        audienceDescription,
        primaryLanguage,
        secondaryLanguage,
        languageMixRules,
        tone,
        ctas: ctas ? JSON.parse(JSON.stringify(ctas)) : undefined,
        contactWebsite,
        contactPhone,
        contactEmail,
        goldenExamples: goldenExamples || undefined,
      },
    });

    return NextResponse.json(contentBrain);
  } catch (error) {
    console.error("[CONTENT_BRAIN_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
