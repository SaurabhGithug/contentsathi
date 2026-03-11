/**
 * ════════════════════════════════════════════════════════════════════
 *  GOLDEN LOOP — Winner Detection & Injection Engine
 *  Detects high-engagement posts via z-score math, analyzes their
 *  structure with Sarvam AI, saves them as GoldenExamples, and
 *  injects them into future Copywriter prompts.
 * ════════════════════════════════════════════════════════════════════
 */

import { prisma } from "@/lib/prisma";
import { callSarvamJSON } from "@/lib/sarvam";

// Use (prisma as any) for models that the generated client may not type yet
const db = prisma as any;

// ─── Types ──────────────────────────────────────────────────────────────────

type StructureAnalysis = {
  opening_hook_pattern: string;
  emotional_trigger: string;
  sentence_rhythm: string;
  cta_style: string;
};

type GoldenExampleForInjection = {
  id: string;
  platform: string;
  postText: string;
  engagementScore: number;
  structureAnalysis: StructureAnalysis | null;
  usageCount: number;
};

// ─── PART A: Winner Detection ───────────────────────────────────────────────

/**
 * Scans MarketIntelligence posts from the last 7 days for a given user,
 * applies z-score math to detect outlier winners, analyzes their structure
 * with Sarvam AI, and saves them as GoldenExamples.
 */
