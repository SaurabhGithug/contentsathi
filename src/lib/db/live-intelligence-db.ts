/**
 * ════════════════════════════════════════════════════════════════════
 *  LIVE INTELLIGENCE DATABASE — ContentSathi v3.0
 *
 *  This module manages the "Living Market Brain" — a PostgreSQL cache
 *  of live social media intelligence that is refreshed every 12 hours.
 *
 *  KEY INSIGHT: Instead of scraping at generation time (slow, expensive),
 *  we run Apify in the background and pre-load the DB with fresh data.
 *  When a user hits "Generate", we pull from DB in <100ms — instant.
 *
 *  Intelligence Life Cycle:
 *  ┌──────────┐      ┌─────────┐      ┌──────────────┐      ┌────────────┐
 *  │  Apify   │─────▶│  Parse  │─────▶│  Prisma DB   │─────▶│ AI Studio  │
 *  │ Scrapers │      │ & Score │      │  (fresh data)│      │ (Generate) │
 *  └──────────┘      └─────────┘      └──────────────┘      └────────────┘
 *       ▲                                                          
 *  Every 12hrs                                                     
 * ════════════════════════════════════════════════════════════════════
 */

import { prisma } from "@/lib/db/prisma";
import { runFullIntelligenceScrape, type IntelligenceSummary } from "@/lib/intelligence/apify-master-scraper";
import { searchWeb } from "@/lib/intelligence/tavily";

// ─── Configuration ────────────────────────────────────────────────────────────

const REFRESH_INTERVALS_HOURS = 12;
const DEFAULT_CORRIDORS = ["Wardha Road", "MIHAN", "Ring Road", "Besa", "Hingna Road", "Saraswati Nagri"];

// Core topics to always keep fresh — expanded over user usage
const EVERGREEN_TOPICS = [
  "Nagpur Real Estate Investment",
  "MIHAN Aerospace SEZ plots",
  "Wardha Road corridor",
  "Ring Road Nagpur property",
  "RERA Nagpur compliance",
  "Hinglish real estate content",
];

// ─── Types ────────────────────────────────────────────────────────────────────

export type LiveIntelligenceContext = {
  // The most powerful field: ready-to-use competitive ammo for the AI Studio
  competitiveAmmo: string;
  // Live viral hooks from social media right now
  viralHooks: string[];
  // What buyers are asking — from comments & reviews
  buyerPainPoints: string[];
  // Competitor weaknesses exposed by negative reviews
  competitorGaps: string[];
  // Format recommendations based on actual engagement
  winningFormats: string[];
  // News & regulatory angles to newsjack
  newsjackingAngles: string[];
  // Corridor-specific signals
  corridorSignals: Record<string, string[]>;
  // Meta
  dataFreshnessMinutes: number;
  totalSourcesScraped: number;
  lastUpdatedAt: string;
  isFromLiveData: boolean;
};

// ─── Main: Get Live Intelligence for AI Studio ────────────────────────────────

/**
 * Called by the AI Studio workflow BEFORE writing any content.
 * Returns rich competitive intelligence in <100ms (from DB cache).
 * Falls back to Tavily if DB is stale or empty.
 */
export async function getLiveIntelligenceForTopic(
  topic: string,
  city: string = "Nagpur",
  userId?: string
): Promise<LiveIntelligenceContext> {
  
  const freshnessCutoff = new Date();
  freshnessCutoff.setHours(freshnessCutoff.getHours() - REFRESH_INTERVALS_HOURS);

  try {
    // ── Step 1: Try fetching from DB (fast path) ──────────────────────────
    const recentIntelligence = await prisma.marketIntelligence.findMany({
      where: {
        scrapedAt: { gte: freshnessCutoff },
        content: { not: "" },
      },
      orderBy: [
        { engagementScore: "desc" },
        { scrapedAt: "desc" },
      ],
      take: 50,
    });

    if (recentIntelligence.length >= 5) {
      // We have fresh data — build context from it
      console.log(`[LiveIntelDB] ✅ Loaded ${recentIntelligence.length} fresh signals from DB`);
      return buildContextFromDB(recentIntelligence, topic, city);
    }

    // ── Step 2: DB is stale — trigger a quick Tavily search as bridge ─────
    console.log(`[LiveIntelDB] ⚡ DB stale. Running Tavily bridge search for: "${topic}"`);
    return await buildContextFromTavily(topic, city);

  } catch (err) {
    console.error("[LiveIntelDB] Error:", err);
    return getFallbackContext(topic, city);
  }
}

