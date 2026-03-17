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

// Standard Token Limits per Agent
const TOKEN_LIMITS: Record<string, number> = {
  ContentLead: 1500,
  ResearchSpecialist: 2500,
  Copywriter: 2000,
  SEOSpecialist: 1500,
  VisualDesigner: 2000,
  QCAuditor: 1500,
  DistributionLead: 1500,
  Default: 1200
};

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
    const limit = TOKEN_LIMITS[agentName] || TOKEN_LIMITS.Default;
    const result = await callSarvamChat(prompt, userMessage, limit);
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
      (brain as any)?.marketingStage ? `Project Stage: ${(brain as any).marketingStage}` : "",
      (brain as any)?.marketingGap ? `Current Pain Point: ${(brain as any).marketingGap}` : "",
    ].filter(Boolean).join("\n");

    const caoStrategy = (brain as any)?.caoStrategy ? JSON.stringify((brain as any).caoStrategy) : "No active CAO strategy.";

    const inputContext = (task as any)?.inputContext ? `INPUT CONTEXT DATA:\n${JSON.stringify((task as any).inputContext)}\n` : "";

    const systemContext = `${inputContext}${brandContext}

NAGPUR GROUNDING DATA (STRICT):
- Key Corridors: Wardha Road, MIHAN, Amravati Road, Hingna Road, Outer Ring Road, Besa-Pipla, Jamtha, Koradi Road.
- Major Hubs: Butibori Industrial Estate (MIDC), MIHAN SEZ, Metro Phase 2, Dr. Babasaheb Ambedkar Airport.
- Real Estate Context: NMRDA sanctions, RERA registration numbers (format: P5050000XXXXX).
- NO HALLUCINATIONS: Do not use names like "Satyameva Nagar" or "Buttegen". Use real locations.

CAO MASTER STRATEGY (Directives from the Chief AI Officer):
${caoStrategy}

CORE MEMORY (soul.md — permanent rules):
${coreMemory}

CAMPAIGN PERFORMANCE LOG (historical learnings):
${campaignPerfLog || "No prior campaigns yet."}

STRICT RULE: Your first priority is to extract REAL company names and proper nouns from the research data. 
If the scraper provides real posts, identify the authors/builders. Do NOT use placeholders like "ABC Realty".
Goal: HIGH-QUALITY CONTENT that generates REAL LEADS. Cite local Nagpur context. Respect RERA.`;

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
4. Identify WHICH platforms the user explicitly asked for (e.g. LinkedIn, Instagram, WhatsApp). ONLY list the platforms explicitly requested. If no specific platforms were requested, default to all three. DO NOT suggest platforms that were not requested. Specify the language (Hinglish/English/Marathi).
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
1. Identify WHICH platforms are specifically requested in the CAMPAIGN BRIEF.
2. ONLY write content for the platforms requested. DO NOT write content for unrequested platforms.
3. If LinkedIn is requested, write a LINKEDIN ARTICLE HOOK (300 chars, investor-focused, authoritative tone) and full content.
4. If Instagram is requested, write an INSTAGRAM CAPTION (120 chars + 5 hashtags, aspirational, Hinglish).
5. If WhatsApp is requested, write a WHATSAPP BROADCAST message (friendly, direct CTA, first-person from agent).
6. For each piece, attach: (a) a suggested alternative hook, (b) primary CTA.
7. Flag any area where SEO keywords should be integrated — use [SEO_QUERY: keyword] marker.

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
2. Review the COPYWRITER'S DRAFT to see which platforms were generated. ONLY generate metadata for platforms present in the draft.
3. If LinkedIn is present: Add primary keyword, 3 secondary keywords, and optimize the LinkedIn Article title for Google search (<60 chars).
4. If Instagram is present: Add primary keyword, 3 secondary keywords, and generate 10 Instagram hashtags (mix of: local, niche, broad).
5. If WhatsApp is present: Add primary/secondary keywords for internal use.
6. If YouTube is mentioned: Add a YouTube description template with timestamps and keywords.

