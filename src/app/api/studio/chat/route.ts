import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callSarvamChat } from "@/lib/sarvam";
import { isValuationIntent, parsePlotFromMessage } from "@/app/api/studio/valuate-plot/route";

export const runtime = "nodejs";
export const maxDuration = 90;

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

// Helper: format INR amounts
function formatCr(v: number): string {
  if (v >= 10_000_000) return `₹${(v / 10_000_000).toFixed(2)} Cr`;
  if (v >= 100_000)    return `₹${(v / 100_000).toFixed(2)} L`;
  return `₹${v.toLocaleString("en-IN")}`;
}

// Helper: call the valuation engine inline (no HTTP round-trip needed)
async function runValuationEngine(message: string, userId?: string): Promise<string> {
  try {
    const parsed = parsePlotFromMessage(message);
    const { POST: valuatePost } = await import("@/app/api/studio/valuate-plot/route");

    const body = JSON.stringify({
      userQuery: message,
      corridor:    parsed.corridor,
      areaSqFt:    parsed.areaSqFt,
      isCornerPlot: parsed.isCornerPlot,
      shape:       parsed.shape,
      location:    parsed.corridor || "Nagpur",
      userId,
    });

    const syntheticReq = new Request("http://localhost/api/studio/valuate-plot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    const res  = await valuatePost(syntheticReq);
    const data = await res.json();

    if (data.error) throw new Error(data.error);

    // ── Format structured response as a rich Markdown chat message ──────────
    const hasArea        = data.estimatedRangeLow > 0;
    const confidenceBadge = data.dataConfidence === "HIGH" ? "🟢 High" : data.dataConfidence === "MEDIUM" ? "🟡 Medium" : "🔴 Low";
    const signalMatch    = (data.analysisNarrative || "").match(/SIGNAL:\s*(BUY|HOLD|EVALUATE|SELL)/i);
    const signal         = signalMatch ? signalMatch[1] : (data.marketPremiumPct >= 10 ? "BUY" : data.marketPremiumPct >= 5 ? "HOLD" : "EVALUATE");
    const signalEmoji    = signal === "BUY" ? "🚀" : signal === "HOLD" ? "📊" : signal === "SELL" ? "⚠️" : "🔎";

    let reply = `## 🏗️ CAO Plot Valuation Report\n\n`;

    if (parsed.corridor) {
      reply += `**Corridor:** ${parsed.corridor} · **Circle Rate:** ₹${data.circleRate}/sqft · **Market Premium:** +${data.marketPremiumPct?.toFixed(1)}% above circle rate\n\n`;
    }

    if (hasArea) {
      reply += `### 📊 Value Estimate\n| Metric | Value |\n|---|---|\n`;
      reply += `| **Market Rate** | ₹${data.estimatedPPSF?.toLocaleString("en-IN")}/sqft |\n`;
      reply += `| **Estimated Range** | ${formatCr(data.estimatedRangeLow)} – ${formatCr(data.estimatedRangeHigh)} |\n`;
      reply += `| **⚡ Fast-Sell Price** | **${formatCr(data.fastSellPrice)}** |\n`;
      reply += `| Circle Rate (govt.) | ₹${data.circleRate}/sqft |\n\n`;
    } else {
      reply += `### 📊 Rate Estimate *(area not specified)*\n| Metric | Value |\n|---|---|\n`;
      reply += `| **Market Rate** | ₹${data.estimatedPPSF?.toLocaleString("en-IN")}/sqft |\n`;
      reply += `| Circle Rate | ₹${data.circleRate}/sqft |\n\n`;
      reply += `> ℹ️ *Provide plot area (sq ft / gunta / acres) for a total ₹ estimate.*\n\n`;
    }

    reply += `### ${signalEmoji} Signal: **${signal}**\n`;
    reply += `${(data.analysisNarrative || "").replace(/BOTTOM LINE:.*$/m, "").trim()}\n\n`;

    reply += `### ⚡ Fast-Sell Rationale\n${data.fastSellRationale}\n\n`;

    if (data.keyDrivers?.length) {
      reply += `### ✅ Key Value Drivers\n${data.keyDrivers.map((d: string) => `- ${d}`).join("\n")}\n\n`;
    }
    if (data.riskFactors?.length) {
      reply += `### ⚠️ Risk Factors\n${data.riskFactors.map((r: string) => `- ${r}`).join("\n")}\n\n`;
    }

    reply += `---\n**Data:** ${data.compsUsed} portal comps · ${data.liveSignals} live signals · Confidence: ${confidenceBadge}\n`;
    reply += `*Indicative estimate only. Verify with EC, RERA check, and a certified valuer before transacting.*`;

    return reply;

  } catch (e: any) {
    console.error("[Chat:Valuate] Error:", e.message);
    return `I tried the valuation engine but hit an error: ${e.message}. Try the **Plot Value Estimator** in the sidebar for a full analysis — it works offline too.`;
  }
}

// ── POST — main chat handler ─────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { message, userId } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // ── Valuation Intent Intercept ───────────────────────────────────────────
    if (isValuationIntent(message)) {
      console.log("[Chat] 🏗️ Valuation intent — routing to ValuateBot");

      const [valuationReply, brain] = await Promise.all([
        runValuationEngine(message, userId),
        userId
          ? prisma.contentBrain.findFirst({ where: { userId } })
          : prisma.contentBrain.findFirst({ orderBy: { updatedAt: "desc" } }),
      ]);

      const chatHistory: Array<{ role: string; content: string }> =
        Array.isArray(brain?.orchestratorChatHistory) ? (brain!.orchestratorChatHistory as any) : [];

      const updatedHistory = [
        ...chatHistory,
        { role: "user",      content: message },
        { role: "assistant", content: valuationReply },
      ].slice(-20);

      if (brain) {
        await prisma.contentBrain.update({
          where: { id: brain.id },
          data:  { orchestratorChatHistory: updatedHistory },
        });
      }

      return NextResponse.json({ reply: valuationReply, mode: "valuation", memoryUpdated: false });
    }

    // ── Standard Chat ────────────────────────────────────────────────────────
    const brain = userId
      ? await prisma.contentBrain.findFirst({ where: { userId } })
      : await prisma.contentBrain.findFirst({ orderBy: { updatedAt: "desc" } });

    const currentMemory = (brain?.orchestratorMemory as string) || DEFAULT_MEMORY;
    const chatHistory: Array<{ role: string; content: string }> =
      Array.isArray(brain?.orchestratorChatHistory) ? (brain?.orchestratorChatHistory as any) : [];

    const isRule = isPermanentInstruction(message);

    const systemPrompt = `You are the ContentSathi AI Co-Founder — a personal AI business partner for an Indian real estate content creator.
You are deeply intelligent, proactive, and speak in warm Hinglish (Hindi + English).

YOUR CORE MEMORY (soul.md):
---
${currentMemory}
---

${isRule ? `IMPORTANT: The user is giving a new permanent instruction. At the END of your response, add "[MEMORY_UPDATE]: <concise rule>". Do NOT include this in the visible response.` : ""}

Your capabilities:
- Content strategy, topics, schedules, audience insights
- Real estate market insights for Nagpur & Indian tier-2 cities
- 🏗️ Plot/land valuation — just describe a plot and say "value estimate" or "kitna milega"
- Dashboard and pipeline questions

Respond warmly, concisely, like a smart business partner. Use emojis occasionally.`;

    const historyContext = chatHistory
      .slice(-8)
      .map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content.substring(0, 300)}`)
      .join("\n");

    const fullPrompt = historyContext
      ? `Previous conversation:\n${historyContext}\n\nUser now says: ${message}`
      : message;

    let aiResponse = "";
    try {
      aiResponse = await callSarvamChat(systemPrompt, fullPrompt);
    } catch {
      aiResponse = "Maafi karo, AI abhi thoda busy hai! Ek baar phir try karo. 🙏";
    }

    // Extract memory update if present
    let memoryUpdated = false;
    let newRule = "";
    const memoryMarker = "[MEMORY_UPDATE]:";
    const markerIndex  = aiResponse.indexOf(memoryMarker);
    if (markerIndex !== -1) {
      newRule    = aiResponse.substring(markerIndex + memoryMarker.length).trim();
      aiResponse = aiResponse.substring(0, markerIndex).trim();
      const updatedMemory = `${currentMemory}\n- ${newRule}`;
      if (brain) {
        await prisma.contentBrain.update({
          where: { id: brain.id },
          data:  { orchestratorMemory: updatedMemory },
        });
      }
      memoryUpdated = true;
    }

    const updatedHistory = [
      ...chatHistory,
      { role: "user",      content: message },
      { role: "assistant", content: aiResponse },
    ].slice(-20);

    if (brain) {
      await prisma.contentBrain.update({
        where: { id: brain.id },
        data:  { orchestratorChatHistory: updatedHistory },
      });
    }

    return NextResponse.json({
      reply: aiResponse,
      memoryUpdated,
      newRule:       memoryUpdated ? newRule : undefined,
      currentMemory: memoryUpdated ? `${currentMemory}\n- ${newRule}` : currentMemory,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── GET & PATCH — unchanged ──────────────────────────────────────────────────

export async function GET() {
  try {
    const brain = await prisma.contentBrain.findFirst({
      orderBy: { updatedAt: "desc" },
      select:  { orchestratorMemory: true, orchestratorChatHistory: true },
    });
    return NextResponse.json({
      memory:      brain?.orchestratorMemory || DEFAULT_MEMORY,
      chatHistory: brain?.orchestratorChatHistory || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { memory } = await req.json();
    const brain = await prisma.contentBrain.findFirst({ orderBy: { updatedAt: "desc" } });
    if (brain) {
      await prisma.contentBrain.update({
        where: { id: brain.id },
        data:  { orchestratorMemory: memory },
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

### Valuation Rules
- When user asks for plot value / land estimate: trigger ValuateBot automatically
- Always cite circle rate + market premium when discussing land prices
- Fast-sell price = 12% below estimated market mid (standard liquidity discount)
- Always remind user to verify EC, title, and RERA before transacting

### Brand Voice
- Professional yet approachable
- Hindi/Marathi phrases add authenticity
- Story-based content performs best`;