export async function detectAndSaveWinners(userId: string): Promise<{
  winnersFound: number;
  totalScanned: number;
  newGoldenExamples: string[];
}> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // 1. Fetch recent scraped posts
  const recentPosts: any[] = await db.marketIntelligence.findMany({
    where: {
      userId,
      scrapedAt: { gte: sevenDaysAgo },
    },
    orderBy: { scrapedAt: "desc" },
  });

  if (recentPosts.length < 3) {
    // Need at least 3 posts for meaningful z-score calculation
    return { winnersFound: 0, totalScanned: recentPosts.length, newGoldenExamples: [] };
  }

  // 2. Calculate engagement scores
  const scoredPosts = recentPosts.map((post: any) => ({
    ...post,
    calculatedScore: (post.likes || 0) + ((post.comments || 0) * 3) + ((post.shares || 0) * 5),
  }));

  // 3. Z-score calculation
  const scores: number[] = scoredPosts.map((p: any) => p.calculatedScore);
  const mean = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
  const variance = scores.reduce((acc: number, s: number) => acc + Math.pow(s - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  // Threshold: mean + 1.5 * stdDev
  const threshold = mean + 1.5 * stdDev;

  // 4. Filter winners (posts above threshold)
  const winners = scoredPosts.filter((p: any) => p.calculatedScore > threshold);

  if (winners.length === 0) {
    return { winnersFound: 0, totalScanned: recentPosts.length, newGoldenExamples: [] };
  }

  // 5. Check for duplicates — don't save a post we've already captured
  const existingGoldens: any[] = await db.goldenExample.findMany({
    where: { userId },
    select: { sourcePostId: true },
  });
  const existingSourceIds = new Set(
    existingGoldens.map((g: any) => g.sourcePostId).filter(Boolean)
  );

  const newWinners = winners.filter((w: any) => !existingSourceIds.has(w.id));
  const savedIds: string[] = [];

  // 6. For each new winner: analyze structure with Sarvam AI, then save
  for (const winner of newWinners) {
    let structureAnalysis: string | null = null;

    try {
      const analysisResult = await callSarvamJSON(
        `You are a content structure analyst for high-performing social media posts.
Analyze this high-performing post's structure. Extract:
1. Opening hook pattern (e.g., "Question hook", "Stat hook", "Bold claim", "Story opener")
2. Emotional trigger used (e.g., "Fear of missing out", "Aspiration", "Trust/credibility", "Social proof")
3. Sentence rhythm (e.g., "Short-Short-Long", "Gradually increasing", "Punchy throughout")
4. Call-to-action style (e.g., "Direct command", "Soft ask", "Urgency-driven", "Social CTA")

Return as JSON only with these exact keys:
{
  "opening_hook_pattern": "string",
  "emotional_trigger": "string", 
  "sentence_rhythm": "string",
  "cta_style": "string"
}`,
        `Analyze this post:\n\n${winner.content.substring(0, 1500)}`,
        500
      );

      structureAnalysis = JSON.stringify(analysisResult);
    } catch (err) {
      console.warn(`[GoldenLoop] Sarvam analysis failed for post ${winner.id}:`, err);
      // Save without analysis — we can retry later
      structureAnalysis = JSON.stringify({
        opening_hook_pattern: "Unknown — analysis pending",
        emotional_trigger: "Unknown — analysis pending",
        sentence_rhythm: "Unknown — analysis pending",
        cta_style: "Unknown — analysis pending",
      });
    }

    // Save to GoldenExample table
    const golden = await db.goldenExample.create({
      data: {
        userId,
        platform: winner.platform,
        postText: winner.content,
        engagementScore: winner.calculatedScore,
        structureAnalysis,
        sourcePostId: winner.id,
        capturedAt: winner.scrapedAt || new Date(),
      },
    });

    savedIds.push(golden.id);
    console.log(
      `[GoldenLoop] ⭐ Winner captured: "${winner.content.substring(0, 60)}..." | Score: ${winner.calculatedScore} (threshold: ${threshold.toFixed(1)})`
    );
  }

  // 7. Update the source MarketIntelligence engagementScore for bookkeeping
  for (const winner of newWinners) {
    await db.marketIntelligence.update({
      where: { id: winner.id },
      data: { engagementScore: winner.calculatedScore },
    }).catch(() => {}); // non-fatal
  }

  return {
    winnersFound: newWinners.length,
    totalScanned: recentPosts.length,
    newGoldenExamples: savedIds,
  };
}

// ─── PART B: Injection into Copywriter ──────────────────────────────────────

/**
 * Retrieves the top N golden examples for a user+platform combo,
 * sorted by engagement score descending. Increments usageCount on each.
 */
export async function getTopGoldenExamples(
  userId: string,
  platform?: string,
  limit: number = 3
): Promise<GoldenExampleForInjection[]> {
  const where: any = { userId };
  if (platform) {
    where.platform = platform;
  }

  const examples: any[] = await db.goldenExample.findMany({
    where,
    orderBy: { engagementScore: "desc" },
    take: limit,
    select: {
      id: true,
      platform: true,
      postText: true,
      engagementScore: true,
      structureAnalysis: true,
      usageCount: true,
    },
  });

  if (examples.length === 0) return [];

  // Increment usageCount for all retrieved examples
  await db.goldenExample.updateMany({
    where: { id: { in: examples.map((e: any) => e.id) } },
    data: { usageCount: { increment: 1 } },
  });

  return examples.map((e: any) => ({
    ...e,
    structureAnalysis: e.structureAnalysis
      ? safeParseJSON(e.structureAnalysis)
      : null,
  }));
}

/**
 * Builds the injection block for the Copywriter's system prompt.
 * Returns an empty string if no golden examples exist.
 */
export function buildGoldenExamplesPromptBlock(
  examples: GoldenExampleForInjection[]
): string {
  if (!examples || examples.length === 0) return "";

  const formattedExamples = examples.map((ex, i) => {
    const analysis = ex.structureAnalysis as StructureAnalysis | null;
    const analysisBlock = analysis
      ? `   Structure Analysis:
     - Hook Pattern: ${analysis.opening_hook_pattern}
     - Emotional Trigger: ${analysis.emotional_trigger}
     - Sentence Rhythm: ${analysis.sentence_rhythm}
     - CTA Style: ${analysis.cta_style}`
      : "";

    return `
   Example ${i + 1} (${ex.platform} | Engagement: ${ex.engagementScore}):
   "${ex.postText.substring(0, 500)}"
${analysisBlock}`;
  }).join("\n");

  return `
═══ GOLDEN EXAMPLES (posts that went viral for this brand) ═══
${formattedExamples}

INSTRUCTIONS FOR GOLDEN EXAMPLES:
- Mirror the STRUCTURE of these proven winners (hook pattern, rhythm, CTA style).
- Do NOT copy the words. Adapt to today's topic.
- Use the same emotional triggers and sentence cadence.
- If a hook pattern is "Question hook", open YOUR post with a question too.
═══════════════════════════════════════════════════════════════
`;
}

// ─── Stats & Utilities ──────────────────────────────────────────────────────

/**
 * Returns golden loop stats for the dashboard.
 */
export async function getGoldenLoopStats(userId: string) {
  const totalExamples = await db.goldenExample.count({ where: { userId } });
  const totalUsages = await db.goldenExample.aggregate({
    where: { userId },
    _sum: { usageCount: true },
  });
  const topPlatform = await db.goldenExample.groupBy({
    by: ["platform"],
    where: { userId },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 1,
  });

  const recentExamples = await db.goldenExample.findMany({
    where: { userId },
    orderBy: { capturedAt: "desc" },
    take: 5,
    select: {
      id: true,
      platform: true,
      postText: true,
      engagementScore: true,
      usageCount: true,
      capturedAt: true,
    },
  });

  return {
    totalGoldenExamples: totalExamples,
    totalTimesInjected: totalUsages._sum.usageCount || 0,
    topPlatform: topPlatform[0]?.platform || "none",
    recentExamples,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function safeParseJSON(str: string): StructureAnalysis | null {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}
