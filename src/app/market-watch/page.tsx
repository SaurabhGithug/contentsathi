"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  TrendingUp, Zap, Shield, Target, BrainCircuit, RefreshCw,
  AlertTriangle, CheckCircle2, Clock, Loader2, Swords, Sparkles,
  BarChart3, MessageCircle, BookOpen, ChevronRight, Eye, Play, Pause,
  Globe2, Newspaper, Mic, Users, Building2, Linkedin, FileText,
  ArrowRight, Radio
} from "lucide-react";
import toast from "react-hot-toast";
import MarkdownContent from "@/components/MarkdownContent";
import Link from "next/link";

type BattleCard = {
  id: string;
  title: string;
  body: string;
  language: string;
  tags: string[];
  notes: string;
  createdAt: string;
  status: string;
};

type ScanResult = {
  timestamp: string;
  scan: {
    corridor: string;
    competitor_activity: string;
    gaps_found: string[];
    urgency: string;
    signal_count: number;
    sources_searched: string[];
    source_breakdown: {
      linkedin_insight: string;
      portal_insight: string;
      forum_question: string;
      news_signal: string;
      podcast_insight: string;
    };
  };
  battle_card: {
    title: string;
    staged_asset_id: string | null;
    assets_created: number;
    forum_question_answered: string;
    whatsapp_alert_sent: boolean;
    whatsapp_alert_text: string;
  };
};

const CORRIDORS = ["Wardha Road", "Besa", "MIHAN", "Ring Road", "Hingna Road"];
const AUTO_SCAN_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours

const URGENCY_COLORS: Record<string, string> = {
  high:   "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low:    "bg-green-100 text-green-700 border-green-200",
};