// ─── Background: Refresh Intelligence DB ─────────────────────────────────────

/**
 * Run by the `/api/intelligence/refresh` cron endpoint every 12 hours.
 * Scrapes all platforms via Apify and stores fresh signals in the DB.
 */
export async function refreshIntelligenceDB(
  userId: string,
  customTopics?: string[]
): Promise<{ success: boolean; signalsSaved: number; errors: string[] }> {
  
  const topics = customTopics && customTopics.length > 0 ? customTopics : EVERGREEN_TOPICS;
  const errors: string[] = [];
  let totalSaved = 0;

  console.log(`[LiveIntelDB] 🔄 Starting DB refresh for ${topics.length} topics...`);

  // Run 2 topics at a time to avoid Apify concurrency limits
  for (let i = 0; i < topics.length; i += 2) {
    const batch = topics.slice(i, i + 2);
    
    await Promise.allSettled(batch.map(async (topic) => {
      try {
        const scrapeResult = await runFullIntelligenceScrape(topic, "Nagpur", DEFAULT_CORRIDORS);
        const allPosts = [
          ...scrapeResult.linkedin.posts,
          ...scrapeResult.instagram.posts,
          ...scrapeResult.googleMaps.posts,
          ...scrapeResult.youtube.posts,
        ];

        // Save each scraped post to DB
        for (const post of allPosts) {
          if (!post.text || post.text.length < 20) continue;
          
          try {
            await prisma.marketIntelligence.create({
              data: {
                userId,
                platform: normalizePlatform(post.platform, post),
                postUrl: post.url || null,
                author: post.author || "Unknown",
                content: post.text.substring(0, 2000),
                likes: post.likes || 0,
                comments: post.comments || 0,
                shares: post.shares || 0,
                engagementScore: post.engagementScore || 0,
                postedAt: post.postedAt ? new Date(post.postedAt) : null,
                corridor: detectCorridor(post.text, DEFAULT_CORRIDORS) || null,
                tags: [...(post.hashtags || []), topic.split(" ")[0]],
                metadata: {
                  scraped_topic: topic,
                  media_type: post.mediaType || "text",
                  author_followers: post.authorFollowers || 0,
                  views: post.views || 0,
                  rating: post.rating || null,
                  signal: post.signal,
                  summary: scrapeResult.summary ? JSON.stringify({
                    viralHooks: scrapeResult.summary.topViralHooks.slice(0, 3),
                    winningFormats: scrapeResult.summary.winningContentFormats.slice(0, 2),
                  }) : null,
                },
              },
            });
            totalSaved++;
          } catch (dbErr: any) {
            // Silently skip duplicates — this is expected
            if (!dbErr.message?.includes("Unique constraint")) {
              errors.push(`DB save failed for ${post.url}: ${dbErr.message}`);
            }
          }
        }

        // Also save the synthesized summary as a special "meta" record
        if (scrapeResult.summary) {
          await saveSummaryRecord(userId, topic, scrapeResult.summary);
        }

      } catch (scrapeErr: any) {
        errors.push(`Scrape failed for "${topic}": ${scrapeErr.message}`);
        console.error(`[LiveIntelDB] Scrape error for ${topic}:`, scrapeErr);
      }
    }));

    // Brief pause between batches
    if (i + 2 < topics.length) {
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  // Cleanup: Delete intelligence older than 48 hours to keep DB lean
  try {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 48);
    const deleted = await prisma.marketIntelligence.deleteMany({
      where: { scrapedAt: { lt: cutoff } },
    });
    console.log(`[LiveIntelDB] 🧹 Cleaned ${deleted.count} stale records`);
  } catch (cleanupErr: any) {
    errors.push(`Cleanup error: ${cleanupErr.message}`);
  }

  console.log(`[LiveIntelDB] ✅ Refresh complete. Saved: ${totalSaved} signals. Errors: ${errors.length}`);
  return { success: true, signalsSaved: totalSaved, errors };
}

// ─── Context Builders ─────────────────────────────────────────────────────────

function buildContextFromDB(records: any[], topic: string, city: string): LiveIntelligenceContext {
  
  // Sort by engagement to find strongest signals
  const sortedByEng = [...records].sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0));
  
  // Top viral content signals
  const viralHooks = sortedByEng
    .filter(r => r.platform === "linkedin" || r.platform === "instagram")
    .slice(0, 5)
    .map(r => r.content?.split("\n")[0]?.trim().substring(0, 100) || "")
    .filter(Boolean);

  // Buyer pain points from forum/review content (negative signals)
  const painPoints = records
    .filter(r => r.platform === "google_maps" || r.platform === "forum")
    .map(r => r.content?.substring(0, 120) || "")
    .filter(Boolean)
    .slice(0, 5);

  // Extract corridor signals
  const corridorSignals: Record<string, string[]> = {};
  for (const corridor of DEFAULT_CORRIDORS) {
    const relevant = records
      .filter(r => r.corridor === corridor || r.content?.toLowerCase().includes(corridor.toLowerCase()))
      .map(r => r.content?.substring(0, 80) || "")
      .filter(Boolean)
      .slice(0, 3);
    if (relevant.length > 0) corridorSignals[corridor] = relevant;
  }

  // Pull summary meta if available
  const summaryRecords = records
    .filter(r => r.platform === "meta_summary")
    .map(r => {
      try { return JSON.parse(r.content); } catch { return null; }
    })
    .filter(Boolean);

  const winningFormats = summaryRecords[0]?.winningFormats || [
    "Instagram Reel (15-30s with hook in first 3 seconds)",
    "LinkedIn long-form text post with local data point",
    "WhatsApp voice note script",
  ];

  const newsjackingAngles = records
    .filter(r => r.platform === "news" || r.tags?.includes("news"))
    .map(r => r.content?.substring(0, 100) || "")
    .filter(Boolean)
    .slice(0, 3);

  // Build the "Competitive Ammo" briefing — this is what the AI Studio reads
  const now = new Date();
  const oldestRecord = records[records.length - 1];
  const freshnessMins = oldestRecord 
    ? Math.round((now.getTime() - new Date(oldestRecord.scrapedAt).getTime()) / 60000)
    : 0;

  const competitiveAmmo = buildCompetitiveAmmo({
    topic, city,
    viralHooks,
    painPoints,
    corridorSignals,
    totalRecords: records.length,
    freshnessMins,
  });

  return {
    competitiveAmmo,
    viralHooks: viralHooks.length > 0 ? viralHooks : getDefaultHooks(topic, city),
    buyerPainPoints: painPoints.length > 0 ? painPoints : getDefaultPainPoints(topic),
    competitorGaps: getCompetitorGaps(records),
    winningFormats,
    newsjackingAngles: newsjackingAngles.length > 0 ? newsjackingAngles : getDefaultAngles(topic, city),
    corridorSignals,
    dataFreshnessMinutes: freshnessMins,
    totalSourcesScraped: records.length,
    lastUpdatedAt: records[0]?.scrapedAt || new Date().toISOString(),
    isFromLiveData: true,
  };
}

