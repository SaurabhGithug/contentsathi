import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runGravityClaw } from "@/lib/gravity-claw";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const tasks = await prisma.agentTask.findMany({
      where: { userId: user.id },
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
    runGravityClaw(newBgTask.id).catch(console.error);

    return NextResponse.json({ success: true, taskId: newBgTask.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
