import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { callSarvamJSON } from "@/lib/sarvam";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/market-watch/hunt
 * Session-aware manual trigger for the Research Specialist (Hunter Mode).
 * Saves battle cards to the LOGGED-IN user's account, fixing the previous bug
 * where cards were saved to the system user and thus invisible in the UI.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { contentBrain: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const brain = user.contentBrain;
    const brandCtx = [
      brain?.brandDescription && `Brand: ${brain.brandDescription}`,
      brain?.audienceDescription && `Audience: ${brain.audienceDescription}`,
      brain?.tone && `Tone: ${brain.tone}`,
      brain?.contactPhone && `CTA Number: ${brain.contactPhone}`,
    ].filter(Boolean).join("\n") || "Nagpur real estate — focus on Saraswati Nagri plots for investors and families.";

    // ── Phase A: AI Market Intelligence ───────────────────────────────────────
    const researchSystem = `You are a deep market intelligence analyst for Nagpur real estate.
Simulate a real-time competitive scan of 99acres, MagicBricks, and local Instagram developer accounts in Nagpur.
Focus corridors: Wardha Road, Besa, MIHAN, Ring Road, Hingna Road.
Return a JSON object with these EXACT fields (valid JSON only):
{
  "viral_activity": "string — describe any hypothetical high-engagement competitor activity this week",
  "competitor_name": "string — generic competitor name or platform",
  "corridor": "string — which Nagpur corridor is most active",
  "competitor_focus": ["topic1", "topic2"],
  "content_gaps": ["gap1", "gap2"],
  "win_strategy": "string — what you should post to counter the competitor",
  "urgency_level": "high|medium|low"
}`;

    let competitorData: any = {
      viral_activity: "Multiple developers on Wardha Road are aggressively posting about pricing and limited inventory",
      competitor_name: "Wardha Road Developer Cluster",
      corridor: "Wardha Road",
      competitor_focus: ["price", "inventory scarcity"],
      content_gaps: ["rera_compliance", "infrastructure_connectivity", "investment_roi"],
      win_strategy: "Post about RERA approval, Ring Road & Metro connectivity and long-term ROI — competitors are ignoring trust-building",
      urgency_level: "high",
    };

    try {
      const res = await callSarvamJSON(researchSystem,
        `Simulate a competitive market scan for the current week in Nagpur real estate (March 2026). Brand Context: ${brandCtx}`,
        800
      );
      if (res?.corridor) competitorData = res;
    } catch { /* use fallback */ }

    // ── Phase B: Battle Card Generation ─────────────────────────────────────
    const battleCardSystem = `You are a master real estate copywriter for Nagpur.
Create TWO posts:
1. A punchy Hinglish Instagram post (Battle Card) that positions your brand above the competitor's angle.
   - Must start with a strong emotional hook
   - Reference the Nagpur corridor: ${competitorData.corridor}
   - Counter competitor angle: ${(competitorData.competitor_focus || []).join(", ")}
   - Focus on content gaps: ${(competitorData.content_gaps || []).join(", ")}
   - End with a WhatsApp CTA
2. The same concept in casual Nagpur Marathi.

Brand Info: ${brandCtx}

Return JSON:
{
  "hinglish_post": "string",
  "marathi_post": "string",
  "whatsapp_alert": "string — 40 words max, for the owner",
  "post_title": "string"
}`;

    let battleCard: any = {
      hinglish_post: `🚨 ${competitorData.corridor} pe competitor sirf price bata rahe hain — hum transparency dete hain!\n\n✅ RERA Approved — full clarity\n✅ Possession guaranteed — koi delay nahi\n✅ Ring Road + MIHAN — future growth assured\n\nAaj hi site visit book karo. Call: ${brain?.contactPhone || "98765-43210"}`,
      marathi_post: `🏠 ${competitorData.corridor} वर स्वप्नातलं घर — RERA मंजूर!\n\n✅ पूर्ण पारदर्शकता\n✅ ताबा हमी\n✅ Ring Road + MIHAN — भविष्यातील विकास\n\nआजच site visit बुक करा: ${brain?.contactPhone || "98765-43210"}`,
      whatsapp_alert: `🔍 Hunter Alert: ${competitorData.corridor} competitors posting only pricing. Battle card on RERA trust + infra drafted. Approve in dashboard.`,
      post_title: `Battle Card: RERA Trust vs ${competitorData.competitor_focus?.[0] || "Price"} War`,
    };

    try {
      const res = await callSarvamJSON(battleCardSystem,
        `Competitor Intelligence:\n${JSON.stringify(competitorData, null, 2)}`
      );
      if (res?.hinglish_post) battleCard = res;
    } catch { /* use fallback */ }

    // ── Phase C: Save to DB (correct user session) ───────────────────────────
    const [hinglishAsset] = await Promise.all([
      prisma.generatedAsset.create({
        data: {
          userId: user.id,
          type: "post",
          platform: "instagram",
          language: "hinglish",
          title: battleCard.post_title || "Market Watch Battle Card",
          body: battleCard.hinglish_post || "",
          notes: `Research Specialist (Hunter Mode) | Corridor: ${competitorData.corridor} | Gap: ${(competitorData.content_gaps || []).join(", ")}`,
          isGoldenExample: false,
          tags: ["battle_card", "hunter_agent", competitorData.corridor?.toLowerCase().replace(/\s/g, "_") || "nagpur"],
        },
      }),
      prisma.generatedAsset.create({
        data: {
          userId: user.id,
          type: "post",
          platform: "instagram",
          language: "marathi",
          title: `[Marathi] ${battleCard.post_title || "Market Watch Battle Card"}`,
          body: battleCard.marathi_post || "",
          notes: `Research Specialist (Hunter Mode) | Corridor: ${competitorData.corridor}`,
          isGoldenExample: false,
          tags: ["battle_card", "hunter_agent", "marathi"],
        },
      }),
    ]);

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
        staged_asset_id: hinglishAsset.id,
        whatsapp_alert_sent: false,
      },
    });
  } catch (error: any) {
    console.error("Hunter POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
