/**
 * ════════════════════════════════════════════════════════════════════
 *  CAO PLOT VALUATION ENGINE — /api/studio/valuate-plot
 *
 *  Orchestrates 4 sub-agents in parallel for a complete land analysis:
 *
 *  1. MARKET HUNT AGENT   — pulls live Market Intelligence + portal comps from DB
 *  2. SEARCH AGENT        — Tavily web search for corridor news, infra, zoning
 *  3. COMP ANALYSIS AGENT — applies Sales Comparison Method from the primer
 *  4. CAO SYNTHESIS AGENT — final analysis: value range + fast-sell price + brief
 *
 *  Called by the Direct Line to CAO chat interface when a valuation
 *  intent is detected, and directly from the Plot Valuator page.
 * ════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { callSarvamChat } from "@/lib/ai/sarvam";
import { searchWeb } from "@/lib/intelligence/tavily";
import { isValuationIntent, parsePlotFromMessage, ValuationRequest } from "@/lib/utils/valuation";

export const runtime = "nodejs";
export const maxDuration = 90; // Allow up to 90s for full orchestration

// ── Valuation Request Schema ─────────────────────────────────────────────────

// Valuation types are now in src/lib/valuation.ts

export type ValuationOutput = {
  // Valuation
  estimatedRangeLow: number;   // INR
  estimatedRangeHigh: number;  // INR
  estimatedPPSF: number;       // ₹/sqft
  fastSellPrice: number;       // INR — typically 8-12% below market mid
  circleRate?: number;         // corridor circle rate (₹/sqft)
  marketPremiumPct?: number;   // % above circle rate

  // Narrative
  analysisNarrative: string;   // 3-4 paragraph investor brief
  keyDrivers: string[];        // bullet list of top value drivers
  riskFactors: string[];       // bullet list of risks / deductions
  fastSellRationale: string;  // why this fast-sell price

  // Data quality
  compsUsed: number;
  liveSignals: number;
  dataConfidence: "HIGH" | "MEDIUM" | "LOW";
  scrapedAt: string;
};

// Intent Detector and Parsers are now in src/lib/valuation.ts

// ── Corridor Benchmark Data (same as the Plot Valuator UI) ───────────────────

const CORRIDOR_DATA: Record<string, { circleRate: number; marketMult: number; trend: string }> = {
  "Wardha Road":      { circleRate: 3200, marketMult: 1.18, trend: "+12% YoY" },
  "Besa":             { circleRate: 2400, marketMult: 1.22, trend: "+9% YoY"  },
  "MIHAN / SEZ":      { circleRate: 2800, marketMult: 1.35, trend: "+21% YoY" },
  "Ring Road":        { circleRate: 3000, marketMult: 1.25, trend: "+15% YoY" },
  "Hingna Road":      { circleRate: 1800, marketMult: 1.15, trend: "+7% YoY"  },
  "Saraswati Nagri":  { circleRate: 2200, marketMult: 1.28, trend: "+18% YoY" },
  "Godni":            { circleRate: 1600, marketMult: 1.12, trend: "+5% YoY"  },
  "Katol Road":       { circleRate: 2000, marketMult: 1.20, trend: "+9% YoY"  },
  "Umred Road":       { circleRate: 1500, marketMult: 1.15, trend: "+15% YoY" },
  "Khamla":           { circleRate: 3500, marketMult: 1.10, trend: "+6% YoY"  },
  "Dharampeth":       { circleRate: 4500, marketMult: 1.08, trend: "+5% YoY"  },
  "Sitabuldi":        { circleRate: 4000, marketMult: 1.05, trend: "+3% YoY"  },
};

// ── Main Orchestrator ─────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userQuery,
      areaSqFt,
      corridor: corridorInput,
      location,
      shape,
      frontageRoad,
      isCornerPlot,
      utilities,
      zoning,
      titleStatus,
      nearbyDevelopments,
      userId,
    } = body as ValuationRequest & { userId?: string };

    if (!userQuery && !location) {
      return NextResponse.json({ error: "userQuery or location required" }, { status: 400 });
    }

    // Deduce details from free text if not provided
    const parsed = parsePlotFromMessage(userQuery || location || "");
    const corridor = corridorInput || parsed.corridor || "Wardha Road";
    const area     = areaSqFt || parsed.areaSqFt;
    const corData  = CORRIDOR_DATA[corridor] || { circleRate: 2500, marketMult: 1.20, trend: "~10% YoY" };

    console.log(`[ValuateBot] 🚀 Starting valuation for "${corridor}" — ${area || "?"}sqft`);

    // ── PHASE 1: Parallel data gathering ─────────────────────────────────────
    const [dbCompsResult, webSignalsResult, marketIntelResult] = await Promise.allSettled([

      // Sub-agent 1: Pull comp data from DB (populated by Market Hunt Apify scraper)
      (async () => {
        const comps = await prisma.plotComparable.findMany({
          where: {
            corridor: { contains: corridor, mode: "insensitive" as const },
            isActive: true,
            pricePerSqFt: { not: null },
          },
          orderBy: { scrapedAt: "desc" },
          take: 10,
          select: { pricePerSqFt: true, areaSqFt: true, title: true, source: true, scrapedAt: true, tags: true },
        });
        return comps;
      })(),

      // Sub-agent 2: Live web search (Tavily) — corridor news, infra, zoning
      searchWeb(
        `${corridor} Nagpur plot land price 2026 infrastructure development real estate`,
        "advanced",
        true
      ).catch(() => ({ results: [] as any[] })),

      // Sub-agent 3: Recent Market Intelligence signals from DB
      (async () => {
        const uid = userId || undefined;
        const signals = await prisma.marketIntelligence.findMany({
          where: {
            ...(uid ? { userId: uid } : {}),
            content: { contains: corridor.split(" ")[0], mode: "insensitive" as const },
          },
          orderBy: { scrapedAt: "desc" },
          take: 5,
          select: { content: true, platform: true, likes: true, scrapedAt: true },
        });
        return signals;
      })(),
    ]);

    const dbComps = dbCompsResult.status === "fulfilled" ? dbCompsResult.value : [];
    const webResults = webSignalsResult.status === "fulfilled" ? webSignalsResult.value?.results || [] : [];
    const marketSignals = marketIntelResult.status === "fulfilled" ? marketIntelResult.value : [];

    // ── PHASE 2: Comp Analysis ────────────────────────────────────────────────

    // Compute avg ₹/sqft from DB comps
    const compPrices = dbComps.map((c) => c.pricePerSqFt as number).filter(Boolean);
    const avgCompPPSF = compPrices.length > 0
      ? compPrices.reduce((a: number, b: number) => a + b, 0) / compPrices.length
      : corData.circleRate * corData.marketMult;

    // Apply plot-specific adjustments
    let adjustmentPct = 0;
    const adjustmentsApplied: string[] = [];

    if (isCornerPlot || parsed.isCornerPlot || (userQuery || "").toLowerCase().includes("corner")) {
      adjustmentPct += 8; adjustmentsApplied.push("Corner plot +8%");
    }
    if ((frontageRoad || "").toLowerCase().includes("main road") || (userQuery || "").toLowerCase().includes("main road")) {
      adjustmentPct += 5; adjustmentsApplied.push("Road-facing +5%");
    }
    if ((corridor === "MIHAN / SEZ") || (userQuery || "").toLowerCase().includes("mihan") || (userQuery || "").toLowerCase().includes("sez")) {
      adjustmentPct += 15; adjustmentsApplied.push("MIHAN/SEZ belt +15%");
    }
    if ((shape === "Irregular") || (userQuery || "").toLowerCase().includes("irregular")) {
      adjustmentPct -= 8; adjustmentsApplied.push("Irregular shape -8%");
    }
    if ((userQuery || "").toLowerCase().includes("waterlog") || (userQuery || "").toLowerCase().includes("flood")) {
      adjustmentPct -= 12; adjustmentsApplied.push("Waterlogging risk -12%");
    }
    if ((userQuery || "").toLowerCase().includes("encumbrance") || (userQuery || "").toLowerCase().includes("title issue")) {
      adjustmentPct -= 20; adjustmentsApplied.push("Title/encumbrance issue -20%");
    }
    if ((userQuery || "").toLowerCase().includes("metro") || (userQuery || "").toLowerCase().includes("airport")) {
      adjustmentPct += 12; adjustmentsApplied.push("Metro/Airport proximity +12%");
    }
    if ((userQuery || "").toLowerCase().includes("rera")) {
      adjustmentPct += 3; adjustmentsApplied.push("RERA registered +3%");
    }
    if (!(utilities || "").toLowerCase().includes("water") && !(userQuery || "").toLowerCase().includes("water")) {
      // no deduction if utilities not mentioned — don't penalise
    }

    const subjectPPSF    = avgCompPPSF * (1 + adjustmentPct / 100);
    const estimatedMid   = area ? subjectPPSF * area : 0;
    const estimatedLow   = estimatedMid * 0.92;
    const estimatedHigh  = estimatedMid * 1.10;
    const fastSellPrice  = estimatedMid * 0.88; // 12% below mid — industry standard for quick sale
    const circleRateVal  = area ? corData.circleRate * area : 0;
    const marketPremium  = ((subjectPPSF - corData.circleRate) / corData.circleRate) * 100;

    // ── PHASE 3: CAO Synthesis — Sarvam reasoning mode ───────────────────────

    const webSummary = webResults.slice(0, 4).map((r: { title: string; content?: string }) => `• ${r.title}: ${(r.content || "").substring(0, 120)}`).join("\n");
    const signalSummary = marketSignals.slice(0, 3).map((s: { platform: string; content: string }) => `• [${s.platform}] ${s.content.substring(0, 100)}`).join("\n");
    const compSummary = dbComps.slice(0, 5).map((c) => `• ${c.title || "Listed plot"}: ₹${c.pricePerSqFt}/sqft (${c.source})`).join("\n");
    const dataConfidence: "HIGH" | "MEDIUM" | "LOW" = dbComps.length >= 5 ? "HIGH" : dbComps.length >= 2 ? "MEDIUM" : "LOW";

    const analysisPrompt = `You are the CAO (Chief AI Officer) of ContentSathi — an elite real estate intelligence engine specialised in Nagpur, Maharashtra. A client has asked you to value their plot and suggest a fast-selling price.

PLOT DETAILS (extracted from client query):
- Location: ${location || corridor}, Nagpur
- Corridor: ${corridor}
- Area: ${area ? `${area} sq ft (≈ ${(area / 10.764).toFixed(0)} sq m)` : "Not specified — use corridor averages"}
- Shape: ${parsed.shape || shape || "Not specified"}
- Corner Plot: ${isCornerPlot || parsed.isCornerPlot ? "Yes" : "Not mentioned"}
- Road/Frontage: ${frontageRoad || "Not specified"}
- Utilities: ${utilities || "Standard (assumed available)"}
- Zoning: ${zoning || "Residential (assumed)"}
- Title Status: ${titleStatus || "Not specified"}
- Nearby Developments: ${nearbyDevelopments || "Not explicitly mentioned"}
- Client's Full Query: "${userQuery}"

MARKET DATA (from live scrape + portal comps):
Circle Rate (FY25-26): ₹${corData.circleRate}/sqft
Corridor Appreciation: ${corData.trend}
DB Comp Average: ₹${Math.round(avgCompPPSF)}/sqft (from ${dbComps.length} listings on 99acres/MagicBricks)
Adjustments Applied: ${adjustmentsApplied.join(", ") || "None (standard market rate used)"}
Net Subject ₹/sqft (post adjustment): ₹${Math.round(subjectPPSF)}
${area ? `Estimated Market Value: ₹${(estimatedLow / 100000).toFixed(2)}L – ₹${(estimatedHigh / 100000).toFixed(2)}L` : "Area not provided — provide ₹/sqft range only"}
${area ? `Fast-Sell Price: ₹${(fastSellPrice / 100000).toFixed(2)}L (12% below market mid = standard liquidity discount)` : ""}
Market Premium over Circle Rate: ${marketPremium.toFixed(1)}%

RECENT WEB INTELLIGENCE (from Market Hunt):
${webSummary || "No web signals captured in this run."}

MARKET SIGNALS (from social + portal scrape):
${signalSummary || "No social signals available for this corridor."}

COMPARABLE LISTINGS IN DB:
${compSummary || "No portal comps in DB for this corridor yet. Using corridor averages."}

TASK — Write a professional land valuation analysis in 3-4 tight paragraphs:
1. Corridor fundamentals and current pricing context (cite specific data above)
2. Plot-specific value drivers and deductions (reference adjustmentsApplied above)
3. Risk factors and unknowns (title, utilities, shape) that the buyer must verify
4. Final line: recommended market value range${area ? ` and fast-sell price (₹${(fastSellPrice / 100000).toFixed(2)}L), with rationale` : ""}

Tone: Professional English with occasional Hinglish phrase. Written for an HNI investor or NRI buyer. Be direct — no fluff, no hedging beyond genuine uncertainties. End with 1 line: BOTTOM LINE: [market value] | FAST-SELL: [price] | SIGNAL: BUY/HOLD/EVALUATE`;

    let analysisNarrative = "";
    try {
      analysisNarrative = await callSarvamChat(
        "You are the CAO — Chief AI Officer — of ContentSathi, an expert Nagpur real estate intelligence engine. You reason sharply, cite data precisely, and give clear investor-grade advice.",
        analysisPrompt,
        1200 // allow richer detail
      );
    } catch (e: any) {
      analysisNarrative = `Analysis unavailable: ${e.message}. Use the computed figures: ₹${Math.round(subjectPPSF)}/sqft, estimated range ₹${(estimatedLow / 100000).toFixed(2)}L – ₹${(estimatedHigh / 100000).toFixed(2)}L.`;
    }

    // Extract structured key drivers / risks from Sarvam if possible
    const keyDrivers: string[] = [
      ...adjustmentsApplied,
      `Corridor trend: ${corData.trend}`,
      ...(dbComps.length > 0 ? [`${dbComps.length} portal comps support ₹${Math.round(avgCompPPSF)}/sqft avg`] : []),
      ...(webResults.length > 0 ? ["Live infrastructure news factored in"] : []),
    ];
    const riskFactors: string[] = [
      "Title / EC not verified — obtain 15-year EC before offer",
      "Circle rate compliance required for stamp duty — cannot understate",
      ...(dbComps.length < 3 ? ["Limited comp data — widen search or get local broker opinion"] : []),
      ...(adjustmentsApplied.includes("Irregular shape -8%") ? ["Shape irregularity reduces usable FSI — factor in construction cost"] : []),
    ];

    // ── Response ──────────────────────────────────────────────────────────────

    const output: ValuationOutput = {
      estimatedRangeLow:  Math.round(estimatedLow),
      estimatedRangeHigh: Math.round(estimatedHigh),
      estimatedPPSF:      Math.round(subjectPPSF),
      fastSellPrice:      Math.round(fastSellPrice),
      circleRate:         corData.circleRate,
      marketPremiumPct:   Math.round(marketPremium * 10) / 10,
      analysisNarrative,
      keyDrivers,
      riskFactors,
      fastSellRationale:  "12% discount from market mid — standard Indian real estate liquidity discount for a 60-90 day sale. Attracts serious buyers without appearing distressed.",
      compsUsed:          dbComps.length,
      liveSignals:        webResults.length + marketSignals.length,
      dataConfidence,
      scrapedAt:          new Date().toISOString(),
    };

    console.log(`[ValuateBot] ✅ Done. Confidence=${dataConfidence}, comps=${dbComps.length}, signals=${webResults.length}`);

    return NextResponse.json(output);

  } catch (error: any) {
    console.error("[ValuateBot] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
