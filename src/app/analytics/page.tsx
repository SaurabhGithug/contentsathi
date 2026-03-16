"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp, Activity, BarChart3, Zap, Clock, CheckCircle2,
  AlertTriangle, Users, Target, PieChart, Calendar,
  ArrowUpRight, ArrowDownRight, Minus
} from "lucide-react";

// ─── Mock data (replace with real API in production) ─────────────────────────
const PERFORMANCE_OVER_TIME = [
  { week: "W1", score: 62, leads: 3, compliance: 95 },
  { week: "W2", score: 70, leads: 5, compliance: 97 },
  { week: "W3", score: 75, leads: 7, compliance: 98 },
  { week: "W4", score: 82, leads: 11, compliance: 99 },
  { week: "W5", score: 78, leads: 9, compliance: 98 },
  { week: "W6", score: 88, leads: 14, compliance: 100 },
];

const AGENT_ANALYTICS = [
  { name: "Content Lead",         avgTime: "18s", successRate: 97, revisions: 0,  color: "violet",  emoji: "👩‍💼" },
  { name: "Research Specialist",  avgTime: "34s", successRate: 92, revisions: 1,  color: "blue",    emoji: "🕵️" },
  { name: "Copywriter",           avgTime: "28s", successRate: 94, revisions: 1,  color: "cyan",    emoji: "✍️" },
  { name: "SEO Specialist",       avgTime: "15s", successRate: 98, revisions: 0,  color: "teal",    emoji: "🔤" },
  { name: "Visual Designer",      avgTime: "22s", successRate: 90, revisions: 2,  color: "amber",   emoji: "🎨" },
  { name: "QC Auditor",           avgTime: "20s", successRate: 95, revisions: 0,  color: "orange",  emoji: "✅" },
  { name: "Distribution Agent",   avgTime: "12s", successRate: 99, revisions: 0,  color: "rose",    emoji: "🚀" },
];

const CONTENT_MIX = [
  { type: "LinkedIn Article", count: 12, color: "from-blue-500 to-indigo-600" },
  { type: "Instagram Caption", count: 18, color: "from-pink-500 to-rose-600" },
  { type: "WhatsApp Broadcast", count: 9, color: "from-emerald-500 to-teal-600" },
  { type: "YouTube Script", count: 4, color: "from-amber-500 to-orange-600" },
];

const PLATFORM_QUALITY = [
  { platform: "LinkedIn",   score: 88, trend: "up",   color: "bg-indigo-600" },
  { platform: "Instagram",  score: 82, trend: "up",   color: "bg-pink-500" },
  { platform: "WhatsApp",   score: 91, trend: "same", color: "bg-emerald-500" },
  { platform: "YouTube",    score: 76, trend: "down", color: "bg-amber-500" },
];

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "up") return <ArrowUpRight className="w-4 h-4 text-emerald-600" />;
  if (trend === "down") return <ArrowDownRight className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-gray-400" />;
}

function MiniBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex-1">
      <div
        className={`h-full rounded-full ${color} transition-all duration-700`}
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
  );
}

// ─── Story Mode Timeline ───────────────────────────────────────────────────────
const STORY_EVENTS = [
  { time: "Day 1, 9:00 AM",  event: "Campaign briefed",         desc: "NRI Investor Lead-Gen — Saraswati Nagri Q2 2026",               type: "brief",    emoji: "🎯" },
  { time: "Day 1, 9:00:18",  event: "Research completed",       desc: "MIHAN gap identified. 3 competitor angles scraped.",           type: "research", emoji: "🔍" },
  { time: "Day 1, 9:00:52",  event: "QC Micro-Audit passed",    desc: "Research data cleared for Copywriter.",                        type: "qc",       emoji: "✅" },
  { time: "Day 1, 9:01:20",  event: "3 posts drafted",          desc: "LinkedIn, Instagram, WhatsApp copy generated.",               type: "write",    emoji: "✍️" },
  { time: "Day 1, 9:01:40",  event: "QC Flagged Revision",      desc: "Instagram 'guarantee' phrase flagged. Dynamic reroute.",      type: "revision", emoji: "⚠️" },
  { time: "Day 1, 9:01:55",  event: "Targeted Rewrite",         desc: "Only Instagram caption rewritten. LinkedIn & WA intact.",      type: "fix",      emoji: "🔄" },
  { time: "Day 1, 9:02:10",  event: "All posts approved by QC", desc: "Scores: LinkedIn 9/10, Instagram 8/10, WhatsApp 8/10.",       type: "approved", emoji: "🌟" },
  { time: "Day 1, 9:02:22",  event: "Scheduled by Distribution",desc: "LinkedIn: Tue 9AM · IG: Thu 7:30PM · WA: Mon 11AM",           type: "publish",  emoji: "🚀" },
];

