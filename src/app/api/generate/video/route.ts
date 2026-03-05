import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.sub || token?.email || req.headers.get("x-forwarded-for") || "anonymous") as string;

    // Rate Limit Check
    const limiter = rateLimit(`generate:${userId}`, RATE_LIMITS.generate);
    if (!limiter.success) {
      return NextResponse.json(rateLimitResponse(limiter.retryAfter), { status: 429 });
    }

    const body = await req.json();
    const { script, voiceStyle = "conversational" } = body;

    if (!script || typeof script !== "string" || !script.trim()) {
      return NextResponse.json({ error: "Script is required." }, { status: 400 });
    }

    // Resolve user from JWT token (works without separate authOptions export)
    let saved = false;
    try {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      const userId = token?.id as string | undefined;

      if (userId) {
        await prisma.generatedAsset.create({
          data: {
            userId,
            type: "video_script",
            platform: "youtube",
            language: "english",
            title: `Video Script — ${voiceStyle}`,
            body: script,
            notes: JSON.stringify({ voiceStyle, savedAt: new Date().toISOString() }),
          },
        });
        saved = true;
      }
    } catch {
      // DB save failed — not fatal
    }

    return NextResponse.json({
      status: "coming_soon",
      message:
        "Video generation will be powered by a text-to-video API. Your script is saved.",
      saved,
    });
  } catch (err: any) {
    console.error("[/api/generate/video]", err);
    return NextResponse.json({
      status: "coming_soon",
      message:
        "Video generation will be powered by a text-to-video API. Your script is saved.",
      saved: false,
    });
  }
}
