import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { runAutonomousOrchestrator } from "@/lib/agents/orchestrator-autonomous";

export const runtime = "nodejs";

// This acts as the webhook for receiving incoming WhatsApp messages
// Think of this connected to Twilio/Meta WhatsApp Cloud API
export async function POST(req: Request) {
  try {
    const { from, message } = await req.json(); // "from" is the WhatsApp sender, "message" is their text command

    if (!from || !message) {
      return NextResponse.json({ error: "Invalid payload. Needs 'from' phone number and 'message'." }, { status: 400 });
    }

    // ── ACCOUNT LINKING LOGIC ──────────────────────────────────
    if (message.startsWith("Link_Account_")) {
      const targetUserId = message.replace("Link_Account_", "").trim();
      const updatedUser = await prisma.user.update({
        where: { id: targetUserId },
        data: { phone: from }
      });

      // Also create a basic social account entry for WhatsApp
      await (prisma.socialAccount as any).upsert({
        where: { userId_platform: { userId: targetUserId, platform: "whatsapp" } },
        create: {
          userId: targetUserId,
          platform: "whatsapp",
          accessToken: "linked_via_qr",
          accountId: from,
          accountName: `WhatsApp (${from})`,
          isActive: true,
        },
        update: {
          accountId: from,
          accountName: `WhatsApp (${from})`,
          isActive: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Account linked successfully for User: ${updatedUser.email}`
      });
    }

    // ── SMART COMMAND ROUTING ──────────────────────────────────
    const lowerMsg = message.toLowerCase().trim();
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3001";

    let user = await prisma.user.findFirst({
      where: { phone: from },
      include: { contentBrain: true },
    });

    if (!user) {
      // Fallback for demo: pick the most recent user
      user = await prisma.user.findFirst({
        orderBy: { updatedAt: 'desc' },
        include: { contentBrain: true },
      });
      if (!user) return NextResponse.json({ error: "No user found to process task." }, { status: 404 });
    }

    // ── 1. AUTONOMOUS APPROVAL LOOP (THE 10/10 FEATURE) ────────
    const approvalSynonyms = ["yes", "approve", "go ahead", "looks good", "do it", "approved"];
    if (approvalSynonyms.some(word => lowerMsg === word || lowerMsg.startsWith(word))) {
      // Find the most recent Draft Calendar Item for this user
      const pendingPost = await prisma.calendarItem.findFirst({
        where: { userId: user.id, status: "draft" },
        orderBy: { createdAt: "desc" },
        include: { generatedAsset: true }
      });

      if (pendingPost) {
        // Mark it as Scheduled/Ready. Set schedule to T+5 minutes.
        const scheduledTime = new Date(Date.now() + 5 * 60 * 1000);
        await prisma.calendarItem.update({
          where: { id: pendingPost.id },
          data: { 
            status: "scheduled", 
            scheduledAt: scheduledTime 
          }
        });

        return NextResponse.json({
          success: true,
          action: "auto_approved",
          message: `✅ Post Approved autonomously! It has been scheduled for publishing at ${scheduledTime.toLocaleTimeString()}. ContentSathi is handling the rest.`
        });
      } else {
        return NextResponse.json({
          success: true,
          message: "You said approve, but I couldn't find any pending draft posts in your queue."
        });
      }
    }

    // Market Watch / Hunter commands
    if (
      lowerMsg.includes("analyze") ||
      lowerMsg.includes("market watch") ||
      lowerMsg.includes("battle card") ||
      lowerMsg.includes("scan competitors") ||
      lowerMsg.includes("wardha road") ||
      lowerMsg.includes("besa") ||
      lowerMsg.includes("mihan")
    ) {
      // Fire the Market Watch cron in background
      fetch(`${baseUrl}/api/cron/market-watch`, {
        headers: { Authorization: `Bearer ${process.env.CRON_SECRET || ""}` }
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        action: "market_watch_triggered",
        message: "🔍 Hunter Agent launched. Scanning competitors now. Battle card will be drafted and staged in your dashboard within ~2 minutes."
      });
    }

    // Self-improvement command
    if (lowerMsg.includes("what's working") || lowerMsg.includes("improve") || lowerMsg.includes("analytics")) {
      fetch(`${baseUrl}/api/cron/self-improve`, { method: "POST" }).catch(() => {});
      return NextResponse.json({
        success: true,
        action: "self_improve_triggered",
        message: "🧠 Self-improvement cycle started. Analyzing your last 30 days of posts. soul.md will be updated with new learnings."
      });
    }

    // AI Co-Founder instruction (everything else)

    // 1. Log the incoming command as a Background Task in DB
    const bgTask = await (prisma.agentTask as any).create({
      data: {
        userId: user.id,
        goal: message,
        source: "whatsapp",
        status: "processing",
        progress: 0,
        currentAgent: "Orchestrator",
        logs: [
          { time: new Date().toISOString(), message: "Task received from WhatsApp webhook." }
        ]
      }
    });

    // 2. Kick off the background execution asynchronously 
    // We don't await this so the webhook responds to WhatsApp immediately
    runAutonomousOrchestrator(bgTask.id).catch(err => {
      console.error("Background task crash:", err);
    });

    // 3. Respond back exactly what Twilio/WhatsApp needs to acknowledge
    return NextResponse.json({
      success: true,
      taskId: bgTask.id,
      message: "Received and processing background AutoPilot lead gen task."
    });

  } catch (error: any) {
    console.error("WhatsApp webhook err:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
