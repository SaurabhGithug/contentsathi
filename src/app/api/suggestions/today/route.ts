import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { addDays, startOfDay, endOfDay, subDays } from "date-fns";

// ── 7 Content Pillars ─────────────────────────────────────────────────────
const PILLARS = [
  { id: "trust", label: "Trust Building", angle: "Why buy from me — credibility" },
  { id: "authority", label: "Market Insight", angle: "Industry knowledge — position as expert" },
  { id: "proof", label: "Social Proof", angle: "Customer stories — build credibility" },
  { id: "listing", label: "Property Showcase", angle: "Direct listing with USPs" },
  { id: "expertise", label: "Expert Tip", angle: "Education — position as advisor" },
  { id: "relevance", label: "Local / Timely", angle: "City-specific or event-based content" },
  { id: "conversion", label: "Direct CTA", angle: "Clear call to action — site visit, call" },
];

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await (prisma.user as any).findUnique({
      where: { email: session.user.email },
      include: { contentBrain: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const now = new Date();
    const suggestions: any[] = [];

    // ═══════════════════════════════════════════════════════════════════════
    // PRIORITY 1 — Festival / Event (Highest engagement)
    // ═══════════════════════════════════════════════════════════════════════
    const twoWeeksLater = addDays(now, 14);
    const upcomingFestivals = await (prisma as any).festivalCalendar.findMany({
      where: {
        date: { gte: startOfDay(now), lte: endOfDay(twoWeeksLater) },
      },
      orderBy: { date: "asc" },
      take: 2,
    });

    for (const festival of upcomingFestivals) {
      const daysAway = Math.ceil(
        (festival.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      const isWeekend = [0, 6].includes(now.getDay());

      suggestions.push({
        id: `fest-${festival.id}`,
        type: "festival",
        title: daysAway <= 3 ? `🔥 ${festival.name} — Post TODAY!` : `${festival.name} Coming Up`,
        description:
          festival.contentAngle ||
          `${festival.name} is ${daysAway} days away. Great time for a special offer post!`,
        urgency: daysAway <= 3 ? "high" : "medium",
        topic: festival.suggestedTopics?.[0] || `${festival.name} special offer for your property`,
        platform: "Instagram",
        festivalTag: festival.name,
        pillar: "relevance",
      });

      if (suggestions.length >= 1) break; // Only 1 festival suggestion max
    }

    // If it's a weekend and no festival, add a weekend suggestion
    if ([0, 6].includes(now.getDay()) && suggestions.length === 0) {
      const location = user.contentBrain?.location || "your city";
      suggestions.push({
        id: "weekend-1",
        type: "timely",
        title: "🗓️ Weekend Site Visit Post",
        description: `Weekends get highest engagement for site visit CTAs. Post a "Visit us this weekend" CTA.`,
        urgency: "high",
        topic: `Weekend special — free site visit for properties in ${location}`,
        platform: "Instagram",
        pillar: "conversion",
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PRIORITY 2 — Trend-Based / Market Watch
    // ═══════════════════════════════════════════════════════════════════════
    if (suggestions.length < 3 && user.contentBrain?.location) {
      const location = user.contentBrain.location;
      const isNagpur = location.toLowerCase().includes("nagpur");

      if (isNagpur) {
        const localities = await (prisma as any).nagpurLocality.findMany({ take: 6 });
        const randomLoc = localities[Math.floor(Math.random() * localities.length)];

        if (randomLoc) {
          suggestions.push({
            id: `market-${randomLoc.id}`,
            type: "market_insight",
            title: `📈 ${randomLoc.name} Growth Story`,
            description: `${randomLoc.name} showing ${randomLoc.appreciationYoY} YoY appreciation. ${randomLoc.upcomingInfra?.[0] || "New infrastructure coming up."}`,
            urgency: "medium",
            topic: `Why ${randomLoc.name} in Nagpur is the smartest investment right now — ${randomLoc.appreciationYoY} growth`,
            platform: "LinkedIn",
            pillar: "authority",
          });
        }
      } else {
        suggestions.push({
          id: "market-general",
          type: "market_insight",
          title: `📈 ${location} Market Update`,
          description: `Share local market insights to position yourself as the city expert.`,
          urgency: "medium",
          topic: `Why ${location} real estate is booming — what buyers need to know right now`,
          platform: "LinkedIn",
          pillar: "authority",
        });
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PRIORITY 3 — Content Gap Detection
    // ═══════════════════════════════════════════════════════════════════════
    if (suggestions.length < 3) {
      const sevenDaysAgo = subDays(now, 7);

      // Find which pillars were used in the last 7 days
      const recentSuggestions = await (prisma.contentSuggestion as any).findMany({
        where: {
          userId: user.id,
          wasUsed: true,
          usedAt: { gte: sevenDaysAgo },
        },
        select: { pillar: true },
      });

      const usedPillars = new Set(recentSuggestions.map((s: any) => s.pillar).filter(Boolean));

      // Find the missing pillar with highest priority
      const missingPillar = PILLARS.find((p) => !usedPillars.has(p.id));

      if (missingPillar) {
        const location = user.contentBrain?.location || "your city";
        const propType = user.contentBrain?.propertyType || "property";

        const pillarTopics: Record<string, string> = {
          trust: `Why customers trust us for ${propType} in ${location}`,
          authority: `${location} real estate market update — expert analysis`,
          proof: `Customer success story — how they found their dream ${propType}`,
          listing: `Featured ${propType} available now in ${location}`,
          expertise: `Top 5 mistakes to avoid when buying ${propType} in ${location}`,
          relevance: `What makes ${location} special for family living`,
          conversion: `Last few ${propType} remaining — schedule your site visit now`,
        };

        suggestions.push({
          id: `gap-${missingPillar.id}`,
          type: "content_gap",
          title: `💡 Missing: ${missingPillar.label}`,
          description: `You haven't posted a ${missingPillar.label.toLowerCase()} post in 7+ days. This keeps your content balanced.`,
          urgency: "medium",
          topic: pillarTopics[missingPillar.id] || `${missingPillar.angle} for ${location}`,
          platform: missingPillar.id === "authority" ? "LinkedIn" : "Instagram",
          pillar: missingPillar.id,
        });
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PRIORITY 4 — Rotation Engine (Fallback)
    // ═══════════════════════════════════════════════════════════════════════
    if (suggestions.length < 3) {
      // Get yesterday's pillar to avoid repetition
      const yesterdayStart = startOfDay(subDays(now, 1));
      const yesterdayEnd = endOfDay(subDays(now, 1));

      const yesterdaySugs = await (prisma.contentSuggestion as any).findMany({
        where: {
          userId: user.id,
          date: { gte: yesterdayStart, lte: yesterdayEnd },
        },
        select: { pillar: true },
        take: 3,
      });

      const yesterdayPillars = new Set(yesterdaySugs.map((s: any) => s.pillar).filter(Boolean));
      const usedPillarIds = new Set(suggestions.map((s) => s.pillar));

      // Pick pillars not used yesterday and not already in suggestions
      const availablePillars = PILLARS.filter(
        (p) => !yesterdayPillars.has(p.id) && !usedPillarIds.has(p.id)
      );

      const location = user.contentBrain?.location || "your city";

      for (const pillar of availablePillars) {
        if (suggestions.length >= 3) break;

        const fallbackTopics: Record<string, string> = {
          trust: `3 reasons why families choose us for their first home in ${location}`,
          authority: `The truth about real estate investment in ${location} — a data-backed analysis`,
          proof: `From our happy customers — real stories from ${location}`,
          listing: `Premium properties in ${location} — starting at affordable prices`,
          expertise: `What every first-time buyer in ${location} must know`,
          relevance: `Living in ${location} — the lifestyle guide`,
          conversion: `Book a free site visit this week — limited slots available`,
        };

        suggestions.push({
          id: `rotation-${pillar.id}`,
          type: "pillar_rotation",
          title: `✨ ${pillar.label}`,
          description: pillar.angle,
          urgency: "low",
          topic: fallbackTopics[pillar.id] || `${pillar.label} content for ${location}`,
          platform: ["trust", "proof", "relevance"].includes(pillar.id) ? "Instagram" : "LinkedIn",
          pillar: pillar.id,
        });
      }
    }

    return NextResponse.json(suggestions.slice(0, 3));
  } catch (error: any) {
    console.error("[SUGGESTIONS_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to load suggestions" },
      { status: 500 }
    );
  }
}
