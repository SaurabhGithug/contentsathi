"use client";

import { useState } from "react";
import {
  CalendarDays, TrendingUp, Zap, Star, Globe, Users,
  Home, BadgeIndianRupee, AlertCircle, CheckCircle2,
  BrainCircuit, Megaphone, Clock, ArrowRight, Sparkles,
  Flame, Target, Building
} from "lucide-react";
import Link from "next/link";

// ── Festive Calendar Data ─────────────────────────────────────────────────────
const FESTIVE_CALENDAR = [
  { date: "Mar 30, 2026", festival: "Gudi Padwa", emoji: "🪗", impact: "critical", type: "maharashtra", desc: "Maharashtra New Year. Highest buying intent of Q1. RERA clear + possession promise drive bookings.", angle: "New Year, New Home — Book Your Plot This Gudi Padwa", platforms: ["Instagram", "WhatsApp", "LinkedIn"] },
  { date: "Apr 14, 2026", festival: "Akshaya Tritiya", emoji: "🪙", impact: "critical", type: "national", desc: "Considered the most auspicious day to invest in gold and property. NRI remittance peaks.", angle: "Eternal Growth on Akshaya Tritiya — Invest in Land Today", platforms: ["LinkedIn", "Instagram", "WhatsApp"] },
  { date: "Apr 18, 2026", festival: "Good Friday", emoji: "✝️", impact: "low", type: "national", desc: "Low marketing day. Avoid sales-heavy posts.", angle: "Pause — use for brand storytelling only", platforms: [] },
  { date: "May 1, 2026", festival: "Maharashtra Day", emoji: "🧡", impact: "medium", type: "maharashtra", desc: "Pride of Maharashtra. Local connection content performs well — showcase Nagpur's development story.", angle: "Proud Nagpurkars Build Here — Maharashtra Day Special", platforms: ["Instagram", "WhatsApp"] },
  { date: "Jun 21, 2026", festival: "Eid al-Adha", emoji: "☪️", impact: "medium", type: "national", desc: "Good for community and gifting-themed content.", angle: "Gift Your Family Their Dream Address This Eid", platforms: ["WhatsApp", "Instagram"] },
  { date: "Aug 15, 2026", festival: "Independence Day", emoji: "🇮🇳", impact: "high", type: "national", desc: "Patriotism drives local investment sentiment. MIHAN & smart city angles resonate strongly.", angle: "Invest in India's Future — Own Land in Nagpur's Growth Corridor", platforms: ["LinkedIn", "Instagram", "WhatsApp"] },
  { date: "Aug 30, 2026", festival: "Ganesh Chaturthi", emoji: "🐘", impact: "critical", type: "maharashtra", desc: "10-day peak for Maharashtra buyers. Huge community content opportunity. Site visit campaigns work extremely well.", angle: "Ganapati Bappa's Blessing on Your New Home This Season", platforms: ["Instagram", "WhatsApp", "Facebook"] },
  { date: "Oct 2, 2026", festival: "Navratri Begins", emoji: "💃", impact: "high", type: "national", desc: "Start of festive season. NRI October investment cycle begins. Property searches spike 40%.", angle: "Festive Season, Forever Investment — Book Now", platforms: ["Instagram", "LinkedIn"] },
  { date: "Oct 20, 2026", festival: "Diwali / Dhanteras", emoji: "🪔", impact: "critical", type: "national", desc: "Biggest real estate sales window in India. Dhanteras = peak buying intent for land. Launch offers + EMI schemes.", angle: "Light Up Your Future This Diwali — Plot at Pre-Diwali Price", platforms: ["Instagram", "WhatsApp", "Facebook", "LinkedIn"] },
  { date: "Nov 1, 2026", festival: "Bhai Dooj / Post-Diwali", emoji: "🎊", impact: "high", type: "national", desc: "Wrap up Diwali offers. Year-end investment decisions are being made. Target HNI and investors.", angle: "Last Chance — Festive Price Ends. Register Before Nov 15", platforms: ["WhatsApp", "LinkedIn"] },
  { date: "Dec 31, 2026", festival: "Financial Year Planning", emoji: "📊", impact: "medium", type: "investor", desc: "Last month for tax-saving investments. LTCG and 54EC bond discussions bring investor leads.", angle: "Book Before Financial Year Ends — Save Tax, Build Wealth", platforms: ["LinkedIn", "WhatsApp"] },
];

