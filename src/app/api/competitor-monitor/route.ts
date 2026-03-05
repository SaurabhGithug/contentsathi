import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { callGemini } from "@/lib/gemini";
import { SYSTEM_PROMPT_BASE } from "@/lib/prompts";

const YT_API_KEY = process.env.YOUTUBE_API_KEY;

async function searchYouTubeCompetitors(query: string, maxResults = 8): Promise<any[]> {
  if (!YT_API_KEY) return [];
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&order=relevance&publishedAfter=${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}&maxResults=${maxResults}&regionCode=IN&key=${YT_API_KEY}`;
    const res = await fetch(url, { next: { revalidate: 7200 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items || []).map((item: any) => ({
      videoId: item.id?.videoId,
      title: item.snippet?.title,
      channelTitle: item.snippet?.channelTitle,
      description: item.snippet?.description?.slice(0, 300),
      publishedAt: item.snippet?.publishedAt,
      thumbnailUrl: item.snippet?.thumbnails?.medium?.url,
    }));
  } catch {
    return [];
  }
}

// GET /api/competitor-monitor
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { contentBrain: true } as any,
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const brain = (user as any).contentBrain;
    const niche = brain?.niche || "Real Estate";
    const location = brain?.location || "Nagpur";

    // Search for competitor content
    const competitorVideos = await searchYouTubeCompetitors(
      `${location} ${niche} developer builder project 2025`,
      8
    );

    // If no YouTube key, return simulated competitor data
    const videoList = competitorVideos.length > 0
      ? competitorVideos.map((v, i) => `${i + 1}. "${v.title}" (${v.channelTitle})`).join("\n")
      : `1. "Top 5 plots in Nagpur 2025" (NagpurProperties)
2. "Why Nagpur real estate is booming" (RealEstateGuru)
3. "New township launch: Nagpur East" (PropertyIndia)
4. "Investment guide: Nagpur vs Pune 2025" (InvestSmart)
5. "RERA approved projects in Nagpur" (HomesBazaar)`;

    // Use Gemini to analyze competitive gaps
    const prompt = `You are a competitive intelligence analyst for a ${niche} business in ${location}, India.

Competitor activity on YouTube this month:
${videoList}

Analyze these competitor posts and identify:
1. Content gaps (topics they haven't covered that our business could own)
2. Angles that are overdone (what to avoid)
3. Opportunities to differentiate

Return a JSON object with:
{
  "gaps": [
    {
      "topic": "string (the gap topic)",
      "opportunity": "string (why this gap is valuable)",
      "suggestedAngle": "string (our unique take or hook)",
      "platform": "Instagram" | "LinkedIn" | "WhatsApp" | "YouTube Shorts",
      "urgency": "high" | "medium" | "low"
    }
  ],
  "overdoneTopics": ["string", "string"],
  "competitorInsights": "string (2-3 sentence summary of what competitors are doing)",
  "recommendedFocus": "string (one clear recommendation for what our business should focus on)"
}

Return ONLY valid JSON, no markdown fences.`;

    let analysis: any = null;
    try {
      const result = await callGemini(SYSTEM_PROMPT_BASE, prompt);
      if (result && typeof result === "object" && "gaps" in result) {
        analysis = result;
      } else if (result && typeof result === "object") {
        const vals = Object.values(result);
        const found = vals.find((v: any) => v?.gaps);
        if (found) analysis = found;
      }
    } catch {
      // Fallback
    }

    // Fallback analysis
    if (!analysis) {
      analysis = {
        gaps: [
          {
            topic: "EMI vs Rent: Financial Comparison",
            opportunity: "Most competitors only show EMI amounts but don't compare to rent savings",
            suggestedAngle: "Show monthly EMI of ₹12,000 vs rent of ₹18,000 — owning is cheaper!",
            platform: "Instagram",
            urgency: "high",
          },
          {
            topic: "Nagpur Metro Impact on Property Prices",
            opportunity: "Few local creators are covering how metro routes affect plot values",
            suggestedAngle: "Plots within 2km of metro stations are seeing 15-20% faster appreciation",
            platform: "YouTube Shorts",
            urgency: "high",
          },
          {
            topic: "Women Buyers Special Guide",
            opportunity: "Stamp duty rebate for women buyers is not being promoted by anyone locally",
            suggestedAngle: "Did you know women buyers get 1% stamp duty discount in Maharashtra?",
            platform: "WhatsApp",
            urgency: "medium",
          },
        ],
        overdoneTopics: ["Generic property showcases", "Price comparison charts without context"],
        competitorInsights: `Competitors are posting project launches and generic investment tips. Very few are covering the human stories, buyer journeys, or financial math to help buyers decide.`,
        recommendedFocus: `Focus on education-first content — help buyers understand the financial logic of buying in ${location} with real numbers.`,
      };
    }

    return NextResponse.json({
      ...analysis,
      competitorVideosFound: competitorVideos.length,
      competitors: competitorVideos.slice(0, 5),
      analyzedAt: new Date().toISOString(),
      niche,
      location,
    });
  } catch (error: any) {
    console.error("[COMPETITOR_MONITOR_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
