"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import NextLink from "next/link";
import {
  ChevronDown, ChevronUp, BrainCircuit, Search,
  PenTool, Tag, Image, ShieldCheck, Send,
  TrendingUp, Target, Sparkles, AlertTriangle,
  CheckCircle2, Clock, ExternalLink, BarChart3,
  FileText, Hash, MessageSquarePlus, Pause, Play,
  RotateCcw, XCircle, Loader2, Activity, ArrowRight,
  Zap, Eye, RefreshCw, ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";

// ─── Agent Definitions ────────────────────────────────────────────────────────
const AGENTS = [
  {
    id: "content-lead",
    gcRole: "ContentLead",
    role: "Content Lead",
    subtitle: "Editorial PM — Strategy & Briefs",
    emoji: "👩‍💼",
    color: "from-violet-500 to-indigo-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
    pillColor: "bg-violet-100 text-violet-700",
    description: "Owns the campaign strategy. Reads brand memory, defines audience, picks angles, and hands off structured briefs to each specialist.",
    skills: ["CreateEditorialBrief", "ApproveDraft", "BuildEditorialCalendar", "SelectAngles"],
    outputs: ["Campaign brief", "Editorial calendar", "Audience segment", "Content angle list"],
    metrics: { avgTime: "18s", successRate: "97%", revisionCount: 0 },
    sampleOutput: "Campaign Brief: 'Investor Lead-Gen — Saraswati Nagri Q2 2026'\n• Audience: NRIs & HNI Investors\n• Angle 1: Plot appreciation story (ROI-first)\n• Angle 2: Infrastructure trigger (Ring Road completion)\n• Angle 3: First-mover advantage vs Western Nagpur\n• Formats: LinkedIn Article + Instagram Carousel + WhatsApp Broadcast\n• Language: English primary, Hinglish secondary",
    dependencies: { needs: ["soul.md", "User Goal"], provides: ["Research Query", "Copy Brief"] },
  },
  {
    id: "research",
    gcRole: "ResearchSpecialist",
    role: "Research Specialist",
    subtitle: "Market Intelligence, Competitor Analysis & Hunter Mode",
    emoji: "🕵️",
    color: "from-blue-500 to-cyan-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
    pillColor: "bg-blue-100 text-blue-700",
    description: "Deep-dives into market data, competitor content, and local real estate trends. In Hunter Mode, autonomously scans 99acres, MagicBricks & Instagram every 6 hours and drafts Battle Cards.",
    skills: ["GatherSources", "CompetitorAnalysis", "GapIdentification", "MarketDataScrape", "HunterMode", "BattleCardDraft"],
    outputs: ["Competitor audit", "3 proven angles", "Local market data", "Gap report", "Battle Card"],
    metrics: { avgTime: "34s", successRate: "92%", revisionCount: 1 },
    sampleOutput: "Market Intel Summary:\n• Competitors using: 'Plot in Nagpur under 20L' hooks on Instagram\n• MISSED ANGLE: None are covering MIHAN expansion effect on North Nagpur\n• Data: Avg plot appreciation in Saraswati Nagri = 22% YoY (MagicBricks Q1)\n• GAP BRIEF: Diaspora investor angle underused — only 1 competitor posting in Hindi for NRIs",
    dependencies: { needs: ["Campaign Brief"], provides: ["Research Data", "Gap Analysis", "Battle Card"] },
    marketWatchLink: true,
  },
  {
    id: "copywriter",
    gcRole: "Copywriter",
    role: "Copywriter",
    subtitle: "Lead-Gen & Platform-Specific Copy",
    emoji: "✍️",
    color: "from-cyan-500 to-teal-600",
    bg: "bg-cyan-50",
    border: "border-cyan-100",
    pillColor: "bg-cyan-100 text-cyan-700",
    description: "Writes persuasive, locally-contextual copy tailored to platform and persona. Investor-focused for LinkedIn, aspirational Hinglish for Instagram, direct CTA for WhatsApp.",
    skills: ["LinkedInArticle", "InstagramCaption", "WhatsAppBroadcast", "HookGeneration"],
    outputs: ["LinkedIn Article", "Instagram Caption + Hashtags", "WhatsApp Broadcast"],
    metrics: { avgTime: "28s", successRate: "94%", revisionCount: 1 },
    sampleOutput: "[LINKEDIN]: Why Saraswati Nagri is Nagpur's most undervalued investment pocket right now\n\nIn 2021, I told a friend to buy here. He hesitated. Today his plot is worth 42% more.\n\n[INSTAGRAM]: Jab aapka plot 3 saal mein double ho jaye, tab pata chalega 🏡✨\nSaraswati Nagri mein abhi bhi time hai. DM karo site visit ke liye.\n#NagpurProperty #SaraswatiNagri #PlotInNagpur",
    dependencies: { needs: ["Research Data", "Campaign Brief"], provides: ["Draft Copy", "CTA Options"] },
  },
  {
    id: "seo",
    gcRole: "SEOSpecialist",
    role: "SEO Specialist",
    subtitle: "Keywords, Metadata & Discoverability",
    emoji: "🔤",
    color: "from-teal-500 to-emerald-600",
    bg: "bg-teal-50",
    border: "border-teal-100",
    pillColor: "bg-teal-100 text-teal-700",
    description: "Optimizes every piece for maximum organic reach. Handles keyword mapping, metadata, YouTube descriptions, hashtags, and internal link suggestions.",
    skills: ["KeywordMapping", "MetaTagGeneration", "YouTubeOptimization", "HashtagResearch"],
    outputs: ["SEO keyword map", "Optimized title", "10 Instagram hashtags", "YouTube metadata"],
    metrics: { avgTime: "15s", successRate: "98%", revisionCount: 0 },
    sampleOutput: "[KEYWORD MAP]\nPrimary: 'plots for sale Nagpur' (1.9K/mo)\nSecondary: 'Saraswati Nagri plot price' (320/mo) | 'buy plot Nagpur' (880/mo)\nQuestion: 'Is Saraswati Nagri a good investment?'\n[HASHTAGS]: #NagpurPlots #SaraswatiNagri #NagpurRealEstate #PlotInNagpur #InvestInNagpur",
    dependencies: { needs: ["Draft Copy"], provides: ["SEO-Optimized Copy", "Metadata"] },
  },
  {
    id: "visual",
    gcRole: "VisualDesigner",
    role: "Visual Designer",
    subtitle: "Image Prompts, Carousel Design & Storyboards",
    emoji: "🎨",
    color: "from-amber-500 to-orange-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    pillColor: "bg-amber-100 text-amber-700",
    description: "Generates photo-realistic AI image prompts, carousel slide structures, and video storyboards for each platform. Ensures visual consistency with brand identity.",
    skills: ["ImagePromptGeneration", "CarouselDesign", "VideoStoryboard", "BrandColorGuide"],
    outputs: ["3 AI image prompts", "Carousel slide structure", "Reel storyboard"],
    metrics: { avgTime: "22s", successRate: "90%", revisionCount: 2 },
    sampleOutput: "[IMAGE PROMPT]: Photo-realistic aerial drone shot of residential plots in a clean Indian township, morning golden hour, Nagpur skyline visible, 8K cinematic\n\n[CAROUSEL]: Slide 1: Bold claim hook | Slide 2: Problem ('Rent bhar rahe ho?') | Slide 3: Solution | Slide 4: ROI data | Slide 5: CTA with number",
    dependencies: { needs: ["SEO Metadata", "Draft Copy"], provides: ["Image Prompts", "Slide Decks"] },
  },
  {
    id: "qc",
    gcRole: "QCAuditor",
    role: "QC Auditor",
    subtitle: "Compliance, Fact-Check & Quality Gate",
    emoji: "✅",
    color: "from-orange-500 to-rose-600",
    bg: "bg-orange-50",
    border: "border-orange-100",
    pillColor: "bg-orange-100 text-orange-700",
    description: "Audits all content against RERA guidelines, verifies data claims, rates quality 1-10, and triggers targeted rollbacks. Also runs pre-audit on research data.",
    skills: ["RERACompliance", "FactCheck", "QualityScoring", "MicroAudit", "RollbackTrigger"],
    outputs: ["Compliance report", "Quality scores (1-10)", "Revision list", "Approved verdict"],
    metrics: { avgTime: "20s", successRate: "95%", revisionCount: 0 },
    sampleOutput: "[LINKEDIN_QC] Score: 9/10 — APPROVED\n  ✅ No guaranteed return claims\n  ✅ RERA references included\n  ⚠️ 'Double ho jaye' phrase in Instagram — changed to 'significantly higher'\n[WHATSAPP_QC] Score: 8/10 — APPROVED",
    dependencies: { needs: ["All Agent Outputs"], provides: ["Approved Content", "Revision Instructions"] },
  },
  {
    id: "distribution",
    gcRole: "DistributionLead",
    role: "Distribution Lead",
    subtitle: "Channel Formatting, Scheduling & Publishing",
    emoji: "🚀",
    color: "from-rose-500 to-pink-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
    pillColor: "bg-rose-100 text-rose-700",
    description: "Takes QC-approved content and formats it for each platform's specific rules, generates optimal scheduling plan and A/B test variants.",
    skills: ["PlatformFormatting", "ScheduleOptimization", "ABTestVariant", "FollowUpSuggestion"],
    outputs: ["Ready-to-copy blocks", "Posting schedule (IST)", "A/B variant", "Follow-up suggestion"],
    metrics: { avgTime: "12s", successRate: "99%", revisionCount: 0 },
    sampleOutput: "[LINKEDIN]: Post at Tuesday 9:00 AM IST — B2B peak engagement\n[INSTAGRAM]: Post at Thursday 7:30 PM IST — Post-work browsing peak\n[WHATSAPP]: Broadcast Monday 11:00 AM IST — Pre-lunch decision window\n[A/B TEST - IG]: Alt hook: 'Ek plot ne meri zindagi badal di...' — test for 7 days vs main hook.",
    dependencies: { needs: ["QC Approved Output"], provides: ["Published Content", "Scheduling Data"] },
  },
];

// ─── Map GravityClaw agent names to our IDs ──────────────────────────────────
const GC_NAME_TO_ID: Record<string, string> = {
  "Content Lead": "content-lead",
  "ContentLead": "content-lead",
  "Research Specialist": "research",
  "ResearchSpecialist": "research",
  "Research": "research",
  "Copywriter": "copywriter",
  "Copy": "copywriter",
  "SEO Specialist": "seo",
  "SEOSpecialist": "seo",
  "SEO": "seo",
  "Visual Designer": "visual",
  "VisualDesigner": "visual",
  "QC Auditor": "qc",
  "QCAuditor": "qc",
  "Distribution Lead": "distribution",
  "DistributionLead": "distribution",
  "Orchestrator": "content-lead",
};

// Live status types
type AgentLiveStatus = "idle" | "working" | "done" | "error" | "paused";

type AgentLiveData = {
  status: AgentLiveStatus;
  lastOutput: string | null;
  outputHistory: { text: string; taskId: string; time: string; goal: string }[];
  revisionCount: number;
  totalRuns: number;
  avgQcScore: number | null;
};

const STATUS_CONFIG: Record<AgentLiveStatus, { label: string; dotClass: string; badgeClass: string; icon: any }> = {
  idle:    { label: "Idle",    dotClass: "bg-gray-300",   badgeClass: "bg-gray-50 text-gray-500 border-gray-200",   icon: Clock },
  working: { label: "Working", dotClass: "bg-indigo-500 animate-pulse", badgeClass: "bg-indigo-50 text-indigo-600 border-indigo-200", icon: Loader2 },
  done:    { label: "Done",    dotClass: "bg-emerald-500", badgeClass: "bg-emerald-50 text-emerald-600 border-emerald-200", icon: CheckCircle2 },
  error:   { label: "Error",   dotClass: "bg-red-500",    badgeClass: "bg-red-50 text-red-600 border-red-200",       icon: XCircle },
  paused:  { label: "Paused",  dotClass: "bg-amber-400",  badgeClass: "bg-amber-50 text-amber-600 border-amber-200", icon: Pause },
};

// ─── Pipeline Flow Node ───────────────────────────────────────────────────────
function PipelineNode({
  agent,
  isSelected,
  onClick,
  liveStatus,
}: {
  agent: typeof AGENTS[0];
  isSelected: boolean;
  onClick: () => void;
  liveStatus: AgentLiveStatus;
}) {
  const sc = STATUS_CONFIG[liveStatus];
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 px-3 py-3 rounded-[1.5rem] border-2 transition-all min-w-[80px] ${
        isSelected
          ? "border-indigo-400 bg-indigo-50 shadow-lg shadow-indigo-100/50"
          : "border-gray-100 hover:border-indigo-200 hover:bg-gray-50"
      }`}
    >
      <div className="relative">
        <div
          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-xl shadow-md`}
        >
          {agent.emoji}
        </div>
        {/* Live status dot */}
        <span
          className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${sc.dotClass}`}
        />
      </div>
      <p className="text-[9px] font-black uppercase tracking-wider text-gray-700 text-center max-w-[72px] leading-tight">
        {agent.role}
      </p>
    </button>
  );
}

// ─── Agent Performance Bar ────────────────────────────────────────────────────
function PerformanceRanking({ agentsData }: { agentsData: Record<string, AgentLiveData> }) {
  const ranked = AGENTS.map((a) => {
    const data = agentsData[a.id];
    return {
      ...a,
      revisions: data?.revisionCount ?? a.metrics.revisionCount,
      avgQc: data?.avgQcScore ?? null,
      totalRuns: data?.totalRuns ?? 0,
    };
  }).sort((a, b) => b.revisions - a.revisions);

  const maxRevisions = Math.max(1, ...ranked.map((r) => r.revisions));

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
          <BarChart3 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-black text-gray-900">Agent Performance</h3>
          <p className="text-xs text-gray-400 font-medium">Which agent causes the most revisions? Who has the best QC?</p>
        </div>
      </div>
      <div className="space-y-3">
        {ranked.map((a) => {
          const pct = maxRevisions > 0 ? (a.revisions / maxRevisions) * 100 : 0;
          const barColor =
            a.revisions === 0
              ? "bg-emerald-400"
              : a.revisions <= 1
              ? "bg-amber-400"
              : "bg-rose-400";
          return (
            <div key={a.id} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center text-sm shrink-0`}>
                {a.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-gray-800 truncate">{a.role}</p>
                  <div className="flex items-center gap-3 shrink-0">
                    {a.avgQc !== null && (
                      <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                        QC {a.avgQc.toFixed(1)}/10
                      </span>
                    )}
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                      a.revisions === 0
                        ? "bg-emerald-50 text-emerald-600"
                        : a.revisions <= 1
                        ? "bg-amber-50 text-amber-600"
                        : "bg-rose-50 text-rose-600"
                    }`}>
                      {a.revisions} revision{a.revisions !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                    style={{ width: `${Math.max(pct, 4)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Agent Card ───────────────────────────────────────────────────────────────
function AgentCard({
  agent,
  isExpanded,
  onToggle,
  liveData,
}: {
  agent: typeof AGENTS[0];
  isExpanded: boolean;
  onToggle: () => void;
  liveData: AgentLiveData;
}) {
  const [tab, setTab] = useState<"output" | "history" | "skills" | "metrics">("output");
  const sc = STATUS_CONFIG[liveData.status];
  const StatusIcon = sc.icon;

  return (
    <div
      className={`rounded-[2rem] border-2 transition-all duration-300 overflow-hidden ${
        isExpanded
          ? "border-indigo-200 shadow-xl shadow-indigo-100/50"
          : "border-gray-100 hover:border-indigo-100 shadow-sm"
      }`}
    >
      {/* Card Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50/50 transition-colors"
      >
        <div className="relative">
          <div
            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-2xl shadow-lg shrink-0`}
          >
            {agent.emoji}
          </div>
          <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${sc.dotClass}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-black text-gray-900">{agent.role}</h3>
            <span className={`flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${sc.badgeClass}`}>
              <StatusIcon className={`w-3 h-3 ${liveData.status === "working" ? "animate-spin" : ""}`} />
              {sc.label}
            </span>
          </div>
          <p className="text-xs text-gray-500 font-medium">{agent.subtitle}</p>
          <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{agent.description}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex gap-1">
            {agent.outputs.slice(0, 2).map((o, i) => (
              <span key={i} className={`text-[9px] font-black px-2 py-1 rounded-full ${agent.pillColor}`}>
                {o}
              </span>
            ))}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50/30">
          {/* Dependency Row */}
          <div className="px-6 pt-4 pb-2 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase text-gray-400 mr-2">Context Flow:</span>
            {agent.dependencies.needs.map((n, i) => (
              <span key={i} className="text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 px-2 py-1 rounded-lg">
                {n}
              </span>
            ))}
            <span className="text-gray-300 text-lg font-light">→</span>
            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg">
              {agent.role}
            </span>
            <span className="text-gray-300 text-lg font-light">→</span>
            {agent.dependencies.provides.map((p, i) => (
              <span key={i} className="text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-1 rounded-lg">
                {p}
              </span>
            ))}
          </div>

          {/* Market Watch CTA for Research */}
          {(agent as any).marketWatchLink && (
            <div className="mx-6 mt-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-0.5">Hunter Mode · Autonomous</p>
                <p className="text-xs font-bold text-gray-800">Scans 99acres, MagicBricks & Instagram every 6h · Drafts Battle Cards automatically</p>
              </div>
              <NextLink href="/market-watch"
                className="shrink-0 ml-4 flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-blue-200">
                🕵️ Open Market Watch
              </NextLink>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 px-6 pt-4 pb-0">
            {(["output", "history", "skills", "metrics"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  tab === t
                    ? "bg-indigo-600 text-white"
                    : "bg-white border border-gray-200 text-gray-500 hover:border-indigo-200"
                }`}
              >
                {t === "output"
                  ? "Latest Output"
                  : t === "history"
                  ? `History (${liveData.outputHistory.length})`
                  : t === "skills"
                  ? "Agent Skills"
                  : "Metrics"}
              </button>
            ))}
          </div>

          <div className="p-6 pt-4">
            {/* Latest Output */}
            {tab === "output" && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3">
                  {liveData.lastOutput ? "Latest Live Output" : "Default Sample Output"}
                </p>
                <pre className="text-xs text-gray-700 font-mono leading-relaxed whitespace-pre-wrap">
                  {liveData.lastOutput || agent.sampleOutput}
                </pre>
              </div>
            )}

            {/* Output History */}
            {tab === "history" && (
              <div className="space-y-3">
                {liveData.outputHistory.length === 0 ? (
                  <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
                    <Clock className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-gray-400">No output history yet</p>
                    <p className="text-xs text-gray-400 mt-1">Run a campaign from the Studio to see this agent&apos;s outputs here.</p>
                  </div>
                ) : (
                  liveData.outputHistory.map((entry, idx) => (
                    <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                            Run #{liveData.outputHistory.length - idx}
                          </span>
                          <span className="text-[9px] text-gray-400 font-medium">{entry.time}</span>
                        </div>
                        <span className="text-[9px] font-bold text-gray-500 truncate max-w-[200px]" title={entry.goal}>
                          {entry.goal}
                        </span>
                      </div>
                      <pre className="text-xs text-gray-600 font-mono leading-relaxed whitespace-pre-wrap line-clamp-6">
                        {entry.text}
                      </pre>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Skills */}
            {tab === "skills" && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {agent.skills.map((skill) => (
                  <div key={skill} className={`${agent.bg} ${agent.border} border rounded-2xl p-3 text-center`}>
                    <p className="text-xs font-black text-gray-800">{skill}</p>
                  </div>
                ))}
                <div className="bg-gray-100 rounded-2xl p-3 text-center flex items-center justify-center">
                  <MessageSquarePlus className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            )}

            {/* Metrics */}
            {tab === "metrics" && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Avg Run Time", value: agent.metrics.avgTime, icon: Clock },
                  { label: "Success Rate", value: agent.metrics.successRate, icon: CheckCircle2 },
                  {
                    label: "Revisions Required",
                    value: String(liveData.revisionCount || agent.metrics.revisionCount),
                    icon: AlertTriangle,
                  },
                  {
                    label: "Total Runs",
                    value: String(liveData.totalRuns),
                    icon: Activity,
                  },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <div key={m.label} className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
                      <Icon className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                      <p className="text-2xl font-black text-gray-900">{m.value}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{m.label}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────
function AgentsContent() {
  const [expandedId, setExpandedId] = useState<string | null>("content-lead");
  const [tasks, setTasks] = useState<any[]>([]);
  const pollingRef = useRef<NodeJS.Timeout>();

  const searchParams = useSearchParams();
  const agentParam = searchParams.get("agent");

  useEffect(() => {
    if (agentParam && AGENTS.some((a) => a.id === agentParam)) {
      setExpandedId(agentParam);
    }
  }, [agentParam]);

  useEffect(() => {
    fetchTasks();
    pollingRef.current = setInterval(fetchTasks, 5000);
    return () => clearInterval(pollingRef.current);
  }, []);

  async function fetchTasks() {
    try {
      const res = await fetch("/api/studio/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch {}
  }

  // ── Compute live data per agent from real task logs ──────────────────────
  const agentsLiveData: Record<string, AgentLiveData> = {};

  // Initialize all agents
  AGENTS.forEach((a) => {
    agentsLiveData[a.id] = {
      status: "idle",
      lastOutput: null,
      outputHistory: [],
      revisionCount: 0,
      totalRuns: 0,
      avgQcScore: null,
    };
  });

  // Find the actively processing task
  const activeTask = tasks.find((t) => t.status === "processing");
  const activeAgentName = activeTask?.currentAgent || null;
  const activeAgentId = activeAgentName ? GC_NAME_TO_ID[activeAgentName] || null : null;

  // Set working status for the active agent
  if (activeAgentId && agentsLiveData[activeAgentId]) {
    agentsLiveData[activeAgentId].status = "working";
  }

  // Parse all completed tasks for output history, revisions, and QC scores
  tasks.forEach((task) => {
    const logs = Array.isArray(task.logs) ? task.logs : [];
    const gc = task.generatedContent;
    const taskTime = task.createdAt
      ? new Date(task.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
      : "";
    const taskGoal = (task.goal || "").substring(0, 60);

    // Trace through logs to figure out which agents ran
    const agentsThatRan = new Set<string>();
    const agentOutputs: Record<string, string> = {};
    let rollbackCount = 0;

    logs.forEach((log: any) => {
      const msg = log.message || "";

      // Detect agent stages from log messages
      AGENTS.forEach((a) => {
        const names = [a.role, a.gcRole, a.role.toLowerCase()];
        if (names.some((n) => msg.toLowerCase().includes(n.toLowerCase()))) {
          agentsThatRan.add(a.id);
        }
      });

      // Detect rollbacks / revisions
      if (msg.toLowerCase().includes("rollback") || msg.toLowerCase().includes("revision") || msg.toLowerCase().includes("rewrite")) {
        rollbackCount++;
      }
    });

    // Parse generated content for per-agent outputs
    if (gc && Array.isArray(gc)) {
      gc.forEach((item: any) => {
        const agentName = item.agent || "";
        const matchedAgent = AGENTS.find((a) =>
          [a.role, a.gcRole, a.role.toLowerCase()].some(
            (n) => agentName.toLowerCase().includes(n.toLowerCase())
          )
        );
        if (matchedAgent) {
          agentsThatRan.add(matchedAgent.id);
          const outputText = item.text || item.content || "";
          if (outputText) {
            agentOutputs[matchedAgent.id] = outputText;
          }
        }
      });
    }

    // Update live data
    agentsThatRan.forEach((agentId) => {
      const d = agentsLiveData[agentId];
      if (d) {
        d.totalRuns++;
        if (task.status === "completed" && d.status !== "working") {
          d.status = "done";
        }
        if (task.status === "failed") {
          d.status = "error";
        }

        // Add output to history
        const output = agentOutputs[agentId];
        if (output) {
          d.lastOutput = output;
          d.outputHistory.push({
            text: output,
            taskId: task.id,
            time: taskTime,
            goal: taskGoal,
          });
        }
      }
    });

    // Attribute rollbacks primarily to Copywriter and Visual Designer (most common targets)
    if (rollbackCount > 0) {
      if (agentsLiveData["copywriter"]) agentsLiveData["copywriter"].revisionCount += Math.ceil(rollbackCount / 2);
      if (agentsLiveData["visual"]) agentsLiveData["visual"].revisionCount += Math.floor(rollbackCount / 2);
    }

    // Parse QC scores
    if (gc && Array.isArray(gc)) {
      gc.forEach((item: any) => {
        if (item.qcScore && typeof item.qcScore === "number") {
          const d = agentsLiveData["qc"];
          if (d) {
            d.avgQcScore = d.avgQcScore ? (d.avgQcScore + item.qcScore) / 2 : item.qcScore;
          }
        }
      });
    }
  });

  // Limit history to most recent 10
  AGENTS.forEach((a) => {
    agentsLiveData[a.id].outputHistory = agentsLiveData[a.id].outputHistory.slice(-10).reverse();
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-1">
            ContentSathi · Mission Control
          </p>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Your 7-Agent Team</h1>
          <p className="text-gray-400 font-medium mt-1">
            Deep-dive into each agent — live status, output history, skills, and metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchTasks();
              toast.success("Refreshed agent data");
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-50 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <NextLink
            href="/studio"
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl shadow-md shadow-indigo-200 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Brief All Agents
          </NextLink>
        </div>
      </div>

      {/* Pipeline Flow Visualization — ALL 7 VISIBLE + scrollable on mobile */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Agent Pipeline — Live Status
          </p>
          <div className="flex items-center gap-3">
            {(["working", "done", "idle", "error"] as AgentLiveStatus[]).map((s) => (
              <span key={s} className="flex items-center gap-1 text-[9px] font-bold text-gray-400">
                <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dotClass.replace(" animate-pulse", "")}`} />
                {STATUS_CONFIG[s].label}
              </span>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto pb-2 -mx-2 px-2">
          <div className="flex items-center gap-0 min-w-0">
            {AGENTS.map((agent, i) => (
              <div key={agent.id} className="flex items-center shrink-0">
                <PipelineNode
                  agent={agent}
                  isSelected={expandedId === agent.id}
                  onClick={() => setExpandedId(expandedId === agent.id ? null : agent.id)}
                  liveStatus={agentsLiveData[agent.id]?.status || "idle"}
                />
                {i < AGENTS.length - 1 && (
                  <div className="flex items-center px-1 shrink-0">
                    <div className={`w-6 sm:w-8 h-0.5 ${
                      agentsLiveData[AGENTS[i + 1].id]?.status === "done" ||
                      agentsLiveData[AGENTS[i + 1].id]?.status === "working"
                        ? "bg-gradient-to-r from-indigo-400 to-indigo-300"
                        : "bg-gradient-to-r from-gray-200 to-gray-300"
                    }`} />
                    <div className={`w-0 h-0 border-t-[5px] border-b-[5px] border-l-[5px] border-transparent ${
                      agentsLiveData[AGENTS[i + 1].id]?.status === "done" ||
                      agentsLiveData[AGENTS[i + 1].id]?.status === "working"
                        ? "border-l-indigo-300"
                        : "border-l-gray-300"
                    }`} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent Performance Ranking */}
      <PerformanceRanking agentsData={agentsLiveData} />

      {/* Agent Cards */}
      <div className="space-y-4">
        {AGENTS.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            isExpanded={expandedId === agent.id}
            onToggle={() => setExpandedId(expandedId === agent.id ? null : agent.id)}
            liveData={agentsLiveData[agent.id]}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Page Wrapper ────────────────────────────────────────────────────────
export default function AgentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <span className="animate-pulse text-indigo-500 font-bold">Loading agent specs...</span>
        </div>
      }
    >
      <AgentsContent />
    </Suspense>
  );
}
