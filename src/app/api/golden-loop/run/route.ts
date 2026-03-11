/**
 * POST /api/golden-loop/run
 * Manual trigger for the Golden Loop winner detection engine.
 * Can be called from dashboard or WhatsApp command.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { detectAndSaveWinners, getGoldenLoopStats } from "@/lib/golden-loop";

export const runtime = "nodejs";
export const maxDuration = 60;

// POST — Run golden loop detection
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId;

    // If no userId provided, use the most recently active user
    let targetUserId = userId;
    if (!targetUserId) {
      const user = await prisma.user.findFirst({
        orderBy: { updatedAt: "desc" },
        select: { id: true },
      });
      if (!user) {
        return NextResponse.json({ error: "No user found" }, { status: 404 });
      }
      targetUserId = user.id;
    }

    console.log(`[GoldenLoop API] Running winner detection for user ${targetUserId}...`);

    const result = await detectAndSaveWinners(targetUserId);

    return NextResponse.json({
      success: true,
      ...result,
      message: result.winnersFound > 0
        ? `🏆 Found ${result.winnersFound} winner(s) from ${result.totalScanned} posts! Saved as Golden Examples.`
        : `Scanned ${result.totalScanned} posts — no new outlier winners detected this cycle.`,
    });
  } catch (error: any) {
    console.error("[GoldenLoop API Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET — Retrieve golden loop stats and recent examples
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    let targetUserId = userId;
    if (!targetUserId) {
      const user = await prisma.user.findFirst({
        orderBy: { updatedAt: "desc" },
        select: { id: true },
      });
      if (!user) {
        return NextResponse.json({ error: "No user found" }, { status: 404 });
      }
      targetUserId = user.id;
    }

    const stats = await getGoldenLoopStats(targetUserId);

    return NextResponse.json({
      success: true,
      ...stats,
    });
  } catch (error: any) {
    console.error("[GoldenLoop Stats Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
