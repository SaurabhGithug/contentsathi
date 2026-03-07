"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import NextLink from "next/link";
import {
  ChevronDown, ChevronUp, BrainCircuit, Search,
  PenTool, Tag, Image, ShieldCheck, Send,
  TrendingUp, Target, Sparkles, AlertTriangle,
  CheckCircle2, Clock, Link, ExternalLink, BarChart3,
  FileText, Hash, MessageSquarePlus
} from "lucide-react";

// ─── Agent Definitions ────────────────────────────────────────────────────────
const AGENTS = [
  {
    id: "content-lead",
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
    role: "Research Specialist",
    subtitle: "Market Intelligence, Competitor Analysis & Hunter Mode",
    emoji: "🕵️",
    color: "from-blue-500 to-cyan-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
    pillColor: "bg-blue-100 text-blue-700",
    description: "Deep-dives into market data, competitor content, and local real estate trends. In Hunter Mode, autonomously scans 99acres, MagicBricks & Instagram every 6 hours and drafts Battle Cards.",
    skills: ["GatherSources", "CompetitorAnalysis", "GapIdentification", "MarketDataScrape", "HunterMode", "BattleCardDraft"],
    outputs: ["Competitor audit", "3 proven angles", "Local market data", "Gap report", "Battle Card (Hinglish + Marathi)"],
    metrics: { avgTime: "34s", successRate: "92%", revisionCount: 1 },
    sampleOutput: "Market Intel Summary:\n• Competitors using: 'Plot in Nagpur under 20L' hooks on Instagram\n• MISSED ANGLE: None are covering MIHAN expansion effect on North Nagpur\n• Data: Avg plot appreciation in Saraswati Nagri = 22% YoY (MagicBricks Q1)\n• GAP BRIEF for Content Lead: Diaspora investor angle underused — only 1 competitor posting in Hindi for NRIs",
    dependencies: { needs: ["Campaign Brief"], provides: ["Research Data", "Gap Analysis", "Battle Card"] },
    marketWatchLink: true,
  },
  {
    id: "copywriter",
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
    sampleOutput: "[LINKEDIN]: Why Saraswati Nagri is Nagpur's most undervalued investment pocket right now\n\nIn 2021, I told a friend to buy here. He hesitated. Today his plot is worth 42% more.\n\nHere's what most people still don't know about Saraswati Nagri...\n\n[INSTAGRAM]: Jab aapka plot 3 saal mein double ho jaye, tab pata chalega 🏡✨\nSaraswati Nagri mein abhi bhi time hai. DM karo site visit ke liye.\n#NagpurProperty #SaraswatiNagri #PlotInNagpur",
    dependencies: { needs: ["Research Data", "Campaign Brief"], provides: ["Draft Copy", "CTA Options"] },
  },
  {
    id: "seo",
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
    sampleOutput: "[KEYWORD MAP]\nPrimary: 'plots for sale Nagpur' (1.9K/mo)\nSecondary: 'Saraswati Nagri plot price' (320/mo) | 'buy plot Nagpur' (880/mo)\nQuestion: 'Is Saraswati Nagri a good investment?'\n[INSTAGRAM HASHTAGS]: #NagpurPlots #SaraswatiNagri #NagpurRealEstate #PlotInNagpur #InvestInNagpur #NagpurLand #MihanNagpur #RingRoadNagpur #NagpurProperty #NRIInvestment",
    dependencies: { needs: ["Draft Copy"], provides: ["SEO-Optimized Copy", "Metadata"] },
  },
  {
    id: "visual",
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
    sampleOutput: "[INSTAGRAM_IMAGE PROMPT]: Photo-realistic aerial drone shot of a row of open residential plots in a clean Indian township, morning golden hour, Nagpur skyline faintly visible in background, vibrant greens on roadsides, 8K, cinematic\n\n[CAROUSEL_STRUCTURE]: Slide 1: Bold claim hook | Slide 2: Problem ('Rent bhar rahe ho?') | Slide 3: Solution (plot investment) | Slide 4: ROI data | Slide 5: CTA with number",
    dependencies: { needs: ["SEO Metadata", "Draft Copy"], provides: ["Image Prompts", "Slide Decks"] },
  },
  {
    id: "qc",
    role: "QC Auditor",
    subtitle: "Compliance, Fact-Check & Quality Gate",
    emoji: "✅",
    color: "from-orange-500 to-rose-600",
    bg: "bg-orange-50",
    border: "border-orange-100",
    pillColor: "bg-orange-100 text-orange-700",
    description: "Audits all content against RERA guidelines, verifies data claims, rates quality 1–10, and triggers targeted rollbacks for specific sections. Also runs pre-audit on research data before it reaches the Copywriter.",
    skills: ["RERACompliance", "FactCheck", "QualityScoring", "MicroAudit", "RollbackTrigger"],
    outputs: ["Compliance report", "Quality scores (1-10)", "Revision list", "Approved verdict"],
    metrics: { avgTime: "20s", successRate: "95%", revisionCount: 0 },
    sampleOutput: "[LINKEDIN_QC] Score: 9/10 — APPROVED\n  ✅ No guaranteed return claims\n  ✅ RERA references included\n  ⚠️ 'Double ho jaye' phrase in Instagram — changed to 'significantly higher'\n[WHATSAPP_QC] Score: 8/10 — APPROVED\n  ✅ First-person tone\n  ✅ CTA compliant",
    dependencies: { needs: ["All Agent Outputs"], provides: ["Approved Content", "Revision Instructions"] },
  },
  {
    id: "distribution",
    role: "Distribution Lead",
    subtitle: "Channel Formatting, Scheduling & Publishing",
    emoji: "🚀",
    color: "from-rose-500 to-pink-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
    pillColor: "bg-rose-100 text-rose-700",
    description: "Takes QC-approved content and formats it for each platform's specific rules, then generates an optimal scheduling plan and A/B test variants.",
    skills: ["PlatformFormatting", "ScheduleOptimization", "ABTestVariant", "FollowUpSuggestion"],
    outputs: ["Ready-to-copy blocks", "Posting schedule (IST)", "A/B variant", "Follow-up suggestion"],
    metrics: { avgTime: "12s", successRate: "99%", revisionCount: 0 },
    sampleOutput: "[LINKEDIN]: Post at Tuesday 9:00 AM IST — Rationale: B2B peak engagement\n[INSTAGRAM]: Post at Thursday 7:30 PM IST — Rationale: Post-work browsing peak\n[WHATSAPP]: Broadcast Monday 11:00 AM IST — Rationale: Pre-lunch decision window\n[A/B VARIANT - IG]: Opening hook alternative: 'Ek plot ne meri zindagi badal di...' — test for 7 days vs main hook.",
    dependencies: { needs: ["QC Approved Output"], provides: ["Published Content", "Scheduling Data"] },
  },
];

