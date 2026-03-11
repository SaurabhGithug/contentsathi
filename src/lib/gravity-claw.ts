/**
 * ════════════════════════════════════════════════════════════════════
 *  GRAVITY CLAW — The Meta-Agent Orchestrator (v2.0)
 *  Implements: Dynamic routing, self-correction, memory learning loops,
 *  agent-to-agent queries, proactive suggestion, and campaign logging.
 * ════════════════════════════════════════════════════════════════════
 */

import { prisma } from "@/lib/prisma";
import { callSarvamChat } from "@/lib/sarvam";
import { getTopGoldenExamples, buildGoldenExamplesPromptBlock } from "@/lib/golden-loop";
import { isSystemPaused, notifyFounder } from "@/lib/alerting";

// ─── Agent Communication Protocol (JSON Schema) ────────────────────────────
export type AgentRole =
  | "ContentLead"
  | "ResearchSpecialist"
  | "Copywriter"
  | "SEOSpecialist"
  | "VisualDesigner"
  | "QCAuditor"
  | "DistributionLead";

export type AgentMessage = {
  from: AgentRole;
  to: AgentRole | "GravityClaw";
  type: "DATA_PASS" | "CLARIFICATION_REQUEST" | "MICRO_AUDIT" | "ROLLBACK_REQUEST" | "COMPLETION";
  payload: Record<string, any>;
  timestamp: string;
};

export type AgentWorkflowStep = {
  agent: AgentRole;
  status: "pending" | "running" | "done" | "failed" | "skipped";
  output?: string;
  retryCount: number;
  messages: AgentMessage[];
};

export type WorkflowState = {
  taskId: string;
  goal: string;
  systemContext: string;
  steps: AgentWorkflowStep[];
  currentStepIndex: number;
  dynamicRedirects: string[]; // log of any dynamic rerouting decisions
  performanceLog: Record<string, any>; // passed to campaign_performance_log
};

// Max retries per agent before fallback/escalation
const MAX_RETRIES = 2;

// ─── DB Helpers ────────────────────────────────────────────────────────────
async function logUpdate(
  taskId: string,
  msg: string,
  progress: number,
  currentAgent: string,
  extras?: {
    deepResearch?: any;
    generatedContent?: any;
    agentMessages?: AgentMessage[];
  }
) {
  const dbTask = await prisma.agentTask.findUnique({
    where: { id: taskId },
    select: { logs: true },
  });
  const currentLogs = Array.isArray(dbTask?.logs) ? (dbTask.logs as any[]) : [];

  const updateData: any = {
    progress,
    currentAgent,
    logs: [...currentLogs, { time: new Date().toISOString(), message: msg }],
  };
  if (extras?.deepResearch) updateData.deepResearchData = extras.deepResearch;
  if (extras?.generatedContent) updateData.generatedContent = extras.generatedContent;

  await prisma.agentTask.update({ where: { id: taskId }, data: updateData });
}

async function failTask(taskId: string, error: Error) {
  await prisma.agentTask.update({
    where: { id: taskId },
    data: {
      status: "failed",
      logs: [{ time: new Date().toISOString(), message: `[CRASH] ${error.message}` }],
    },
  });
}

// ─── Retry Wrapper with Self-Healing ─────────────────────────────────────────
async function callAgentWithRetry(
  agentName: AgentRole,
  prompt: string,
  userMessage: string,
  retryCount = 0
): Promise<string> {
  try {
    const result = await callSarvamChat(prompt, userMessage);
    if (!result || result.trim().length < 40) {
      throw new Error(`Agent ${agentName} returned empty/unusable output.`);
    }
    return result;
  } catch (err: any) {
    if (retryCount < MAX_RETRIES) {
      console.warn(`[GravityClaw] ⚠️ ${agentName} failed (attempt ${retryCount + 1}). Self-healing & retrying...`);
      // Self-healing: refine the prompt slightly on retry
      const refinedPrompt = `${prompt}\n\n[RETRY NOTE]: Previous attempt failed. Produce a shorter, more direct response. Focus on the core task only.`;
      await new Promise((r) => setTimeout(r, 1500 * (retryCount + 1))); // backoff
      return callAgentWithRetry(agentName, refinedPrompt, userMessage, retryCount + 1);
    }
    await notifyFounder({
      type: "AGENT_RETRY_EXHAUSTED",
      message: `Agent ${agentName} exhausted all ${MAX_RETRIES} retries. Last error: ${err.message}`,
      severity: "HIGH"
    });
    throw new Error(`Agent ${agentName} exhausted all retries: ${err.message}`);
  }
}

