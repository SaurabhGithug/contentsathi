import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limiter";
import { sanitizeText } from "@/lib/sanitize";
import {
  SARVAM_LANGUAGE_CONFIGS, INDIC_LANGUAGES, generateIndicContent,
  callSarvamJSON, callSarvamChat,
  buildThinkerSystemPrompt, buildWriterSystemPrompt,
  FREE_TIER_PLATFORMS, FREE_TIER_LANGUAGES, FREE_TIER_MONTHLY_LIMIT,
} from "@/lib/sarvam";
import { getLiveIntelligenceForTopic, type LiveIntelligenceContext } from "@/lib/live-intelligence-db";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// ── Gemini Helper for JSON Output ──────────────────────────────────────────
async function callGeminiJSON(systemPrompt: string, userPrompt: string): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API Error: ${response.status} — ${err.substring(0, 200)}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini");

  try {
    // Strip any markdown code fences that Gemini sometimes wraps around JSON
    const clean = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    return JSON.parse(clean);
  } catch {
    throw new Error("Gemini returned invalid JSON");
  }
}

// ── Gemini Helper for raw text (platform content writing) ──────────────────
async function callGeminiText(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.85 },
      }),
    }
  );

  if (!response.ok) throw new Error(`Gemini Text Error: ${response.status}`);
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

// Platform-specific writing instructions
function getPlatformRules(platform: string): string {
  const p = platform.toLowerCase();
  if (p.includes("instagram")) return "Punchy 2-line hook. 3 value bullets. Natural emojis. Clear CTA. 5 hashtags (mix English + relevant topic).";
  if (p.includes("linkedin")) return "Professional hook (1 line). Problem → Solution → Insight structure. One real data point from research. Short paragraphs (1-2 lines each). Soft CTA.";
  if (p.includes("twitter") || p.includes("x (")) return "A 3-tweet thread. Each tweet under 280 characters. Format as: 1/ ... \n\n2/ ... \n\n3/ [CTA]";
  if (p.includes("whatsapp")) return "Warm greeting. 3 value lines. One open-ended question to start conversation. Property inquiry CTA with emoji. Keep under 150 words.";
  if (p.includes("youtube")) return "YouTube Shorts Script: [HOOK] — First 15 seconds word-for-word. [BODY] — 3 main points as outline. [CTA] — Closing action line.";
  if (p.includes("facebook")) return "Storytelling format. 100-150 words. Community angle. Personal warm tone. End with a soft question to encourage comments.";
  return "Engaging hook. 3 value points. Clear CTA.";
}