// ─── Dependency Flow Visualizer ───────────────────────────────────────────────
function FlowArrow({ active }: { active: boolean }) {
  return (
    <div className={`flex flex-col items-center py-1 transition-all ${active ? "opacity-100" : "opacity-20"}`}>
      <div className={`w-0.5 h-6 ${active ? "bg-indigo-400" : "bg-gray-200"}`} />
      <div className={`w-2 h-2 border-r-2 border-b-2 rotate-45 -mt-1.5 ${active ? "border-indigo-400" : "border-gray-200"}`} />
    </div>
  );
}

// ─── Agent Card ───────────────────────────────────────────────────────────────
function AgentCard({ agent, isExpanded, onToggle, isActive }: { agent: typeof AGENTS[0], isExpanded: boolean, onToggle: () => void, isActive: boolean }) {
  const [tab, setTab] = useState<"output" | "skills" | "metrics">("output");

  return (
    <div className={`rounded-[2rem] border-2 transition-all duration-300 overflow-hidden ${isExpanded ? "border-indigo-200 shadow-xl shadow-indigo-100/50" : "border-gray-100 hover:border-indigo-100 shadow-sm"}`}>
      {/* Card Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50/50 transition-colors"
      >
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-2xl shadow-lg shrink-0`}>
          {agent.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-black text-gray-900">{agent.role}</h3>
            {isActive && (
              <span className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 font-medium">{agent.subtitle}</p>
          <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{agent.description}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex gap-1">
            {agent.outputs.slice(0, 2).map((o, i) => (
              <span key={i} className={`text-[9px] font-black px-2 py-1 rounded-full ${agent.pillColor}`}>{o}</span>
            ))}
          </div>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50/30">
          {/* Dependency Row */}
          <div className="px-6 pt-4 pb-2 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase text-gray-400 mr-2">Context Flow:</span>
            {agent.dependencies.needs.map((n, i) => (
              <span key={i} className="text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 px-2 py-1 rounded-lg">{n}</span>
            ))}
            <span className="text-gray-300 text-lg font-light">→</span>
            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg">{agent.role}</span>
            <span className="text-gray-300 text-lg font-light">→</span>
            {agent.dependencies.provides.map((p, i) => (
              <span key={i} className="text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-1 rounded-lg">{p}</span>
            ))}
          </div>

          {/* Market Watch Hunter Mode CTA — Research Specialist only */}
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
          <div className="flex gap-1 px-6 pt-2 pb-0">
            {(["output", "skills", "metrics"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${tab === t ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-indigo-200"}`}
              >
                {t === "output" ? "Sample Output" : t === "skills" ? "AgentSkills" : "Metrics"}
              </button>
            ))}
          </div>

          <div className="p-6 pt-4">
            {tab === "output" && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3">Last Output Sample</p>
                <pre className="text-xs text-gray-700 font-mono leading-relaxed whitespace-pre-wrap">{agent.sampleOutput}</pre>
              </div>
            )}
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
            {tab === "metrics" && (
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Avg Run Time",    value: agent.metrics.avgTime,          icon: Clock },
                  { label: "Success Rate",    value: agent.metrics.successRate,      icon: CheckCircle2 },
                  { label: "Revisions Needed", value: String(agent.metrics.revisionCount), icon: AlertTriangle },
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

function AgentsContent() {
  const [expandedId, setExpandedId] = useState<string | null>("content-lead");
  const [activeAgentId] = useState<string | null>(null); // In real version: derive from active task

  const searchParams = useSearchParams();
  const agentParam = searchParams.get("agent");

  useEffect(() => {
    if (agentParam && AGENTS.some(a => a.id === agentParam)) {
      setExpandedId(agentParam);
    }
  }, [agentParam]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-1">ContentSathi · Mission Control</p>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Your 7-Agent Team</h1>
          <p className="text-gray-400 font-medium mt-1">Deep-dive into each agent — outputs, skills, agent comms, and live metrics.</p>
        </div>
        <a href="/studio" className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl shadow-md shadow-indigo-200 transition-all">
          <Sparkles className="w-4 h-4" />
          Brief All Agents
        </a>
      </div>

      {/* Pipeline Flow Visualization */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 overflow-x-auto">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-5">Agent Dependency Graph — Task Flow</p>
        <div className="flex items-center gap-0 min-w-max">
          {AGENTS.map((agent, i) => (
            <div key={agent.id} className="flex items-center">
              <button
                onClick={() => setExpandedId(expandedId === agent.id ? null : agent.id)}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-[1.5rem] border-2 transition-all ${expandedId === agent.id ? "border-indigo-400 bg-indigo-50 shadow-lg" : "border-gray-100 hover:border-indigo-200 hover:bg-gray-50"}`}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-xl shadow-md`}>
                  {agent.emoji}
                </div>
                <p className="text-[9px] font-black uppercase tracking-wider text-gray-700 text-center max-w-[64px] leading-tight">{agent.role}</p>
              </button>
              {i < AGENTS.length - 1 && (
                <div className="flex items-center px-1">
                  <div className="w-8 h-0.5 bg-gradient-to-r from-gray-200 to-gray-300" />
                  <div className="w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-300" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Agent Cards */}
      <div className="space-y-4">
        {AGENTS.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            isExpanded={expandedId === agent.id}
            isActive={activeAgentId === agent.id}
            onToggle={() => setExpandedId(expandedId === agent.id ? null : agent.id)}
          />
        ))}
      </div>

    </div>
  );
}

// ─── Main Page Wrapper ────────────────────────────────────────────────────────
export default function AgentsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><span className="animate-pulse text-indigo-500 font-bold">Loading agent specs...</span></div>}>
      <AgentsContent />
    </Suspense>
  );
}