async function buildContextFromTavily(topic: string, city: string): Promise<LiveIntelligenceContext> {
  try {
    const [newsResult, socialResult] = await Promise.allSettled([
      searchWeb(`${topic} ${city} real estate news 2026`, "basic", true),
      searchWeb(`${topic} ${city} real estate site:linkedin.com OR site:instagram.com`, "basic", false),
    ]);

    const newsItems = newsResult.status === "fulfilled" ? newsResult.value.results : [];
    const socialItems = socialResult.status === "fulfilled" ? socialResult.value.results : [];

    const viralHooks = socialItems.slice(0, 3).map((r: any) => r.title?.substring(0, 100) || "");
    const newsjackingAngles = newsItems.slice(0, 3).map((r: any) => r.title?.substring(0, 100) || "");

    const competitiveAmmo = `
LIVE INTELLIGENCE (via Tavily, ${new Date().toLocaleTimeString("en-IN")} IST):

TOP TRENDING HEADLINES FOR "${topic} in ${city}":
${newsItems.slice(0, 3).map((r: any) => `• ${r.title}: ${r.content?.substring(0, 150)}`).join("\n")}

SOCIAL MENTIONS DETECTED:
${socialItems.slice(0, 3).map((r: any) => `• ${r.title}: ${r.content?.substring(0, 100)}`).join("\n")}

KEY ANGLE: Use these live developments as your content hook. Reference the current news to make content feel urgent and timely.
    `.trim();

    return {
      competitiveAmmo,
      viralHooks: viralHooks.filter(Boolean).length > 0 ? viralHooks.filter(Boolean) : getDefaultHooks(topic, city),
      buyerPainPoints: getDefaultPainPoints(topic),
      competitorGaps: [],
      winningFormats: ["Instagram Reel", "WhatsApp Broadcast", "LinkedIn Post"],
      newsjackingAngles: newsjackingAngles.filter(Boolean),
      corridorSignals: {},
      dataFreshnessMinutes: 0,
      totalSourcesScraped: newsItems.length + socialItems.length,
      lastUpdatedAt: new Date().toISOString(),
      isFromLiveData: true,
    };
  } catch {
    return getFallbackContext(topic, city);
  }
}

