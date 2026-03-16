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
    <div className="max-w-6xl mx-auto space-y-8 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {!onboardingCompleted && (
        <OnboardingWizard onComplete={() => setOnboardingCompleted(true)} />
      )}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Welcome back, Partner.</h1>
          <p className="text-gray-500 font-medium text-lg">What are we building today?</p>
        </div>
      </div>

      {/* ── Primary Action Banner ──────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-3xl border border-indigo-400/20 shadow-xl overflow-hidden relative p-8 md:p-12 transition-all">
         <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Sparkles className="w-64 h-64 text-white" />
         </div>
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="flex-shrink-0 w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
               <Zap className="w-12 h-12 text-indigo-300 fill-indigo-300/20" />
            </div>
            <div className="flex-1 text-center md:text-left">
               <h3 className="text-3xl font-black text-white mb-3 tracking-tight">Create New Content</h3>
               <p className="text-indigo-100/80 text-lg font-medium leading-relaxed max-w-2xl">
                  Brief your AI partner. It will research, write, design, and schedule posts across all your active channels in minutes.
               </p>
            </div>
            <Link href="/studio" className="px-10 py-5 bg-white text-indigo-900 font-black text-lg rounded-2xl hover:bg-indigo-50 transition-all shadow-xl hover:scale-105 active:scale-95 whitespace-nowrap group">
               Start Creating <ArrowRight className="w-5 h-5 inline-block ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
         </div>
      </div>

      {/* ── Active Work (Only show if running tasks exist) ─────────────── */}
      {activeTasks.length > 0 && (
        <div className="bg-white rounded-3xl border border-indigo-100 shadow-sm overflow-hidden p-6 py-8 relative">
           <div className="absolute top-0 left-0 w-1 bg-indigo-500 h-full"></div>
           <div className="flex items-center gap-3 mb-6">
             <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <BrainCircuit className="w-5 h-5 animate-pulse" />
             </div>
             <div>
               <h3 className="text-xl font-bold text-gray-900">Partner is currently working...</h3>
               <p className="text-sm text-gray-500 font-medium">Processing {activeTasks.length} active campaigns.</p>
             </div>
           </div>
           
           <div className="space-y-4">
            {activeTasks.map((task: any) => (
              <div key={task.id} className="flex items-center gap-4 bg-gray-50 rounded-2xl px-5 py-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{task.goal}</p>
                  <p className="text-xs text-indigo-600 font-bold uppercase mt-1">Current phase: {task.currentAgent}</p>
                </div>
                <div className="hidden sm:block flex-1 max-w-xs">
                  <div className="flex justify-between text-xs mb-1 font-bold text-gray-500">
                    <span>Progress</span>
                    <span>{task.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${task.progress}%` }} />
                  </div>
                </div>
                <Link href="/studio" className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap">
                  View Live
                </Link>
              </div>
            ))}
           </div>
        </div>
      )}

      {/* ── Tools & Overviews ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Intelligence / CAO Overview */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col justify-between group hover:border-indigo-100 transition-all">
           <div>
             <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6">
                <Target className="w-6 h-6" />
             </div>
             <h3 className="text-xl font-black text-gray-900 mb-2">Active Intelligence</h3>
             <p className="text-gray-500 font-medium text-sm leading-relaxed mb-6">
               {stats?.brain?.caoStrategy ? (
                  typeof stats.brain.caoStrategy === 'string' ? stats.brain.caoStrategy : (stats.brain.caoStrategy.market_insight || "Executing data-driven market infiltration strategy.")
               ) : "Partner is listening to market signals and steering your content strategy automatically."}
             </p>
           </div>
           <Link href="/cao" className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 group-hover:text-indigo-800 transition-colors">
              Review Strategy <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
           </Link>
        </div>

        {/* Quick Stats & Tools Grid */}
        <div className="grid grid-cols-2 gap-4">
           {[
             { label: "Approvals Needed", value: pendingApprovals, icon: CheckCircle2, color: "amber", href: "/approvals", alert: pendingApprovals > 0 },
             { label: "Posts Published", value: completedCount, icon: Layers, color: "emerald", href: "/library", alert: false },
             { label: "Market Hunter", value: "Analyze", icon: TrendingUp, color: "violet", href: "/market-watch", alert: false },
             { label: "Content Schedule", value: "View", icon: CalendarCheck, color: "blue", href: "/calendar", alert: false },
           ].map((tool, i) => (
             <Link key={i} href={tool.href} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all group hover:-translate-y-1 block relative">
               {tool.alert && (
                 <span className="absolute top-4 right-4 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                 </span>
               )}
               <div className={`w-10 h-10 rounded-xl bg-${tool.color}-50 flex items-center justify-center text-${tool.color}-600 mb-4 group-hover:scale-110 transition-transform`}>
                  <tool.icon className="w-5 h-5" />
               </div>
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{tool.label}</p>
               <p className="text-2xl font-black text-gray-900 mt-1">{tool.value}</p>
             </Link>
           ))}
        </div>

      </div>

    </div>
  );
}
