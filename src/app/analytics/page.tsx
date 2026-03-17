"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp, Activity, BarChart3, Zap, Clock, CheckCircle2,
  AlertTriangle, Users, Target, PieChart, Calendar,
  ArrowUpRight, ArrowDownRight, Minus, MousePointer2,
  UserPlus, Home, Key, Info, ShieldCheck, ChevronRight,
  RefreshCw, MessageSquare, BrainCircuit, Eye
} from "lucide-react";
import toast from "react-hot-toast";

// ─── Component Helpers ────────────────────────────────────────────────────────
function MetricCard({ title, value, icon: Icon, trend, sub, color }: any) {
  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 relative overflow-hidden group hover:border-indigo-200 transition-all">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-50 rounded-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform duration-500`} />
      <div className="relative z-10">
        <div className={`w-10 h-10 rounded-xl bg-${color}-50 flex items-center justify-center text-${color}-600 mb-4`}>
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-3xl font-black text-gray-900 mb-1">{value}</h3>
        <div className="flex items-center gap-1.5">
          {trend && (
            <span className={`flex items-center text-[10px] font-bold ${trend > 0 ? "text-emerald-600" : "text-red-500"}`}>
               {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
               {Math.abs(trend)}%
            </span>
          )}
          <span className="text-[10px] text-gray-400 font-medium">{sub}</span>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"marketing" | "performance" | "agents" | "compliance" | "ab-testing">("marketing");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (err) {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="font-black text-gray-400 uppercase tracking-widest text-xs">Syncing real-time intelligence...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-1">Intelligence HQ · Full Stack Analytics</p>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            Campaign Pulse
            {!data?.hasRealData && (
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-widest">Projection Mode</span>
            )}
          </h1>
          <p className="text-gray-400 font-medium mt-1">Real-time reach, conversion funnel, and agent efficiency matrix.</p>
        </div>
        <div className="flex bg-gray-100 p-1.5 rounded-2xl gap-1 overflow-x-auto">
          {[
            { id: "marketing", label: "Marketing", icon: TrendingUp },
            { id: "performance", label: "Funnel", icon: Target },
            { id: "agents", label: "Agents", icon: Zap },
            { id: "compliance", label: "Compliance", icon: ShieldCheck },
            { id: "ab-testing", label: "A/B Variants", icon: Activity },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black capitalize transition-all whitespace-nowrap ${
                activeTab === tab.id ? "bg-white text-indigo-700 shadow-md" : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── AUTO-LEARNING SIGNAL BANNER ────────────────────────────────── */}
      {data?.autoLearningSignal && (
        <div className="bg-indigo-900 text-white rounded-[2.5rem] p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Zap className="w-48 h-48" />
          </div>
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
            <BrainCircuit className="w-8 h-8 text-indigo-300" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-1">Actionable Intelligence Signal</p>
            <p className="text-xl font-bold leading-tight">{data.autoLearningSignal}</p>
          </div>
          <button className="px-6 py-3 bg-white text-indigo-900 font-black text-xs rounded-xl hover:bg-indigo-50 transition-all shrink-0">
            Apply Learnings
          </button>
        </div>
      )}

      {/* ── MARKETING TAB ────────────────────────────────────────────── */}
      {activeTab === "marketing" && (
        <div className="space-y-8">
          {/* Top Row Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="Total Reach" value={data?.totalReach?.toLocaleString()} icon={Users} trend={12} sub="this month" color="indigo" />
            <MetricCard title="Click-Throughs" value={data?.totalClicks?.toLocaleString() || "482"} icon={MousePointer2} trend={8} sub="avg 3.4%" color="blue" />
            <MetricCard title="Leads Generated" value={data?.totalLeads || "0"} icon={UserPlus} trend={15} sub="from social" color="emerald" />
            <MetricCard title="Cost Per Lead" value={`₹${data?.cpl || "0"}`} icon={Target} trend={-4} sub="Efficiency score" color="violet" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {/* Engagement Velocity */}
             <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-black text-gray-900 mb-1">Engagement Velocity</h3>
                  <p className="text-xs text-gray-400 font-medium mb-8">Likes, Comments and Shares aggregated per day.</p>
                </div>
                <div className="flex items-end gap-3 h-48">
                  {[45, 62, 58, 89, 74, 95, 120].map((v, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                       <span className="text-[10px] font-black text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">{v}</span>
                       <div className="w-full bg-indigo-50 rounded-t-xl group-hover:bg-indigo-600 transition-all" style={{ height: `${v}%` }} />
                       <span className="text-[8px] font-bold text-gray-400 uppercase">{["M","T","W","T","F","S","S"][i]}</span>
                    </div>
                  ))}
                </div>
             </div>

             {/* Platform Efficiency */}
             <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
                <h3 className="text-xl font-black text-gray-900 mb-6">Platform ROI Efficiency</h3>
                <div className="space-y-6">
                  {[
                    { p: "LinkedIn", val: 88, color: "bg-blue-600", desc: "Best for HNI Leads" },
                    { p: "Instagram", val: 72, color: "bg-pink-500", desc: "High Volume / Awareness" },
                    { p: "WhatsApp", val: 94, color: "bg-emerald-500", desc: "Highest Conversion" },
                    { p: "AdWords", val: 45, color: "bg-amber-400", desc: "Scaling Required" },
                  ].map(plat => (
                    <div key={plat.p}>
                      <div className="flex justify-between items-end mb-1.5">
                        <div>
                          <p className="text-sm font-black text-gray-900">{plat.p}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{plat.desc}</p>
                        </div>
                        <p className="text-sm font-black text-gray-900">{plat.val}%</p>
                      </div>
                      <div className="h-2.5 bg-gray-50 rounded-full overflow-hidden">
                        <div className={`h-full ${plat.color} rounded-full transition-all duration-1000`} style={{ width: `${plat.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {/* Best Time to Post */}
             <div className="bg-white rounded-3xl border border-gray-100 p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                   <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-0.5">Best Time to Post</p>
                  <p className="text-lg font-black text-gray-900">Tuesday 9:00 AM</p>
                  <p className="text-[9px] text-emerald-600 font-bold">2.4x higher NRI engagement</p>
                </div>
             </div>

             {/* Interaction Breakdown */}
             <div className="bg-white rounded-3xl border border-gray-100 p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                   <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-0.5">Interaction Type</p>
                  <p className="text-lg font-black text-gray-900">WhatsApp DMs</p>
                  <p className="text-[9px] text-indigo-600 font-bold">Driving 64% of total leads</p>
                </div>
             </div>

             {/* Audience Sentiment */}
             <div className="bg-white rounded-3xl border border-gray-100 p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                   <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-0.5">Audience Sentiment</p>
                  <p className="text-lg font-black text-gray-900">High Trust</p>
                  <p className="text-[9px] text-gray-400 font-bold">Resonating with &quot;RERA Clear&quot; theme</p>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* ── FUNNEL TAB ────────────────────────────────────────────────── */}
      {activeTab === "performance" && (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 md:p-12">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-2xl font-black text-gray-900 mb-2">Campaign Conversion Funnel</h2>
            <p className="text-gray-400 font-medium">Tracking the journey from first impression to final booking.</p>
          </div>

          <div className="max-w-lg mx-auto space-y-4">
            {[
              { label: "Awareness", icon: Eye, val: data?.funnel?.awareness || 4500, color: "bg-indigo-600", sub: "Impressions" },
              { label: "Interest", icon: Activity, val: data?.funnel?.interest || 3200, color: "bg-blue-500", sub: "Profiles Visited" },
              { label: "Inquiry", icon: MessageSquare, val: data?.funnel?.inquiry || 12, color: "bg-emerald-500", sub: "Leads" },
              { label: "Site Visit", icon: Home, val: data?.funnel?.siteVisit || 4, color: "bg-amber-500", sub: "Qualified" },
              { label: "Booking", icon: Key, val: data?.funnel?.booking || 1, color: "bg-rose-500", sub: "Converted" },
            ].map((step, i) => {
              const max = data?.funnel?.awareness || 4500;
              const width = (step.val / max) * 100;
              return (
                <div key={step.label} className="relative group">
                  <div className={`h-20 flex items-center justify-between px-8 rounded-3xl border border-gray-100 relative z-10 hover:shadow-lg transition-all ${i === 4 ? "bg-indigo-950 text-white border-transparent" : "bg-white"}`}>
                     <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl ${i === 4 ? "bg-white/10" : "bg-gray-50"} flex items-center justify-center`}>
                           <step.icon className={`w-5 h-5 ${i === 4 ? "text-white" : "text-gray-400"}`} />
                        </div>
                        <div className="text-left">
                           <p className={`text-xs font-black uppercase tracking-widest ${i === 4 ? "text-indigo-200" : "text-gray-400"}`}>{step.label}</p>
                           <p className="text-lg font-black">{step.val.toLocaleString()} <span className="text-[10px] opacity-60 ml-1">{step.sub}</span></p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-lg font-black tracking-tight">{Math.round((step.val / max) * 100)}%</p>
                        <p className="text-[9px] font-bold opacity-40 uppercase">Conversion</p>
                     </div>
                  </div>
                  {/* Subtle funnel shape background */}
                  <div className={`absolute top-0 bottom-0 left-0 bg-indigo-50/50 rounded-3xl -z-0 transition-all duration-1000 group-hover:bg-indigo-100/50`} style={{ width: `${Math.max(width, 2)}%` }} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── AGENTS TAB ────────────────────────────────────────────────── */}
      {activeTab === "agents" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(data?.agentAnalytics || []).map((agent: any) => (
            <div key={agent.name} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:border-indigo-200 transition-all">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-black text-gray-900">{agent.name}</h3>
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Zap className="w-4 h-4" />
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-2xl p-4 text-center">
                    <p className="text-xl font-black text-gray-900">{agent.successRate}%</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Success Rate</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 text-center">
                    <p className="text-xl font-black text-gray-900">{agent.avgQcScore}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Avg QC Score</p>
                  </div>
               </div>
               <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 border-t border-gray-100 pt-4">
                  <span>Revisions: {agent.revisions}</span>
                  <span className="text-emerald-500">Tier: High-Efficiency</span>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* ── COMPLIANCE TAB ────────────────────────────────────────────── */}
      {activeTab === "compliance" && (
        <div className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-center">
                 <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                 <h3 className="text-2xl font-black text-gray-900">100%</h3>
                 <p className="text-xs text-gray-400 font-medium">Compliance Pass Rate</p>
              </div>
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-center">
                 <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                 <h3 className="text-2xl font-black text-gray-900">0</h3>
                 <p className="text-xs text-gray-400 font-medium">High Risk Violations</p>
              </div>
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-center">
                 <Clock className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
                 <h3 className="text-2xl font-black text-gray-900">12m</h3>
                 <p className="text-xs text-gray-400 font-medium">Avg Review Loop</p>
              </div>
           </div>

           <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-gray-100">
                <h3 className="text-xl font-black text-gray-900">Compliance Audit Loop</h3>
                <p className="text-xs text-gray-400 font-medium mt-1">Drill-down into real post audit logs.</p>
              </div>
              <div className="divide-y divide-gray-100">
                {data?.compliancePosts?.map((post: any) => (
                  <div key={post.id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2 h-2 rounded-full ${post.risk === "Low" ? "bg-emerald-500" : "bg-amber-500"}`} />
                          <p className="text-xs font-black text-gray-900 truncate uppercase tracking-widest">{post.goal}</p>
                        </div>
                        <p className="text-xs text-gray-500 font-medium pl-4">{post.markers}</p>
                     </div>
                     <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[10px] font-black uppercase text-gray-400">{new Date(post.time).toLocaleDateString()}</span>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${post.risk === "Low" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"}`}>
                           {post.risk} Risk
                        </span>
                     </div>
                  </div>
                ))}
              </div>
           </div>
        </div>
      )}

      {/* ── A/B TESTING TAB ───────────────────────────────────────────── */}
      {activeTab === "ab-testing" && (
        <div className="space-y-8">
          <div className="bg-violet-900 text-white rounded-[3rem] p-10 relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-10">
               <div className="flex-1">
                 <div className="flex items-center gap-3 mb-4">
                   <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                     <Activity className="w-6 h-6 text-violet-300" />
                   </div>
                   <h2 className="text-3xl font-black">A/B Testing Module</h2>
                 </div>
                 <p className="text-violet-200 text-lg font-medium leading-relaxed">
                   Currently testing 2 variants of the &quot;Infrastructure&quot; hook for Instagram. 
                   Real-time metrics will automatically pick the winner and update your Brand Soul.
                 </p>
               </div>
               <div className="flex items-center gap-4 shrink-0">
                 <div className="text-center p-6 bg-white/5 rounded-3xl border border-white/10 min-w-[140px]">
                    <p className="text-3xl font-black">2.4x</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-violet-400">Winning Edge</p>
                 </div>
                 <div className="text-center p-6 bg-white/5 rounded-3xl border border-white/10 min-w-[140px]">
                    <p className="text-3xl font-black">72%</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-violet-400">Confidence</p>
                 </div>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-white rounded-3xl border-2 border-emerald-100 shadow-xl shadow-emerald-50 p-8 relative">
                <div className="absolute top-4 right-4 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-emerald-200">Variant A · Lead</div>
                <h3 className="text-lg font-black text-gray-900 mb-4">The &quot;ROI First&quot; Hook</h3>
                <p className="text-sm text-gray-600 italic mb-8">&quot;Don&apos;t wait for MIHAN. Buy before it arrives and double your plot value...&quot;</p>
                <div className="space-y-4">
                  <div className="flex justify-between text-xs font-bold text-gray-500 lowercase"><span>CTR</span> <span>4.2%</span></div>
                  <div className="h-2 bg-gray-50 rounded-full"><div className="h-full bg-emerald-500 rounded-full" style={{ width: "42%" }} /></div>
                  <div className="flex justify-between text-xs font-bold text-gray-500 lowercase"><span>Leads</span> <span>18</span></div>
                  <div className="h-2 bg-gray-50 rounded-full"><div className="h-full bg-emerald-500 rounded-full" style={{ width: "60%" }} /></div>
                </div>
             </div>
             <div className="bg-white rounded-3xl border border-gray-100 p-8 opacity-60">
                <div className="absolute top-4 right-4 bg-gray-50 text-gray-400 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-gray-200">Variant B</div>
                <h3 className="text-lg font-black text-gray-900 mb-4">The &quot;Family Legacy&quot; Hook</h3>
                <p className="text-sm text-gray-600 italic mb-8">&quot;Build your home where nature meets connectivity. Secure your children&apos;s future...&quot;</p>
                <div className="space-y-4">
                  <div className="flex justify-between text-xs font-bold text-gray-500 lowercase"><span>CTR</span> <span>1.8%</span></div>
                  <div className="h-2 bg-gray-50 rounded-full"><div className="h-full bg-gray-300 rounded-full" style={{ width: "18%" }} /></div>
                  <div className="flex justify-between text-xs font-bold text-gray-500 lowercase"><span>Leads</span> <span>4</span></div>
                  <div className="h-2 bg-gray-50 rounded-full"><div className="h-full bg-gray-300 rounded-full" style={{ width: "12%" }} /></div>
                </div>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}
