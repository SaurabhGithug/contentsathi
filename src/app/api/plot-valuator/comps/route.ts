/**
 * GET /api/plot-valuator/comps?corridor=MIHAN&limit=20
 *
 * Returns PlotComparable records from the DB for a given corridor.
 * These are sourced from 99acres, MagicBricks, Housing.com, and local
 * developer sites via the Apify property portal scraper.
 *
 * POST /api/plot-valuator/comps
 * Body: { corridor, city? }
 * Triggers a fresh Apify scrape for that corridor and saves results to DB.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  scrapePropertyPortals,
  scrapeLocalDevSites,
  saveComparablesToDB,
} from "@/lib/apify-master-scraper";

import type { Session } from "next-auth";

// Type-safe session helper — handles next-auth's typed overloads
function getUserId(session: Session | null): string | null {
  return (session?.user as any)?.id ?? null;
}

// ── GET — fetch comps from DB ─────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const corridor = searchParams.get("corridor") || "";
  const limit    = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const minPPSF  = parseFloat(searchParams.get("minPPSF") || "0");
  const maxPPSF  = parseFloat(searchParams.get("maxPPSF") || "999999");

  try {
    const comps = await prisma.plotComparable.findMany({
      where: {
        userId,
        isActive: true,
        ...(corridor ? { corridor: { contains: corridor, mode: "insensitive" as const } } : {}),
        pricePerSqFt: {
          gte: minPPSF > 0 ? minPPSF : undefined,
          lte: maxPPSF < 999999 ? maxPPSF : undefined,
          not: null,
        },
      },
      orderBy: { scrapedAt: "desc" },
      take: limit,
      select: {
        id: true,
        corridor: true,
        locality: true,
        title: true,
        description: true,
        areaSqFt: true,
        priceTotal: true,
        pricePerSqFt: true,
        priceLabel: true,
        possessionStatus: true,
        source: true,
        sourceUrl: true,
        reraNumber: true,
        tags: true,
        isVerified: true,
        scrapedAt: true,
        postedAt: true,
      },
    });

    const ppsfValues = comps.map((c) => c.pricePerSqFt ?? 0).filter(Boolean);

    // Compute corridor stats
    const stats = {
      count: comps.length,
      avgPricePerSqFt: ppsfValues.length > 0
        ? Math.round(ppsfValues.reduce((s: number, v: number) => s + v, 0) / ppsfValues.length)
        : null,
      minPricePerSqFt: ppsfValues.length > 0 ? Math.min(...ppsfValues) : null,
      maxPricePerSqFt: ppsfValues.length > 0 ? Math.max(...ppsfValues) : null,
      lastScraped: comps[0]?.scrapedAt || null,
      sources: Array.from(new Set(comps.map((c) => c.source))),
    };

    return NextResponse.json({ comps, stats });
  } catch (error: any) {
    console.error("[PlotComps:GET] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── POST — trigger fresh scrape for a corridor ────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const corridor     = body.corridor || "MIHAN";
  const city         = body.city || "Nagpur";
  const localDevUrls = body.localDevUrls || [];

  console.log(`[PlotComps:POST] Refresh triggered for corridor=${corridor} by userId=${userId}`);

  try {
    // Run portal scrape + local site scrape in parallel
    const [portalListings, localListings] = await Promise.allSettled([
      scrapePropertyPortals(corridor, city, 20),
      scrapeLocalDevSites(localDevUrls, corridor),
    ]);

    const allListings = [
      ...(portalListings.status === "fulfilled" ? portalListings.value : []),
      ...(localListings.status === "fulfilled"  ? localListings.value  : []),
    ];

    const result = await saveComparablesToDB(userId, allListings);

    return NextResponse.json({
      success: true,
      corridor,
      totalScraped: allListings.length,
      saved: result.saved,
      skipped: result.skipped,
      message: result.saved > 0
        ? `✅ ${result.saved} new comparables saved from 99acres, MagicBricks & local sites.`
        : `ℹ️ No new listings found (${result.skipped} already in DB). Try a different corridor or check back later.`,
    });
  } catch (error: any) {
    console.error("[PlotComps:POST] Scrape error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
