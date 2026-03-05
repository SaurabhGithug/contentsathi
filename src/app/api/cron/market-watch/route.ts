import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callSarvamChat, callSarvamJSON } from "@/lib/sarvam";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const maxDuration = 60; // Allow up to 60s for deep research

// GET /api/cron/market-watch
// Triggered every 6 hours by Vercel Cron or manually via WhatsApp
// Phase A: Scrape competitor landscape (simulated via AI deep read)
// Phase B: Find content gaps → generate Battle Card
// Phase C: Alert user via WhatsApp + stage post in DB

export async function GET(req: Request) {
  const authHeader = req.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;
  const isManual = req.headers.get("x-manual-trigger") === "true";
  
  if (!isManual && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get admin/primary user with connected WhatsApp
    const user = await prisma.user.findFirst({
      orderBy: { updatedAt: "desc" },
      include: { contentBrain: true, socialAccounts: true },
    });

    if (!user) return NextResponse.json({ error: "No user found" }, { status: 404 });

    const brain = user.contentBrain;
    const brandCtx = [
      brain?.brandDescription && `Brand: ${brain.brandDescription}`,
      brain?.audienceDescription && `Audience: ${brain.audienceDescription}`,
      brain?.tone && `Tone: ${brain.tone}`,
      brain?.contactPhone && `CTA Number: ${brain.contactPhone}`,
    ].filter(Boolean).join("\n");

    // ── Phase A: Competitor Intelligence via AI Research ─────────────────
    const researchSystem = `You are a deep market intelligence analyst for Nagpur real estate.
Your job: simulate a real-time competitive scan of 99acres, MagicBricks, and local Instagram developer accounts in Nagpur.
Focus corridors: Wardha Road, Besa, MIHAN, Ring Road, Hingna Road.
Return a JSON object with these EXACT fields:
{
  "viral_activity": "string — describe any hypothetical high-engagement competitor activity",
  "competitor_name": "string — generic competitor name or platform",
  "corridor": "string — which Nagpur corridor is active",
  "competitor_focus": ["topic1", "topic2"],
  "content_gaps": ["gap1", "gap2"],
  "win_strategy": "string — what you should post to counter",
  "urgency_level": "high|medium|low"
}
Return valid JSON only.`;

    const researchPrompt = `Simulate a compete market scan for the current week in Nagpur real estate (March 2026).
Brand Context: ${brandCtx}
Identify the most active competitor pattern, what they are NOT covering, and recommend a counter strategy.`;

    let competitorData: any = {};
    try {
      competitorData = await callSarvamJSON(researchSystem, researchPrompt, 800);
    } catch {
      competitorData = {
        viral_activity: "Multiple developers on Wardha Road are posting about pricing and limited inventory",
        competitor_name: "Wardha Road Developer Cluster",
        corridor: "Wardha Road",
        competitor_focus: ["price", "inventory"],
        content_gaps: ["rera_compliance", "infrastructure", "investment_roi"],
        win_strategy: "Post about RERA approval, infrastructure connectivity and long-term ROI — competitors are ignoring trust-building",
        urgency_level: "high"
      };
    }

    // ── Phase B: Battle Card Generation ──────────────────────────────────
    const battleCardSystem = `You are a master real estate copywriter for Nagpur.
Create TWO posts:
1. A punchy Hinglish Instagram post (Battle Card) that positions your brand above the competitor's angle.
2. The same concept in casual Nagpur Marathi.

Both must:
- Start with a strong emotional hook
- Reference the specific Nagpur corridor: ${competitorData.corridor || "Wardha Road"}
- Counter the competitor angle: ${(competitorData.competitor_focus || []).join(", ")}
- Focus on: ${(competitorData.content_gaps || ["RERA compliance"]).join(", ")}
- End with a WhatsApp CTA

Brand Info: ${brandCtx}

Return JSON:
{
  "hinglish_post": "string",
  "marathi_post": "string",
  "whatsapp_alert": "string — 40 words max for the owner",
  "post_title": "string"
}`;

    let battleCard: any = {};
    try {
      battleCard = await callSarvamJSON(battleCardSystem, `Competitor Post Strategy:\n${JSON.stringify(competitorData, null, 2)}`);
    } catch {
      battleCard = {
        hinglish_post: `🚨 Wardha Road pe competitor sirf price bata rahe hain — hum transparency dete hain!\n\n✅ RERA Approved — full clarity\n✅ Possession guaranteed — koi delay nahi\n✅ Ring Road + MIHAN — future growth assured\n\nAaj hi site visit book karo. Call karo: ${brain?.contactPhone || "98765-43210"}`,
        marathi_post: `🏠 Wardha Road वर स्वप्नातलं घर — RERA मंजूर!\n\n✅ पूर्ण पारदर्शकता\n✅ ताबा हमी\n✅ Ring Road + MIHAN — भविष्यातील विकास\n\nआजंच site visit बुक करा: ${brain?.contactPhone || "98765-43210"}`,
        whatsapp_alert: `🔍 Hunter Alert: Wardha Road competitors posting only about pricing. Battle card drafted highlighting RERA & infrastructure. Check dashboard to approve.`,
        post_title: "Battle Card: RERA Trust vs Price War"
      };
    }

    // ── Phase C: Stage Battle Card in DB ─────────────────────────────────
    const stagedAsset = await (prisma as any).generatedAsset.create({
      data: {
        userId: user.id,
        type: "post",
        platform: "instagram",
        language: "hinglish",
        title: battleCard.post_title || "Market Watch Battle Card",
        body: battleCard.hinglish_post || "",
        notes: `Generated by Hunter Agent | Corridor: ${competitorData.corridor} | Gap: ${(competitorData.content_gaps || []).join(", ")}`,
        isGoldenExample: false,
        tags: ["battle_card", "hunter_agent", competitorData.corridor?.toLowerCase().replace(/\s/g, "_") || "nagpur"],
      }
    }).catch((e: any) => { console.error(e); return null; }); // non-fatal

    // Stage Marathi version too
    await (prisma as any).generatedAsset.create({
      data: {
        userId: user.id,
        type: "post",
        platform: "instagram",
        language: "marathi",
        title: `[Marathi] ${battleCard.post_title || "Market Watch Battle Card"}`,
        body: battleCard.marathi_post || "",
        notes: `Generated by Hunter Agent | Corridor: ${competitorData.corridor} | Gap: ${(competitorData.content_gaps || []).join(", ")}`,
        tags: ["battle_card", "hunter_agent", "marathi"],
      }
    }).catch((e: any) => { console.error(e); return null; }); // non-fatal

    // ── Phase D: WhatsApp Alert to owner ─────────────────────────────────
    let wpAlertSent = false;
    const whatsappAccount = user.socialAccounts?.find(
      (a: any) => a.platform === "whatsapp" && a.isActive
    );
    
    if (whatsappAccount?.accountId && process.env.WHATSAPP_PHONE_NUMBER_ID) {
      try {
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
        await fetch(
          `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: whatsappAccount.accountId,
              type: "text",
              text: {
                body: `🤖 *Gravity Claw — Market Watch Alert*\n\n${battleCard.whatsapp_alert}\n\n🔗 View & approve at: ${process.env.NEXTAUTH_URL || "http://localhost:3001"}/market-watch`,
              },
            }),
          }
        );
        wpAlertSent = true;
      } catch (e) {
        console.error("WA notification error:", e);
      }
    }

    // ── Phase E: Update memory/market_data.json (local dev) ──────────────
    try {
      const memoryPath = path.join(process.cwd(), "memory", "market_data.json");
      if (fs.existsSync(memoryPath)) {
        const memData = JSON.parse(fs.readFileSync(memoryPath, "utf-8"));
        memData.last_updated = new Date().toISOString();
        memData.scan_history = [
          {
            timestamp: new Date().toISOString(),
            corridor: competitorData.corridor,
            gaps_found: competitorData.content_gaps,
            battle_card_title: battleCard.post_title
          },
          ...(memData.scan_history || []).slice(0, 9) // Keep last 10
        ];
        memData.battle_cards_generated = [
          ...(memData.battle_cards_generated || []),
          { timestamp: new Date().toISOString(), title: battleCard.post_title, corridor: competitorData.corridor }
        ].slice(-20);
        fs.writeFileSync(memoryPath, JSON.stringify(memData, null, 2));
      }
    } catch { /* non-fatal in prod */ }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      scan: {
        corridor: competitorData.corridor,
        competitor_activity: competitorData.viral_activity,
        gaps_found: competitorData.content_gaps,
        urgency: competitorData.urgency_level,
      },
      battle_card: {
        title: battleCard.post_title,
        staged_asset_id: stagedAsset?.id || null,
        whatsapp_alert_sent: wpAlertSent,
      }
    });

  } catch (error: any) {
    console.error("Market Watch Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — Manual trigger from WhatsApp command or web UI
export async function POST(req: Request) {
  const { corridor, userId: requestUserId } = await req.json().catch(() => ({}));
  return GET(new Request(req.url, {
    headers: { ...req.headers, "x-corridor": corridor || "all" }
  }));
}
