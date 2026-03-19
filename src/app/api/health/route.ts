import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isSystemPaused, toggleSystemPause } from "@/lib/utils/alerting";

export async function GET() {
  try {
    const paused = await isSystemPaused();
    
    // Last CAO Run
    const lastCao = await prisma.contentBrain.findFirst({
      orderBy: { caoLastRunAt: 'desc' },
      select: { caoLastRunAt: true }
    });
    
    // Active jobs
    const activeJobs = await prisma.jobRun.count({
      where: { status: "IN_PROGRESS" }
    });
    
    // Pending drafts (calendar items pending)
    const pendingDrafts = await prisma.calendarItem.count({
      where: { status: "draft" }
    });
    
    // Recent alerts
    const recentAlerts = await prisma.systemAlert.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    return NextResponse.json({
      status: "ok",
      lastCaoRun: lastCao?.caoLastRunAt || null,
      activeJobs,
      systemPaused: paused,
      pendingDrafts,
      recentAlerts
    });
  } catch (err: any) {
    return NextResponse.json({ status: "error", error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { pause } = await req.json();
    const newStatus = await toggleSystemPause(pause);
    return NextResponse.json({ success: true, paused: newStatus });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