const SOURCES = [
  {
    key: "linkedin",
    icon: <Linkedin className="w-4 h-4" />,
    label: "LinkedIn",
    desc: "Industry posts, influencer activity, proptech trends",
    status: "active",
    color: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    key: "portals",
    icon: <Building2 className="w-4 h-4" />,
    label: "MagicBricks + 99acres",
    desc: "Listing activity, price movements, corridor trends",
    status: "active",
    color: "text-orange-500",
    bg: "bg-orange-50",
    border: "border-orange-100",
  },
  {
    key: "forums",
    icon: <Users className="w-4 h-4" />,
    label: "Property Forums",
    desc: "Buyer questions, pain points, community discussions",
    status: "active",
    color: "text-teal-500",
    bg: "bg-teal-50",
    border: "border-teal-100",
  },
  {
    key: "news",
    icon: <Newspaper className="w-4 h-4" />,
    label: "News Portals",
    desc: "Economic Times, Mint, Business Standard, RERA updates",
    status: "active",
    color: "text-rose-500",
    bg: "bg-rose-50",
    border: "border-rose-100",
  },
  {
    key: "podcasts",
    icon: <Mic className="w-4 h-4" />,
    label: "Podcast Transcripts",
    desc: "Expert insights from real estate and proptech podcasts",
    status: "active",
    color: "text-violet-500",
    bg: "bg-violet-50",
    border: "border-violet-100",
  },
  {
    key: "proptech",
    icon: <Globe2 className="w-4 h-4" />,
    label: "PropTech Blogs",
    desc: "Case studies, marketing strategies, industry analysis",
    status: "active",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
];

export default function MarketWatchPage() {
  const [activeTab, setActiveTab] = useState<"hunt" | "battle_cards" | "improve" | "report">("hunt");
  const [isScanning, setIsScanning]       = useState(false);
  const [isImproving, setIsImproving]     = useState(false);
  const [lastScan, setLastScan]           = useState<ScanResult | null>(null);
  const [battleCards, setBattleCards]     = useState<BattleCard[]>([]);
  const [selectedCorridor, setSelectedCorridor] = useState("all");
  const [improvements, setImprovements]   = useState<any>(null);
  const [isAutoMode, setIsAutoMode]       = useState(true);
  const [nextScanIn, setNextScanIn]       = useState<number | null>(null);
  const [activeSources, setActiveSources] = useState<string[]>(["linkedin", "portals", "forums", "news", "podcasts", "proptech"]);
  const autoTimerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const resetCountdownRef = useRef<() => void>(() => {});

  const fetchBattleCards = useCallback(async () => {
    try {
      const res = await fetch("/api/generated-assets?tags=battle_card");
      if (res.ok) {
        const data = await res.json();
        setBattleCards((data.assets || []).filter((a: BattleCard) =>
          a.tags?.includes("battle_card")
        ));
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchBattleCards(); }, [fetchBattleCards]);

  const runHunterScan = useCallback(async (isAuto = false) => {
    if (isScanning) return;
    setIsScanning(true);
    toast.loading("🕵️ Deploying Market Hunter v2.0 across 6 sources...", { id: "hunt" });
    try {
      const res = await fetch("/api/market-watch/hunt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "full" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed");
      setLastScan(data);
      toast.success(isAuto
        ? `🤖 Autonomous scan: ${data.scan?.signal_count || 0} signals from ${data.scan?.sources_searched?.length || 0} sources. ${data.battle_card?.assets_created || 0} battle cards drafted.`
        : `🔍 Hunt complete! ${data.scan?.signal_count || 0} signals. ${data.battle_card?.assets_created || 0} battle cards ready.`,
        { id: "hunt", duration: 5000 }
      );
      await fetchBattleCards();
      setActiveTab("battle_cards");
      resetCountdownRef.current();
    } catch (e: any) {
      toast.error(e.message || "Scan failed", { id: "hunt" });
    } finally {
      setIsScanning(false);
    }
  }, [isScanning, fetchBattleCards]);

  const resetCountdown = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    let remaining = AUTO_SCAN_INTERVAL / 1000;
    setNextScanIn(remaining);
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) remaining = AUTO_SCAN_INTERVAL / 1000;
      setNextScanIn(remaining);
    }, 1000);
  }, []);

  resetCountdownRef.current = resetCountdown;

  useEffect(() => {
    if (isAutoMode) {
      resetCountdown();
      autoTimerRef.current = setInterval(() => runHunterScan(true), AUTO_SCAN_INTERVAL);
    } else {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      setNextScanIn(null);
    }
    return () => {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isAutoMode, runHunterScan, resetCountdown]);

  const formatCountdown = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
  };

  const runSelfImprove = async () => {
    setIsImproving(true);
    try {
      const res = await fetch("/api/cron/self-improve", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setImprovements(data);
      toast.success(`🧠 Self-improved! ${data.improvements_found} new lessons learned.`);
    } catch (e: any) {
      toast.error(e.message || "Self-improve failed");
    } finally {
      setIsImproving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-100">
              🕵️
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Market Hunter</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">
                v2.0 · 6-Source Intelligence Engine · Hunter Mode
              </p>
            </div>
          </div>
          <p className="text-gray-500 font-medium ml-[52px]">
            Scans LinkedIn · MagicBricks · 99acres · Forums · News Portals · Podcast Transcripts for real market signals.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsAutoMode(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black border transition-all ${
              isAutoMode
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-gray-50 border-gray-200 text-gray-500"
            }`}
          >
            {isAutoMode ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            {isAutoMode ? "Autonomous: ON" : "Autonomous: OFF"}
          </button>

          {isAutoMode && nextScanIn !== null && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-[10px] font-black text-blue-600">
              <Clock className="w-3 h-3" />
              Next scan in {formatCountdown(nextScanIn)}
            </div>
          )}

          <button
            onClick={() => runHunterScan(false)}
            disabled={isScanning}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-black rounded-2xl shadow-md transition-all disabled:opacity-50"
          >
            {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-white" />}
            {isScanning ? "Deploying..." : "Deploy Hunter v2.0"}
          </button>

          <Link
            href="/report"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-black rounded-2xl shadow-md hover:shadow-lg transition-all"
          >
            <FileText className="w-4 h-4" />
            2026 Report
          </Link>
        </div>
      </div>

      {/* ── Alert Banner ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-900 rounded-[2rem] px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div className="relative flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/30 flex items-center justify-center text-lg shrink-0">🕵️</div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-300 mb-0.5">Hunter Agent · Multi-Source Intelligence</p>
            <p className="text-sm font-bold text-white">Research Specialist scanning LinkedIn · MagicBricks · 99acres · Forums · Economic Times · Podcasts</p>
            <p className="text-[10px] text-indigo-400 font-medium">Generates 3 battle cards per scan: Hinglish · Marathi · LinkedIn Thought Leadership</p>
          </div>
        </div>
        <Link href="/agents?agent=research" className="relative shrink-0 text-xs font-black text-indigo-300 border border-indigo-700 bg-indigo-900/50 px-3 py-1.5 rounded-xl hover:bg-indigo-800 transition-colors flex items-center gap-1">
          View Agent <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* ── Live Scan Result ─────────────────────────────────────────────── */}
      {lastScan && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-[2.5rem] p-6 animate-in slide-in-from-top duration-500">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500 flex items-center justify-center shrink-0 shadow-lg shadow-red-200">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-black text-red-800 uppercase tracking-widest">Hunter Alert</p>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${URGENCY_COLORS[lastScan.scan.urgency] || URGENCY_COLORS.medium}`}>
                    {lastScan.scan.urgency?.toUpperCase()} URGENCY
                  </span>
                  <span className="text-[10px] font-black bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                    {lastScan.scan.signal_count} SIGNALS
                  </span>
                </div>
                <p className="text-base font-bold text-gray-900 mb-1">{lastScan.scan.competitor_activity}</p>
                <p className="text-xs text-gray-600 mb-3">
                  Corridor: <strong>{lastScan.scan.corridor}</strong> · Gaps: <strong>{lastScan.scan.gaps_found?.slice(0, 2).join(", ")}</strong>
                </p>

                {/* Source Breakdown */}
                {lastScan.scan.source_breakdown && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { icon: "💼", label: "LinkedIn", key: "linkedin_insight" },
                      { icon: "🏘️", label: "Portal Intel", key: "portal_insight" },
                      { icon: "💬", label: "Forum Signal", key: "forum_question" },
                      { icon: "📰", label: "News Alert", key: "news_signal" },
                      { icon: "🎙️", label: "Podcast Insight", key: "podcast_insight" },
                    ].map(({ icon, label, key }) => {
                      const val = (lastScan.scan.source_breakdown as any)[key];
                      if (!val) return null;
                      return (
                        <div key={key} className="flex items-start gap-2 p-2.5 bg-white rounded-xl border border-red-100 text-xs">
                          <span className="shrink-0">{icon}</span>
                          <div>
                            <p className="font-black text-red-700 uppercase tracking-wider text-[9px] mb-0.5">{label}</p>
                            <p className="text-gray-600 leading-snug">{val}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Battle Cards Drafted</p>
              <p className="text-xs font-black text-green-700">{lastScan.battle_card.title}</p>
              <p className="text-[10px] text-gray-400 mt-1">{lastScan.battle_card.assets_created} assets created</p>
              {lastScan.scan.sources_searched?.length > 0 && (
                <p className="text-[10px] text-blue-500 font-bold mt-1">
                  {lastScan.scan.sources_searched.length} sources searched
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Corridor Filters ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {CORRIDORS.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCorridor(selectedCorridor === c ? "all" : c)}
            className={`p-4 rounded-[1.5rem] border text-sm font-bold text-left transition-all ${
              selectedCorridor === c
                ? "bg-gray-900 text-white border-gray-900 shadow-lg"
                : "bg-white text-gray-600 border-gray-100 hover:border-gray-300"
            }`}
          >
            <TrendingUp className={`w-4 h-4 mb-2 ${selectedCorridor === c ? "text-orange-400" : "text-gray-300"}`} />
            {c}
          </button>
        ))}
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-2xl p-1.5 w-fit shadow-sm flex-wrap">
        {[
          { id: "hunt",         label: "Intelligence Feed",                    icon: Target },
          { id: "battle_cards", label: `Battle Cards (${battleCards.length})`, icon: Swords },
          { id: "improve",      label: "Self-Improvement",                     icon: BrainCircuit },
          { id: "report",       label: "2026 Report",                          icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-gray-900 text-white shadow-md"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.id === "report" && (
                <span className="text-[9px] bg-indigo-500 text-white px-1.5 py-0.5 rounded-full font-black">NEW</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Intelligence Feed Tab ─────────────────────────────────────────── */}
      {activeTab === "hunt" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">

            {/* Source Status Grid */}
            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-sm">
              <h3 className="text-lg font-black text-gray-900 mb-5 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Radio className="w-4 h-4 text-blue-500" />
                </div>
                Live Intelligence Sources
                <span className="ml-auto text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
                  6 Active
                </span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SOURCES.map((source) => (
                  <div
                    key={source.key}
                    className={`flex items-center gap-3 p-4 rounded-2xl border ${source.bg} ${source.border} cursor-pointer transition-all hover:shadow-sm`}
                    onClick={() => {
                      setActiveSources(prev =>
                        prev.includes(source.key)
                          ? prev.filter(k => k !== source.key)
                          : [...prev, source.key]
                      );
                    }}
                  >
                    <div className={`w-9 h-9 rounded-xl bg-white flex items-center justify-center ${source.color} shadow-sm border border-white/80`}>
                      {source.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-black ${activeSources.includes(source.key) ? "text-gray-900" : "text-gray-400"}`}>
                        {source.label}
                      </p>
                      <p className="text-[11px] text-gray-500 font-medium truncate">{source.desc}</p>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      activeSources.includes(source.key)
                        ? "bg-emerald-500 shadow-sm shadow-emerald-200"
                        : "bg-gray-200"
                    }`} />
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between text-xs text-gray-400 border-t border-gray-50 pt-4">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  {isAutoMode && nextScanIn !== null
                    ? `Auto-scan in ${formatCountdown(nextScanIn)}`
                    : "Manual mode — click Deploy Hunter"}
                </div>
                <button
                  onClick={() => runHunterScan(false)}
                  disabled={isScanning}
                  className="flex items-center gap-1 text-indigo-600 font-bold hover:text-indigo-700"
                >
                  <RefreshCw className={`w-3 h-3 ${isScanning ? "animate-spin" : ""}`} />
                  Force scan
                </button>
              </div>
            </div>

            {/* Battle Card Rules */}
            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-sm">
              <h3 className="text-base font-black text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Swords className="w-3.5 h-3.5 text-amber-500" />
                </div>
                What Hunter v2.0 Generates Per Scan
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { icon: "🇮🇳", label: "Hinglish Battle Card", desc: "Instagram/WhatsApp post countering competitor move" },
                  { icon: "🏠", label: "Marathi Battle Card", desc: "Localized for Vidarbha buyers and Wardha Road audience" },
                  { icon: "💼", label: "LinkedIn Thought Leadership", desc: "Market data post to establish authority with investors" },
                ].map((item, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-2xl mb-2">{item.icon}</p>
                    <p className="text-sm font-black text-gray-900 mb-1">{item.label}</p>
                    <p className="text-xs text-gray-500 font-medium">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Rules Panel */}
          <div className="space-y-4">
            <div className="bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-[2.5rem] p-6 shadow-xl">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-5 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" /> Hunter Rules (competitive_edge.md)
              </h4>
              <div className="space-y-3">
                {[
                  { icon: "🎯", rule: "Competitor posts price → You post RERA trust" },
                  { icon: "⚡", rule: "New rival project → Battle Card in 60 mins" },
                  { icon: "📍", rule: "Always reference local Nagpur landmarks" },
                  { icon: "🗣️", rule: "Wardha Road = Marathi, MIHAN = Hinglish" },
                  { icon: "📱", rule: "Every post ends with WhatsApp CTA" },
                  { icon: "💬", rule: "Forum questions = your next content idea" },
                  { icon: "📰", rule: "Breaking news signal = same-day post" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-2xl border border-white/10">
                    <span className="text-lg">{item.icon}</span>
                    <p className="text-xs font-medium text-gray-300 leading-snug">{item.rule}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-white/10">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Sources Active</p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  LinkedIn · MagicBricks · 99acres · Forums · Economic Times · Podcasts
                </p>
              </div>
            </div>

            {/* Quick report CTA */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-[2rem] p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h4 className="font-black text-indigo-900">New: 2026 Industry Report</h4>
              </div>
              <p className="text-xs text-indigo-700 font-medium mb-4">
                Generate &amp; download &ldquo;The State of AI in Indian Real Estate Marketing — 2026&rdquo; — a free PDF benchmark report.
              </p>
              <Link href="/report" className="flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xs rounded-xl hover:shadow-lg transition-all">
                <Sparkles className="w-3.5 h-3.5" /> Get Free Report
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Battle Cards Tab ──────────────────────────────────────────────── */}
      {activeTab === "battle_cards" && (
        <div className="space-y-4">
          {battleCards.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] border border-dashed border-gray-200 p-16 text-center">
              <div className="w-20 h-20 rounded-[2rem] bg-gray-50 flex items-center justify-center mx-auto mb-5 border border-gray-100">
                <Swords className="w-9 h-9 text-gray-300" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">No Battle Cards Yet</h3>
              <p className="text-gray-500 text-sm font-medium mb-6">
                Deploy Hunter v2.0 to scan 6 sources and get 3 battle cards (Hinglish + Marathi + LinkedIn).
              </p>
              <button
                onClick={() => runHunterScan(false)}
                disabled={isScanning}
                className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl font-black text-sm mx-auto transition-all hover:bg-black shadow-lg"
              >
                {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-white" />}
                Deploy Hunter v2.0
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {battleCards.map((card) => (
                <div key={card.id} className="bg-white border border-gray-100 rounded-[2rem] p-5 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-black bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full uppercase tracking-wider">Battle Card</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          card.language === "marathi"
                            ? "bg-purple-50 text-purple-600 border-purple-100"
                            : card.language === "english"
                            ? "bg-blue-50 text-blue-600 border-blue-100"
                            : "bg-amber-50 text-amber-600 border-amber-100"
                        }`}>
                          {(card.language || "hinglish").toUpperCase()}
                        </span>
                        {card.tags?.includes("multi_source") && (
                          <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full">MULTI-SOURCE</span>
                        )}
                        {card.tags?.includes("thought_leadership") && (
                          <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Linkedin className="w-2.5 h-2.5" /> LINKEDIN
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-black text-gray-900 line-clamp-2">{card.title}</h4>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                      card.status === "published" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}>{card.status?.toUpperCase() || "DRAFT"}</span>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 mb-3 border border-gray-100 max-h-36 overflow-y-auto custom-scrollbar text-sm">
                    <MarkdownContent content={card.body} compact />
                  </div>

                  {card.notes && (
                    <p className="text-xs text-gray-400 mb-3 flex items-start gap-1.5">
                      <Target className="w-3 h-3 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{card.notes}</span>
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    <Link href="/approvals" className="flex-1 py-2 bg-gray-900 hover:bg-black text-white text-xs font-black rounded-xl transition-all text-center">
                      <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                      Approve & Schedule
                    </Link>
                    <Link href="/library" className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-600 rounded-xl transition-all">
                      Library
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Self-Improvement Tab ──────────────────────────────────────────── */}
      {activeTab === "improve" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-200">
                <BrainCircuit className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">Recursive Self-Improvement</h3>
                <p className="text-xs font-medium text-gray-400">Analyzes your past posts and updates soul.md memory weekly</p>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              {[
                "Reads analytics from last 30 days of posts",
                "Identifies best-performing language per corridor",
                "Detects top engagement patterns (format, time, CTA)",
                "Auto-updates Core Memory (soul.md) with new rules",
                "Injects learned rules into all future prompts",
                "Updates Hunter v2.0 source weights based on signal quality",
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-xs font-black text-gray-400 border border-gray-100 shadow-sm shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-xs font-bold text-gray-700">{step}</p>
                </div>
              ))}
            </div>

            <button
              onClick={runSelfImprove}
              disabled={isImproving}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-violet-200 hover:shadow-xl transition-all disabled:opacity-50"
            >
              {isImproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isImproving ? "Learning from analytics..." : "Run Self-Improvement Now"}
            </button>
            <p className="text-center text-xs text-gray-400 font-medium mt-2">Runs automatically every Sunday at 3AM</p>
          </div>

          {improvements ? (
            <div className="bg-gradient-to-b from-violet-50 to-indigo-50 border border-violet-100 rounded-[2.5rem] p-8">
              <h4 className="text-sm font-black text-violet-800 uppercase tracking-widest mb-5">Latest Learnings</h4>
              <div className="space-y-3 mb-6">
                {improvements.lessons?.map((lesson: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-violet-100 shadow-sm">
                    <ChevronRight className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
                    <p className="text-sm font-bold text-gray-800">{lesson}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl p-4 border border-violet-100 text-center">
                  <p className="text-2xl font-black text-violet-700">{improvements.bestLanguage}</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Best Language</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-violet-100 text-center">
                  <p className="text-2xl font-black text-indigo-700 capitalize">{improvements.bestCorridor}</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Best Corridor</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-100">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <p className="text-xs font-bold text-green-800">
                  {improvements.analytics_processed} posts analyzed. soul.md + contentBrain memory updated.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center">
              <BookOpen className="w-12 h-12 text-gray-200 mb-4" />
              <h4 className="text-lg font-black text-gray-400 mb-2">No improvements run yet</h4>
              <p className="text-sm text-gray-400 font-medium">Click &quot;Run Self-Improvement Now&quot; or wait for the weekly Sunday cycle.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Report Tab ────────────────────────────────────────────────────── */}
      {activeTab === "report" && (
        <div className="flex flex-col items-center text-center py-10 gap-6">
          <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-200">
            <FileText className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-3xl font-black text-gray-900">The State of AI in Indian Real Estate Marketing — 2026</h2>
          <p className="text-gray-500 max-w-lg font-medium text-lg">
            India&apos;s first benchmark report. Multi-source intelligence from 6 platforms. Free PDF download.
          </p>
          <Link
            href="/report"
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-lg rounded-2xl shadow-xl shadow-indigo-300 hover:scale-105 transition-all"
          >
            <Sparkles className="w-5 h-5" />
            Open Report Generator
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      )}
    </div>
  );
}
