import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { callSarvamChat } from "@/lib/sarvam";
import { searchWeb } from "@/lib/tavily";
import { marketHunter } from "@/lib/social-scraper";
import { isOperationalQuery, runOperationalQuery } from "@/lib/cao-ops";
import { isValuationIntent, parsePlotFromMessage } from "@/lib/valuation";

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

    // ── Operational Query Intercept (DB-backed) ──────────────────────────────
    if (isOperationalQuery(message)) {
      const opResult = await runOperationalQuery(message, user.id);
      if (opResult) {
        const updHist = [...chatHistory, { role: "user", content: message }, { role: "assistant", content: opResult }].slice(-20);
        await prisma.contentBrain.update({ where: { id: brain.id }, data: { orchestratorChatHistory: updHist } });
        return NextResponse.json({ reply: opResult, memoryUpdated: false });
      }
    }

    // ── Valuation Intent Intercept ───────────────────────────────────────────
    if (isValuationIntent(message)) {
      const parsed = parsePlotFromMessage(message);
      const { POST: valuatePost } = await import("@/app/api/studio/valuate-plot/route");
      const syntheticReq = new Request("http://localhost/api/studio/valuate-plot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userQuery: message, corridor: parsed.corridor, areaSqFt: parsed.areaSqFt, isCornerPlot: parsed.isCornerPlot, shape: parsed.shape, location: parsed.corridor || "Nagpur", userId: user.id }),
      });
      const resVal = await valuatePost(syntheticReq);
      const dataVal = await resVal.json();
      
      let valuationReply = "I tried the valuation engine but hit an error.";
      if (!dataVal.error) {
         valuationReply = `## 🏗️ CAO Plot Valuation Report\n\n`;
         if (parsed.corridor) valuationReply += `**Corridor:** ${parsed.corridor} · **Circle Rate:** ₹${dataVal.circleRate}/sqft\n\n`;
         if (dataVal.estimatedRangeLow > 0) {
            valuationReply += `| **Market Rate** | ₹${dataVal.estimatedPPSF?.toLocaleString("en-IN")}/sqft |\n`;
            valuationReply += `| **⚡ Fast-Sell Price** | **₹${(dataVal.fastSellPrice / 100000).toFixed(2)}L** |\n\n`;
         }
         valuationReply += `${dataVal.analysisNarrative || ""}`;
      }
      
      const updHist = [...chatHistory, { role: "user", content: message }, { role: "assistant", content: valuationReply }].slice(-20);
      await prisma.contentBrain.update({ where: { id: brain.id }, data: { orchestratorChatHistory: updHist } });
      return NextResponse.json({ reply: valuationReply, memoryUpdated: false });
    }

    // Check for research or social media search intent
    let extraContext = "";
    const query = message.toLowerCase();
    
    // Improved search intent detection: Only search if user explicitly asks for research/market/latest info, 
    // NOT when asking functional questions about their account status.
    const hasSearchIntent = query.includes("research") || query.includes("search") || 
                           query.includes("latest") || query.includes("market") ||
                           query.includes("competitor") || query.includes("analysis");

    const isSocialSearch = hasSearchIntent && (query.includes("linkedin") || query.includes("instagram") || query.includes("twitter") || query.includes("social"));

    if (hasSearchIntent) {
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

YOUR CURRENT STRATEGY:
${caoStrategy}

YOUR BRAND KNOWLEDGE:
Industry: ${brain.industry || "Real Estate"} | Location: ${brain.location || "Nagpur"} | Tone: ${brain.tone || "Professional"}

${extraContext}

FORMATTING RULES:
- Use proper markdown (##, ###, bullets).
- Use bold (**text**) for emphasis.
- NEVER output <think> tags.

CRITICAL DIRECTIVE:
- If the user is asking about their account connection status, posts, or credits, DO NOT talk about Nagpur real estate, RERA, or sales funnels. 
- DO NOT say you cannot access internal data. You are the CAO; you have full system access.
- Be direct, strategic, and concise.`;

    // Format chat history for the prompt
    const historyText = chatHistory
      .slice(-10)
      .map((msg: any) => `${msg.role === "user" ? "USER" : "CAO"}: ${msg.content}`)
      .join("\n\n");

    const fullPrompt = `${caoSystemPrompt}\n\n=== RECENT CHAT HISTORY ===\n${historyText}\n\nUSER: ${message}\nCAO:`;

    // Get CAO's semantic response (callSarvamChat already strips leaking <think> blocks)
    let caoReply = await callSarvamChat(fullPrompt, "Responding as CAO.");

    // Detect Publish Intent and Execute
    const isPublish = ["publish", "post it on", "post to", "share on"].some(kw => message.toLowerCase().includes(kw));

    if (isPublish) {
      let platform = null;
      if (message.toLowerCase().includes("linkedin")) platform = "linkedin";
      
      if (platform === "linkedin") {
        const account = await prisma.socialAccount.findFirst({
          where: { userId: user.id, platform: "linkedin", isActive: true }
        });

        if (!account || !account.accessToken || !account.accountId) {
          caoReply += `\n\n⚠️ **Publishing Failed**: Your LinkedIn account is not connected. Go to **Settings → Accounts** to connect it.`;
        } else {
          try {
            // Ask Sarvam to extract/format ONLY the post text from the CAO reply
            const extractPrompt = `You are a formatting assistant. Extract ONLY the raw text for the social media post from the following response. Do not include any conversational filler, intro, or outro. Give me the pure post content that is ready to be published.\\n\\nResponse:\\n${caoReply}`;
            const postBody = await callSarvamChat(extractPrompt, "Extracting post body.");

            const { POST: publishPost } = await import("@/app/api/publish/linkedin/route");
            const syntheticReq = new Request("http://localhost/api/publish/linkedin", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user.id,
                title: "New Update", 
                body: postBody,
                accessToken: account.accessToken,
                providerAccountId: account.accountId
              }),
            });
            const resVal = await publishPost(syntheticReq);
            const dataVal = await resVal.json();
            
            if (dataVal.success) {
               caoReply = postBody + `\n\n✅ **Successfully published to LinkedIn!**\n[View Post](${dataVal.platformPostUrl})`;
            } else {
               caoReply += `\n\n❌ **Failed to publish to LinkedIn**: ${dataVal.error || "Unknown error"}`;
            }
          } catch (e: any) {
             console.error("CAO publish failed:", e);
             caoReply += `\n\n❌ **Publishing error**: ${e.message}`;
          }
        }
      }
    }

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