// ── Main POST Handler ──────────────────────────────────────────────────────
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;
  const limiter = rateLimit(`workflow:${userId}`, RATE_LIMITS.generate);
  if (!limiter.success) {
    return new Response("Too Many Requests", { status: 429 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid Request Body", { status: 400 });
  }

  const {
    topic: rawTopic,
    platforms = ["Instagram"],
    audience = "First-time homebuyers, Investors",
    languages = ["English", "Hindi", "Marathi"],   // All selected languages
    tone = "Conversational",
    regeneratePlatform = null,
    cachedIntent = null,
    cachedResearch = null,
    regenerate_single = false,
    regenerateLanguage = null,
  } = body;

  console.log("[WORKFLOW] Incoming request. Platforms:", platforms, "Languages:", languages, "RegenSingle:", regenerate_single, "RegenPlatform:", regeneratePlatform, "RegenLang:", regenerateLanguage);

  const topic = sanitizeText(rawTopic, 1000);
  if (!topic) return new Response("Topic is required", { status: 400 });

  // Load user data + credits + brain
  let dbUserId: string | null = null;
  let brainContext = "";
  let hasEnoughCredits = true;
  let userPlanTier: string = "free";

  try {
    const userRecord = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { contentBrain: true },
    });

    if (userRecord) {
      dbUserId = userRecord.id;
      userPlanTier = userRecord.planTier || "free";

      // Credit check — only for full runs (not single-platform regeneration)
      if (!regeneratePlatform && userPlanTier !== "free" && userRecord.creditsBalance < 5) {
        hasEnoughCredits = false;
      }

      // Free tier: check 30 posts/month quota
      if (userPlanTier === "free" && !regeneratePlatform) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const monthlyUsage = await prisma.usageLog.count({
          where: {
            userId: dbUserId,
            action: "generate_workflow_free",
            createdAt: { gte: startOfMonth },
          },
        });
        if (monthlyUsage >= FREE_TIER_MONTHLY_LIMIT) {
          return new Response(
            JSON.stringify({ error: `Free tier limit reached (${FREE_TIER_MONTHLY_LIMIT} posts/month). Upgrade to unlock unlimited generation across all platforms and languages.` }),
            { status: 402, headers: { "Content-Type": "application/json" } }
          );
        }
      }

      const b = userRecord.contentBrain;
      if (b) {
        brainContext = [
          b.brandName ? `Brand: ${b.brandName}` : "",
          b.industry ? `Niche: ${b.industry}` : "Niche: Real Estate",
          b.location ? `City: ${b.location}` : "",
          b.brandDescription ? `About: ${b.brandDescription.substring(0, 200)}` : "",
          b.contactPhone ? `Contact: ${b.contactPhone}` : b.contactEmail ? `Contact: ${b.contactEmail}` : "",
        ].filter(Boolean).join(". ");
      }
    }
  } catch (e) {
    console.error("[WORKFLOW] Error loading user:", e);
  }

  if (!hasEnoughCredits) {
    return new Response(
      JSON.stringify({ error: "Insufficient credits. 5 credits needed per full generation." }),
      { status: 402, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── LIVE INTELLIGENCE FETCH (runs before content generation) ───────────────
  // This replaces static LLM training data with real scraped market signals.
  // Pulls from the Apify-populated DB cache (<100ms) or falls back to Tavily.
  let liveIntel: LiveIntelligenceContext | null = null;
  try {
    const cityMatch = brainContext.match(/City: ([^.]+)/);
    const city = cityMatch?.[1]?.trim() || "Nagpur";
    liveIntel = await getLiveIntelligenceForTopic(topic, city, dbUserId || undefined);
    console.log(`[WORKFLOW] Live intel loaded. Fresh: ${liveIntel.isFromLiveData}. Signals: ${liveIntel.totalSourcesScraped}. Age: ${liveIntel.dataFreshnessMinutes}min`);
  } catch (e) {
    console.warn("[WORKFLOW] Live intel fetch failed (non-critical):", e);
  }

  // ── SSE Stream Setup ───────────────────────────────────────────────────────
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, any>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {

        // ════════════════════════════════════════════════════════════════════
        // FREE TIER: Two-Pass Sarvam Pipeline (₹0 cost)
        // ════════════════════════════════════════════════════════════════════
        if (userPlanTier === "free") {
          // BUG 1 & 2: Strict filtering for free tier selection
          const requestedPlatforms = regenerate_single && regeneratePlatform ? [regeneratePlatform] : platforms;
          const requestedLangs = regenerate_single && regenerateLanguage ? [regenerateLanguage] : languages;

          const freePlatforms = requestedPlatforms.filter((p: string) => 
            FREE_TIER_PLATFORMS.some(fp => p.toLowerCase().includes(fp.toLowerCase()))
          );
          const freeLangs = requestedLangs.filter((l: string) => FREE_TIER_LANGUAGES.includes(l));

          if (freePlatforms.length === 0) {
            send({ error: `Free plan supports ${FREE_TIER_PLATFORMS.join(" & ")} only. Upgrade to unlock all 6 platforms.` });
            controller.close();
            return;
          }
          if (freeLangs.length === 0) {
            freeLangs.push("English"); // Fallback
          }

          // ── PASS 1: Sarvam Thinker (with Live Intelligence) ────────────────
          send({ step: 1, label: `Sarvam AI analyzing topic + loading live market data (${liveIntel?.totalSourcesScraped || 0} signals)...` });
          let thinkingResults: any;

          // Inject live intelligence context into Sarvam's system prompt
          const liveIntelContext = liveIntel?.competitiveAmmo
            ? `\n\nLIVE MARKET INTELLIGENCE (scraped from LinkedIn, Instagram, Google Maps today):\n${liveIntel.competitiveAmmo}\n\nVIRAL HOOKS WORKING RIGHT NOW:\n${(liveIntel.viralHooks || []).slice(0, 3).map((h, i) => `${i + 1}. "${h}"`).join("\n")}\n\nBUYER PAIN POINTS FROM REAL REVIEWS:\n${(liveIntel.buyerPainPoints || []).slice(0, 3).map((p, i) => `${i + 1}. ${p}`).join("\n")}\n\nUSE THIS LIVE DATA. Do NOT rely on generic assumptions.`
            : "";

          try {
            thinkingResults = await callSarvamJSON(
              `You are a senior real estate content strategist with 15 years of experience in Indian Tier 2 city markets including Nagpur, Pune, Jaipur, Indore, and Bhopal. You understand Indian home buyer psychology deeply. You know that first-time buyers fear black money and title issues. Investors want appreciation data. NRIs want trust and legal clarity. Land buyers want RERA, NA plots, and connectivity. You always inject specific local references — road names, infrastructure projects, landmarks — to make content feel authentic not generic.${liveIntelContext}`,
              `Analyze this real estate content topic and return a JSON object only. No explanation before or after the JSON. Topic: ${topic}. Target audience: ${audience}. City: ${brainContext || "Nagpur"}.

Return JSON with exactly these fields:
goal — one of: awareness, lead_generation, trust_building, urgency
audience_type — one of: first_time_homebuyer, investor, NRI, land_buyer
emotional_trigger — one of: FOMO, aspiration, trust, urgency
hook_sentence — one powerful opening line under 12 words that makes the target audience stop scrolling. Must not start with the topic title as a plain statement. Must trigger emotion.
local_reference — one specific local detail relevant to the city such as a road name, upcoming metro, ring road, IT corridor, school zone, or landmark
objection — the single biggest fear or doubt this audience has about this topic
talking_points — array of exactly 3 specific compelling points about this topic for this audience. Each point must be specific and factual, not generic. Example of bad: good location. Example of good: 2 km from proposed Ring Road metro station increasing land value 18 percent annually.
market_context — one sentence about current Indian real estate trends relevant to this topic based on knowledge through 2025

Return only valid JSON. Nothing else.`
            );
          } catch (e) {
            console.error("[SARVAM_PASS1_ERROR]", e);
            thinkingResults = {
              targetAudience: "First-time homebuyers in Indian cities",
              topPainPoints: ["Builder trust issues", "Hidden costs", "Delayed possession"],
              bestEmotionalAngle: "Your family deserves a home they can call their own",
              localReference: "Growing infrastructure near Ring Road corridor",
              trustSignal: "RERA registered project with clear documentation",
              urgencyTrigger: "Prices are rising — early buyers get the best rates",
            };
          }

          // ── PASS 2: Sarvam Writer (6-technique master prompt) ──────
          send({ step: 3, label: `Writing ${freePlatforms.length} posts in ${freeLangs.length} language${freeLangs.length > 1 ? "s" : ""} with Sarvam AI...` });

          const finalPosts: any[] = [];
          let postIdCounter = 0;

          for (const platform of freePlatforms) {
            for (const lang of freeLangs) {
              let writerSystem = "";
              let writerUser = "";
              
              const p = platform.toLowerCase();
              const langInst = (lang === "Hindi" || lang === "Marathi") ? 
                (lang === "Hindi" ? `CRITICAL LANGUAGE INSTRUCTION: This is not a translation task. Do not translate the English content word by word. You must completely reimagine and rewrite the content the way a real estate agent in Nagpur actually speaks to a buyer on WhatsApp or in person. Write in natural Hinglish — mix Hindi and English words the way urban Indians in Tier 2 cities actually speak. Use phrases like Sach mein batao toh, Ekdum sahi jagah hai, Bilkul first class location hai, Seedha point pe aata hoon, Yaar sun, Kya lagta hai aapko. Never use formal bookish Hindi. Never say Pratham for first. Never say Ucch Prasansa for high appreciation. Never say Pratispardhi for competitive. Say Pehla, Bahut tagda, Saste mein best deal. The reader must feel a real human from Nagpur wrote this, not a translation engine.` 
                : `CRITICAL LANGUAGE INSTRUCTION: This is not a translation task. Do not translate the English content word by word. You must completely reimagine and rewrite the content the way a real estate agent in Nagpur and the Vidarbha region speaks to a local buyer. Write in casual Vidarbha-style Marathi — not formal Pune Marathi. Mix Marathi and English naturally. Use expressions like Ekdum mast ahe, Changli jagah ahe bhai, Ghya na contact, Ata ch bagh, Khup changlya price la milte, Serious asayla phone kar. Never use formal literary Marathi. Never use words that sound like a textbook. The reader must feel a trusted local Nagpur person wrote this, not software.`)
                : `LANGUAGE: Write in clear, engaging English. Use simple words.`;

              if (p.includes("instagram")) {
                writerSystem = `${langInst}\n\nYou are a top-performing Indian real estate social media writer. You write Instagram captions that stop people mid-scroll. You never write generic content. Every post has a specific local reference, a strong hook, and emojis used naturally. You write the way real Indians post — not like a corporate marketing team.`;
                writerUser = `Write an Instagram caption using the following context. Hook to use: ${thinkingResults.hook_sentence}. Talking points: ${thinkingResults.talking_points?.join(", ")}. Local reference to include: ${thinkingResults.local_reference}. Buyer objection to address: ${thinkingResults.objection}. Topic: ${topic}. Tone: ${tone}. Emotional trigger: ${thinkingResults.emotional_trigger}.

Follow this exact structure. Do not deviate. Do not add the word Instagram anywhere in the output:
Line 1: The hook sentence — rewrite it to be punchy, under 10 words, creates curiosity or urgency
Line 2: First talking point starting with a relevant emoji
Line 3: Second talking point starting with a relevant emoji
Line 4: Third talking point starting with a relevant emoji
Line 5: One line addressing the main buyer objection starting with emoji
Line 6: CTA — one of: DM us for details, Call today, Link in bio, Visit this weekend
Last line: Exactly 5 hashtags mixing English and Hindi or Marathi words — example style: #NagpurRealEstate #PlotForSale #GharKhojo #PropertyInvestment #RozDikhteRaho

CRITICAL: The response MUST be at least 80 words long. Include hook, 3 benefit lines with emojis, objection crusher, CTA, and 5 hashtags. Total emojis in post: 4 to 6. No line longer than 12 words.`;
              } else if (p.includes("whatsapp")) {
                writerSystem = `${langInst}\n\nYou are an expert at writing WhatsApp messages that real estate agents send to potential leads. Your messages feel warm and human, never like bulk marketing spam. They always start a conversation, never try to close a sale in one message.`;
                writerUser = `Write a WhatsApp message using the following context. Hook: ${thinkingResults.hook_sentence}. Talking points: ${thinkingResults.talking_points?.join(", ")}. Local reference: ${thinkingResults.local_reference}. Topic: ${topic}. Tone: ${tone}. Emotional trigger: ${thinkingResults.emotional_trigger}.

Follow this exact structure. Do not add the word WhatsApp anywhere in the output:
Line 1: Warm Indian greeting — Namaskar or Hello with their name placeholder [Name]
Line 2: One sentence establishing why you are reaching out — reference the local_reference naturally
Line 3: First talking point in one line, maximum 8 words
Line 4: Second talking point in one line, maximum 8 words
Line 5: Third talking point in one line, maximum 8 words
Line 6: One open-ended question to start conversation — example: Would you be open to a quick site visit this weekend? or Kya aap iss week 10 minutes nikal sakte hain?
Line 7: Sign off — Warm regards, [Your Name] and Call or WhatsApp: [Number]

CRITICAL: The response MUST be at least 60 words long including greeting, context line, 3 value points, question, and sign-off. No emojis. Conversational and warm. Never pushy.`;
              } else if (p.includes("linkedin")) {
                writerSystem = `${langInst}\n\nYou are a real estate thought leader who writes LinkedIn posts that get shared by investors and professionals. You write with authority and back claims with data. You never use fluffy motivational language. You write like a knowledgeable professional sharing genuine insights.`;
                writerUser = `Write a LinkedIn post using the following context. Hook: ${thinkingResults.hook_sentence}. Talking points: ${thinkingResults.talking_points?.join(", ")}. Local reference: ${thinkingResults.local_reference}. Market context: ${thinkingResults.market_context}. Topic: ${topic}. Tone: ${tone}. Emotional trigger: ${thinkingResults.emotional_trigger}.

Follow this exact structure. Do not deviate. Do not add the word LinkedIn anywhere in the output:
Paragraph 1: One bold insight or surprising fact as a standalone opening line — no greeting, directly into the insight, under 15 words
Paragraph 2: 2 to 3 sentences expanding on why this matters for Indian buyers or investors right now
Paragraph 3: One specific data point or market trend from the market_context, made concrete with a number or percentage
Paragraph 4: What readers should do or think about based on this insight — practical takeaway
Final line: Soft CTA — Happy to discuss this further, Feel free to connect, or Drop a comment if you want to know more

CRITICAL: The response MUST be between 150 to 200 words including opening insight, explanation paragraph, data point, takeaway, and CTA. No emojis except one optional at the very end. Professional tone throughout.`;
              } else if (p.includes("youtube")) {
                writerSystem = `${langInst}\n\nYou are a YouTube script writer who specializes in short-form real estate content for Indian audiences. You write scripts that hook viewers in the first 3 seconds and deliver clear value in under 60 seconds. You write for speaking, not reading.`;
                writerUser = `Write a YouTube Shorts script using the following context. Hook: ${thinkingResults.hook_sentence}. Talking points: ${thinkingResults.talking_points?.join(", ")}. Topic: ${topic}. Tone: ${tone}. Emotional trigger: ${thinkingResults.emotional_trigger}.

Follow this exact structure. Do not deviate. Do not add the word YouTube anywhere in the output. Format with timestamps:
0 to 3 seconds: Hook line spoken to camera. Start with Did you know, Here is the truth about, or Most agents will never tell you this. One sentence only. Must create immediate curiosity.
4 to 30 seconds: Three numbered points, each one sentence. Number them 1, 2, 3.
31 to 50 seconds: Expand on the most interesting point in 2 to 3 spoken sentences. Include the local_reference naturally.
51 to 60 seconds: CTA — Follow for daily real estate tips and Comment [TOPIC KEYWORD] below if you want a free guide on this.

CRITICAL: The script MUST be between 80 to 120 words with timestamped sections. Write for speaking — short sentences, natural pauses.`;
              } else {
                writerSystem = `${langInst}\n\nYou are a expert real estate social media writer.`;
                writerUser = `Write a post about ${topic} for ${platform}. Hook: ${thinkingResults.hook_sentence}. Points: ${thinkingResults.talking_points?.join(", ")}.`;
              }

              let postBody = "";
              try {
                postBody = await callSarvamChat(writerSystem, writerUser, 600);
                
                // BUG 3: Content Cleanup Patterns
                postBody = postBody
                  .replace(/^\[(Instagram|LinkedIn|WhatsApp|YouTube Shorts|Facebook|Twitter|X|YouTube)\][:\s]*/i, "")
                  .replace(/^\s*\[?(Instagram|LinkedIn|WhatsApp|YouTube Shorts|Facebook|Twitter|X|YouTube)\]?\s*$/gmi, "")
                  .trim();
              } catch (e) {
                console.error(`[SARVAM_PASS2_ERROR] ${platform}/${lang}:`, e);
                postBody = `${thinkingResults.hook_sentence || topic}\n\n${(thinkingResults.talking_points || [topic]).join("\n")}\n\n${thinkingResults.urgency_trigger || "Enquire now!"}`;
              }

              finalPosts.push({
                id: `post_${postIdCounter++}_${Date.now()}`,
                platform,
                language: lang,
                title: `${platform} — ${lang}`,
                body: postBody,
                tags: `#${topic.replace(/\s+/g, "")} #RealEstate #${thinkingResults.local_reference?.replace(/\s/g, "") || "India"}`,
                cta: thinkingResults.goal === "lead_generation" ? "Call/WhatsApp now for site visit" : "Enquire now!",
                notes: `[Sarvam-M Free] Platform-optimized generation. Language: ${lang}.`,
                engine: "sarvam-m",
              });
            }
          }

          // ── Save + Track Usage ────────────────────────────────────
          send({ step: 5, label: "Saving to your workspace..." });

          if (dbUserId && !regeneratePlatform) {
            try {
              // Log free tier usage (for 30/month quota tracking)
              await prisma.usageLog.create({
                data: { userId: dbUserId, action: "generate_workflow_free", creditsUsed: 0 },
              });
            } catch (e) {
              console.error("[WORKFLOW_FREE] Usage log failed:", e);
            }
          }

          // Save posts to library
          if (dbUserId) {
            await Promise.allSettled(
              finalPosts.map(async (post) => {
                try {
                  let plat = post.platform.toLowerCase();
                  if (plat.includes("whatsapp")) plat = "whatsapp";
                  else if (plat.includes("instagram")) plat = "instagram";

                  const saved = await prisma.generatedAsset.create({
                    data: {
                      userId: dbUserId!,
                      type: "post",
                      platform: plat as any,
                      language: (post.language || "english").toLowerCase() as any,
                      title: post.title || "Social Post",
                      body: post.body,
                      tags: typeof post.tags === "string" ? post.tags.split(/[\s,]+/).filter(Boolean) : [],
                      cta: post.cta,
                      notes: post.notes,
                    },
                  });
                  post.id = saved.id;
                } catch (e) {
                  console.error("[WORKFLOW_FREE] DB save failed:", e);
                }
              })
            );
          }

          // ── Final Success ──────────────────────────────────────────
          send({
            step: 6,
            label: `Done! Sarvam AI generated ${finalPosts.length} post${finalPosts.length > 1 ? "s" : ""} for you.`,
            result: {
              posts: finalPosts,
              intentJson: thinkingResults,
              researchJson: null,
            },
          });

          controller.close();
          return; // Exit early — skip the paid Gemini pipeline below
        }

        // ════════════════════════════════════════════════════════════════════
        // PAID TIER: Full Gemini Multi-Step Agent Pipeline
        // ════════════════════════════════════════════════════════════════════
        // ────────────────────────────────────────────────────────────────────
        // STEP 1: Intent Analyzer
        // ────────────────────────────────────────────────────────────────────
        let intentJson = cachedIntent;
        if (!intentJson) {
          send({ step: 1, label: "Analyzing your content goal and target audience..." });

          const intentSystem = `You are an expert Indian Real Estate Content Strategist. 
Analyze the user's request and return a structured JSON with these exact keys:
{
  "primaryGoal": "awareness|lead_generation|trust_building|urgency",
  "targetAudience": "first_time_buyer|investor|nri|land_buyer|general",
  "emotionalTrigger": "FOMO|aspiration|trust|urgency|security",
  "contentAngle": "string — the best angle for this goal/audience combination",
  "cityContext": "string — city or locality extracted from input, or null",
  "projectName": "string — project/property name if mentioned, or null"
}`;

          const intentUser = `Topic: ${topic}
Audience: ${audience}
Platforms: ${platforms.join(", ")}
Languages: ${languages.join(", ")}
Brand Context: ${brainContext || "Not specified"}`;

          try {
            intentJson = await callGeminiJSON(intentSystem, intentUser);
          } catch {
            intentJson = { primaryGoal: "awareness", targetAudience: "general", emotionalTrigger: "aspiration", contentAngle: "informative", cityContext: null, projectName: null };
          }
        } else {
          send({ step: 1, label: "Using cached intent analysis...", skip: true });
        }

        // ────────────────────────────────────────────────────────────────────
        // STEP 2: Research Context Agent
        // ────────────────────────────────────────────────────────────────────
        let researchJson = cachedResearch;
        if (!researchJson) {
          send({ step: 2, label: `Loading live market intelligence (${liveIntel?.totalSourcesScraped || 0} signals) + deep research for ${intentJson.cityContext || "local"} market...` });

          // Build live intelligence injection for Gemini Research Agent
          const geminiLiveContext = liveIntel?.competitiveAmmo
            ? `\n\n═══ LIVE COMPETITIVE INTELLIGENCE (Fresh from Apify Scrapers) ═══\n${liveIntel.competitiveAmmo}\n\nTOP VIRAL HOOKS CURRENTLY WORKING ON SOCIAL MEDIA:\n${(liveIntel.viralHooks || []).map((h, i) => `${i + 1}. "${h}"`).join("\n")}\n\nBUYER PAIN POINTS (from actual Google reviews & forum posts, not assumptions):\n${(liveIntel.buyerPainPoints || []).map((p, i) => `${i + 1}. ${p}`).join("\n")}\n\nCOMPETITOR WEAKNESSES (scraped from negative reviews):\n${(liveIntel.competitorGaps || []).map((g, i) => `${i + 1}. ${g}`).join("\n")}\n\nWINNING CONTENT FORMATS RIGHT NOW:\n${(liveIntel.winningFormats || []).join(" | ")}\n\nNEWSJACKING ANGLES (use these as hooks):\n${(liveIntel.newsjackingAngles || []).join("\n")}\n═══ END LIVE INTELLIGENCE ═══\n\nCRITICAL: Your research MUST incorporate the above live data. Do NOT return generic market observations. The talking points, emotional hook, and local references must reflect what is actually happening in the market today based on the scraped signals above.`
            : "";

          const researchSystem = `You are a Real Estate Research Agent specializing in Indian real estate markets (2026), especially Tier-2 cities like Nagpur, Pune, Indore.
You have access to LIVE market intelligence scraped from LinkedIn, Instagram, Google Maps, and YouTube.
Return JSON with these exact keys:
{
  "talkingPoints": ["string", "string", "string"],
  "objectionHandlers": [{"objection": "string", "response": "string"}, {"objection": "string", "response": "string"}],
  "localReferences": ["string", "string"],
  "emotionalHook": "string — one powerful hook sentence (use a live viral hook if available)",
  "marketContext": "string — use live scraped data, not generic assumptions",
  "liveSignal": "string — the single most powerful live market signal you detected that creates urgency"
}${geminiLiveContext}`;

          const researchUser = `Topic: ${topic}
Intent Analysis: ${JSON.stringify(intentJson)}
City: ${intentJson.cityContext || "India"}
Audience Type: ${intentJson.targetAudience}
Brand: ${brainContext || "Real estate developer"}
${liveIntel?.corridorSignals && Object.keys(liveIntel.corridorSignals).length > 0 ? `\nLIVE CORRIDOR SIGNALS:\n${JSON.stringify(liveIntel.corridorSignals, null, 2)}` : ""}`;

          try {
            researchJson = await callGeminiJSON(researchSystem, researchUser);
          } catch {
            researchJson = {
              talkingPoints: [
                liveIntel?.viralHooks?.[0] || topic,
                liveIntel?.buyerPainPoints?.[0] || "Prime location with appreciation potential",
                "RERA-registered with full document transparency"
              ],
              objectionHandlers: [],
              localReferences: Object.keys(liveIntel?.corridorSignals || {}).slice(0, 2) || ["Upcoming infrastructure", "City growth"],
              emotionalHook: liveIntel?.viralHooks?.[0] || "Your dream home is closer than you think.",
              marketContext: liveIntel?.newsjackingAngles?.[0] || "Strong buyer market in 2026.",
              liveSignal: liveIntel?.newsjackingAngles?.[0] || "Market is actively moving.",
            };
          }
        } else {
          send({ step: 2, label: "Using cached research context...", skip: true });
        }

        // ────────────────────────────────────────────────────────────────────
        // STEP 3: Platform Content Writers (parallel across platforms)
        // ────────────────────────────────────────────────────────────────────
        const requestedPlatforms = regenerate_single && regeneratePlatform ? [regeneratePlatform] : platforms;
        const requestedLangs = regenerate_single && regenerateLanguage ? [regenerateLanguage] : languages;

        const targetPlatforms = requestedPlatforms;
        const targetLangs = requestedLangs;

        console.log("[WORKFLOW_PAID] Processing platforms:", targetPlatforms, "Langs:", targetLangs);

        send({ step: 3, label: `Writing optimized content for ${targetPlatforms.length} platform${targetPlatforms.length > 1 ? "s" : ""} in ${targetLangs.length} language${targetLangs.length > 1 ? "s" : ""}...` });

        // For each platform, generate English content with Gemini first,
        // then transcreate each Indic language with Sarvam-M in parallel
        const platformPromises = targetPlatforms.map(async (platform: string) => {
          const platformRules = getPlatformRules(platform);

          // Live signal injection into platform content writer
          const livePlatformContext = liveIntel
            ? `\n\nLIVE INTELLIGENCE TO USE (do NOT ignore this):
- Best performing hook right now: "${liveIntel.viralHooks?.[0] || "Use urgency + local reference"}"
- Top buyer pain point to address: ${liveIntel.buyerPainPoints?.[0] || "Hidden charges and delayed possession"}
- Newsjacking angle: ${liveIntel.newsjackingAngles?.[0] || "Reference recent local development"}
- Winning format for this platform: ${liveIntel.winningFormats?.[0] || "Strong hook + value + CTA"}
- Live market signal: ${(researchJson as any)?.liveSignal || liveIntel.newsjackingAngles?.[0] || "Market is actively moving"}

CRITICAL: This post must feel like it was written by someone who checked LinkedIn and the news TODAY, not 6 months ago. Reference current market reality.`
            : "";

          // ── English Content via Gemini ──────────────────────
          const engPrompt = `You are an elite social media copywriter for Indian real estate — one who checks social media, news, and competitor activity DAILY before writing a single word.

Platform: ${platform}
${platformRules}

Topic: ${topic}
Tone: ${tone}
Goal: ${intentJson.primaryGoal}
Target Audience: ${intentJson.targetAudience}
Emotional Hook (from live research): ${researchJson.emotionalHook}
Key Talking Points (from live market scan): ${researchJson.talkingPoints?.join(", ")}
City Context: ${intentJson.cityContext || "India"}
${intentJson.projectName ? `Project Name: ${intentJson.projectName}` : ""}
${brainContext ? `Brand: ${brainContext}` : ""}${livePlatformContext}

CRITICAL RULES:
- Start with a STRONG hook from the live intelligence above — NOT a generic opener
- Address a real buyer pain point you found in the live data
- If there is a newsjacking angle, make it the context for urgency
- End with a CLEAR, specific CTA — not just "contact us"
- ${intentJson.projectName ? `Mention the project name "${intentJson.projectName}" naturally` : ""}
- ${intentJson.cityContext ? `Reference ${intentJson.cityContext} naturally` : ""}
- Write the COMPLETE post, not a template
- NEVER write generic content. A reader must feel: "This person clearly knows what's happening in the market today."

Write the ${platform} post in English (Do not start with or include the platform name in the content):`;

          let engContent = "";
          try {
            engContent = await callGeminiText(engPrompt);
          } catch (e) {
            engContent = `[${platform}] ${topic}\n\n${researchJson.emotionalHook}\n\n${researchJson.talkingPoints?.join("\n")}\n\nContact us for more info.`;
          }

          // ── Generate all language versions in parallel ──────
          const langResults: Array<{ language: string; body: string; isIndic: boolean }> = [];

          const langPromises = targetLangs.map(async (lang: string) => {
            if (lang === "English") {
              langResults.push({ language: "English", body: engContent, isIndic: false });
            } else if (INDIC_LANGUAGES.includes(lang)) {
              // Sarvam-M for all Indic languages
              try {
                let indicBody = await generateIndicContent(engContent, lang, platform, topic);
                
                // BUG 3: Cleanup labels for Indic versions too
                indicBody = indicBody
                  .replace(/^\[?(Instagram|LinkedIn|WhatsApp|YouTube Shorts|Facebook|Twitter|X|Threads|YouTube)\]?[:\s]*/i, "")
                  .replace(/^\s*\[?(Instagram|LinkedIn|WhatsApp|YouTube Shorts|Facebook|Twitter|X|Threads|YouTube)\]?\s*$/gmi, "")
                  .trim();

                langResults.push({ language: lang, body: indicBody, isIndic: true });
              } catch (e) {
                console.error(`[Sarvam] Failed for ${lang}:`, e);
                // Fallback: use English with a note
                langResults.push({ language: lang, body: `[${lang} — Sarvam AI key not configured]\n\n${engContent}`, isIndic: true });
              }
            }
          });

          await Promise.all(langPromises);

          return {
            platform,
            engContent,
            langResults,
          };
        });

        const platformResults = await Promise.all(platformPromises);

        // ────────────────────────────────────────────────────────────────────
        // STEP 4: Quality Reviewer Agent (reviews English content only)
        // ────────────────────────────────────────────────────────────────────
        send({ step: 4, label: "Running AI quality review — sharpening hooks and CTAs..." });

        const qaSystem = `You are the final Quality Assurance Editor for Indian real estate content.
You receive a list of platform posts and must fix them. For each post:
1. If the hook is weak or generic — rewrite the first line to be punchy and specific
2. Remove any filler phrases: "in today's world", "as we all know", "in the current scenario", "needless to say"
3. If CTA is weak or missing — add a specific, actionable one
4. If a project name or city was mentioned in context — ensure it appears naturally
Return JSON: { "posts": [{ "platform": "...", "body": "..." }] }`;

        const qaUser = `Context: Topic="${topic}", City="${intentJson.cityContext || "N/A"}", Project="${intentJson.projectName || "N/A"}"
Posts to review:
${JSON.stringify(platformResults.map(r => ({ platform: r.platform, body: r.engContent })))}`;

        let qaResult: any = null;
        try {
          qaResult = await callGeminiJSON(qaSystem, qaUser);
        } catch {
          // QA failed — use originals
        }

        // Build final posts array — one per platform × language
        const finalPosts: any[] = [];
        let postIdCounter = 0;

        for (const platResult of platformResults) {
          // Get QA-reviewed English body (or fallback to original)
          const qaPost = qaResult?.posts?.find((p: any) => p.platform === platResult.platform);
          const reviewedEngBody = qaPost?.body || platResult.engContent;

          for (const lr of platResult.langResults) {
            const body = lr.language === "English" ? reviewedEngBody : lr.body;
            const langConfig = SARVAM_LANGUAGE_CONFIGS[lr.language];

            finalPosts.push({
              id: `post_${postIdCounter++}_${Date.now()}`,
              platform: platResult.platform,
              language: lr.language,
              title: `${platResult.platform} — ${lr.language}`,
              body,
              tags: `#${topic.replace(/\s+/g, "")} #RealEstate #${intentJson.cityContext?.replace(/\s/g, "") || "India"}`,
              cta: intentJson.primaryGoal === "lead_generation" ? "Call/WhatsApp now for site visit" : "Follow for daily updates",
              notes: lr.isIndic
                ? `[Sarvam-M ${lr.language}] ${langConfig?.dialectInstruction?.substring(0, 80) || ""}...`
                : "[Gemini 2.5 Flash] Strategic content with research context.",
            });
          }
        }

        // ────────────────────────────────────────────────────────────────────
        // STEP 5: Save to DB + Deduct Credits
        // ────────────────────────────────────────────────────────────────────
        send({ step: 5, label: "Saving to your workspace..." });

        if (dbUserId && !regeneratePlatform) {
          // Deduct 5 credits for full workflow run
          try {
            await prisma.user.update({
              where: { id: dbUserId },
              data: {
                creditsBalance: { decrement: 5 },
                creditsLifetimeUsed: { increment: 5 },
              },
            });
            await prisma.usageLog.create({
              data: { userId: dbUserId, action: "generate_workflow", creditsUsed: 5 },
            });
          } catch (e) {
            console.error("[WORKFLOW] Credit deduction failed:", e);
          }
        }

        // Save English posts to DB for library
        if (dbUserId) {
          await Promise.allSettled(
            finalPosts
              .filter((post) => post.language === "English")
              .map(async (post) => {
                try {
                  let plat = post.platform.toLowerCase();
                  if (plat.includes("youtube")) plat = "youtube";
                  else if (plat.includes("twitter") || plat === "x") plat = "x";
                  else if (plat.includes("whatsapp")) plat = "whatsapp";
                  else if (plat.includes("instagram")) plat = "instagram";
                  else if (plat.includes("linkedin")) plat = "linkedin";
                  else if (plat.includes("facebook")) plat = "facebook";

                  const saved = await prisma.generatedAsset.create({
                    data: {
                      userId: dbUserId!,
                      type: "post",
                      platform: plat as any,
                      language: "english",
                      title: post.title || "Social Post",
                      body: post.body,
                      tags: typeof post.tags === "string" ? post.tags.split(/[\s,]+/).filter(Boolean) : [],
                      cta: post.cta,
                    },
                  });
                  post.id = saved.id;
                } catch (e) {
                  console.error("[WORKFLOW] DB save failed:", e);
                }
              })
          );
        }

        // ── Final Success Event ────────────────────────────────────────────
        send({
          step: 6,
          label: "Done! Your ContentSathi has prepared content across all platforms and languages.",
          result: {
            posts: finalPosts,
            intentJson,
            researchJson,
          },
        });

        controller.close();
      } catch (error: any) {
        console.error("[WORKFLOW_ERROR]", error);
        send({ error: error.message || "Pipeline failed unexpectedly. Please try again." });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