// ── NRI Remittance Cycle ──────────────────────────────────────────────────────
const NRI_CYCLES = [
  { month: "April", icon: "📈", strength: 95, reason: "New financial year begins. NRIs review portfolios and make real estate investments in India.", content: "ROI comparison post: India land vs. UK/US savings account" },
  { month: "October", icon: "🪔", strength: 100, reason: "Pre-Diwali property buying. NRIs send maximum remittances to book property for the festive season.", content: "Diwali special — Book your family's plot from anywhere in the world" },
  { month: "July", icon: "💼", strength: 60, reason: "US and UK tax filing season ends. Mid-year portfolio rebalancing.", content: "Mid-year investment check: Is your money growing as fast as Nagpur?" },
  { month: "January", icon: "🎊", strength: 55, reason: "Post-New Year financial planning. Many NRIs plan for home visits in March.", content: "Planning your India trip in March? Make it count — site visit + booking" },
];

// ── Employment Triggers ────────────────────────────────────────────────────────
const EMPLOYMENT_TRIGGERS = [
  { event: "MIHAN Job Announcements", icon: Building, impact: "critical", desc: "Every major job announcement in MIHAN-SEZ triggers demand for plots in Wardha Road, MIHAN area. Monitor for new tenants.", action: "Create 'MIHAN jobs → plot values rise' content within 48 hours of announcement" },
  { event: "IT Park Phase Completion", icon: Zap, impact: "high", desc: "IT professionals look for land near their workplace. Target LinkedIn with investment angle.", action: "LinkedIn post: 'IT Professional's Plot Investment Guide — Nagpur Edition'" },
  { event: "Airport Expansion Updates", icon: Globe, impact: "high", desc: "International flight expansion news drives NRI and business class buyer interest.", action: "Urgent content: 'Airport expansion = plot appreciation. Act before prices adjust.'" },
  { event: "NMRDA Clearances", icon: CheckCircle2, impact: "critical", desc: "New clearances in specific corridors create buying windows. RERA first-mover advantage.", action: "News-led post: 'NMRDA just approved [corridor] — here's why buyers are moving fast'" },
];

// ── Home Loan Triggers ────────────────────────────────────────────────────────
const LOAN_TRIGGERS = [
  { trigger: "RBI Rate Cut", direction: "down", detail: "EMIs drop for existing and new borrowers. Affordability argument becomes stronger.", angle: "RBI cuts rates — now is the best time to book a plot on EMI" },
  { trigger: "RBI Rate Hike", direction: "up", detail: "Window is closing. Lock in current rates now before they rise further.", angle: "Rates going up — book before your EMI increases. Act this weekend." },
  { trigger: "PMAY Subsidy Announcement", direction: "opportunity", detail: "First-time buyers qualify for Rs.2.67L subsidy. Target new buyers.", angle: "Government giving Rs.2.67L to first-time buyers — check if you qualify" },
  { trigger: "Tax Benefit Reminder", direction: "opportunity", detail: "Section 80C and 24(b) deductions. Year-end content.", angle: "Own land + save tax — Rs.3.5L deduction available for homebuyers" },
];

// ── Auto Content Planner ──────────────────────────────────────────────────────
const NEXT_7_DAYS_PLAN = [
  { day: "Mon", date: "Mar 17", angle: "Gudi Padwa Countdown — 13 days to Nagpur's biggest real estate moment", platform: "Instagram", pillar: "urgency", readiness: 95 },
  { day: "Tue", date: "Mar 18", angle: "Why NRIs are choosing Wardha Road over Mumbai: 5 Infrastructure reasons", platform: "LinkedIn", pillar: "authority", readiness: 90 },
  { day: "Wed", date: "Mar 19", angle: "Buyer Story: From a 1BHK in Pune to a plot in Nagpur — in 8 months", platform: "Instagram", pillar: "proof", readiness: 85 },
  { day: "Thu", date: "Mar 20", angle: "MIHAN Update: Which job sectors are hiring and what it means for land demand", platform: "LinkedIn", pillar: "market intel", readiness: 80 },
  { day: "Fri", date: "Mar 21", angle: "Weekend Site Visit Invite — Saraswati Nagri. 30 minutes, zero obligation", platform: "WhatsApp", pillar: "conversion", readiness: 95 },
  { day: "Sat", date: "Mar 22", angle: "Vastu Walk — Behind the scenes of how we place east-facing plots", platform: "Instagram", pillar: "trust", readiness: 75 },
  { day: "Sun", date: "Mar 23", angle: "Weekly Recap — Who visited, what they said, what sold this week", platform: "WhatsApp", pillar: "social proof", readiness: 70 },
];

