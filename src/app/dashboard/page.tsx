"use client";

import { useEffect, useState, useRef } from "react";
import {
  BrainCircuit, Zap, TrendingUp, CheckCircle2, AlertCircle,
  Clock, Plus, Activity, ArrowRight, Sparkles, Target,
  Users, CalendarCheck, BarChart3, Instagram, Linkedin,
  Youtube, MessageCircle, Twitter, RefreshCw, ChevronRight,
  Play, Pause, RotateCcw, Eye, Layers
} from "lucide-react";
import Link from "next/link";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

// ─── Pipeline Stage Config ────────────────────────────────────────────────────
const PIPELINE_STAGES = [
  { id: "brief",     label: "Brief",     emoji: "🎯", color: "from-violet-500 to-indigo-500" },
  { id: "research",  label: "Research",  emoji: "🔍", color: "from-blue-500 to-cyan-500" },
  { id: "write",     label: "Write",     emoji: "✍️",  color: "from-cyan-500 to-teal-500" },
  { id: "seo",       label: "SEO",       emoji: "🔤", color: "from-teal-500 to-emerald-500" },
  { id: "design",    label: "Design",    emoji: "🎨", color: "from-amber-500 to-orange-500" },
  { id: "qc",        label: "QC",        emoji: "✅",  color: "from-orange-500 to-rose-500" },
  { id: "publish",   label: "Publish",   emoji: "🚀",  color: "from-rose-500 to-pink-500" },
];

const STAGE_COLORS: Record<string, string> = {
  processing: "bg-indigo-100 text-indigo-700 border-indigo-200",
  completed:  "bg-emerald-100 text-emerald-700 border-emerald-200",
  failed:     "bg-red-100 text-red-700 border-red-200",
  pending:    "bg-gray-100 text-gray-500 border-gray-200",
};

const KPI_CARDS = [
  { label: "Active Campaigns",     value: "3",    sub: "+1 since yesterday", color: "indigo",  icon: Layers },
  { label: "Avg Cycle Time",       value: "4.2m",  sub: "Per 7-agent run",    color: "violet",  icon: Clock },
  { label: "Approvals Pending",    value: "7",    sub: "In human-gate queue", color: "amber",   icon: CheckCircle2 },
  { label: "Credits Used Today",   value: "340",  sub: "of ∞ agency plan",    color: "emerald", icon: Zap },
];

