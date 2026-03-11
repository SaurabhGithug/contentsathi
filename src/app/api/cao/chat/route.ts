import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { callSarvamChat } from "@/lib/sarvam";
import { searchWeb } from "@/lib/tavily";
import { marketHunter } from "@/lib/social-scraper";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * CAO Chat API
 * User <-> Chief AI Officer conversation interface.
 * Has full context of the user's business, strategy, and tools.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { contentBrain: true },
    });

    if (!user || !user.contentBrain) {
      return NextResponse.json({ error: "No brand profile found" }, { status: 404 });
    }

    const brain = user.contentBrain;
    let caoStrategy = "No self-generated strategy currently active.";
    if ((brain as any).caoStrategy) {
       caoStrategy = typeof (brain as any).caoStrategy === "string" 
          ? (brain as any).caoStrategy 
          : JSON.stringify((brain as any).caoStrategy);
    }
    const campaignLog = (brain.contentDna as any)?.campaignLog?.slice(-3) || [];
    const chatHistory = Array.isArray(brain.orchestratorChatHistory) ? (brain.orchestratorChatHistory as any[]) : [];

    // Check for research or social media search intent
    let extraContext = "";
    const query = message.toLowerCase();
    const isSocialSearch = query.includes("linkedin") || query.includes("instagram") || query.includes("twitter") || query.includes("social");

    if (query.includes("research") || query.includes("search") || query.includes("latest") || isSocialSearch) {
      try {
        if (isSocialSearch) {
          const socialResults = await marketHunter(message, user.id);
          if (socialResults.length > 0) {
            const resultsText = socialResults
              .map((r: any) => `[${r.platform.toUpperCase()}] ${r.author}: "${r.text.substring(0, 200)}..." \nURL: ${r.url}\nStats: ${r.likes} likes, ${r.comments} comments, ${r.shares} shares`)
              .join("\n\n");
            extraContext = `[REAL-TIME SOCIAL MEDIA ANALYSIS (HUNTER MODE)]:\nThe following are REAL posts scraped from LinkedIn/Social Media just now:\n\n${resultsText}\n\n[INSTRUCTION]: Use these REAL stats and links. Do NOT hallucinate engagement. If a link is present above, cite it exactly.`;
          }
        } else {
          const searchResults = await searchWeb(message, "basic", true);
          const resultsText = searchResults.results
             .slice(0, 3) 
             .map((r: any) => `${r.title}: ${r.content.substring(0, 300)}...`)
             .join("\n");
          extraContext = `[LIVE WEB SEARCH RESULTS FOR CONTEXT]:\n${searchResults.answer || "No direct answer."}\n\nSources:\n${resultsText}`;
        }
      } catch (err) {
        console.error("CAO Intelligence Discovery Failed:", err);
      }
    }

    // System Persona for the CAO
    const caoSystemPrompt = `You are the Chief AI Officer (CAO) for ${brain.brandName || "this real estate brand"}.
You DO NOT introduce yourself every time. You talk like a highly intelligent, proactive, data-driven Chief of Staff in a fast-paced agency.

YOUR CURRENT STRATEGY (If asked what we are doing):
${caoStrategy}

RECENT CAMPAIGN HISTORY:
${JSON.stringify(campaignLog)}

YOUR BRAND KNOWLEDGE:
Industry: ${brain.industry || "Real Estate"}
Location: ${brain.location || "Nagpur"}
Audience: ${brain.audienceDescription || "Buyers/Investors"}
Tone: ${brain.tone || "Professional, authoritative"}
USPs: ${(brain.usps || []).join(", ")}
Rules (soul.md): ${brain.orchestratorMemory || "None yet"}

${extraContext}

YOUR CAPABILITIES (If the user asks what to do):
- You can build strategies based on data.
- You can launch campaigns (tell the user to go to the AI Studio or say "I will launch this").
- You can create new specialized sub-agents if the user asks.
- You can search the live web for competitors or market news.

FORMATTING RULES (VERY IMPORTANT):
- Use proper markdown with clear headings (##, ###), bullet points, and numbered lists.
- Put each section on a new line.
- Use bold (**text**) for emphasis.
- NEVER output <think> tags or any XML-like tags.
- Keep responses well-structured and scannable — avoid walls of text.
- Use short paragraphs, each separated by a blank line.

Answer the user directly, concisely, and strategically. Do NOT use fake filler data; if you don't know something, tell them what you need to find out.`;

    // Format chat history for the prompt
    const historyText = chatHistory
      .slice(-10)
      .map((msg: any) => `${msg.role === "user" ? "USER" : "CAO"}: ${msg.content}`)
      .join("\n\n");

    const fullPrompt = `${caoSystemPrompt}\n\n=== RECENT CHAT HISTORY ===\n${historyText}\n\nUSER: ${message}\nCAO:`;

    // Get CAO's semantic response (callSarvamChat already strips leaking <think> blocks)
    let caoReply = await callSarvamChat(fullPrompt, "Responding as CAO.");

    // Determine if the CAO deduced a new rule or sub-agent from the conversation
    // (This is a simplified extraction; could be a separate JSON LLM call for robustness)
    let newRuleExtract = null;
    let newAgentExtract = null;

    if (message.toLowerCase().includes("always") || message.toLowerCase().includes("never") || message.toLowerCase().includes("rule")) {
      try {
        const extractionPrompt = `Extract ONLY the core brand rule from this user instruction, phrased as a permanent instruction. User: "${message}". Reply with just the rule or "NONE".`;
        const rule = await callSarvamChat(extractionPrompt, "Extracting rule.");
        if (rule && rule !== "NONE" && rule.length < 200) newRuleExtract = rule;
      } catch (e) {
        console.error("CAO Rule extraction failed:", e);
      }
    }
 
    if (message.toLowerCase().includes("new agent") || message.toLowerCase().includes("create agent") || message.toLowerCase().includes("specialist")) {
      try {
        const extractionPrompt = `The user wants to spawn a new sub-agent. User: "${message}". Reply with a JSON object { "roleName": "e.g. Hindi Video Scripter", "systemPrompt": "The full system prompt defining this agent's job and rules." } or just "NONE" if invalid. Valid JSON only.`;
        const agentJsonText = await callSarvamChat(extractionPrompt, "Extracting agent spawn.");
        const jsonMatch = agentJsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) newAgentExtract = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error("CAO Agent extraction failed:", e);
      }
    }

    // Update DB Memory
    const dbUpdates: any = {};
    let memoryUpdated = false;

    // 1. Append Chat History
    const updatedHistory = [...chatHistory, { role: "user", content: message }, { role: "assistant", content: caoReply }];
    dbUpdates.orchestratorChatHistory = updatedHistory.slice(-20); // keep last 20 messages

    // 2. Add new brand rule (Soul.md update)
    if (newRuleExtract) {
      dbUpdates.orchestratorMemory = brain.orchestratorMemory
        ? `${brain.orchestratorMemory}\n- ${newRuleExtract}`
        : `- ${newRuleExtract}`;
      memoryUpdated = true;
    }

    // 3. Spawn Sub-Agent (Save to caoCustomAgents)
    if (newAgentExtract?.roleName && newAgentExtract?.systemPrompt) {
      const currentAgents = Array.isArray((brain as any).caoCustomAgents) ? (brain as any).caoCustomAgents : [];
      dbUpdates.caoCustomAgents = [...currentAgents, newAgentExtract];
      memoryUpdated = true;
    }

    await prisma.contentBrain.update({
      where: { id: brain.id },
      data: dbUpdates,
    });

    return NextResponse.json({
      reply: caoReply,
      memoryUpdated,
      newRule: newRuleExtract,
      newAgentSpawned: newAgentExtract?.roleName,
      currentMemory: dbUpdates.orchestratorMemory || brain.orchestratorMemory,
    });

  } catch (error: any) {
    console.error("CAO Chat POST error:", error);
    return NextResponse.json({ 
      error: error.message || "Unknown error",
      detail: error.stack,
      success: false 
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { contentBrain: true },
    });

    return NextResponse.json({
      brain: user?.contentBrain || null,
      chatHistory: (user?.contentBrain?.orchestratorChatHistory as any[]) || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