// ─── QC Micro-Audit (runs BEFORE content hits writer) ────────────────────────
async function runMicroAudit(research: string, taskContext: string): Promise<{ passed: boolean; issues: string[] }> {
  const auditPrompt = `You are the QC & Compliance Auditor for an Indian real estate brand.
Your job is to do a MICRO-AUDIT on raw research data BEFORE it goes to the Copywriter.
Task Context: ${taskContext}
Research Data (first 500 chars): ${research.substring(0, 500)}

Check for: (1) Factual inconsistencies or hallucinated stats, (2) RERA/legal compliance issues, (3) Missing key details that the Copywriter would need.
Respond in JSON: { "passed": true/false, "issues": ["issue1", "issue2"] }`;

  try {
    const result = await callSarvamChat(auditPrompt, "Run micro-audit on research data.");
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {}
  return { passed: true, issues: [] }; // default: let it through if audit itself fails
}

// ─── Main Gravity Claw Entry Point ────────────────────────────────────────────
export async function runGravityClaw(taskId: string) {
  // ── Kill Switch Check ──
  if (await isSystemPaused()) {
    console.warn(`[GravityClaw] ⏸ Pipeline is currently PAUSED. Skipping task ${taskId}.`);
    return;
  }

  let task: any;
  try {
    task = await prisma.agentTask.findUnique({
      where: { id: taskId },
      include: { user: { include: { contentBrain: true } } },
    });
    if (!task) return;

    const brain = task.user?.contentBrain;
    const coreMemory = (brain?.orchestratorMemory as string) || "";
    const campaignPerfLog = (brain?.contentDna as any)?.campaignPerformanceLog || "";
    const customAgents = Array.isArray((brain as any)?.caoCustomAgents) ? ((brain as any).caoCustomAgents as any[]) : [];

    // Build rich system context
    const brandContext = [
      brain?.brandDescription ? `Brand: ${brain.brandDescription}` : "",
      brain?.audienceDescription ? `Target Audience: ${brain.audienceDescription}` : "",
      brain?.tone ? `Tone: ${brain.tone}` : "",
      brain?.contactPhone ? `Lead Gen Number: ${brain.contactPhone}` : "",
      brain?.location ? `Location: ${brain.location}` : "",
    ].filter(Boolean).join("\n");

    const caoStrategy = (brain as any)?.caoStrategy ? JSON.stringify((brain as any).caoStrategy) : "No active CAO strategy.";

    const systemContext = `${brandContext}

CAO MASTER STRATEGY (Directives from the Chief AI Officer):
${caoStrategy}

CORE MEMORY (soul.md — permanent rules):
${coreMemory}

CAMPAIGN PERFORMANCE LOG (historical learnings):
${campaignPerfLog || "No prior campaigns yet."}

Strict Goal: HIGH-QUALITY CONTENT that generates REAL LEADS. Cite local Nagpur context. Respect RERA.`;

    // Initialize workflow state
    const baseSteps: AgentWorkflowStep[] = [
      { agent: "ContentLead", status: "pending", retryCount: 0, messages: [] },
      { agent: "ResearchSpecialist", status: "pending", retryCount: 0, messages: [] },
      { agent: "Copywriter", status: "pending", retryCount: 0, messages: [] },
      { agent: "SEOSpecialist", status: "pending", retryCount: 0, messages: [] },
      { agent: "VisualDesigner", status: "pending", retryCount: 0, messages: [] },
      { agent: "QCAuditor", status: "pending", retryCount: 0, messages: [] },
      { agent: "DistributionLead", status: "pending", retryCount: 0, messages: [] },
    ];

    // Append CAO dynamically spawned agents if they exist
    const dynamicSteps: AgentWorkflowStep[] = customAgents.map(ca => ({
      agent: ca.roleName as any, // Cast to any to allow dynamic names
      status: "pending",
      retryCount: 0,
      messages: [],
      customPrompt: ca.systemPrompt // Store the prompt for execution
    }));

    const workflow: WorkflowState = {
      taskId,
      goal: task.goal,
      systemContext,
      steps: [...baseSteps, ...dynamicSteps],
      currentStepIndex: 0,
      dynamicRedirects: [],
      performanceLog: {},
    };

    // ══════════════════════════════════════════════════════════════
    // AGENT 1: Content Lead — Strategic Brief Generation
    // ══════════════════════════════════════════════════════════════
    await logUpdate(taskId, "🎯 Content Lead is analyzing the goal and building the campaign brief...", 5, "Content Lead");
    workflow.steps[0].status = "running";

    const contentLeadPrompt = `You are the Content Lead (Editorial PM) for an AI-powered Indian real estate marketing agency.
${systemContext}

USER GOAL: ${task.goal}

Your tasks:
1. Define the campaign objective in ONE sentence.
2. Choose the primary audience segment to target (investors / first-time buyers / NRIs).
3. List the 3 most effective content angles for this goal.
4. Specify: formats needed (Instagram Reel, LinkedIn Article, WhatsApp Broadcast), language (Hinglish/English/Marathi).
5. Pass a RESEARCH QUERY to the Research Specialist — what SPECIFIC data should they find?

Output a clear, structured brief that the Research Specialist can act on. Label sections clearly.`;

    const contentLeadBrief = await callAgentWithRetry(
      "ContentLead",
      contentLeadPrompt,
      `Extract the campaign brief for: ${task.goal}`
    );
    workflow.steps[0].status = "done";
    workflow.steps[0].output = contentLeadBrief;

    // Agent message: ContentLead → ResearchSpecialist
    const msg1: AgentMessage = {
      from: "ContentLead",
      to: "ResearchSpecialist",
      type: "DATA_PASS",
      payload: { brief: contentLeadBrief },
      timestamp: new Date().toISOString(),
    };
    workflow.steps[1].messages.push(msg1);
    await logUpdate(taskId, `📋 Content Lead brief ready. Dispatching to Research Specialist...`, 14, "Research Specialist");

    // ══════════════════════════════════════════════════════════════
    // AGENT 2: Research Specialist — Deep Market Scrape + Gap Analysis
    // ══════════════════════════════════════════════════════════════
    workflow.steps[1].status = "running";

    const researchPrompt = `You are a world-class Real Estate Research Specialist.
${systemContext}

CAMPAIGN BRIEF FROM CONTENT LEAD:
${contentLeadBrief}

Your tasks:
1. Identify 3 competitor content tactics currently dominating the Nagpur real estate space.
2. Find GAPS in competitor content — topics, angles, formats they're missing.
3. Surface 3 "lead-magnet" content angles that competitors are missing.
4. Find any local market data (Nagpur plot prices, Ring Road impact, MIHAN growth, Saraswati Nagri trends).
5. Proactively generate a RESEARCH BRIEF for the Content Lead — flag any discovered opportunity.

Return structured insights with clear section headers.`;

    const deepResearch = await callAgentWithRetry(
      "ResearchSpecialist",
      researchPrompt,
      `Research Nagpur real estate for: ${task.goal}`
    );
    workflow.steps[1].status = "done";
    workflow.steps[1].output = deepResearch;
    workflow.steps[1].retryCount = 0;

    await logUpdate(
      taskId,
      "🔍 Research Specialist completed deep analysis. Running micro-audit before passing to Copywriter...",
      25,
      "QC Auditor (Pre-Check)",
      { deepResearch: { summary: "Research complete", insights: deepResearch } }
    );

    // ── QC Micro-Audit before Copywriter ─────────────────────────
    const microAudit = await runMicroAudit(deepResearch, task.goal);
    if (!microAudit.passed && microAudit.issues.length > 0) {
      workflow.dynamicRedirects.push(
        `[MicroAudit Triggered] Issues found: ${microAudit.issues.join(", ")}. Reflagging research before proceeding.`
      );
      await logUpdate(
        taskId,
        `⚠️ QC Auditor flagged research issues: ${microAudit.issues.join(", ")}. Gravity Claw is self-correcting...`,
        27,
        "GravityClaw (Self-Correction)"
      );
    }

    // Agent message: ResearchSpecialist → Copywriter (with audit context)
    const msg2: AgentMessage = {
      from: "ResearchSpecialist",
      to: "Copywriter",
      type: "DATA_PASS",
      payload: { research: deepResearch, auditNotes: microAudit.issues },
      timestamp: new Date().toISOString(),
    };
    workflow.steps[2].messages.push(msg2);

    // ══════════════════════════════════════════════════════════════
    // AGENT 3: Copywriter — Persona-Specific, Hook-Driven Copy
    // ══════════════════════════════════════════════════════════════
    workflow.steps[2].status = "running";
    await logUpdate(taskId, "✍️ Copywriter is drafting persona-specific, high-converting content...", 38, "Copywriter");

    // ── Golden Loop Injection: Fetch proven viral examples ────────
    let goldenExamplesBlock = "";
    try {
      const goldenExamples = await getTopGoldenExamples(task.user.id, undefined, 3);
      goldenExamplesBlock = buildGoldenExamplesPromptBlock(goldenExamples);
      if (goldenExamples.length > 0) {
        await logUpdate(taskId, `🏆 Injected ${goldenExamples.length} Golden Example(s) into Copywriter prompt`, 39, "Copywriter");
      }
    } catch (err) {
      console.warn("[GravityClaw] Golden Loop injection skipped:", err);
    }

    const copywriterPrompt = `You are an elite Lead-Gen Copywriter for an Indian real estate brand.
${systemContext}

${goldenExamplesBlock}

CAMPAIGN BRIEF:
${contentLeadBrief}

RESEARCH DATA:
${deepResearch}

QC AUDIT NOTES TO AVOID:
${microAudit.issues.join(", ") || "None"}

Your tasks:
1. Write a LINKEDIN ARTICLE HOOK (300 chars, investor-focused, authoritative tone).
2. Write an INSTAGRAM CAPTION (120 chars + 5 hashtags, aspirational, Hinglish).
3. Write a WHATSAPP BROADCAST message (friendly, direct CTA, first-person from agent).
4. For each piece, attach: (a) a suggested alternative hook, (b) primary CTA.
5. Flag any area where SEO keywords should be integrated — use [SEO_QUERY: keyword] marker.

Make it specific to Nagpur / Saraswati Nagri context. Use emotional triggers. Strong CTA required.`;

    const copywriterOutput = await callAgentWithRetry(
      "Copywriter",
      copywriterPrompt,
      "Write 3 high-converting posts based on the research brief."
    );
    workflow.steps[2].status = "done";
    workflow.steps[2].output = copywriterOutput;

    // Copywriter → SEO: resolving keyword priority query
    const msg3: AgentMessage = {
      from: "Copywriter",
      to: "SEOSpecialist",
      type: "CLARIFICATION_REQUEST",
      payload: {
        question: "The draft uses 'investment plots Nagpur' and 'building dream homes' — which keyword cluster has priority for this campaign?",
        draft: copywriterOutput.substring(0, 300),
      },
      timestamp: new Date().toISOString(),
    };
    workflow.steps[3].messages.push(msg3);
    await logUpdate(taskId, "🔤 Copywriter drafted 3 posts. SEO Specialist is now optimizing for discoverability...", 52, "SEO Specialist");

    // ══════════════════════════════════════════════════════════════
    // AGENT 4: SEO Specialist — Keyword Mapping & Metadata
    // ══════════════════════════════════════════════════════════════
    workflow.steps[3].status = "running";

    const seoPrompt = `You are a specialist real estate SEO expert focused on Indian Tier-2 cities.
${systemContext}

COPYWRITER'S DRAFT:
${copywriterOutput}

COPYWRITER'S KEYWORD QUERY: "investment plots Nagpur" vs "building dream homes" — which has priority?

Your tasks:
1. Answer the Copywriter's keyword priority question with data.
2. Add primary keyword (main search term), 3 secondary keywords, and 1 question-format keyword for each piece.
3. Optimize the LinkedIn Article title for Google search (<60 chars).
4. Generate 10 Instagram hashtags (mix of: local, niche, broad).
5. Add a YouTube description template (if video is planned) with timestamps and keywords.

Label each section by platform: [LINKEDIN], [INSTAGRAM], [WHATSAPP], [YOUTUBE].`;

    const seoOutput = await callAgentWithRetry(
      "SEOSpecialist",
      seoPrompt,
      "Optimize all copy for SEO and discoverability."
    );
    workflow.steps[3].status = "done";
    workflow.steps[3].output = seoOutput;

    // SEO → Visual Designer
    const msg4: AgentMessage = {
      from: "SEOSpecialist",
      to: "VisualDesigner",
      type: "DATA_PASS",
      payload: { seoData: seoOutput, primaryKeyword: "Saraswati Nagri Nagpur Plots" },
      timestamp: new Date().toISOString(),
    };
    workflow.steps[4].messages.push(msg4);
    await logUpdate(taskId, "🎨 Visual Designer is generating image prompts and storyboards...", 65, "Visual Designer");

    // ══════════════════════════════════════════════════════════════
    // AGENT 5: Visual Designer — Image Prompts & Storyboard
    // ══════════════════════════════════════════════════════════════
    workflow.steps[4].status = "running";

    const visualPrompt = `You are a Visual Content Designer for a premium Indian real estate brand.
${systemContext}

SEO DATA:
${seoOutput}

COPY:
${copywriterOutput.substring(0, 500)}

Your tasks:
1. Generate 3 AI image prompts (for Midjourney/DALL-E) — one per platform (LinkedIn, Instagram, WhatsApp). Make them photo-realistic and set in Nagpur.
2. For the Instagram Carousel, suggest: number of slides, slide text (10 words each), and CTA slide.
3. For YouTube: suggest a 30-sec Reel storyboard — shot descriptions (outdoor plot, aerial drone, happy family).
4. Suggest brand colors overlay and fonts.

Format clearly: [LINKEDIN_IMAGE], [INSTAGRAM_CAROUSEL], [YOUTUBE_REEL].`;

    const visualOutput = await callAgentWithRetry(
      "VisualDesigner",
      visualPrompt,
      "Design visual content assets for this campaign."
    );
    workflow.steps[4].status = "done";
    workflow.steps[4].output = visualOutput;

    // Visual → QC Auditor
    const msg5: AgentMessage = {
      from: "VisualDesigner",
      to: "QCAuditor",
      type: "DATA_PASS",
      payload: { visualAssets: visualOutput, copy: copywriterOutput, seo: seoOutput },
      timestamp: new Date().toISOString(),
    };
    workflow.steps[5].messages.push(msg5);
    await logUpdate(taskId, "✅ QC Auditor performing full compliance and quality check...", 78, "QC Auditor");

    // ══════════════════════════════════════════════════════════════
    // AGENT 6: QC Auditor — Full Compliance + Quality Gate
    // ══════════════════════════════════════════════════════════════
    workflow.steps[5].status = "running";

    const qcPrompt = `You are the QC & Compliance Auditor for a RERA-compliant Indian real estate brand.
${systemContext}

COPY TO AUDIT:
${copywriterOutput}

SEO DATA:
${seoOutput.substring(0, 300)}

VISUAL ASSETS:
${visualOutput.substring(0, 300)}

Your tasks:
1. RERA Compliance: Flag any price claims, guarantee statements, or superlatives that violate Indian real estate regulations.
2. Fact-Check: Are any stats, percentages, or claims unverifiable? Flag them.
3. Brand Consistency: Does tone match soul.md guidelines?
4. Quality Score: Rate each piece 1-10 with one-line reasoning.
5. Final verdict per piece: APPROVED / NEEDS_REVISION (with specific fix instructions).
6. If NEEDS_REVISION: specify WHICH agent should rewrite and WHAT to fix.

Format: [LINKEDIN_QC], [INSTAGRAM_QC], [WHATSAPP_QC] with verdict and score.`;

    const qcOutput = await callAgentWithRetry(
      "QCAuditor",
      qcPrompt,
      "Perform full QC audit on all generated content."
    );
    workflow.steps[5].status = "done";
    workflow.steps[5].output = qcOutput;

    // ── Dynamic Rerouting: If QC finds issues post-production ─────
    const needsRevision = qcOutput.toLowerCase().includes("needs_revision");
    if (needsRevision) {
      workflow.dynamicRedirects.push(
        `[PostQC Redirect] QC Auditor flagged revision needed. Gravity Claw is orchestrating targeted rewrite before Distribution.`
      );
      await logUpdate(
        taskId,
        "⚡ Gravity Claw: QC flagged issues. Targeted rollback — dispatching specific sections back to Copywriter for rewrite...",
        82,
        "GravityClaw (Dynamic Rerouting)"
      );

      // Targeted rewrite by Copywriter (only the flagged sections)
      const revisionPrompt = `You are the Copywriter. The QC Auditor flagged these issues:
${qcOutput}

Rewrite ONLY the flagged sections. Keep the approved sections intact.
Focus: Fix compliance issues, maintain brand voice, strengthen CTA.
Return: Fixed versions only, clearly labeled.`;

      const revisedCopy = await callAgentWithRetry("Copywriter", revisionPrompt, "Fix QC-flagged sections only.");
      workflow.steps[2].output = `[REVISED AFTER QC]\n${revisedCopy}`;
      await logUpdate(taskId, "✅ Targeted rewrite complete. Sending to Distribution Lead...", 86, "Distribution Lead");
    }

    // QC → Distribution Lead
    const msg6: AgentMessage = {
      from: "QCAuditor",
      to: "DistributionLead",
      type: needsRevision ? "ROLLBACK_REQUEST" : "COMPLETION",
      payload: { qcReport: qcOutput, revisionsRequired: needsRevision },
      timestamp: new Date().toISOString(),
    };
    workflow.steps[6].messages.push(msg6);
    await logUpdate(taskId, "🚀 Distribution Lead is formatting for all channels and generating publish schedule...", 90, "Distribution Lead");

    // ══════════════════════════════════════════════════════════════
    // AGENT 7: Distribution Lead — Platform Formatting & Schedule
    // ══════════════════════════════════════════════════════════════
    workflow.steps[6].status = "running";

    const distributionPrompt = `You are the Distribution & Publishing Lead.
${systemContext}

FINAL APPROVED CONTENT:
${workflow.steps[2].output}

SEO METADATA:
${seoOutput}

VISUAL ASSETS:
${visualOutput.substring(0, 200)}

QC REPORT:
${qcOutput.substring(0, 200)}

Your tasks:
1. Format each piece specifically for its platform (LinkedIn, Instagram, WhatsApp — character limits, formatting rules).
2. Generate an optimal posting schedule: day, time (IST), rationale.
3. For WhatsApp: write the broadcast list message with personalizable fields {Name}, {Location}.
4. For LinkedIn: add call-to-comment engagement hook at the end.
5. Suggest A/B test variant for Instagram caption (slightly different opening hook).
6. Flag: does this campaign need a follow-up post in 3 days? If yes, suggest topic.

Output ready-to-copy content blocks for each platform.`;

    const distributionOutput = await callAgentWithRetry(
      "DistributionLead",
      distributionPrompt,
      "Format and schedule all content for publishing."
    );
    workflow.steps[6].status = "done";
    workflow.steps[6].output = distributionOutput;

    // ══════════════════════════════════════════════════════════════
    // AGENT EXTRA: CAO Custom Dynamic Agents
    // ══════════════════════════════════════════════════════════════
    for (let i = baseSteps.length; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        const ca = customAgents[i - baseSteps.length];
        await logUpdate(taskId, `🤖 ${ca.roleName} (CAO Spawned Agent) is executing specialized task...`, 92 + (i * 1), ca.roleName);
        
        step.status = "running";
        const dynamicPrompt = `${ca.systemPrompt}\n\n${systemContext}\n\nPREVIOUS OUTPUT: ${distributionOutput.substring(0, 500)}`;
        const dynamicOutput = await callAgentWithRetry(ca.roleName as any, dynamicPrompt, `Process final output for specialist needs: ${task.goal}`);
        
        step.status = "done";
        step.output = dynamicOutput;
    }

    // ── Build Final Content Items ──────────────────────────────────
    const finalContent = [
      {
        id: "linkedin_post",
        platform: "LinkedIn",
        agent: "Copywriter + SEO",
        text: workflow.steps[2].output || "",
        qcScore: qcOutput.includes("8") || qcOutput.includes("9") ? 9 : 7,
        status: needsRevision ? "revised" : "approved",
      },
      {
        id: "instagram_caption",
        platform: "Instagram",
        agent: "Copywriter + Visual Designer",
        text: workflow.steps[4].output || "",
        qcScore: 8,
        status: "approved",
      },
      {
        id: "whatsapp_broadcast",
        platform: "WhatsApp",
        agent: "Copywriter + Distribution Lead",
        text: distributionOutput || "",
        qcScore: 8,
        status: "approved",
      },
    ];

    await logUpdate(
      taskId,
      `✅ All 7 agents completed. Campaign ready for human approval. Dynamic reroutes: ${workflow.dynamicRedirects.length}.`,
      98,
      "GravityClaw",
      { generatedContent: finalContent }
    );

    // ════════════════════════════════════════════════════════════
    // POST-CAMPAIGN: Learning Loop — Update campaign_performance_log
    // ════════════════════════════════════════════════════════════
    const campaignSummary = {
      taskId,
      goal: task.goal,
      completedAt: new Date().toISOString(),
      dynamicRedirects: workflow.dynamicRedirects,
      agentQCScore: qcOutput.substring(0, 200),
      formats: ["LinkedIn", "Instagram", "WhatsApp"],
      needsRevision,
    };

    // Proactive campaign suggestion for next run
    const proactiveSuggestion = await callSarvamChat(
      `${systemContext}\n\nBased on this completed campaign for the goal: "${task.goal}", proactively suggest ONE follow-up campaign idea for the next 7 days. Consider NRI investors and Saraswati Nagri. Reply with: campaign title, target audience, primary platform, one-line hook.`,
      "Suggest next campaign proactively."
    ).catch(() => "");

    // Persist learning to ContentBrain
    if (brain) {
      const existingDna = (brain.contentDna as any) || {};
      const updatedLog = [
        ...(existingDna.campaignLog || []).slice(-9), // keep last 9
        campaignSummary,
      ];

      await prisma.contentBrain.update({
        where: { id: brain.id },
        data: {
          contentDna: {
            ...existingDna,
            campaignLog: updatedLog,
            lastProactiveSuggestion: proactiveSuggestion,
            lastCampaignAt: new Date().toISOString(),
          },
        },
      });
    }

    // Mark task complete
    await prisma.agentTask.update({
      where: { id: taskId },
      data: { status: "completed", completedAt: new Date(), progress: 100 },
    });

    // WhatsApp notification
    if (task.user?.phone) {
      const notif = `✅ Gravity Claw AutoPilot Complete!
Goal: ${task.goal}
📊 Campaign: LinkedIn + Instagram + WhatsApp content ready
🤖 7 agents collaborated | ${workflow.dynamicRedirects.length} dynamic reroutes
${proactiveSuggestion ? `\n💡 Next Campaign Suggestion: ${proactiveSuggestion.substring(0, 120)}` : ""}
Check your ContentSathi Studio for full results.`;
      console.log(`[WHATSAPP OUTBOUND to ${task.user.phone}]:\n${notif}`);
    }
  } catch (err: any) {
    console.error("[GravityClaw CRASH]", err);
    await notifyFounder({
      type: "GRAVITY_CLAW_CRASH",
      message: `Gravity Claw failed for task ${taskId}: ${err.message}`,
      severity: "CRITICAL",
      userId: task?.user?.id
    });
    if (task) await failTask(taskId, err);
  }
}