export default function AgencyHQPage() {
  const [stats, setStats] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<number>(0);
  const [onboardingCompleted, setOnboardingCompleted] = useState(true);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"heatmap" | "list">("heatmap");
  const pollingRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    fetchAll();
    pollingRef.current = setInterval(fetchAll, 6000);
    return () => clearInterval(pollingRef.current);
  }, []);

  async function fetchAll() {
    try {
      const [statsRes, tasksRes, approvalsRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/studio/tasks"),
        fetch("/api/approvals"),
      ]);
      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats(s);
        setOnboardingCompleted(s.onboardingCompleted ?? true);
      }
      if (tasksRes.ok) {
        const t = await tasksRes.json();
        setTasks(t.tasks || []);
      }
      if (approvalsRes.ok) {
        const a = await approvalsRes.json();
        const pending = (a.items || a || []).filter((i: any) => i.status === "pending" || i.status === "staged").length;
        setPendingApprovals(pending);
      }
    } catch {}
    finally { setLoading(false); }
  }

  // Derive pipeline heatmap data from tasks
  const stageMap: Record<string, number> = {};
  tasks.forEach((t: any) => {
    const agent = (t.currentAgent || "").toLowerCase();
    if (agent.includes("content") || agent.includes("lead")) stageMap["brief"] = (stageMap["brief"] || 0) + 1;
    else if (agent.includes("research")) stageMap["research"] = (stageMap["research"] || 0) + 1;
    else if (agent.includes("copy") || agent.includes("write")) stageMap["write"] = (stageMap["write"] || 0) + 1;
    else if (agent.includes("seo")) stageMap["seo"] = (stageMap["seo"] || 0) + 1;
    else if (agent.includes("visual") || agent.includes("design")) stageMap["design"] = (stageMap["design"] || 0) + 1;
    else if (agent.includes("qc") || agent.includes("audit")) stageMap["qc"] = (stageMap["qc"] || 0) + 1;
    else if (agent.includes("publish") || agent.includes("distribut")) stageMap["publish"] = (stageMap["publish"] || 0) + 1;
  });

  const activeTasks = tasks.filter(t => t.status === "processing");
  const completedCount = tasks.filter(t => t.status === "completed").length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {!onboardingCompleted && (
        <OnboardingWizard onComplete={() => setOnboardingCompleted(true)} />
      )}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-1">ContentSathi · Agency HQ</p>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Mission Control</h1>
          <p className="text-gray-400 font-medium mt-1">Your 7-agent AI content team, live at a glance.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black text-emerald-700">{activeTasks.length} Agents Running</span>
          </div>
          <Link href="/studio" className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl shadow-md shadow-indigo-200 transition-all">
            <Zap className="w-4 h-4 fill-current" />
            New Campaign
          </Link>
        </div>
      </div>

      {/* ── KPI Row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Campaigns",   value: loading ? "—" : activeTasks.length,             sub: "Currently processing",   color: "indigo",  icon: Layers },
          { label: "Completed Runs",     value: loading ? "—" : completedCount,                 sub: "All time",               color: "emerald", icon: CheckCircle2 },
          { label: "Approvals Pending",  value: loading ? "—" : pendingApprovals,               sub: "In human-gate queue",    color: "amber",   icon: CheckCircle2 },
          { label: "Credits Balance",    value: loading ? "—" : (stats?.creditsBalance ?? "∞"), sub: "Posts remaining",        color: "violet",  icon: Zap },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 flex items-center justify-between group hover:border-indigo-100 hover:shadow-lg transition-all">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{kpi.label}</p>
                <p className="text-4xl font-black text-gray-900">{kpi.value}</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">{kpi.sub}</p>
              </div>
              <div className={`w-14 h-14 rounded-2xl bg-${kpi.color}-50 flex items-center justify-center group-hover:bg-${kpi.color}-600 group-hover:text-white transition-all duration-300`}>
                <Icon className="w-7 h-7" />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── CAO Strategy Banner ─────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-900 rounded-3xl border border-indigo-400/20 shadow-xl overflow-hidden relative p-8">
         <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles className="w-24 h-24 text-white" />
         </div>
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
               <Target className="w-10 h-10 text-indigo-300" />
            </div>
            <div className="flex-1">
               <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Active Intelligence Directive</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
               </div>
               <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Chief AI Officer Master Strategy</h3>
               <p className="text-indigo-100/80 text-base font-medium leading-relaxed italic line-clamp-2 max-w-2xl border-l-2 border-indigo-500/30 pl-4 py-1">
                  {stats?.brain?.caoStrategy ? (
                     typeof stats.brain.caoStrategy === 'string' ? stats.brain.caoStrategy : (stats.brain.caoStrategy.market_insight || "Executing data-driven market infiltration strategy.")
                  ) : "Directing the 7-agent team using Nagpur's latest real estate intelligence..."}
               </p>
            </div>
            <Link href="/cao" className="px-8 py-4 bg-white text-indigo-900 font-black text-sm rounded-2xl hover:bg-indigo-50 transition-all shadow-xl hover:scale-105 active:scale-95 whitespace-nowrap group">
               Steer Strategy <ArrowRight className="w-4 h-4 inline-block ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
         </div>
      </div>

      {/* ── Pipeline Heatmap ───────────────────────────────────────────── */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-8 pt-6 pb-4">
          <div>
            <h2 className="text-xl font-black text-gray-900">Live Pipeline Heatmap</h2>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Idea → Brief → Research → Write → QC → Publish</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setViewMode("heatmap")} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "heatmap" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500"}`}>Heatmap</button>
            <button onClick={() => setViewMode("list")} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "list" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500"}`}>List</button>
          </div>
        </div>

        {viewMode === "heatmap" ? (
          <div className="px-8 pb-8">
            {/* Stage flow */}
            <div className="flex items-stretch gap-1 overflow-x-auto pb-2">
              {PIPELINE_STAGES.map((stage, i) => {
                const count = stageMap[stage.id] || 0;
                const intensity = count > 0 ? "opacity-100 shadow-lg scale-105" : "opacity-40";
                return (
                  <div key={stage.id} className="flex items-center gap-1 flex-1 min-w-[80px]">
                    <div className={`flex-1 rounded-2xl p-4 text-center cursor-pointer transition-all duration-300 bg-gradient-to-b ${stage.color} ${intensity}`}>
                      <div className="text-2xl mb-2">{stage.emoji}</div>
                      <p className="text-white text-xs font-black uppercase">{stage.label}</p>
                      {count > 0 && (
                        <div className="mt-2 bg-white/20 rounded-lg px-2 py-1">
                          <p className="text-white text-sm font-black">{count}</p>
                        </div>
                      )}
                    </div>
                    {i < PIPELINE_STAGES.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Active campaign pills */}
            {activeTasks.length > 0 && (
              <div className="mt-6 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Active Campaigns</p>
                {activeTasks.map((task: any) => (
                  <div key={task.id} className="flex items-center gap-4 bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
                      <BrainCircuit className="w-4 h-4 text-white animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-indigo-900 truncate">{task.goal}</p>
                      <p className="text-[10px] text-indigo-500 font-bold uppercase">{task.currentAgent} · {task.progress}% complete</p>
                    </div>
                    <div className="h-1.5 w-32 bg-indigo-200 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${task.progress}%` }} />
                    </div>
                    <Link href="/studio" className="text-xs font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                      Watch <Eye className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}

            {tasks.length === 0 && !loading && (
              <div className="mt-8 text-center py-10 border-2 border-dashed border-gray-100 rounded-3xl">
                <BrainCircuit className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-bold text-sm">No active campaigns. The pipeline is clear.</p>
                <Link href="/studio" className="mt-4 inline-flex items-center gap-2 text-sm font-black text-indigo-600 hover:text-indigo-800">
                  Brief the team now <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 px-0">
            {tasks.length === 0 && <p className="py-10 text-center text-gray-400 font-medium text-sm">No campaigns yet.</p>}
            {tasks.slice(0, 5).map((task: any) => (
              <div key={task.id} className="flex items-center gap-4 px-8 py-4 hover:bg-gray-50">
                <div className={`w-3 h-3 rounded-full ${task.status === "processing" ? "bg-indigo-500 animate-pulse" : task.status === "completed" ? "bg-emerald-500" : "bg-red-500"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{task.goal}</p>
                  <p className="text-[10px] text-gray-400 font-medium uppercase">{task.status} · {task.currentAgent}</p>
                </div>
                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full border ${STAGE_COLORS[task.status] || STAGE_COLORS["pending"]}`}>
                  {task.status}
                </span>
                <p className="text-xs text-gray-400">{task.progress}%</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Meet Your Team + Quick Actions ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Status Mini-Cards */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-black text-gray-900">Your Agency Team</h2>
            <Link href="/agents" className="text-xs font-black text-indigo-600 flex items-center gap-1 hover:text-indigo-800">
              Full Detail View <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: "content-lead", role: "Content Lead",     emoji: "👩‍💼", status: "Standby",    color: "violet" },
              { id: "research",     role: "Research Agent",   emoji: "🕵️",  status: activeTasks.length > 0 ? "Active" : "Standby", color: "blue" },
              { id: "copywriter",   role: "Copywriter",       emoji: "✍️",   status: "Standby",    color: "cyan" },
              { id: "seo",          role: "SEO Expert",       emoji: "🔍",  status: "Standby",    color: "teal" },
              { id: "visual",       role: "Visual Designer",  emoji: "🎨",  status: "Standby",    color: "amber" },
              { id: "qc",           role: "QC Auditor",       emoji: "✅",   status: "Standby",    color: "emerald" },
              { id: "distribution", role: "Distribution",     emoji: "🚀",   status: "Standby",    color: "rose" },
            ].map((agent) => (
              <Link key={agent.role} href={`/agents?agent=${agent.id}`} className="bg-gray-50 rounded-2xl p-3 text-center hover:bg-indigo-50 hover:border-indigo-100 border border-transparent transition-all group">
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{agent.emoji}</div>
                <p className="text-[10px] font-black text-gray-800 leading-tight">{agent.role}</p>
                <div className={`mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${agent.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400 group-hover:bg-white group-hover:text-indigo-500"}`}>
                  {agent.status === "Active" && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                  {agent.status}
                </div>
              </Link>
            ))}
            <Link href="/agents" className="bg-gradient-to-br from-indigo-500 to-fuchsia-600 rounded-2xl p-3 text-center flex flex-col items-center justify-center cursor-pointer hover:-translate-y-0.5 transition-all">
              <Sparkles className="w-6 h-6 text-white mb-2" />
              <p className="text-[10px] font-black text-white">View Team Details</p>
            </Link>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[2.5rem] p-6 text-white shadow-xl">
          <h2 className="text-lg font-black mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {[
              { label: "New Campaign",        href: "/studio",    emoji: "⚡", desc: "Brief the 7-agent team" },
              { label: "Review Approvals",    href: "/approvals", emoji: "✅", desc: pendingApprovals > 0 ? `${pendingApprovals} item${pendingApprovals !== 1 ? 's' : ''} pending review` : "No items pending" },
              { label: "Market Hunter",       href: "/market-watch", emoji: "🎯", desc: "Competitor analysis" },
              { label: "Asset Vault",         href: "/library",   emoji: "📦", desc: "All published content" },
              { label: "Calendar",            href: "/calendar",  emoji: "📅", desc: "Publishing schedule" },
            ].map((action) => (
              <Link key={action.href} href={action.href}
                className="flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-all group"
              >
                <span className="text-xl">{action.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black">{action.label}</p>
                  <p className="text-[10px] text-white/60 font-medium">{action.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/80 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Published Today ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-black text-gray-900">Publishing Today</h2>
        <Link href="/calendar" className="text-xs font-black text-indigo-600 flex items-center gap-1 hover:text-indigo-800">
          Full Calendar <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 text-center">
        <CalendarCheck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-400 font-bold">No posts scheduled for today.</p>
        <Link href="/studio" className="mt-3 inline-flex items-center gap-2 text-sm font-black text-indigo-600 hover:text-indigo-800">
          Brief the team for a campaign <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  );
}
