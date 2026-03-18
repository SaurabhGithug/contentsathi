import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { performQualityCheck } from "@/lib/quality";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId, contentId, editedText, action } = await req.json();

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // 1. Fetch the task to get the generated content
    const task = await prisma.agentTask.findUnique({
      where: { id: taskId, userId: user.id }
    });

    if (!task || !task.generatedContent) {
      return NextResponse.json({ error: "Task or content not found" }, { status: 404 });
    }

    const generatedContent = task.generatedContent as any[];
    const contentItem = generatedContent.find(c => c.id === contentId || `${task.id}_${c.id}` === contentId);

    if (!contentItem) {
      return NextResponse.json({ error: "Content item not found" }, { status: 404 });
    }

    if (action.startsWith("reject")) {
       // Handle rejection if needed (e.g. mark as rejected in task logs)
       return NextResponse.json({ success: true, action: "rejected" });
    }

    const body = editedText || contentItem.text;
    const lang = contentItem.language || "english"; // Default if not specified
    const quality = performQualityCheck(body, lang);

    // 2. Create GeneratedAsset
    const asset = await prisma.generatedAsset.create({
      data: {
        userId: user.id,
        type: "post", // Default
        platform: contentItem.platform?.toLowerCase() || "website",
        language: lang.toLowerCase() as any,
        body,
        title: task.goal.includes("Task:") 
               ? task.goal.split("Task:")[1].trim().substring(0, 100)
               : task.goal.split(/Tone:\s*[^\s]+\s*/i).pop()?.trim().substring(0, 100) || task.goal.substring(0, 100),
        qualityScore: quality.score,
        qualityIssues: quality.issues as any,
        createdAt: new Date(),
      }
    });

    // 3. Create CalendarItem (draft)
    await prisma.calendarItem.create({
      data: {
        userId: user.id,
        generatedAssetId: asset.id,
        platform: asset.platform as any,
        status: "ready", // Mark as ready for scheduling
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to tomorrow
      }
    });

    return NextResponse.json({ success: true, assetId: asset.id });
  } catch (error: any) {
    console.error("[APPROVE_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
