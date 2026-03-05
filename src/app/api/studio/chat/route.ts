import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callSarvamChat } from "@/lib/sarvam";

export const runtime = "nodejs";

// Helper: detect if a message is a permanent instruction to update memory/soul.md
function isPermanentInstruction(message: string): boolean {
  const keywords = [
    "from now on", "always", "never", "remember this", "permanently",
    "rule:", "make it a rule", "going forward", "in the future",
    "aage se", "hamesha", "yaad rakh", "ab se", "remember", "save this",
    "update your rules", "update your memory", "keep in mind always",
  ];
  const lower = message.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

export async function POST(req: Request) {
  try {
    // FOR NOW: Bypassing auth (admin panel is open as instructed)
    const { message, userId } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Fetch or create ContentBrain for user (use first available if no userId)
    let brain = userId
      ? await prisma.contentBrain.findFirst({ where: { userId } })
      : await prisma.contentBrain.findFirst({ orderBy: { updatedAt: "desc" } });

    const currentMemory = (brain?.orchestratorMemory as string) || DEFAULT_MEMORY;
    const chatHistory: Array<{ role: string; content: string }> =
      Array.isArray(brain?.orchestratorChatHistory) ? (brain.orchestratorChatHistory as any) : [];

    const isRule = isPermanentInstruction(message);

    // Build system prompt with the soul.md memory
    const systemPrompt = `You are the ContentSathi AI Co-Founder — a personal AI business partner for an Indian real estate content creator. 
You are deeply intelligent, proactive, and speak in a warm Hinglish (Hindi + English) style.

YOUR CORE MEMORY (soul.md) — these are the rules and preferences your user has taught you:
---
${currentMemory}
---

You have conversational memory of recent chats. Be contextual and helpful.

${isRule ? `IMPORTANT: The user is giving you a new permanent instruction. At the END of your response, add a line starting with "[MEMORY_UPDATE]: " followed by the SPECIFIC new rule to add/update in your Core Memory. Be precise and concise about what to add. Do NOT include this prefix text in your visible response.` : ""}

Your capabilities:
- Help the user think through their content strategy
- Remember and apply their preferences and rules 
- Suggest topics, tones, posting schedules based on what you know
- Give real estate market insights for Indian tier-2 cities (especially Nagpur)
- Answer questions about their ContentSathi dashboard and pipeline

Keep responses concise, actionable, and warm. Use emojis occasionally. Speak like a smart friend who is also a savvy business partner.`;

    // Build messages for the LLM
    const historyContext = chatHistory
      .slice(-8) // last 8 exchanges
      .map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
      .join("\n");

    const fullPrompt = historyContext
      ? `Previous conversation:\n${historyContext}\n\nUser now says: ${message}`
      : message;

    // Call Sarvam API
    let aiResponse = "";
    try {
      aiResponse = await callSarvamChat(systemPrompt, fullPrompt);
    } catch (e) {
      aiResponse = "Maafi karo, AI abhi thoda busy hai! Ek baar phir try karo. 🙏";
    }

    // Extract memory update if present
    let memoryUpdated = false;
    let newRule = "";
    const memoryMarker = "[MEMORY_UPDATE]:";
    const markerIndex = aiResponse.indexOf(memoryMarker);
    if (markerIndex !== -1) {
      newRule = aiResponse.substring(markerIndex + memoryMarker.length).trim();
      aiResponse = aiResponse.substring(0, markerIndex).trim();

      // Append new rule to current memory
      const updatedMemory = `${currentMemory}\n- ${newRule}`;

      // Update DB
      if (brain) {
        await prisma.contentBrain.update({
          where: { id: brain.id },
          data: {
            orchestratorMemory: updatedMemory,
          },
        });
      }
      memoryUpdated = true;
    }

    // Save updated chat history (cap at 20 messages)
    const updatedHistory = [
      ...chatHistory,
      { role: "user", content: message },
      { role: "assistant", content: aiResponse },
    ].slice(-20);

    if (brain) {
      await prisma.contentBrain.update({
        where: { id: brain.id },
        data: { orchestratorChatHistory: updatedHistory },
      });
    }

    return NextResponse.json({
      reply: aiResponse,
      memoryUpdated,
      newRule: memoryUpdated ? newRule : undefined,
      currentMemory: memoryUpdated
        ? `${currentMemory}\n- ${newRule}`
        : currentMemory,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Fetch current memory and chat history for display
    const brain = await prisma.contentBrain.findFirst({
      orderBy: { updatedAt: "desc" },
      select: {
        orchestratorMemory: true,
        orchestratorChatHistory: true,
      },
    });

    return NextResponse.json({
      memory: brain?.orchestratorMemory || DEFAULT_MEMORY,
      chatHistory: brain?.orchestratorChatHistory || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  // Allow user to manually edit the memory from the UI
  try {
    const { memory } = await req.json();
    const brain = await prisma.contentBrain.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    if (brain) {
      await prisma.contentBrain.update({
        where: { id: brain.id },
        data: { orchestratorMemory: memory },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

const DEFAULT_MEMORY = `## ContentSathi AI Brain — Core Memory (soul.md)

### Who I am
I am the AI Co-Founder and Content Partner for a real estate content creator based in Nagpur, India.

### User Context
- Industry: Real estate (residential plots, flats, commercial)
- Location focus: Nagpur, Maharashtra (Tier-2 city)
- Target platforms: Instagram, WhatsApp, LinkedIn
- Primary languages: Hindi, Marathi, Hinglish (English + Hindi)
- Audience: First-time homebuyers, investors, NRIs

### Content Rules
- Always maintain a warm, trustworthy, and authoritative tone
- Include local Nagpur context when possible (Ring Road, Mihan, localities)
- Never use generic content — always make it specific and relatable
- Respect RERA guidelines in all content
- Use emojis tastefully in casual (WhatsApp) content only

### Brand Voice
- Professional yet approachable
- Hindi/Marathi phrases add authenticity
- Story-based content performs best`;
