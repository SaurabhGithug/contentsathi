import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/analytics - Return real PostAnalytics data
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "7"; // days
    const days = parseInt(range);

    const since = new Date();
    since.setDate(since.getDate() - days);

    // Fetch analytics records (use generatedAsset, not calendarItem — per schema)
    const analyticsRecords = await prisma.postAnalytics.findMany({
      where: {
        userId: user.id,
        fetchedAt: { gte: since },
      },
      include: {
        generatedAsset: true,
      },
      orderBy: { fetchedAt: "asc" },
    });

    // Fetch published calendar items for platform breakdown
    const publishedItems = await prisma.calendarItem.findMany({
      where: {
        userId: user.id,
        status: "published",
        publishedAt: { gte: since },
      },
    });

    // Process: weekly reach by day
    const dayNames = Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    });

    const reachByDay: Record<string, number> = {};
    dayNames.forEach((day) => { reachByDay[day] = 0; });

    analyticsRecords.forEach((rec) => {
      const fetchedDate = rec.fetchedAt ? new Date(rec.fetchedAt) : null;
      if (!fetchedDate) return;
      const day = fetchedDate.toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric",
      });
      if (day in reachByDay) {
        reachByDay[day] = (reachByDay[day] || 0) + (rec.reach || 0);
      }
    });

    const weeklyReach = Object.entries(reachByDay).map(([day, reach]) => ({ day, reach }));

    // Platform breakdown from published items
    const platformMap: Record<string, { posts: number; reach: number; likes: number; comments: number }> = {};
    publishedItems.forEach((item) => {
      const plat = item.platform;
      if (!platformMap[plat]) platformMap[plat] = { posts: 0, reach: 0, likes: 0, comments: 0 };
      platformMap[plat].posts++;
    });
    analyticsRecords.forEach((rec) => {
      const plat = rec.platform;
      if (!platformMap[plat]) platformMap[plat] = { posts: 0, reach: 0, likes: 0, comments: 0 };
      platformMap[plat].reach += rec.reach || 0;
      platformMap[plat].likes += rec.likes || 0;
      platformMap[plat].comments += rec.comments || 0;
    });
    const platformBreakdown = Object.entries(platformMap).map(([platform, data]) => ({
      platform,
      ...data,
      er: data.reach > 0 ? (((data.likes + data.comments) / data.reach) * 100).toFixed(1) : "0",
    }));

    // Total stats
    const totalReach = analyticsRecords.reduce((s: number, r) => s + (r.reach || 0), 0);
    const totalLikes = analyticsRecords.reduce((s: number, r) => s + (r.likes || 0), 0);
    const totalComments = analyticsRecords.reduce((s: number, r) => s + (r.comments || 0), 0);
    const totalShares = analyticsRecords.reduce((s: number, r) => s + (r.shares || 0), 0);

    const topRecord = analyticsRecords.reduce(
      (best: typeof analyticsRecords[0] | null, r) => (!best || (r.reach || 0) > (best.reach || 0) ? r : best),
      null
    );

    return NextResponse.json({
      totalReach,
      totalLikes,
      totalComments,
      totalShares,
      totalPosts: publishedItems.length,
      weeklyReach,
      platformBreakdown,
      topPost: topRecord
        ? {
            title: topRecord.generatedAsset?.title || "Post",
            platform: topRecord.platform,
            reach: topRecord.reach,
            likes: topRecord.likes,
          }
        : null,
      hasRealData: analyticsRecords.length > 0,
    });
  } catch (error: any) {
    console.error("[ANALYTICS_GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
