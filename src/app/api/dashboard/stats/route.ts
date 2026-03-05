import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, startOfWeek } from "date-fns";

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
            accountName: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday

    // 1. Posts Planned: ready or scheduled from today onward
    const postsPlanned = await prisma.calendarItem.count({
      where: {
        userId: user.id,
        status: { in: ["ready", "scheduled"] },
        scheduledAt: { gte: todayStart },
      },
    });

    // 2. Posts Published this week
    const postsPublished = await prisma.calendarItem.count({
      where: {
        userId: user.id,
        status: "published",
        scheduledAt: { gte: weekStart },
      },
    });

    // 3. Today's recommendation
    let todayRecommendation: { title: string; platform: string } | null = null;

    const todayReady = await prisma.calendarItem.findFirst({
      where: {
        userId: user.id,
        status: "scheduled",
        scheduledAt: { gte: todayStart, lte: todayEnd },
      },
      orderBy: { scheduledAt: "asc" },
      include: { generatedAsset: true }
    });

    if (todayReady && todayReady.generatedAsset) {
      todayRecommendation = { 
        title: todayReady.generatedAsset.title || "Untitled Post", 
        platform: todayReady.platform 
      };
    } else {
      const nextReady = await prisma.calendarItem.findFirst({
        where: {
          userId: user.id,
          status: "scheduled",
          scheduledAt: { gt: todayEnd },
        },
        orderBy: { scheduledAt: "asc" },
        include: { generatedAsset: true }
      });
      if (nextReady && nextReady.generatedAsset) {
        todayRecommendation = { 
          title: nextReady.generatedAsset.title || "Upcoming Post", 
          platform: nextReady.platform 
        };
      }
    }

    // 4. Upcoming posts
    const upcomingPostsRaw = await prisma.calendarItem.findMany({
      where: {
        userId: user.id,
        scheduledAt: { gte: todayStart },
      },
      orderBy: { scheduledAt: "asc" },
      take: 5,
      include: { generatedAsset: true }
    });

    const upcomingPosts = upcomingPostsRaw.map((item: any) => ({
      id: item.id,
      platform: item.platform,
      title: item.generatedAsset?.title || "Untitled Post",
      scheduledAt: item.scheduledAt ? item.scheduledAt.toISOString() : new Date().toISOString(),
      status: item.status,
    }));

    return NextResponse.json({
      postsPlanned,
      postsPublished,
      todayRecommendation,
      upcomingPosts,
      socialAccounts: user.socialAccounts || [],
      creditsBalance: user.creditsBalance,
      onboardingCompleted: user.onboardingCompleted
    });
  } catch (error: any) {
    console.error("[DASHBOARD_STATS_ERROR]", error);
    return NextResponse.json({ error: "Failed to load dashboard stats" }, { status: 500 });
  }
}
