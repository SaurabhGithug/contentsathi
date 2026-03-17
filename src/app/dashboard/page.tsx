"use client";

import { useEffect, useState, useRef } from "react";
import {
  BrainCircuit, Zap, TrendingUp, TrendingDown, CheckCircle2, AlertCircle,
  Clock, ArrowRight, Sparkles, Target,
  CalendarCheck, BarChart3, Instagram, Linkedin,
  Youtube, MessageCircle, ChevronRight,
  Eye, Layers, Activity, Heart, ArrowUpRight, ArrowDownRight,
  Settings, BookOpen, Gauge
} from "lucide-react";
import Link from "next/link";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")   // **bold**
    .replace(/\*(.*?)\*/g, "$1")       // *italic*
    .replace(/__(.*?)__/g, "$1")       // __bold__
    .replace(/_(.*?)_/g, "$1")         // _italic_
    .replace(/#+\s?/g, "")             // # headings
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [link](url)
    .replace(/`([^`]+)`/g, "$1")       // `code`
    .trim();
}

function TrendBadge({ value, label }: { value: number; label: string }) {
  if (value === 0) return <span className="text-[10px] font-bold text-gray-400">{label}</span>;
  const isUp = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-black ${isUp ? "text-emerald-600" : "text-red-500"}`}>
      {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {isUp ? "+" : ""}{value} {label}
    </span>
  );
}

