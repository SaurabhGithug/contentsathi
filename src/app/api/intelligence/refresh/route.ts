/**
 * POST /api/intelligence/refresh
 *
 * Background intelligence refresh endpoint.
 * Call this via a Vercel Cron Job every 12 hours.
 *
 * Cron config in vercel.json:
 * { "crons": [{ "path": "/api/intelligence/refresh", "schedule": "0 0,12 * * *" }] }
 *
 * Also callable manually from the Market Watch page for on-demand refresh.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refreshIntelligenceDB } from "@/lib/live-intelligence-db";

export const maxDuration = 300; // 5 minutes max for Vercel Pro
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // ── Auth: Accept either cron secret OR logged-in user ──────────────────
  const cronSecret = req.headers.get("x-cron-secret");
  const isValidCron = cronSecret === process.env.CRON_SECRET;

  let userId: string | null = null;

  if (!isValidCron) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    userId = user?.id || null;
  } else {
    // For cron: use the first admin user or any existing user for data association
    const adminUser = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
    userId = adminUser?.id || null;
  }

  if (!userId) {
    return NextResponse.json({ error: "No user found to associate intelligence data" }, { status: 400 });
  }

  let body: any = {};
  try {
    body = await req.json().catch(() => ({}));
  } catch {}

  const customTopics: string[] | undefined = body.topics;
  const force: boolean = body.force === true;

  // ── Check if refresh is needed (or forced) ─────────────────────────────
  if (!force) {
    const freshnessCutoff = new Date();
    freshnessCutoff.setHours(freshnessCutoff.getHours() - 11); // allow 1hr buffer

    const recentCount = await prisma.marketIntelligence.count({
      where: { scrapedAt: { gte: freshnessCutoff } },
    });

    if (recentCount >= 20) {
      return NextResponse.json({
        success: true,
        skipped: true,
        message: `Intelligence DB is fresh (${recentCount} recent signals). No refresh needed.`,
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  // ── Run the refresh ────────────────────────────────────────────────────
  console.log(`[Intelligence API] 🔄 Starting DB refresh. User: ${userId}. Topics: ${customTopics?.join(", ") || "default"}`);

  try {
    const result = await refreshIntelligenceDB(userId, customTopics);

    return NextResponse.json({
      success: result.success,
      signalsSaved: result.signalsSaved,
      errors: result.errors.slice(0, 5), // Don't expose too many error details
      message: `✅ Intelligence DB refreshed. ${result.signalsSaved} signals from LinkedIn · Instagram · Google Maps · YouTube stored.`,
      refreshedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[Intelligence API] Refresh failed:", err);
    return NextResponse.json(
      { error: err.message || "Refresh failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Status endpoint — shows how fresh the intelligence DB is
  try {
    const totalCount = await prisma.marketIntelligence.count();

    const freshCutoff = new Date();
    freshCutoff.setHours(freshCutoff.getHours() - 12);
    const freshCount = await prisma.marketIntelligence.count({
      where: { scrapedAt: { gte: freshCutoff } },
    });

    const latest = await prisma.marketIntelligence.findFirst({
      orderBy: { scrapedAt: "desc" },
      select: { scrapedAt: true, platform: true, corridor: true },
    });

    const platformBreakdown = await prisma.marketIntelligence.groupBy({
      by: ["platform"],
      _count: { platform: true },
      where: { scrapedAt: { gte: freshCutoff } },
    });

    const ageMins = latest
      ? Math.round((Date.now() - new Date(latest.scrapedAt).getTime()) / 60000)
      : null;

    return NextResponse.json({
      status: freshCount >= 10 ? "fresh" : freshCount > 0 ? "stale" : "empty",
      totalSignals: totalCount,
      freshSignals: freshCount,
      dataAgeMinutes: ageMins,
      lastScrapedAt: latest?.scrapedAt || null,
      platformBreakdown: platformBreakdown.map(p => ({
        platform: p.platform,
        count: p._count.platform,
      })),
      nextRefreshRecommended: ageMins !== null && ageMins > 720, // 12 hours
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
