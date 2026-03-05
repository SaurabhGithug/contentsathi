import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PLANS, type PlanTierKey } from "@/lib/plans";

// GET /api/cron/reset-credits
// Runs on the 1st of every month at midnight IST.
// Resets creditsBalance based on each user's planTier using PLANS config.

export async function GET(req: Request) {
  // ── 1. Auth check ─────────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // ── 2. Fetch all users ────────────────────────────────────────────────
    const users = await prisma.user.findMany({
      select: { id: true, planTier: true },
    });

    let resetCount = 0;

    // ── 3. Reset credits per user using PLANS config ──────────────────────
    for (const user of users) {
      const plan = PLANS[user.planTier as PlanTierKey];
      const newCredits = plan
        ? plan.monthlyCredits === -1 ? 999999 : plan.monthlyCredits
        : 100;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          creditsBalance: newCredits,
          linkedinPostsToday: 0,
          linkedinPostsResetAt: new Date(),
        },
      });

      await prisma.usageLog.create({
        data: {
          userId: user.id,
          action: "credit_reset",
          creditsUsed: 0,
          metadata: {
            planTier: user.planTier,
            newBalance: newCredits,
            resetDate: new Date().toISOString(),
          },
        },
      });

      resetCount++;
    }

    // ── 4. Log the reset ──────────────────────────────────────────────────
    console.log(
      `[CRON_RESET_CREDITS] Reset credits for ${resetCount} users at ${new Date().toISOString()}`
    );

    return NextResponse.json({
      success: true,
      usersReset: resetCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[CRON_RESET_CREDITS] Error:", error);
    return NextResponse.json(
      { error: "Credit reset failed: " + error.message },
      { status: 500 }
    );
  }
}
