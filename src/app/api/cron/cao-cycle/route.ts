import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { runCaoIntelligence } from "@/lib/agents/cao-brain";

export const runtime = "nodejs";
export const maxDuration = 300; // Allow it 5 minutes to sweep all users

/**
 * CAO Background Heartbeat (6-hour cron cycle)
 * 1. Iterates through all users who have an active brain profile.
 * 2. Runs the CAO Brain (Market Scan -> Strategy -> Action).
 * 3. Auto-launches campaigns if the CAO decides.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const usersWithBrain = await prisma.user.findMany({
      where: {
        contentBrain: { isNot: null }
      },
      select: { id: true, email: true }
    });

    console.log(`[CAO_CRON] 💓 Heartbeat started. Sweeping ${usersWithBrain.length} users.`);

    const results = [];
    for (const user of usersWithBrain) {
      console.log(`[CAO_CRON] Processing user: ${user.email}`);
      const result = await runCaoIntelligence(user.id);
      results.push({ email: user.email, ...result });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      numProcessed: usersWithBrain.length,
      runs: results
    });

  } catch (error: any) {
    console.error("[CAO_CRON_ERROR]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