const IMPACT_COLORS: Record<string, string> = {
  critical: "bg-rose-50 border-rose-200 text-rose-700",
  high: "bg-amber-50 border-amber-200 text-amber-700",
  medium: "bg-blue-50 border-blue-200 text-blue-700",
  low: "bg-gray-50 border-gray-200 text-gray-500",
};

const PILLAR_COLORS: Record<string, string> = {
  urgency: "bg-rose-100 text-rose-700",
  authority: "bg-blue-100 text-blue-700",
  proof: "bg-emerald-100 text-emerald-700",
  trust: "bg-indigo-100 text-indigo-700",
  conversion: "bg-amber-100 text-amber-700",
  "social proof": "bg-purple-100 text-purple-700",
  "market intel": "bg-cyan-100 text-cyan-700",
};

export default function IntelligencePage() {
  const [activeTab, setActiveTab] = useState<"festive" | "nri" | "triggers" | "planner">("planner");

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-violet-500 mb-1">Human Buying Intelligence · Real Estate Edition</p>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Buyer Behaviour Engine</h1>
          <p className="text-gray-400 font-medium mt-1">Festive cycles, NRI remittance peaks, employment triggers, and auto-planned content.</p>
        </div>
        <div className="flex bg-gray-100 p-1.5 rounded-2xl gap-1 overflow-x-auto">
          {[
            { id: "planner", label: "7-Day Plan", icon: CalendarDays },
            { id: "festive", label: "Festive Calendar", icon: Star },
            { id: "nri", label: "NRI Cycles", icon: Globe },
            { id: "triggers", label: "Market Triggers", icon: Zap },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${activeTab === tab.id ? "bg-white text-violet-700 shadow-md" : "text-gray-500 hover:text-gray-900 hover:bg-white/50"}`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 7-Day Content Planner ──────────────────────────────── */}
      {activeTab === "planner" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-violet-900 via-indigo-900 to-indigo-950 rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-5 pointer-events-none">
              <BrainCircuit className="w-96 h-96" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                  <CalendarDays className="w-6 h-6 text-violet-300" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-violet-300">AI-Generated · Week of Mar 17</p>
                  <h2 className="text-2xl font-black">This Week&apos;s Content Brief</h2>
                </div>
              </div>
              <p className="text-violet-200 font-medium mb-2">Based on: Gudi Padwa approaching, MIHAN updates, NRI April cycle starting. 7 posts across Instagram, LinkedIn, WhatsApp.</p>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-black">Gudi Padwa: 13 days</span>
                <span className="px-3 py-1 bg-rose-500/30 border border-rose-400/30 rounded-full text-xs font-black text-rose-200">NRI April Cycle: Activating</span>
                <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-xs font-black text-emerald-300">MIHAN Jobs: 2 new announcements</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {NEXT_7_DAYS_PLAN.map((item, i) => (
              <div key={i} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 flex flex-col md:flex-row md:items-center gap-5 hover:border-violet-200 hover:shadow-md transition-all group">
                <div className="flex items-center gap-4 shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-gray-900 text-white flex flex-col items-center justify-center">
                    <span className="text-[9px] font-bold uppercase leading-none opacity-50">{item.day}</span>
                    <span className="text-xl font-black leading-none">{item.date.split(" ")[1]}</span>
                    <span className="text-[9px] font-bold uppercase leading-none opacity-50">{item.date.split(" ")[0]}</span>
                  </div>
                  <div>
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${PILLAR_COLORS[item.pillar] ?? "bg-gray-100 text-gray-600"}`}>
                      {item.pillar}
                    </span>
                    <p className="text-[10px] font-black text-gray-400 mt-1 uppercase">{item.platform}</p>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900 leading-tight">{item.angle}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full" style={{ width: `${item.readiness}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 shrink-0">{item.readiness}% ready</span>
                  </div>
                </div>
                <Link
                  href={`/studio?goal=${encodeURIComponent(item.angle)}`}
                  className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-black text-xs rounded-xl transition-all shadow-md shadow-violet-100 opacity-0 group-hover:opacity-100"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Festive Calendar ────────────────────────────────────── */}
      {activeTab === "festive" && (
        <div className="space-y-4">
          {/* Impact legend */}
          <div className="flex flex-wrap gap-3 mb-6">
            {[["critical", "🔴 Critical Sales Window"], ["high", "🟠 High Impact"], ["medium", "🔵 Medium Impact"], ["low", "⚪ Pause / Soft"]].map(([k, l]) => (
              <span key={k} className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-full border ${IMPACT_COLORS[k]}`}>{l}</span>
            ))}
          </div>

          {FESTIVE_CALENDAR.map((event, i) => (
            <div key={i} className={`rounded-3xl border p-6 hover:shadow-md transition-all ${IMPACT_COLORS[event.impact]}`}>
              <div className="flex flex-col md:flex-row md:items-start gap-5">
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-4xl">{event.emoji}</span>
                  <div>
                    <p className="font-black text-lg leading-tight">{event.festival}</p>
                    <p className="text-[10px] font-bold uppercase opacity-60">{event.date} · {event.type}</p>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium mb-3 opacity-80">{event.desc}</p>
                  <div className="bg-white/60 rounded-2xl p-4 mb-3">
                    <p className="text-[10px] font-black uppercase opacity-60 mb-1">Recommended Angle</p>
                    <p className="font-black text-sm">&quot;{event.angle}&quot;</p>
                  </div>
                  {event.platforms.length > 0 && (
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-[10px] font-black uppercase opacity-50">Post on:</span>
                      {event.platforms.map(p => (
                        <span key={p} className="px-2.5 py-1 bg-white/60 text-[10px] font-black rounded-full border border-current/20">{p}</span>
                      ))}
                    </div>
                  )}
                </div>
                {event.platforms.length > 0 && (
                  <Link
                    href={`/studio?goal=${encodeURIComponent(event.angle + " for " + event.festival)}`}
                    className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white font-black text-xs rounded-xl transition-all hover:bg-gray-800 shadow-sm self-start"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Generate
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── NRI Cycles ──────────────────────────────────────────── */}
      {activeTab === "nri" && (
        <div className="space-y-6">
          <div className="bg-indigo-900 text-white rounded-[2.5rem] p-8 md:p-10">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
                <Globe className="w-6 h-6 text-indigo-300" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-1">NRI Remittance Intelligence</p>
                <h2 className="text-2xl font-black">When NRIs Send Money Home</h2>
                <p className="text-indigo-300 text-sm font-medium mt-1">$80 billion+ annual remittances. Property accounts for 34% of NRI investments. These are the peak windows.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {NRI_CYCLES.map((cycle, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{cycle.icon}</span>
                      <span className="font-black text-lg">{cycle.month}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${cycle.strength}%` }} />
                      </div>
                      <span className="text-xs font-black text-indigo-300">{cycle.strength}%</span>
                    </div>
                  </div>
                  <p className="text-indigo-200 text-xs font-medium mb-3">{cycle.reason}</p>
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-[9px] font-black uppercase text-indigo-400 mb-1">Suggested Angle</p>
                    <p className="text-xs font-bold text-white">&quot;{cycle.content}&quot;</p>
                  </div>
                  <Link
                    href={`/studio?goal=${encodeURIComponent(cycle.content)}`}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Generate This
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Market Triggers ─────────────────────────────────────── */}
      {activeTab === "triggers" && (
        <div className="space-y-8">
          {/* Employment Triggers */}
          <div>
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-500" /> Local Employment Triggers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {EMPLOYMENT_TRIGGERS.map((t, i) => (
                <div key={i} className={`p-5 rounded-3xl border ${IMPACT_COLORS[t.impact]}`}>
                  <div className="flex items-start gap-3 mb-3">
                    <t.icon className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-black text-sm">{t.event}</p>
                      <p className="text-xs font-medium opacity-70 mt-1">{t.desc}</p>
                    </div>
                  </div>
                  <div className="bg-white/60 rounded-xl p-3">
                    <p className="text-[9px] font-black uppercase opacity-60 mb-1">Recommended Action</p>
                    <p className="text-xs font-bold">{t.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Home Loan Triggers */}
          <div>
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
              <BadgeIndianRupee className="w-5 h-5 text-emerald-500" /> Home Loan Rate Events
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {LOAN_TRIGGERS.map((t, i) => (
                <div key={i} className="bg-white rounded-3xl border border-gray-100 p-5 hover:border-emerald-200 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.direction === "down" ? "bg-emerald-50 text-emerald-600" : t.direction === "up" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}>
                      {t.direction === "down" ? "▼" : t.direction === "up" ? "▲" : "●"}
                    </div>
                    <p className="font-black text-gray-900">{t.trigger}</p>
                  </div>
                  <p className="text-xs text-gray-500 font-medium mb-3">{t.detail}</p>
                  <div className="bg-gray-50 rounded-xl p-3 mb-3">
                    <p className="text-[9px] font-black uppercase text-gray-400 mb-1">Content Angle</p>
                    <p className="text-xs font-bold text-gray-800">&quot;{t.angle}&quot;</p>
                  </div>
                  <Link
                    href={`/studio?goal=${encodeURIComponent(t.angle)}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" /> Generate Immediately
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
