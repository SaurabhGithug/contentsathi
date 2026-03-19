import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { startOfDay, endOfDay, startOfWeek, subWeeks, format } from "date-fns";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        socialAccounts: {
          select: {
            platform: true,
            isActive: true,
            accountName: true,
          },
        },
        contentBrain: {
          select: {
            brandName: true,
            caoStrategy: true,
            caoLastRunAt: true,
            industry: true,
            location: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = subWeeks(weekStart, 1);

    // ── 1. Posts Planned (this week vs last week for trend) ─────────────
    const postsPlanned = await prisma.calendarItem.count({
      where: {
        userId: user.id,
        status: { in: ["ready", "scheduled"] },
        scheduledAt: { gte: todayStart },
      },
    });

    // ── 2. Posts Published (this week + last week for trend) ────────────
    const postsPublishedThisWeek = await prisma.calendarItem.count({
      where: {
        userId: user.id,
        status: "published",
        scheduledAt: { gte: weekStart },
      },
    });

    const postsPublishedLastWeek = await prisma.calendarItem.count({
      where: {
        userId: user.id,
        status: "published",
        scheduledAt: { gte: lastWeekStart, lt: weekStart },
      },
    });

    const publishTrend = postsPublishedThisWeek - postsPublishedLastWeek;

    // ── 3. Completed campaigns (total + this week) ─────────────────────
    const completedCampaignsThisWeek = await prisma.agentTask.count({
      where: {
        userId: user.id,
        status: "completed",
        createdAt: { gte: weekStart },
      },
    });

    const completedCampaignsLastWeek = await prisma.agentTask.count({
      where: {
        userId: user.id,
        status: "completed",
        createdAt: { gte: lastWeekStart, lt: weekStart },
      },
    });

    const campaignTrend = completedCampaignsThisWeek - completedCampaignsLastWeek;

    // ── 4. Active / processing campaigns ───────────────────────────────
    const activeCampaigns = await prisma.agentTask.count({
      where: {
        userId: user.id,
        status: "processing",
      },
    });

    // ── 5. Total assets generated ──────────────────────────────────────
    const totalAssets = await prisma.generatedAsset.count({
      where: { userId: user.id },
    });

    const assetsThisWeek = await prisma.generatedAsset.count({
      where: {
        userId: user.id,
        createdAt: { gte: weekStart },
      },
    });

    // ── 6. Today's recommendation ──────────────────────────────────────
    let todayRecommendation: { title: string; platform: string } | null = null;

    const todayReady = await prisma.calendarItem.findFirst({
      where: {
        userId: user.id,
        status: "scheduled",
        scheduledAt: { gte: todayStart, lte: todayEnd },
      },
      orderBy: { scheduledAt: "asc" },
      include: { generatedAsset: true },
    });

    if (todayReady && todayReady.generatedAsset) {
      todayRecommendation = {
        title: todayReady.generatedAsset.title || "Untitled Post",
        platform: todayReady.platform,
      };
    } else {
      const nextReady = await prisma.calendarItem.findFirst({
        where: {
          userId: user.id,
          status: "scheduled",
          scheduledAt: { gt: todayEnd },
        },
        orderBy: { scheduledAt: "asc" },
        include: { generatedAsset: true },
      });
      if (nextReady && nextReady.generatedAsset) {
        todayRecommendation = {
          title: nextReady.generatedAsset.title || "Upcoming Post",
          platform: nextReady.platform,
        };
      }
    }

    // ── 7. Upcoming posts ──────────────────────────────────────────────
    const upcomingPostsRaw = await prisma.calendarItem.findMany({
      where: {
        userId: user.id,
        scheduledAt: { gte: todayStart },
      },
      orderBy: { scheduledAt: "asc" },
      take: 5,
      include: { generatedAsset: true },
    });

    const upcomingPosts = upcomingPostsRaw.map((item: any) => ({
      id: item.id,
      platform: item.platform,
      title: item.generatedAsset?.title || "Untitled Post",
      scheduledAt: item.scheduledAt
        ? item.scheduledAt.toISOString()
        : new Date().toISOString(),
      status: item.status,
    }));

    // ── 8. CAO Intelligence ────────────────────────────────────────────
    let caoInsight: string | null = null;
    let caoLastRun: string | null = null;
    const brain = user.contentBrain;

    if (brain?.caoStrategy) {
      const strategy = brain.caoStrategy as any;
      caoInsight =
        strategy.market_insight ||
        strategy.summary ||
        (typeof strategy === "string" ? strategy : null);
      if (brain.caoLastRunAt) {
        caoLastRun = format(new Date(brain.caoLastRunAt), "MMM d, h:mm a");
      }
    }

    // ── 9. Marketing Health Score (0-100) ──────────────────────────────
    // Factors: connected accounts, published this week, active campaigns, CAO running, assets count
    const connectedAccounts = (user.socialAccounts || []).filter(
      (a: any) => a.isActive
    ).length;

    let healthScore = 0;
    // Connected accounts (max 25 pts)
    healthScore += Math.min(connectedAccounts * 8, 25);
    // Posts published this week (max 25 pts)
    healthScore += Math.min(postsPublishedThisWeek * 5, 25);
    // Total assets (max 20 pts)
    healthScore += Math.min(totalAssets * 2, 20);
    // Active campaigns or recent completions (max 15 pts)
    healthScore += activeCampaigns > 0 ? 15 : completedCampaignsThisWeek > 0 ? 10 : 0;
    // CAO running (max 15 pts)
    healthScore += caoInsight ? 15 : 0;
    healthScore = Math.min(healthScore, 100);

    // Health label
    let healthLabel = "Needs Attention";
    let healthColor = "red";
    if (healthScore >= 80) {
      healthLabel = "Excellent";
      healthColor = "emerald";
    } else if (healthScore >= 60) {
      healthLabel = "Good";
      healthColor = "blue";
    } else if (healthScore >= 40) {
      healthLabel = "Fair";
      healthColor = "amber";
    }

    // ── 10. Daily Digest — what's working / what's lagging ─────────────
    const digestItems: string[] = [];
    if (postsPublishedThisWeek > postsPublishedLastWeek) {
      digestItems.push(
        `📈 Publishing velocity is up — ${postsPublishedThisWeek} posts this week vs ${postsPublishedLastWeek} last week`
      );
    } else if (postsPublishedThisWeek < postsPublishedLastWeek) {
      digestItems.push(
        `📉 Publishing slowed — ${postsPublishedThisWeek} posts this week vs ${postsPublishedLastWeek} last week`
      );
    }
    if (connectedAccounts === 0) {
      digestItems.push("⚠️ No social accounts connected — connect at least one in Settings");
    }
    if (activeCampaigns > 0) {
      digestItems.push(`🔄 ${activeCampaigns} campaign${activeCampaigns > 1 ? "s" : ""} actively running right now`);
    }
    if (assetsThisWeek > 0) {
      digestItems.push(`✨ ${assetsThisWeek} new content pieces generated this week`);
    }
    if (!caoInsight) {
      digestItems.push("🧠 CAO strategy hasn't run yet — visit the CAO page to activate");
    }
    if (postsPlanned > 0) {
      digestItems.push(`📅 ${postsPlanned} posts scheduled and ready to go`);
    }
    if (digestItems.length === 0) {
      digestItems.push("🚀 Get started by creating your first campaign in the AI Studio");
    }

    return NextResponse.json({
      // Core stats
      postsPlanned,
      postsPublishedThisWeek,
      postsPublishedLastWeek,
      publishTrend,
      completedCampaignsThisWeek,
      campaignTrend,
      activeCampaigns,
      totalAssets,
      assetsThisWeek,

      // Recommendation + upcoming
      todayRecommendation,
      upcomingPosts,

      // CAO
      caoInsight,
      caoLastRun,

      // Health
      healthScore,
      healthLabel,
      healthColor,

      // Digest
      digestItems,

      // User info
      brandName: brain?.brandName || null,
      industry: brain?.industry || null,
      location: brain?.location || null,
      socialAccounts: user.socialAccounts || [],
      creditsBalance: user.creditsBalance,
      onboardingCompleted: user.onboardingCompleted,
    });
  } catch (error: any) {
    console.error("[DASHBOARD_STATS_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to load dashboard stats" },
      { status: 500 }
    );
  }
}
