"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp, Zap, Shield, Target, BrainCircuit, RefreshCw,
  AlertTriangle, CheckCircle2, Clock, Loader2, Swords, Sparkles,
  BarChart3, MessageCircle, BookOpen, ChevronRight, Eye
} from "lucide-react";
import toast from "react-hot-toast";

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
  };
  battle_card: {
    title: string;
    staged_asset_id: string | null;
    whatsapp_alert_sent: boolean;
  };
};

const CORRIDORS = ["Wardha Road", "Besa", "MIHAN", "Ring Road", "Hingna Road"];

const URGENCY_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-green-100 text-green-700 border-green-200"
};

export default function MarketWatchPage() {
  const [activeTab, setActiveTab] = useState<"hunt" | "battle_cards" | "improve">("hunt");
  const [isScanning, setIsScanning] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [battleCards, setBattleCards] = useState<BattleCard[]>([]);
  const [selectedCorridor, setSelectedCorridor] = useState("all");
  const [improvements, setImprovements] = useState<any>(null);

  const fetchBattleCards = useCallback(async () => {
    try {
      const res = await fetch("/api/generated-assets?tags=battle_card&limit=20");
      if (res.ok) {
        const data = await res.json();
        setBattleCards(data.assets || []);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchBattleCards(); }, [fetchBattleCards]);

  const runHunterScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch("/api/cron/market-watch", {
        method: "GET",
        headers: { 
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || ""}`,
          "x-manual-trigger": "true"
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed");
      setLastScan(data);
      toast.success("🔍 Hunter scan complete! Battle card drafted.");
      fetchBattleCards();
    } catch (e: any) {
      toast.error(e.message || "Scan failed");
    } finally {
      setIsScanning(false);
    }
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

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-md shadow-red-100">
              <Swords className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Market Watch</h1>
          </div>
          <p className="text-gray-500 font-medium ml-[52px]">
            Hunter Agent scans Nagpur competitors every 6h. Auto-drafts Battle Cards. Sends WhatsApp alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-2xl text-xs font-black text-green-700">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Auto-scan every 6h
          </div>
          <button
            onClick={runHunterScan}
            disabled={isScanning}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-black rounded-2xl shadow-md transition-all disabled:opacity-50"
          >
            {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-white" />}
            {isScanning ? "Hunting..." : "Run Hunter Now"}
          </button>
        </div>
      </div>

      {/* ── Live Scan Result Banner ──────────────────────────────── */}
      {lastScan && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-[2.5rem] p-6 animate-in slide-in-from-top duration-500">
          <div className="flex items-start justify-between gap-4">
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
                </div>
                <p className="text-base font-bold text-gray-900 mb-1">{lastScan.scan.competitor_activity}</p>
                <p className="text-xs text-gray-600">
                  Corridor: <strong>{lastScan.scan.corridor}</strong> · Gaps: <strong>{lastScan.scan.gaps_found?.join(", ")}</strong>
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Battle Card</p>
              <p className="text-xs font-black text-green-700">{lastScan.battle_card.title}</p>
              {lastScan.battle_card.whatsapp_alert_sent && (
                <div className="flex items-center gap-1 justify-end mt-1">
                  <MessageCircle className="w-3 h-3 text-green-600" />
                  <span className="text-[10px] text-green-600 font-bold">WhatsApp Sent</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Corridor Status Bar ──────────────────────────────────── */}
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

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-2xl p-1.5 w-fit shadow-sm">
        {[
          { id: "hunt", label: "Intelligence Feed", icon: Target },
          { id: "battle_cards", label: `Battle Cards (${battleCards.length})`, icon: Swords },
          { id: "improve", label: "Self-Improvement", icon: BrainCircuit },
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
            </button>
          );
        })}
      </div>

      {/* ── Intelligence Feed Tab ──────────────────────────────── */}
      {activeTab === "hunt" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
              <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
                  <Eye className="w-4 h-4 text-orange-500" />
                </div>
                Live Competitive Landscape
              </h3>

              <div className="space-y-4">
                {["99acres", "MagicBricks", "Housing.com", "Instagram Accounts"].map((source, i) => (
                  <div key={source} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${i === 0 ? "bg-green-500 animate-pulse" : i === 1 ? "bg-blue-500" : "bg-gray-300"}`} />
                      <div>
                        <p className="text-sm font-bold text-gray-900">{source}</p>
                        <p className="text-xs text-gray-400">
                          {i === 0 ? "Scanning Wardha Road, Besa, MIHAN..." : i === 1 ? "Monitoring active listings" : "Passive tracking"}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full ${i < 2 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {i < 2 ? "ACTIVE" : "UPCOMING"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between text-xs text-gray-400 border-t border-gray-50 pt-4">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Next auto-scan in ~{Math.floor(Math.random() * 6) + 1}h
                </div>
                <button
                  onClick={runHunterScan}
                  disabled={isScanning}
                  className="flex items-center gap-1 text-indigo-600 font-bold hover:text-indigo-700"
                >
                  <RefreshCw className={`w-3 h-3 ${isScanning ? "animate-spin" : ""}`} />
                  Force scan
                </button>
              </div>
            </div>
          </div>

          {/* Right: Rules Panel */}
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
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-2xl border border-white/10">
                  <span className="text-lg">{item.icon}</span>
                  <p className="text-xs font-medium text-gray-300 leading-snug">{item.rule}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Scanning targets</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">99acres · MagicBricks · Housing.com · Instagram Developer Pages</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Battle Cards Tab ───────────────────────────────────── */}
      {activeTab === "battle_cards" && (
        <div className="space-y-4">
          {battleCards.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] border border-dashed border-gray-200 p-16 text-center">
              <div className="w-20 h-20 rounded-[2rem] bg-gray-50 flex items-center justify-center mx-auto mb-5 border border-gray-100">
                <Swords className="w-9 h-9 text-gray-300" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">No Battle Cards Yet</h3>
              <p className="text-gray-500 text-sm font-medium mb-6">
                Run the Hunter Agent to scan competitors and draft your first battle card.
              </p>
              <button
                onClick={runHunterScan}
                disabled={isScanning}
                className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl font-black text-sm mx-auto transition-all hover:bg-black shadow-lg"
              >
                {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-white" />}
                Run Hunter Scan
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {battleCards.map((card) => (
                <div key={card.id} className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full uppercase tracking-wider">Battle Card</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          card.language === "marathi" ? "bg-purple-50 text-purple-600 border-purple-100" : "bg-blue-50 text-blue-600 border-blue-100"
                        }`}>{(card.language || "hinglish").toUpperCase()}</span>
                      </div>
                      <h4 className="text-base font-black text-gray-900">{card.title}</h4>
                    </div>
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                      card.status === "published" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}>{card.status?.toUpperCase() || "DRAFT"}</span>
                  </div>

                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100 line-clamp-4">
                    {card.body}
                  </p>

                  {card.notes && (
                    <p className="text-xs text-gray-400 mb-4 flex items-center gap-1.5">
                      <Target className="w-3 h-3 shrink-0" /> {card.notes}
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    <button className="flex-1 py-2 bg-gray-900 hover:bg-black text-white text-xs font-black rounded-xl transition-all">
                      <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                      Approve & Schedule
                    </button>
                    <button className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-600 rounded-xl transition-all">
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Self-Improvement Tab ───────────────────────────────── */}
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
                "Injects learned rules into all future prompts"
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
    </div>
  );
}