const EVENT_COLORS: Record<string, string> = {
  brief:    "bg-violet-100 text-violet-700 border-violet-200",
  research: "bg-blue-100 text-blue-700 border-blue-200",
  qc:       "bg-emerald-100 text-emerald-700 border-emerald-200",
  write:    "bg-cyan-100 text-cyan-700 border-cyan-200",
  revision: "bg-amber-100 text-amber-700 border-amber-200",
  fix:      "bg-orange-100 text-orange-700 border-orange-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  publish:  "bg-rose-100 text-rose-700 border-rose-200",
};

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"performance" | "agents" | "story">("performance");
  const [campaignLog, setCampaignLog] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/studio/proactive")
      .then(r => r.json())
      .then(d => { if (d.campaignLog) setCampaignLog(d.campaignLog); })
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-1">ContentSathi · Analytics</p>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            Campaign Analytics
            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-widest">Demo Data</span>
          </h1>
          <p className="text-gray-400 font-medium mt-1">Quality scores, agent performance, campaign history, and audit trail.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
          {(["performance", "agents", "story"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-black capitalize transition-all ${activeTab === tab ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {tab === "performance" ? "📊 Performance" : tab === "agents" ? "🤖 Per-Agent" : "📖 Story Mode"}
            </button>
          ))}
        </div>
      </div>

      {/* ── PERFORMANCE TAB ─────────────────────────────────────── */}
      {activeTab === "performance" && (
        <div className="space-y-6">
          {/* Output Quality Over Time — Simulated Bar Chart */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
            <h2 className="text-xl font-black text-gray-900 mb-6">Output Quality Score — 6 Weeks</h2>
            <div className="flex items-end gap-3" style={{ height: "160px" }}>
              {PERFORMANCE_OVER_TIME.map((week) => (
                <div key={week.week} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <p className="text-xs font-black text-gray-700 text-center">{week.score}</p>
                  <div
                    className="w-full rounded-t-2xl bg-gradient-to-b from-indigo-500 to-indigo-700 transition-all duration-700"
                    style={{ height: `${(week.score / 100) * 120}px` }}
                  />
                  <p className="text-[9px] text-gray-400 text-center font-bold uppercase">{week.week}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Quality + Content Mix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Platform Quality */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6">
              <h3 className="text-base font-black text-gray-900 mb-5">Quality by Platform</h3>
              <div className="space-y-4">
                {PLATFORM_QUALITY.map((p) => (
                  <div key={p.platform} className="flex items-center gap-3">
                    <p className="text-sm font-bold text-gray-700 w-24 shrink-0">{p.platform}</p>
                    <MiniBar value={p.score} color={p.color} />
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-sm font-black text-gray-900">{p.score}</span>
                      <TrendIcon trend={p.trend} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Mix */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6">
              <h3 className="text-base font-black text-gray-900 mb-5">Content Variety Mix</h3>
              <div className="space-y-4">
                {CONTENT_MIX.map((c) => {
                  const total = CONTENT_MIX.reduce((a, b) => a + b.count, 0);
                  const pct = Math.round((c.count / total) * 100);
                  return (
                    <div key={c.type} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-bold text-gray-700">{c.type}</p>
                        <p className="text-xs font-black text-gray-900">{c.count} posts ({pct}%)</p>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r ${c.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Compliance Risk Heatmap */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-black text-gray-900 mb-5">Compliance Risk Heatmap</h3>
            <div className="grid grid-cols-4 gap-3">
              {["Pricing Claims", "Guarantee Language", "RERA Markers", "Return Projections"].map((risk, i) => {
                const levels = ["Low", "Cleared", "Low", "Medium"];
                const colors = ["bg-emerald-100 text-emerald-700 border-emerald-200", "bg-blue-100 text-blue-700 border-blue-200", "bg-emerald-100 text-emerald-700 border-emerald-200", "bg-amber-100 text-amber-700 border-amber-200"];
                return (
                  <div key={risk} className={`border rounded-2xl p-4 text-center ${colors[i]}`}>
                    <p className="text-lg font-black mb-1">{levels[i]}</p>
                    <p className="text-[10px] font-black uppercase leading-tight">{risk}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── AGENT ANALYTICS TAB ─────────────────────────────────── */}
      {activeTab === "agents" && (
        <div className="space-y-4">
          {AGENT_ANALYTICS.map((agent) => (
            <div key={agent.name} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex items-center gap-3 md:w-52 shrink-0">
                <span className="text-3xl">{agent.emoji}</span>
                <div>
                  <p className="text-sm font-black text-gray-900">{agent.name}</p>
                  <div className={`inline-block mt-1 w-3 h-3 rounded-full bg-${agent.color}-500`} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 flex-1">
                {[
                  { label: "Avg Time",     value: agent.avgTime,          icon: Clock },
                  { label: "Success Rate", value: `${agent.successRate}%`, icon: CheckCircle2 },
                  { label: "Revisions",    value: String(agent.revisions), icon: AlertTriangle },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <div key={m.label} className="bg-gray-50 rounded-2xl p-4 text-center">
                      <Icon className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                      <p className="text-xl font-black text-gray-900">{m.value}</p>
                      <p className="text-[9px] uppercase font-black text-gray-400 mt-0.5">{m.label}</p>
                    </div>
                  );
                })}
              </div>
              <div className="md:w-40">
                <p className="text-[9px] font-black uppercase text-gray-400 mb-2">Success Rate</p>
                <MiniBar value={agent.successRate} color={`bg-${agent.color}-500`} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── STORY MODE TAB ─────────────────────────────────────── */}
      {activeTab === "story" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2.5rem] p-8 text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Story Mode</p>
                <h2 className="text-xl font-black">Campaign Narrative Timeline</h2>
              </div>
            </div>
            <p className="text-sm text-white/60 mb-8">A complete audit trail — from concept to publish. Every decision, reroute, and outcome captured.</p>

            {/* Timeline */}
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-white/10" />
              <div className="space-y-4">
                {STORY_EVENTS.map((event, i) => (
                  <div key={i} className="flex items-start gap-5 pl-0">
                    <div className="w-16 shrink-0 text-right">
                      <p className="text-[9px] font-bold text-indigo-300 leading-tight">{event.time}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 bg-white shrink-0 mt-0.5 z-10 ${event.type === "revision" ? "border-amber-400" : event.type === "approved" ? "border-emerald-400" : "border-indigo-400"}`} />
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base">{event.emoji}</span>
                        <p className="text-sm font-black text-white">{event.event}</p>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${EVENT_COLORS[event.type]}`}>
                          {event.type}
                        </span>
                      </div>
                      <p className="text-xs text-white/50 mt-1 font-medium">{event.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Real Campaign History from DB */}
          {campaignLog.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-black text-gray-900">Recorded Campaign History</h3>
              {campaignLog.map((log, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-[2rem] shadow-sm p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase text-gray-400 mb-1">{log.completedAt ? new Date(log.completedAt).toLocaleString() : "Unknown"}</p>
                      <p className="text-base font-black text-gray-900">{log.goal}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(log.formats || []).map((f: string) => (
                          <span key={f} className="text-[9px] font-black bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full">{f}</span>
                        ))}
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${log.needsRevision ? "bg-amber-50 text-amber-700 border-amber-100 border" : "bg-emerald-50 text-emerald-700 border-emerald-100 border"}`}>
                          {log.needsRevision ? "Auto-revised" : "First-pass approved"}
                        </span>
                        {log.dynamicRedirects?.length > 0 && (
                          <span className="text-[9px] font-black bg-violet-50 text-violet-700 border border-violet-100 px-2 py-0.5 rounded-full">
                            {log.dynamicRedirects.length} dynamic reroutes
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-black px-3 py-1 rounded-full">Completed</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
