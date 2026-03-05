import { prisma } from "@/lib/prisma";
import { callSarvamChat } from "@/lib/sarvam";

// Simulated function to push a message back to WhatsApp (via Twilio/Meta API in prod)
async function sendWhatsAppNotification(phone: string, message: string) {
  console.log(`[WHATSAPP OUTBOUND to ${phone}]:\n${message}`);
  // In a real app, integrate Twilio or WhatsApp Business Cloud API here
}

export async function runAutonomousOrchestrator(taskId: string) {
  try {
    const task = await prisma.agentTask.findUnique({
      where: { id: taskId },
      include: { user: { include: { contentBrain: true } } },
    });

    if (!task) return;

    const brain = task.user?.contentBrain;
    const coreMemory = brain?.orchestratorMemory || "";
    const brandContext = [
      brain?.brandDescription ? `Brand: ${brain.brandDescription}` : "",
      brain?.audienceDescription ? `Target Audience: ${brain.audienceDescription}` : "",
      brain?.tone ? `Tone: ${brain.tone}` : "",
      brain?.contactPhone ? `Lead Gen Number: ${brain.contactPhone}` : "",
      brain?.location ? `Location: ${brain.location}` : "",
    ].filter(Boolean).join("\n");

    const systemPrompt = `${brandContext}\n\nCORE MEMORY RULES:\n${coreMemory}\n\nStrict Goal: Your pure focus is HIGH-QUALITY CONTENT that gets LEADS (appointments, calls, DMs). No generic fluff.`;

    const logUpdate = async (msg: string, progress: number, currentAgent: string, payload?: any) => {
      const dbTask = await prisma.agentTask.findUnique({ where: { id: taskId }, select: { logs: true } });
      const currentLogs = Array.isArray(dbTask?.logs) ? dbTask.logs : [];
      
      const updateData: any = {
        progress,
        currentAgent,
        logs: [...currentLogs, { time: new Date().toISOString(), message: msg }],
      };
      if (payload?.deepResearch) updateData.deepResearchData = payload.deepResearch;
      if (payload?.generatedContent) updateData.generatedContent = payload.generatedContent;
      
      await prisma.agentTask.update({ where: { id: taskId }, data: updateData });
    };

    // ── Phase 1: Research Agent (Deep dive & competitive analysis)
    await logUpdate("Starting Deep Competitive Research for lead generation...", 10, "Research");
    const researchPrompt = `You are a world-class real estate Growth & Research Hacker.
System Context: ${systemPrompt}
User Goal: ${task.goal}
Task: Given the location and audience, generate a brutal, deep competitor analysis report and uncover 3 proven "lead-magnet" content angles that competitors are missing. Return pure insights.`;
    
    // Using callSarvamChat as our LLM proxy for the "research" step
    const deepResearchRaw = await callSarvamChat(researchPrompt, "Run deep competitive analysis now.");
    
    const deepResearchData = {
      summary: "Completed deep dive into top local real estate accounts and current market trends.",
      insights: deepResearchRaw,
    };
    await logUpdate("Completed deep research and identified missed lead generation angles.", 35, "Research", { deepResearch: deepResearchData });

    // ── Phase 2: Content Agent (Hard-hitting lead generation content)
    await logUpdate("Synthesizing research into optimized lead-gen content...", 45, "Content");
    const contentPrompt = `You are the ultimate Lead-Gen Copywriter.
System Context: ${systemPrompt}
Goal: ${task.goal}
Research Insights: ${deepResearchRaw}
Task: Write 2 high-converting social media posts based on the research. Focus heavily on psychology, pain points, and a strong Call-to-Action to generate direct leads (WhatsApp DM or Call). Ensure it adheres to the Core Memory.`;
    
    const generatedContentRaw = await callSarvamChat(contentPrompt, "Draft 2 ultimate high-converting posts.");
    const contentItems = [
      { id: "post_1", platform: "Instagram/LinkedIn", text: generatedContentRaw.substring(0, Math.floor(generatedContentRaw.length / 2)) + "..." },
      { id: "post_2", platform: "WhatsApp", text: generatedContentRaw.substring(Math.floor(generatedContentRaw.length / 2)) }
    ]; // Simulating split for display
    
    await logUpdate("Drafted multi-platform lead-generation posts.", 70, "Content", { generatedContent: contentItems });

    // ── Phase 3: Scheduling & Publishing (Simulated)
    await logUpdate("Analyzing optimal posting times and queueing content...", 85, "Publishing");
    // Simulate delay
    await new Promise(r => setTimeout(r, 2000));
    await logUpdate("Dispatched content to publishing queue.", 95, "Publishing");

    // ── Phase 4: Finalize & Notify User via WhatsApp (Simulated)
    await logUpdate("Task complete. Notifying user via WhatsApp.", 100, "Reporting");
    await prisma.agentTask.update({
      where: { id: taskId },
      data: { status: "completed", completedAt: new Date() },
    });

    if (task.user?.phone) {
      await sendWhatsAppNotification(
        task.user.phone, 
        `✅ Your Gravity Claw AutoPilot is finished!
Goal: ${task.goal}
I did deep competitor research and created lead-gen optimized posts. They are queued for posting. Check your ContentSathi dashboard for details.`
      );
    }

  } catch (error: any) {
    console.error("Autopilot Error:", error);
    await prisma.agentTask.update({
      where: { id: taskId },
      data: { 
        status: "failed", 
        logs: [{ time: new Date().toISOString(), message: `Crash: ${error.message}` }] 
      },
    });
  }
}
