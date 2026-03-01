import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/cron/publish-scheduled
// Called every minute by Vercel Cron or local polling.
// Publishes all CalendarItems WHERE status='ready' AND scheduledDate <= now

const PUBLISH_ROUTES: Record<string, string> = {
  Instagram: "/api/publish/instagram",
  LinkedIn: "/api/publish/linkedin",
  "YouTube Shorts": "/api/publish/youtube",
  "X (Twitter)": "/api/publish/x",
  X: "/api/publish/x",
  Facebook: "/api/publish/facebook",
  WhatsApp: "/api/publish/whatsapp",
};

export async function GET(req: Request) {
  // Simple auth check via cron secret header
  const authHeader = req.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const dueItems = await prisma.calendarItem.findMany({
    where: {
      status: "ready",
      scheduledAt: { lte: now },
    },
    include: { user: true, generatedAsset: true },
    take: 50, // Process max 50 items per run
  });

  const results = await Promise.allSettled(
    dueItems.map(async (item) => {
      const platformRoute = PUBLISH_ROUTES[item.platform];
      if (!platformRoute) {
        await prisma.calendarItem.update({
          where: { id: item.id },
          data: { status: "failed", failureReason: `No publish route for platform: ${item.platform}` },
        });
        return;
      }

      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

      try {
        const res = await fetch(`${baseUrl}${platformRoute}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Include user session header for API auth bypass in cron context
            "x-cron-user-id": item.userId,
            Authorization: `Bearer ${cronSecret || ""}`,
          },
          body: JSON.stringify({
            postText: item.generatedAsset?.body || item.notes || "",
            title: item.generatedAsset?.title || "",
            description: item.generatedAsset?.body || "",
            calendarItemId: item.id,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          await prisma.calendarItem.update({
            where: { id: item.id },
            data: { status: "failed", failureReason: err.error || "Publish failed" },
          });
        }
      } catch (err: any) {
        await prisma.calendarItem.update({
          where: { id: item.id },
          data: { status: "failed", failureReason: err.message },
        });
      }
    })
  );

  const processed = results.length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({
    processed,
    failed,
    timestamp: now.toISOString(),
  });
}
