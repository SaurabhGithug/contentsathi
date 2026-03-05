import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runAutonomousOrchestrator } from "@/lib/orchestrator-autonomous";

export const runtime = "nodejs";

export async function GET() {
  try {
    const tasks = await prisma.agentTask.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    return NextResponse.json({ tasks });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { goal } = await req.json();

    let user = await prisma.user.findFirst({
      orderBy: { updatedAt: "desc" },
      include: { contentBrain: true },
    });

    if (!user) return NextResponse.json({ error: "User required" }, { status: 400 });

    const newBgTask = await prisma.agentTask.create({
      data: {
        userId: user.id,
        goal,
        source: "web",
        status: "processing",
        progress: 0,
        currentAgent: "Orchestrator",
        logs: [{ time: new Date().toISOString(), message: "Web AutoPilot deeply initialized." }],
      },
    });

    // Run autonomously in background without waiting
    runAutonomousOrchestrator(newBgTask.id).catch(console.error);

    return NextResponse.json({ success: true, taskId: newBgTask.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