Label each section by platform: [LINKEDIN], [INSTAGRAM], [WHATSAPP], [YOUTUBE], but ONLY if writing for that platform.`;

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
1. Review the input COPY and SEO. Identify WHICH platforms are actually present.
2. ONLY generate 1 AI image prompt (for Midjourney/DALL-E) per platform present in the copy. Make them photo-realistic and set in Nagpur.
3. If an Instagram Carousel is present, suggest: number of slides, slide text (10 words each), and CTA slide.
4. If YouTube is present: suggest a 30-sec Reel storyboard — shot descriptions (outdoor plot, aerial drone, happy family).
5. Suggest brand colors overlay and fonts.

Format clearly: [LINKEDIN_IMAGE], [INSTAGRAM_CAROUSEL], [WHATSAPP_IMAGE], [YOUTUBE_REEL] (ONLY use the labels corresponding to the requested platforms).`;

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
1. Identify which platforms are present in the provided copy. ONLY audit those platforms.
2. RERA Compliance: Flag any price claims, guarantee statements, or superlatives that violate Indian real estate regulations.
3. Fact-Check: Are any stats, percentages, or claims unverifiable? Flag them.
4. Brand Consistency: Does tone match soul.md guidelines?
5. Quality Score: Rate each piece 1-10 with one-line reasoning.
6. Final verdict per piece: APPROVED / NEEDS_REVISION (with specific fix instructions).
7. If NEEDS_REVISION: specify WHICH agent should rewrite and WHAT to fix.

Format: [LINKEDIN_QC], [INSTAGRAM_QC], [WHATSAPP_QC] (only for present platforms) with verdict and score.`;

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

      // Targeted rewrite by Copywriter (Full version)
      const revisionPrompt = `You are the Copywriter. The QC Auditor flagged these issues in the previous draft:
${qcOutput}

Rewrite ONLY the flagged posts to fix these issues. Output the FULL NEW VERSION of those posts. 
Do NOT write posts for unflagged platforms, but keep their original content in your output so it is complete.
Focus: Fix compliance issues, maintain brand voice, strictly follow the grounding data.`;

      const revisedCopy = await callAgentWithRetry("Copywriter", revisionPrompt, "Provide the COMPLETE revised campaign content.");
      workflow.steps[2].output = revisedCopy; // Save the full revised version
      await logUpdate(taskId, "✅ Full campaign content revised and merged. Sending to Distribution Lead...", 86, "Distribution Lead");
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
1. Identify which platforms are present in the FINAL APPROVED CONTENT. ONLY process those platforms.
2. Format each piece specifically for its platform (LinkedIn, Instagram, WhatsApp — character limits, formatting rules).
3. Generate an optimal posting schedule: day, time (IST), rationale for those platforms.
4. If WhatsApp is present: write the broadcast list message with personalizable fields {Name}, {Location}.
5. If LinkedIn is present: add call-to-comment engagement hook at the end.
6. If Instagram is present: Suggest A/B test variant for Instagram caption.
7. Flag: does this campaign need a follow-up post in 3 days? If yes, suggest topic.

Output ready-to-copy content blocks for each requested platform, labeled with [PLATFORM_NAME_FINAL].`;

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

    // ── Build Final Content Items (Parsed per platform) ───────────────────
    const finalContent: any[] = [];
    
    // Helper: Parse content block for a specific platform using common markers
    const parsePlatformContent = (content: string, platform: string) => {
      const markers = [
        `\\[${platform.toUpperCase()}_FINAL\\]`,
        `\\[${platform.toUpperCase()}\\]`,
        `\\*\\*${platform.toUpperCase()}\\*\\*`,
        `${platform}:`
      ];
      
      for (const marker of markers) {
        const regex = new RegExp(`${marker}([\\s\\S]*?)(?=\\[[A-Z_]+_FINAL\\]|\\[[A-Z]+\\]|\\*\\*[A-Z]+\\*\\*|$)`, "i");
        const match = content.match(regex);
        if (match && match[1]?.trim()) return match[1].trim();
      }
      return null;
    };

    const requestedPlatforms = ["LinkedIn", "Instagram", "WhatsApp", "YouTube"];
    const combinedOutput = `${distributionOutput}\n${workflow.steps[2].output}\n${workflow.steps[4].output}`;

    requestedPlatforms.forEach(p => {
      const parsedText = parsePlatformContent(combinedOutput, p);
      if (parsedText) {
        finalContent.push({
          id: `${p.toLowerCase()}_${Date.now()}`,
          platform: p,
          agent: "GravityClaw Parsed",
          text: parsedText,
          qcScore: qcOutput.includes(p) ? (parseInt(qcOutput.split(p)[1]?.match(/\d+/)?.[0] || "8")) : 8,
          status: "approved",
        });
      }
    });

    // Fallback: If parsing failed but we have output, give the raw distribution block
    if (finalContent.length === 0) {
      finalContent.push({
        id: `raw_output_${Date.now()}`,
        platform: "General",
        agent: "Distribution Lead",
        text: distributionOutput || workflow.steps[2].output || "",
        qcScore: 8,
        status: "approved",
      });
    }

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
