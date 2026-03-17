"use client";

import { useState } from "react";
import {
  SearchCheck, TrendingUp, TrendingDown, Minus,
  Instagram, Linkedin, Youtube, MessageCircle, Globe,
  BarChart3, Users, Heart, MessageSquare, Eye,
  AlertTriangle, CheckCircle2, Sparkles, RefreshCw,
  ArrowUpRight, Clock, Zap, Shield, BookOpen,
  ChevronRight, Star, Flag
} from "lucide-react";
import Link from "next/link";

// ── Simulated Audit Data (wired to real API when connected) ──────────────────
const AUDIT_OVERVIEW = {
  accountHandle: "@SaraswatiNagriNagpur",
  platform: "instagram",
  followerCount: 2847,
  followerGrowth: "+12.4%",
  growthDirection: "up",
  avgEngagementRate: 3.8,
  totalPosts90days: 28,
  avgReach: 1240,
  bestDay: "Tuesday",
  bestTime: "9–11 AM",
  overallScore: 72,
  reraCompliance: 88,
  contentGaps: [
    "You've never posted about NRI tax benefits on Indian property",
    "Zero posts specifically targeting first-time homebuyers (PMAY angle)",
    "No content explaining the RERA complaint process — builds massive trust",
    "No testimonials from IT professional buyers",
    "Festive content missing — you missed Akshaya Tritiya, Gudi Padwa windows",
  ],
};

const POST_AUDIT_DATA = [
  { id: 1, date: "Mar 10", type: "Carousel", caption: "5 reasons Nagpur is India's fastest growing Tier-2 city 📈", reach: 3200, likes: 187, comments: 23, saves: 91, engagementRate: 6.2, reraStatus: "pass", verdict: "top", growth: "up" },
  { id: 2, date: "Mar 7", type: "Reel", caption: "MIHAN job growth — what it means for plot buyers in Wardha Road", reach: 2800, likes: 143, comments: 18, saves: 67, engagementRate: 5.1, reraStatus: "pass", verdict: "good", growth: "up" },
  { id: 3, date: "Mar 4", type: "Single", caption: "**Investment Opportunity:** Plot near Ring Road from ₹15L only!", reach: 890, likes: 42, comments: 3, saves: 8, engagementRate: 1.9, reraStatus: "risk", verdict: "low", growth: "down" },
  { id: 4, date: "Mar 1", type: "Carousel", caption: "Vastu tips for choosing the perfect plot — North or East facing?", reach: 1740, likes: 98, comments: 31, saves: 55, engagementRate: 4.4, reraStatus: "pass", verdict: "good", growth: "up" },
  { id: 5, date: "Feb 26", type: "Single", caption: "Weekend sale prices dropping! Only 5 plots left at launch price!", reach: 640, likes: 28, comments: 2, saves: 4, engagementRate: 1.3, reraStatus: "risk", verdict: "low", growth: "down" },
  { id: 6, date: "Feb 22", type: "Reel", caption: "Behind the scenes — How we design RERA-compliant plot layouts", reach: 2200, likes: 164, comments: 44, saves: 72, engagementRate: 5.6, reraStatus: "pass", verdict: "top", growth: "up" },
  { id: 7, date: "Feb 18", type: "Single", caption: "Our buyer from Pune shares why he chose Nagpur over Pune for investment", reach: 1980, likes: 131, comments: 29, saves: 48, engagementRate: 4.7, reraStatus: "pass", verdict: "good", growth: "up" },
  { id: 8, date: "Feb 15", type: "Carousel", caption: "Ring Road timeline: What it means for land prices in 2026", reach: 2640, likes: 178, comments: 37, saves: 84, engagementRate: 5.9, reraStatus: "pass", verdict: "top", growth: "up" },
];