export default function AgencyHQPage() {
  const [stats, setStats] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<number>(0);
  const [onboardingCompleted, setOnboardingCompleted] = useState(true);
  const [loading, setLoading] = useState(true);
  const pollingRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    fetchAll();
    pollingRef.current = setInterval(fetchAll, 8000);
    return () => clearInterval(pollingRef.current);
  }, []);

  async function fetchAll() {
    try {
      const [statsRes, tasksRes, approvalsRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/studio/tasks"),
        fetch("/api/studio/tasks"),
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
        const pending = (a.tasks || []).filter(
          (i: any) => i.status === "completed" && i.generatedContent
        ).length;
        setPendingApprovals(pending);
      }
    } catch {}
    finally { setLoading(false); }
  }

  const activeTasks = tasks.filter(t => t.status === "processing");
  const completedCount = tasks.filter(t => t.status === "completed").length;
  const userName = stats?.brandName || "Partner";
  const greeting = getGreeting();

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }

  // Health score ring
  const healthScore = stats?.healthScore ?? 0;
  const healthLabel = stats?.healthLabel ?? "—";
  const healthColor = stats?.healthColor ?? "gray";
  const circumference = 2 * Math.PI * 42;
  const dashOffset = circumference - (healthScore / 100) * circumference;

  const HEALTH_COLORS: Record<string, { ring: string; text: string; bg: string }> = {
    emerald: { ring: "stroke-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50" },
    blue: { ring: "stroke-blue-500", text: "text-blue-600", bg: "bg-blue-50" },
    amber: { ring: "stroke-amber-500", text: "text-amber-600", bg: "bg-amber-50" },
    red: { ring: "stroke-red-500", text: "text-red-600", bg: "bg-red-50" },
    gray: { ring: "stroke-gray-300", text: "text-gray-500", bg: "bg-gray-50" },
  };
  const hc = HEALTH_COLORS[healthColor] || HEALTH_COLORS.gray;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {!onboardingCompleted && (
        <OnboardingWizard onComplete={() => setOnboardingCompleted(true)} />
      )}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
            {greeting}, {userName}.
          </h1>
          <p className="text-gray-500 font-medium text-lg">
            Here&apos;s your marketing pulse for today.
          </p>
        </div>
        <Link
          href="/studio"
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-95 whitespace-nowrap group"
        >
          <Sparkles className="w-4 h-4" />
          Create Content
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* ── Marketing Health Score + Daily Digest ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Health Score Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center text-center group hover:border-indigo-100 transition-all">
          <div className="relative w-28 h-28 mb-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#f3f4f6" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                className={hc.ring}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: "stroke-dashoffset 1.5s ease-out" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-gray-900">{healthScore}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <Gauge className={`w-4 h-4 ${hc.text}`} />
            <p className={`text-sm font-black ${hc.text} uppercase tracking-widest`}>{healthLabel}</p>
          </div>
          <p className="text-xs text-gray-400 font-medium">Marketing Health Score</p>
        </div>

        {/* Daily Digest */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 group hover:border-indigo-100 transition-all">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">Daily Digest</h3>
              <p className="text-xs text-gray-400 font-medium">What&apos;s working · What needs attention</p>
            </div>
          </div>
          <div className="space-y-3">
            {(stats?.digestItems || ["Loading your intel..."]).map((item: string, i: number) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100"
              >
                <span className="text-base mt-0.5 shrink-0">{item.slice(0, 2)}</span>
                <p className="text-sm text-gray-700 font-medium leading-relaxed">{item.slice(3)}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Stats Row with REAL Data + Trends ───────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Published This Week",
            value: stats?.postsPublishedThisWeek ?? "—",
            trend: stats?.publishTrend ?? 0,
            trendLabel: "vs last week",
            icon: Layers,
            color: "emerald",
            href: "/library",
          },
          {
            label: "Approvals Pending",
            value: pendingApprovals,
            trend: 0,
            trendLabel: "need review",
            icon: CheckCircle2,
            color: "amber",
            href: "/approvals",
            alert: pendingApprovals > 0,
          },
          {
            label: "Campaigns Done",
            value: stats?.completedCampaignsThisWeek ?? "—",
            trend: stats?.campaignTrend ?? 0,
            trendLabel: "vs last week",
            icon: BarChart3,
            color: "indigo",
            href: "/studio",
          },
          {
            label: "Total Assets",
            value: stats?.totalAssets ?? "—",
            trend: stats?.assetsThisWeek ?? 0,
            trendLabel: "new this week",
            icon: BookOpen,
            color: "violet",
            href: "/library",
          },
        ].map((card, i) => (
          <Link
            key={i}
            href={card.href}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all group hover:-translate-y-1 block relative"
          >
            {card.alert && (
              <span className="absolute top-4 right-4 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
              </span>
            )}
            <div className={`w-10 h-10 rounded-xl bg-${card.color}-50 flex items-center justify-center text-${card.color}-600 mb-3 group-hover:scale-110 transition-transform`}>
              <card.icon className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{card.label}</p>
            <p className="text-3xl font-black text-gray-900">{card.value}</p>
            <div className="mt-2">
              <TrendBadge value={card.trend} label={card.trendLabel} />
            </div>
          </Link>
        ))}
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
           <div className="absolute top-0 left-0 w-1 bg-indigo-500 h-full" />
           <div className="flex items-center gap-3 mb-6">
             <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <BrainCircuit className="w-5 h-5 animate-pulse" />
             </div>
             <div>
               <h3 className="text-xl font-bold text-gray-900">Partner is currently working...</h3>
               <p className="text-sm text-gray-500 font-medium">Processing {activeTasks.length} active campaign{activeTasks.length > 1 ? "s" : ""}.</p>
             </div>
           </div>
           
           <div className="space-y-4">
            {activeTasks.map((task: any) => (
              <div key={task.id} className="flex items-center gap-4 bg-gray-50 rounded-2xl px-5 py-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{stripMarkdown(task.goal || "")}</p>
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

        {/* Intelligence / CAO Overview — now shows REAL data */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col justify-between group hover:border-indigo-100 transition-all">
           <div>
             <div className="flex items-center justify-between mb-6">
               <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Target className="w-6 h-6" />
               </div>
               {stats?.caoLastRun && (
                 <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                   Last run: {stats.caoLastRun}
                 </span>
               )}
             </div>
             <h3 className="text-xl font-black text-gray-900 mb-2">Active Intelligence</h3>
             <p className="text-gray-500 font-medium text-sm leading-relaxed mb-6">
               {stats?.caoInsight
                 ? stripMarkdown(stats.caoInsight)
                 : "Your AI strategist hasn't run yet. Visit the CAO to activate market intelligence and get data-driven content recommendations."
               }
             </p>
           </div>
           <Link href="/cao" className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 group-hover:text-indigo-800 transition-colors">
              Review Strategy <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
           </Link>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-4">
           {[
             { label: "Approvals", value: pendingApprovals || "0", icon: CheckCircle2, color: "amber", href: "/approvals", alert: pendingApprovals > 0 },
             { label: "Published", value: stats?.postsPublishedThisWeek ?? "—", icon: Layers, color: "emerald", href: "/library", alert: false },
             { label: "Market Hunter", value: "Analyze", icon: TrendingUp, color: "violet", href: "/market-watch", alert: false },
             { label: "Schedule", value: "View", icon: CalendarCheck, color: "blue", href: "/calendar", alert: false },
           ].map((tool, i) => (
             <Link key={i} href={tool.href} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all group hover:-translate-y-1 block relative">
               {tool.alert && (
                 <span className="absolute top-4 right-4 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
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

      {/* ── Connected Channels Footer ──────────────────────────────────── */}
      {stats?.socialAccounts && stats.socialAccounts.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Connected Channels</p>
            <div className="flex flex-wrap gap-2">
              {stats.socialAccounts.map((acc: any, i: number) => {
                const icons: Record<string, any> = { linkedin: Linkedin, instagram: Instagram, youtube: Youtube, whatsapp: MessageCircle };
                const Icon = icons[acc.platform] || Layers;
                const colors: Record<string, string> = {
                  linkedin: "bg-blue-50 text-blue-600 border-blue-100",
                  instagram: "bg-pink-50 text-pink-600 border-pink-100",
                  youtube: "bg-red-50 text-red-600 border-red-100",
                  whatsapp: "bg-emerald-50 text-emerald-600 border-emerald-100",
                };
                return (
                  <span key={i} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${colors[acc.platform] || "bg-gray-50 text-gray-600 border-gray-100"}`}>
                    <Icon className="w-3.5 h-3.5" />
                    {acc.accountName || acc.platform}
                    {acc.isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1" />}
                  </span>
                );
              })}
            </div>
          </div>
          <Link href="/settings?tab=accounts" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 shrink-0">
            <Settings className="w-3.5 h-3.5" />
            Manage Accounts
          </Link>
        </div>
      )}

    </div>
  );
}