// ─── Competitive Ammo Builder ─────────────────────────────────────────────────

function buildCompetitiveAmmo(args: {
  topic: string;
  city: string;
  viralHooks: string[];
  painPoints: string[];
  corridorSignals: Record<string, string[]>;
  totalRecords: number;
  freshnessMins: number;
}): string {
  const { topic, city, viralHooks, painPoints, corridorSignals, totalRecords, freshnessMins } = args;
  const corridorNames = Object.keys(corridorSignals);

  return `
═══════════════════════════════════════════════════════════
LIVE MARKET INTELLIGENCE BRIEF — ${new Date().toLocaleDateString("en-IN")}
Scraped from: LinkedIn · Instagram · Google Maps · YouTube
Signals analyzed: ${totalRecords} | Data age: ${freshnessMins} minutes
═══════════════════════════════════════════════════════════

TOPIC FOCUS: ${topic} in ${city}

TOP VIRAL HOOKS (from actual posts getting shares RIGHT NOW):
${viralHooks.map((h, i) => `${i + 1}. "${h}"`).join("\n") || "• Use urgency + local reference format"}

BUYER PAIN POINTS (from real reviews & forum comments):
${painPoints.map((p, i) => `${i + 1}. ${p}`).join("\n") || "• Hidden charges\n• Delayed possession\n• Poor builder communication"}

ACTIVE MARKET CORRIDORS (in social content right now):
${corridorNames.length > 0 
    ? corridorNames.map(c => `• ${c}: ${(corridorSignals[c] || [])[0]?.substring(0, 80) || "Active discussions detected"}`).join("\n")
    : `• ${city} broadly: Mixed signals on investment timing`
}

CONTENT DIRECTIVE FOR AI STUDIO:
→ DO NOT write generic "good location, great investment" content.
→ Use one of the above viral hooks as your opening line.
→ Address a buyer pain point directly in the post body.
→ If writing about a corridor above, use exact local references.
→ The post must feel like it was written by someone who checked the internet TODAY.
═══════════════════════════════════════════════════════════
`.trim();
}