const COMPETITOR_BENCHMARKS = [
  { name: "GoldenCityPlots", handle: "@goldencityplots_ngp", followers: 7200, engRate: 2.1, postsMonth: 18, reraScore: 71, threat: "medium" },
  { name: "NagpurLandDeal", handle: "@nagpurlanddeal", followers: 3900, engRate: 3.4, postsMonth: 22, reraScore: 58, threat: "medium" },
  { name: "WardhaRoadRealty", handle: "@wardharoad_realty", followers: 11200, engRate: 4.8, postsMonth: 30, reraScore: 82, threat: "high" },
  { name: "MIHANPlots", handle: "@mihanplots_nagpur", followers: 1800, engRate: 1.4, postsMonth: 8, reraScore: 45, threat: "low" },
];

const GROWTH_EVENTS = [
  { date: "Mar 10", event: "Carousel: '5 reasons Nagpur is rising'", delta: "+134 followers", type: "spike" },
  { date: "Feb 22", event: "Reel: RERA-compliant layout behind-scenes", delta: "+87 followers", type: "spike" },
  { date: "Feb 15", event: "Carousel: Ring Road timeline", delta: "+72 followers", type: "spike" },
  { date: "Mar 4", event: "Post: 'Sale prices dropping!' (High pressure sales)", delta: "-23 followers", type: "drop" },
  { date: "Feb 26", event: "Post: 'Weekend sale!' (Spammy CTA)", delta: "-17 followers", type: "drop" },
];

const VERDICT_STYLE: Record<string, string> = {
  top: "bg-emerald-50 text-emerald-700 border-emerald-200",
  good: "bg-blue-50 text-blue-700 border-blue-200",
  low: "bg-red-50 text-red-700 border-red-200",
};
const VERDICT_LABEL: Record<string, string> = {
  top: "🔥 Top Post",
  good: "✓ Good",
  low: "⚠ Low",
};

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const r = 36, circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={r} fill="none" stroke="#f3f4f6" strokeWidth="7" />
          <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="7"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-black text-gray-900">{score}</span>
        </div>
      </div>
      <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mt-1">{label}</p>
    </div>
  );
}

