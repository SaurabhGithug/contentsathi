import { prisma } from "@/lib/prisma";
import { callSarvamJSON } from "@/lib/sarvam";
import { runGravityClaw } from "@/lib/gravity-claw";
import { fetchSocialIntelligence } from "@/lib/market-intelligence";
import { detectAndSaveWinners } from "@/lib/golden-loop";
import { isSystemPaused, notifyFounder } from "@/lib/alerting";

/**
 * CAO Brain — The "Thinking" engine of the master AI agent.
 * Handles self-analysis, market-watch integration, and autonomous decision making.
 */
export async function runCaoIntelligence(userId: string) {
  // 1. Kill Switch Check
  if (await isSystemPaused()) {
    console.warn(`[CAO] ⏸ System is currently PAUSED. Skipping heartbeat for user ${userId}.`);
    return { success: false, error: "System Paused" };
  }

  // 2. Idempotency Check (Prevent double runs)
  const existingJob = await prisma.jobRun.findFirst({
    where: {
      userId,
      jobType: "CAO_HEARTBEAT",
      status: "IN_PROGRESS",
    }
  });

  if (existingJob) {
    console.warn(`[CAO] ⚠️ Job already running for userId ${userId}. Skipping.`);
    return { success: false, error: "Existing job in progress" };
  }

  // 3. Start Job Tracking
  const job = await prisma.jobRun.create({
    data: {
      userId,
      jobType: "CAO_HEARTBEAT",
      status: "IN_PROGRESS"
    }
  });

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { contentBrain: true },
    });

    if (!user || !user.contentBrain) {
      await prisma.jobRun.update({ where: { id: job.id }, data: { status: "FAILED", completedAt: new Date() } });
      return { success: false, error: "No brand profile" };
    }

    const brain = user.contentBrain;
    const brainAny = brain as any;
    const caoStrategy = brainAny.caoStrategy;
    const city = brain.location || "Nagpur";
    const industry = brain.industry || "Real Estate";

    // 1. Live Market Intelligence via Apify & Tavily
    console.log(`[CAO] 🔎 Hunting for live social intelligence...`);
    const signals = await fetchSocialIntelligence(userId);

    // 1.5. Golden Loop — detect winner posts from scraped data
    console.log(`[CAO] 🏆 Running Golden Loop winner detection...`);
    let goldenLoopResult = { winnersFound: 0, totalScanned: 0, newGoldenExamples: [] as string[] };
    try {
      goldenLoopResult = await detectAndSaveWinners(userId);
      if (goldenLoopResult.winnersFound > 0) {
        console.log(`[CAO] ⭐ Golden Loop found ${goldenLoopResult.winnersFound} winner(s) from ${goldenLoopResult.totalScanned} posts`);
      }
    } catch (err) {
      console.warn(`[CAO] Golden Loop skipped:`, err);
    }

    // 1.8. Fetch Historical Analytics for Self-Correction Feedback Loop
    const historicalAnalytics = await prisma.postAnalytics.findMany({
      where: { userId },
      orderBy: { fetchedAt: 'desc' },
      take: 20,
    });
    
    // Calculate a naive average engagement rate to see what's failing/succeeding
    const topPerforming = historicalAnalytics.filter(a => (a.engagementRate || 0) > 2.0).slice(0, 5);
    const lowPerforming = historicalAnalytics.filter(a => (a.engagementRate || 0) < 0.5).slice(0, 5);

    const feedbackLoopContext = `
TOP PERFORMING PAST POSTS (Learn from these):
${topPerforming.map(a => `[${a.platform}] Reach: ${a.reach}, Likes: ${a.likes}, ER: ${a.engagementRate}%`).join("\n") || "No data yet."}

LOW PERFORMING PAST POSTS (Avoid repeating these mistakes):
${lowPerforming.map(a => `[${a.platform}] Reach: ${a.reach}, Likes: ${a.likes}, ER: ${a.engagementRate}%`).join("\n") || "No data yet."}
`;

    // 2. Synthesize Intelligence and Build Strategy
    const systemPrompt = `You are the Chief AI Officer (CAO) for ${brain.brandName || "a real estate brand"}.
Your job is to generate a daily "Master Strategy" based on live market news and self-correct based on past performance.
Current Location: ${city}
Current Brand Data: ${JSON.stringify({ 
  audience: brain.audienceDescription, 
  usps: brain.usps, 
  lastStrategy: caoStrategy 
})}

FEEDBACK LOOP (Historical Performance):
${feedbackLoopContext}

LIVE MARKET DATA (last 6 hours):
${signals.map(s => `[${s.platform.toUpperCase()}] Likes: ${s.likes}, Comments: ${s.comments}\n${s.postText}`).slice(0, 15).join("\n\n")}

Instructions:
1. Identify the top 3 engagement patterns from the live data.
2. Analyze the Feedback Loop to avoid past mistakes and double down on what works (Self-Correction).
3. Build this week's strategy around the highest value predictive insight.
4. Set an 'urgency_level' (low, medium, high) based on the immediacy of the market data.
5. If urgency_level is 'high', set should_auto_launch to true.

Respond in EXACT JSON:
{
  "market_insight": "string - 1 sentence summary of what's happening now in the city",
  "predictive_trend": "string - Predictive insight for the next 7 days based on the data",
  "recommended_theme": "string - which theme should we focus on this week (e.g. Trust, Investment, Urgency)",
  "campaign_brief": "string - a 50-word brief for a new campaign including the specific market data discovered",
  "urgency_level": "low | medium | high",
  "should_auto_launch": boolean,
  "reasoning": "string - logic behind self-correction and autonomous trigger"
}`;

    console.log(`[CAO] 🧠 Analyzing data and deciding strategy (Self-Correcting Mode)...`);
    const intelligence = await callSarvamJSON(systemPrompt, "Build the master strategy for today.", 1500);

    // 3. Update DB with new strategy
    await prisma.contentBrain.update({
      where: { id: brain.id },
      data: {
        caoStrategy: intelligence,
        caoLastRunAt: new Date(),
        caoChannelData: {
          sourcesScraped: signals.length,
          lastSignalTime: signals.length > 0 ? signals[0].scrapedAt : new Date()
        }
      } as any
    });

    // 4. Autonomous Execution (If CAO decides and urgency is high)
    let autoTriggeredTaskId = null;
    if (intelligence.should_auto_launch && intelligence.urgency_level === 'high') {
      console.log(`[CAO] 🚀 AUTO-LAUNCHING CAMPAIGN (High Urgency): ${intelligence.recommended_theme}`);
      
      const newTask = await prisma.agentTask.create({
        data: {
          userId,
          goal: intelligence.campaign_brief,
          source: "cao_autonomous",
          status: "processing",
          currentAgent: "Chief AI Officer",
        }
      });
      
      autoTriggeredTaskId = newTask.id;
      // Kick off Gravity Claw in background
      runGravityClaw(newTask.id).catch(err => console.error("[CAO] Gravity Claw triggered error:", err));
    }

    // 5. Complete Job tracking
    await prisma.jobRun.update({
      where: { id: job.id },
      data: { status: "COMPLETED", completedAt: new Date() }
    });

    return {
      success: true,
      strategy: intelligence,
      autoTriggeredTaskId,
      goldenLoop: goldenLoopResult,
    };

  } catch (error: any) {
    console.error("[CAO_BRAIN_ERROR]:", error);
    
    // Alert Founder
    await notifyFounder({
      type: "CAO_HEARTBEAT_CRASH",
      message: `CAO Heartbeat failed for user ${userId}: ${error.message}`,
      severity: "CRITICAL",
      userId
    });

    // Mark Job as failed
    await prisma.jobRun.update({
      where: { id: job.id },
      data: { status: "FAILED", completedAt: new Date() }
    }).catch(() => {});

    return { success: false, error: error.message };
  }
}