// ─── DB Helpers ───────────────────────────────────────────────────────────────

async function saveSummaryRecord(userId: string, topic: string, summary: IntelligenceSummary) {
  try {
    await prisma.marketIntelligence.create({
      data: {
        userId,
        platform: "meta_summary",
        content: JSON.stringify({
          topic,
          viralHooks: summary.topViralHooks,
          winningFormats: summary.winningContentFormats,
          competitorWeaknesses: summary.competitorWeaknesses,
          newsjackingAngles: summary.newsjackingAngles,
          totalAnalyzed: summary.totalPostsAnalyzed,
        }),
        likes: 0,
        comments: 0,
        shares: 0,
        engagementScore: 0,
        tags: ["meta", "summary", topic.split(" ")[0].toLowerCase()],
        metadata: { topic, generatedAt: new Date().toISOString() },
      },
    });
  } catch {
    // Non-critical — skip if fails
  }
}

// ─── Fallback / Default Values ────────────────────────────────────────────────

function getFallbackContext(topic: string, city: string): LiveIntelligenceContext {
  return {
    competitiveAmmo: `Focus on: ${topic} in ${city}. Use RERA compliance + local corridor references as your credibility anchors. Address the top buyer fear: hidden charges and delayed possession.`,
    viralHooks: getDefaultHooks(topic, city),
    buyerPainPoints: getDefaultPainPoints(topic),
    competitorGaps: [],
    winningFormats: ["Instagram Reel", "WhatsApp Broadcast", "LinkedIn Post"],
    newsjackingAngles: getDefaultAngles(topic, city),
    corridorSignals: {},
    dataFreshnessMinutes: 999,
    totalSourcesScraped: 0,
    lastUpdatedAt: new Date().toISOString(),
    isFromLiveData: false,
  };
}

function getDefaultHooks(topic: string, city: string): string[] {
  return [
    `Stop buying in ${topic} before reading this.`,
    `${city}'s most overlooked investment corridor is right here.`,
    `RERA registered. No hidden charges. Here's why that matters.`,
    `The question every ${city} investor asks but no one answers.`,
  ];
}

function getDefaultPainPoints(topic: string): string[] {
  return [
    "Hidden registration charges not disclosed during booking",
    "Possession delayed by 2-3 years from promised date",
    "Builder communication goes silent after payment",
    "Document verification takes months without agent help",
  ];
}

function getDefaultAngles(topic: string, city: string): string[] {
  return [
    `${city} Metro expansion — how it changes ${topic} pricing today`,
    `MahaRERA QR Code mandate: What every buyer must verify`,
    `MIHAN SEZ Phase 2 announcement and residential demand impact`,
  ];
}

function getCompetitorGaps(records: any[]): string[] {
  const negativeContent = records
    .filter(r => r.platform === "google_maps" && r.engagementScore !== null && r.engagementScore < 30)
    .map(r => r.content?.substring(0, 100) || "")
    .filter(Boolean)
    .slice(0, 4);

  return negativeContent.length > 0 ? negativeContent : [
    "Competitors not addressing RERA transparency in content",
    "No Hinglish/Marathi content from major Nagpur builders",
    "Post-sale customer experience content is completely missing",
  ];
}

function detectCorridor(text: string, corridors: string[]): string | undefined {
  const lower = text.toLowerCase();
  for (const c of corridors) {
    if (lower.includes(c.toLowerCase())) return c;
  }
  return undefined;
}

function normalizePlatform(platform: string, post: any): string {
  if (platform === "linkedin") return "linkedin";
  if (platform === "instagram") return "instagram";
  if (platform === "google_maps") return "google_maps";
  if (platform === "twitter") return "twitter";
  if (post.mediaType === "video") return "youtube";
  return platform;
}
