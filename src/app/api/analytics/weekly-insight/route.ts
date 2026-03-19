import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { callGemini } from "@/lib/ai/gemini";

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { useCase } = await req.json().catch(() => ({ useCase: "dashboard" }));

    // ── STEP 1: Fetch last 7 days of Analytics ──────────────────────────────
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const analytics = await prisma.postAnalytics.findMany({
      where: {
        publishLog: {
          userId: user.id
        },
        createdAt: { gte: sevenDaysAgo }
      },
      include: {
        publishLog: {
          include: { calendarItem: true }
        }
      }
    });

    if (!analytics || analytics.length === 0) {
      return NextResponse.json({
        success: true,
        insight: "Not enough data from the last 7 days yet. Keep publishing to see your AI insights grow!"
      });
    }

    // ── STEP 2: Aggregate formatting for Gemini ───────────────────────────────
    let performanceSummary = "Last 7 Days Social Performance:\n";
    analytics.forEach((a) => {
      const typeStr = a.publishLog?.calendarItem?.notes || "Post";
      const er = ((a.likes + a.comments + a.shares) / (a.reach || 1) * 100).toFixed(2);
      performanceSummary += `- ${a.platform} (${typeStr}): ${a.reach} reach, ${a.likes} likes, ${a.comments} comments, ER: ${er}%\n`;
    });

    const prompt = `
You are an expert Social Media Strategist and AI Content Analyst for an Indian Real Estate firm.
Analyze this user's 7-day social performance:

${performanceSummary}

Give a highly concise, punchy response (Under 100 words total):
1. Three things working well
2. Two things to stop doing
3. One new viral content idea to try next week
Format nicely with Emojis. Use Indian English. If the metrics look synthetic/random, just play along conceptually.
`;

    // ── STEP 3: Generate Insight via Gemini ───────────────────────────────────
    const rawAiResponse = await callGemini(prompt, "You are a senior data analyst.");
    
    // Attempt to extract text from generic Gemini schema
    let finalInsight = "Unable to generate insight at this moment.";
    if (typeof rawAiResponse === 'string') {
        finalInsight = rawAiResponse;
    } else {
        // Fallback for json schema
        finalInsight = JSON.stringify(rawAiResponse);
    }

    // ── STEP 4: Store in Database ─────────────────────────────────────────────
    const weeklyInsight = await prisma.weeklyInsight.create({
      data: {
        userId: user.id,
        weekStartDate: sevenDaysAgo,
        insightText: finalInsight
      }
    });

    return NextResponse.json({
      success: true,
      insight: finalInsight,
      insightId: weeklyInsight.id
    });

  } catch (error: any) {
    console.error(`[ANALYTICS_INSIGHT_ERROR]`, error);
    return NextResponse.json(
      { error: "Failed to generate weekly insight: " + error.message },
      { status: 500 }
    );
  }
}
