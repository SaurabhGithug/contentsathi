import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: Request) {
  try {
    // ── STEP 1: Authorization ─────────────────────────────────────────────
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Return 401 if unauthorized. For local testing without a secret, 
      // you could temporarily bypass this or supply the secret in the header.
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── STEP 2: Fetch Successful PublishLogs from last 30 days ────────────
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await prisma.publishLog.findMany({
      where: {
        status: "success",
        publishedAt: { gte: thirtyDaysAgo },
        platformPostId: { not: null }
      },
      include: {
        user: true,
      }
    });

    if (!logs || logs.length === 0) {
      return NextResponse.json({ success: true, message: "No recent successful posts to analyze." });
    }

    let processedCount = 0;
    const errors: string[] = [];

    // ── STEP 3: Fetch Native Analytics ────────────────────────────────────
    // Group logs by platform to batch requests or handle them contextually
    for (const log of logs) {
      if (!log.platformPostId) continue;
      
      let reach = 0;
      let likes = 0;
      let comments = 0;
      let shares = 0;

      try {
        // MOCK NATIVE API INTEGRATION
        // In reality, this would use log.socialAccount.accessToken to hit 
        // Facebook Graph API, LinkedIn Analytics API, YouTube Data API, etc.
        // For Phase N, we simulate fetching these stats dynamically based on the log.
        
        const platform = log.platform.toLowerCase();
        
        // Mock data variance based on platform
        if (platform === "instagram") {
          reach = Math.floor(Math.random() * 5000) + 100;
          likes = Math.floor(reach * 0.1);
          comments = Math.floor(likes * 0.05);
          shares = Math.floor(likes * 0.02);
        } else if (platform === "linkedin") {
          reach = Math.floor(Math.random() * 2000) + 50; // Impressions
          likes = Math.floor(reach * 0.03);
          comments = Math.floor(likes * 0.2);
          shares = Math.floor(likes * 0.1);
        } else if (platform === "whatsapp") {
          reach = Math.floor(Math.random() * 500) + 10; // Delivered
          likes = 0; // Not applicable
          comments = Math.floor(reach * 0.15); // Replies
          shares = 0;
        } else {
          // generic fallback
          reach = Math.floor(Math.random() * 1000) + 100;
          likes = Math.floor(reach * 0.05);
          comments = Math.floor(likes * 0.1);
          shares = Math.floor(likes * 0.05);
        }

        // ── STEP 4: Upsert PostAnalytics Record ───────────────────────────
        // Check if analytics already exist for this log
        const existing = await prisma.postAnalytics.findFirst({
          where: { publishLogId: log.id }
        });

        if (existing) {
          await prisma.postAnalytics.update({
            where: { id: existing.id },
            data: {
              reach,
              likes,
              comments,
              shares,
              saves: platform === "instagram" ? Math.floor(likes * 0.3) : 0,
              fetchedAt: new Date()
            }
          });
        } else {
          await prisma.postAnalytics.create({
            data: {
              userId: log.userId,
              publishLogId: log.id,
              platform: log.platform,
              reach,
              likes,
              comments,
              shares,
              saves: platform === "instagram" ? Math.floor(likes * 0.3) : 0,
              fetchedAt: new Date()
            }
          });
        }

        processedCount++;

      } catch (err: any) {
        console.error(`[CRON_ANALYTICS_ERROR] LogID: ${log.id}`, err);
        errors.push(`Failed for LogID ${log.id}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error(`[CRON_ANALYTICS_FATAL]`, error);
    return NextResponse.json(
      { error: "Analytics sync failed: " + error.message },
      { status: 500 }
    );
  }
}
