import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { runGravityClaw } from "@/lib/intelligence/gravity-claw";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/utils/auth";

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
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[TASKS_POST] Session email:", session.user.email);
    const { goal, context, deepResearchPlatforms } = await req.json();
    console.log("[TASKS_POST] Body parsed:", { goal, hasContext: !!context, deepResearchPlatforms });

    // FIRST QUERY RECOVERY TEST: Minimal query
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    }).catch(err => {
      console.error("[TASKS_POST] Minimal findUnique failed:", err);
      throw err;
    });

    if (!user) {
      console.warn("[TASKS_POST] User not found for email:", session.user.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // SECOND QUERY: Explicitly get brain if needed
    const brain = await prisma.contentBrain.findFirst({
       where: { userId: user.id }
    });
    console.log("[TASKS_POST] User & Brain found:", { userId: user.id, hasBrain: !!brain });

    const newBgTask = await prisma.agentTask.create({
      data: {
        userId: user.id,
        goal,
        inputContext: context ? { ...context, deepResearchPlatforms } : { deepResearchPlatforms },
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
    console.error("[STUDIO_TASKS_POST_ERROR]", err);
    // Explicitly handle Prisma errors to see if they match the browser report
    return NextResponse.json({ 
      error: err.message, 
      code: err.code,
      meta: err.meta,
      clientVersion: err.clientVersion 
    }, { status: 500 });
  }
}
