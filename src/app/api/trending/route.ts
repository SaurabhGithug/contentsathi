import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { callGemini } from "@/lib/gemini";
import { SYSTEM_PROMPT_BASE } from "@/lib/prompts";

const YT_API_KEY = process.env.YOUTUBE_API_KEY;

async function searchYoutubeTrending(query: string, maxResults = 5): Promise<any[]> {
  if (!YT_API_KEY) return [];
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&order=viewCount&publishedAfter=${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}&maxResults=${maxResults}&regionCode=IN&relevanceLanguage=en&key=${YT_API_KEY}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items || []).map((item: any) => ({
      videoId: item.id?.videoId,
      title: item.snippet?.title,
      channelTitle: item.snippet?.channelTitle,
      description: item.snippet?.description?.slice(0, 200),
      publishedAt: item.snippet?.publishedAt,
    }));
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
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
    const month = new Date().toLocaleString("en-IN", { month: "long" });
    const year = new Date().getFullYear();

    // Build search queries based on niche and location
    const queries = [
      `${location} ${niche} ${month} ${year}`,
      `${niche} trends India ${month} ${year}`,
      `best ${niche} tips India`,
    ];

    // Fetch YouTube results in parallel
    const ytResults = await Promise.all(queries.map(q => searchYoutubeTrending(q, 3)));
    const allVideos = ytResults.flat().slice(0, 9);

    // Synthesize with Gemini if we have YouTube results
    let trendingTopics: any[] = [];

    if (allVideos.length > 0) {
      const videoList = allVideos.map((v, i) => `${i + 1}. "${v.title}" by ${v.channelTitle}`).join("\n");
      
      const prompt = `You are a ${niche} content strategist in ${location}, India.

Based on these trending YouTube videos from the past week:
${videoList}

Generate 4 trending topic suggestions that this business can post about on social media.

For each topic, return a JSON array with objects having:
- "title": short punchy topic headline (max 8 words)
- "angle": creative 1-sentence content angle for this business
- "platform": best platform ("Instagram" | "LinkedIn" | "WhatsApp" | "YouTube Shorts")
- "urgency": "high" | "medium" | "low"
- "hashtags": array of 3-5 relevant hashtags
- "hook": the first 10 words of the post that would grab attention

Return ONLY valid JSON array, no markdown fences.`;

      try {
        const result = await callGemini(SYSTEM_PROMPT_BASE, prompt);
        if (result && Array.isArray(result)) {
          trendingTopics = result;
        } else if (result && typeof result === "object") {
          trendingTopics = Object.values(result)[0] as any[];
        }
      } catch {
        // Fall through to default
      }
    }

    // Always include fallback topics if Gemini fails or no YT data
    if (trendingTopics.length < 3) {
      trendingTopics = [
        {
          title: `${location} ${niche} Investment Guide ${year}`,
          angle: `A complete guide to investing in ${location} ${niche} market this ${month}.`,
          platform: "LinkedIn",
          urgency: "high",
          hashtags: [`#${location}RealEstate`, "#PropertyInvestment", "#IndianRealEstate", "#HomeBuyers"],
          hook: `Why savvy investors are choosing ${location} in ${year}`,
        },
        {
          title: "3 Mistakes First-Time Buyers Make",
          angle: "A myth-busting post about common pitfalls to avoid before your first property purchase.",
          platform: "Instagram",
          urgency: "medium",
          hashtags: ["#HomeBuying", "#RealEstateTips", "#FirstTimeBuyer", "#PropertyAdvice"],
          hook: "Don't sign that agreement until you read this",
        },
        {
          title: `${month} Market Update: Prices & Trends`,
          angle: `Monthly roundup of ${location} property prices, new projects, and what to expect next.`,
          platform: "WhatsApp",
          urgency: "high",
          hashtags: [`#${location}Property`, "#RealEstateIndia", "#MarketUpdate"],
          hook: `${location} property prices just crossed a new milestone`,
        },
        {
          title: "RERA vs NIT: What Every Buyer Must Know",
          angle: "Educational breakdown of RERA approvals vs NIT/AMRDA layout permissions and why it matters.",
          platform: "YouTube Shorts",
          urgency: "low",
          hashtags: ["#RERA", "#NagpurProperty", "#PropertyLaw", "#HomeBuyers"],
          hook: "Your builder said RERA approved. But is it really?",
        },
      ];
    }

    // Attach YouTube video references to topics
    const enrichedTopics = trendingTopics.slice(0, 4).map((topic, i) => ({
      ...topic,
      id: `trend-${Date.now()}-${i}`,
      sourceVideo: allVideos[i] || null,
      generatedAt: new Date().toISOString(),
    }));

    return NextResponse.json({
      topics: enrichedTopics,
      youtubeVideosFound: allVideos.length,
      searchedAt: new Date().toISOString(),
      niche,
      location,
    });
  } catch (error: any) {
    console.error("[TRENDING_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