export default function AccountAuditPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "posts" | "gaps" | "competitors" | "growth">("overview");
  const [isConnected] = useState(false); // false = projection mode with simulated data

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-rose-500 mb-1">ContentSathi · Social Intelligence</p>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Account Audit</h1>
          <p className="text-gray-400 font-medium mt-1">Last 90 days — engagement, RERA compliance, content gaps, competitor benchmarks.</p>
        </div>
        <div className="flex items-center gap-3">
          {!isConnected && (
            <span className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-black rounded-xl">
              <Sparkles className="w-3.5 h-3.5" />
              Projection Mode — Connect Instagram for live data
            </span>
          )}
          <Link href="/settings?tab=accounts"
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl transition-all shadow-md shadow-indigo-100">
            Connect Account
          </Link>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex bg-gray-100 p-1.5 rounded-2xl gap-1 overflow-x-auto">
        {([
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "posts", label: "Post Audit", icon: BookOpen },
          { id: "gaps", label: "Content Gaps", icon: AlertTriangle },
          { id: "growth", label: "Growth Events", icon: TrendingUp },
          { id: "competitors", label: "Competitors", icon: Users },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${activeTab === tab.id ? "bg-white text-rose-700 shadow-md" : "text-gray-500 hover:text-gray-900 hover:bg-white/50"}`}>
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Overview ──────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Score Row */}
          <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex gap-8">
                <ScoreRing score={AUDIT_OVERVIEW.overallScore} label="Overall Score" color="#4f46e5" />
                <ScoreRing score={AUDIT_OVERVIEW.reraCompliance} label="RERA Safe" color="#10b981" />
              </div>
              <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-5">
                {[
                  { label: "Followers", value: AUDIT_OVERVIEW.followerCount.toLocaleString(), sub: AUDIT_OVERVIEW.followerGrowth + " last 90d", up: true },
                  { label: "Avg Reach", value: AUDIT_OVERVIEW.avgReach.toLocaleString(), sub: "per post" },
                  { label: "Engagement", value: AUDIT_OVERVIEW.avgEngagementRate + "%", sub: "3–6% is good for RE" },
                  { label: "Posts (90d)", value: AUDIT_OVERVIEW.totalPosts90days, sub: "~9/month" },
                  { label: "Best Day", value: AUDIT_OVERVIEW.bestDay, sub: AUDIT_OVERVIEW.bestTime },
                  { label: "Platform", value: "Instagram", sub: "@" + AUDIT_OVERVIEW.accountHandle.slice(1, 15) },
                ].map((m, i) => (
                  <div key={i} className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-[9px] font-black uppercase text-gray-400 tracking-wider">{m.label}</p>
                    <p className="text-xl font-black text-gray-900 mt-1">{m.value}</p>
                    <p className="text-[10px] font-medium text-gray-400 mt-0.5">{m.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* What worked / What didn't */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6">
              <h3 className="font-black text-emerald-800 flex items-center gap-2 mb-4"><CheckCircle2 className="w-5 h-5" /> What&apos;s Working</h3>
              <ul className="space-y-3">
                {["Behind-the-scenes RERA process content (+5.6% eng)", "Carousel: infrastructure timelines — top shareable format", "Buyer journey stories — strong DM conversion", "Tuesday/Wednesday 9–11 AM posts — 2.3x higher reach",].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm font-medium text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-3xl p-6">
              <h3 className="font-black text-red-800 flex items-center gap-2 mb-4"><AlertTriangle className="w-5 h-5" /> What&apos;s Hurting You</h3>
              <ul className="space-y-3">
                {["High-pressure sale posts ('prices dropping!') — follower drops", "Vague CTAs with no RERA registration shown — trust dip", "Posting frequency dips on weekends — algorithm penalty", "No video content last 3 weeks — reach down 22%"].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm font-medium text-red-800">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── Post Audit ────────────────────────────────────────── */}
      {activeTab === "posts" && (
        <div className="space-y-3">
          {POST_AUDIT_DATA.map(post => (
            <div key={post.id} className="bg-white rounded-3xl border border-gray-100 p-5 flex flex-col md:flex-row md:items-center gap-5 hover:border-indigo-100 hover:shadow-md transition-all">
              <div className="flex items-center gap-4 shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-xs font-black text-gray-500">{post.date}</div>
                <span className="text-[10px] font-black uppercase bg-gray-50 border border-gray-100 px-2 py-1 rounded-full text-gray-500">{post.type}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-900 truncate">{post.caption}</p>
                <div className="flex flex-wrap gap-4 mt-2">
                  {[
                    { icon: Eye, val: post.reach.toLocaleString(), label: "Reach" },
                    { icon: Heart, val: post.likes, label: "Likes" },
                    { icon: MessageSquare, val: post.comments, label: "Comments" },
                    { icon: BookOpen, val: post.saves, label: "Saves" },
                    { icon: BarChart3, val: post.engagementRate + "%", label: "Eng. Rate" },
                  ].map((m, j) => (
                    <div key={j} className="flex items-center gap-1 text-xs text-gray-500">
                      <m.icon className="w-3.5 h-3.5 text-gray-300" />
                      <span className="font-black text-gray-700">{m.val}</span>
                      <span className="text-gray-400">{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${post.reraStatus === "pass" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                  {post.reraStatus === "pass" ? "✓ RERA Safe" : "⚠ RERA Risk"}
                </span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${VERDICT_STYLE[post.verdict]}`}>
                  {VERDICT_LABEL[post.verdict]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Content Gaps ──────────────────────────────────────── */}
      {activeTab === "gaps" && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 mb-4">
            <div className="flex items-start gap-4">
              <Sparkles className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-amber-900 mb-1">AI identified {AUDIT_OVERVIEW.contentGaps.length} content opportunities your competitors are NOT covering</p>
                <p className="text-sm font-medium text-amber-700">These gaps represent untapped organic reach. Generate each one with a single click.</p>
              </div>
            </div>
          </div>
          {AUDIT_OVERVIEW.contentGaps.map((gap, i) => (
            <div key={i} className="bg-white rounded-3xl border border-gray-100 p-6 flex flex-col md:flex-row md:items-center gap-4 hover:border-indigo-100 hover:shadow-md transition-all group">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm shrink-0">{i + 1}</div>
              <p className="flex-1 font-bold text-gray-800">{gap}</p>
              <Link href={`/studio?goal=${encodeURIComponent("Create content about: " + gap)}`}
                className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl transition-all shadow-sm opacity-0 group-hover:opacity-100">
                <Sparkles className="w-3.5 h-3.5" /> Generate <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* ── Growth Events ─────────────────────────────────────── */}
      {activeTab === "growth" && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-gray-100 p-6 mb-2">
            <p className="font-black text-gray-900 mb-1">Follower Growth Correlations</p>
            <p className="text-sm text-gray-400 font-medium">Every spike and drop below is linked to a specific post. Pattern recognition tells you exactly what to repeat and what to avoid.</p>
          </div>
          {GROWTH_EVENTS.map((ev, i) => (
            <div key={i} className={`rounded-3xl border p-5 flex items-center gap-5 ${ev.type === "spike" ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${ev.type === "spike" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                {ev.type === "spike" ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase text-gray-400">{ev.date}</p>
                <p className="font-bold text-sm text-gray-900 mt-0.5">{ev.event}</p>
              </div>
              <div className={`font-black text-lg shrink-0 ${ev.type === "spike" ? "text-emerald-700" : "text-red-600"}`}>
                {ev.delta}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Competitors ───────────────────────────────────────── */}
      {activeTab === "competitors" && (
        <div className="space-y-4">
          <div className="bg-gray-900 text-white rounded-3xl p-6 mb-2">
            <p className="font-black mb-1">Competitor Intelligence — Nagpur Real Estate</p>
            <p className="text-gray-400 text-sm font-medium">Benchmarking active competitors in your corridor. Engagement Rate and RERA Score are the two metrics that matter most for long-term trust.</p>
          </div>
          {COMPETITOR_BENCHMARKS.map((comp, i) => (
            <div key={i} className="bg-white rounded-3xl border border-gray-100 p-5 hover:border-rose-100 hover:shadow-md transition-all">
              <div className="flex flex-col md:flex-row md:items-center gap-5">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center font-black text-gray-600">
                      {comp.name.slice(0, 1)}
                    </div>
                    <div>
                      <p className="font-black text-gray-900">{comp.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold">{comp.handle}</p>
                    </div>
                    <span className={`ml-auto px-2.5 py-1 rounded-full text-[9px] font-black border ${comp.threat === "high" ? "bg-red-50 border-red-200 text-red-700" : comp.threat === "medium" ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-gray-50 border-gray-200 text-gray-500"}`}>
                      {comp.threat === "high" ? "🔴 Red Flag" : comp.threat === "medium" ? "🟡 Watch" : "🟢 Low"}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: "Followers", val: comp.followers.toLocaleString() },
                      { label: "Eng Rate", val: comp.engRate + "%" },
                      { label: "Posts/mo", val: comp.postsMonth },
                      { label: "RERA Score", val: comp.reraScore + "/100" },
                    ].map((m, j) => (
                      <div key={j} className="bg-gray-50 rounded-xl p-3">
                        <p className="text-[9px] font-black uppercase text-gray-400">{m.label}</p>
                        <p className="text-sm font-black text-gray-900 mt-0.5">{m.val}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <Link
                  href={`/studio?goal=${encodeURIComponent("Create a counter-content strategy against " + comp.name + " (" + comp.handle + ") who focuses on Nagpur real estate with " + comp.engRate + "% engagement. Find angles they haven't covered and RERA compliance advantages we have.")}`}
                  className="shrink-0 flex flex-col items-center gap-1.5 px-6 py-4 bg-gray-900 hover:bg-gray-700 text-white font-black text-xs rounded-2xl transition-all">
                  <Sparkles className="w-4 h-4" />
                  Counter Strategy
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
