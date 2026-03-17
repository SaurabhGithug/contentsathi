"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  MapPin, TrendingUp, Zap, Calculator, BarChart3, CheckCircle2,
  AlertTriangle, Target, ArrowRight, ChevronDown, ChevronUp,
  Home, Sparkles, RefreshCw, Info, Shield, Building2, Clock,
  Loader2, Copy, ExternalLink, PlusCircle, Trash2, ArrowUpRight,
  ArrowDownRight, Minus, BrainCircuit,
} from "lucide-react";
import toast from "react-hot-toast";

// ── Nagpur-specific data ─────────────────────────────────────────────────────
const NAGPUR_CORRIDORS = [
  { id: "wardha", label: "Wardha Road", circleRate: 3200, marketMult: 1.18, trend: "+12% YoY", hot: true },
  { id: "besa",   label: "Besa",        circleRate: 2400, marketMult: 1.22, trend: "+9% YoY",  hot: false },
  { id: "mihan",  label: "MIHAN / SEZ", circleRate: 2800, marketMult: 1.35, trend: "+21% YoY", hot: true },
  { id: "ring",   label: "Ring Road",   circleRate: 3000, marketMult: 1.25, trend: "+15% YoY", hot: true },
  { id: "hingna", label: "Hingna Road", circleRate: 1800, marketMult: 1.15, trend: "+7% YoY",  hot: false },
  { id: "saras",  label: "Saraswati Nagri", circleRate: 2200, marketMult: 1.28, trend: "+18% YoY", hot: true },
  { id: "godni",  label: "Godni",       circleRate: 1600, marketMult: 1.12, trend: "+5% YoY",  hot: false },
  { id: "custom", label: "Custom Area", circleRate: 2000, marketMult: 1.20, trend: "—",        hot: false },
];

const ADJUSTMENT_FACTORS = [
  { id: "road_facing",   label: "Road-Facing Plot",        impact: +5,   icon: "🛣️",  category: "positive" },
  { id: "corner_plot",   label: "Corner Plot",             impact: +8,   icon: "📐",  category: "positive" },
  { id: "metro_nearby",  label: "Metro / Airport Nearby (<2km)", impact: +12, icon: "🚇", category: "positive" },
  { id: "mihan_belt",    label: "MIHAN / SEZ Belt",        impact: +15,  icon: "✈️",  category: "positive" },
  { id: "ring_road",     label: "Ring Road Proximity",     impact: +10,  icon: "🔄",  category: "positive" },
  { id: "north_facing",  label: "North / East Facing",     impact: +3,   icon: "🧭",  category: "positive" },
  { id: "wide_frontage", label: "Wide Road Frontage (>30ft)", impact: +6, icon: "↔️", category: "positive" },
  { id: "school_belt",   label: "School / Hospital Belt",  impact: +5,   icon: "🏥",  category: "positive" },
  { id: "irregular",     label: "Irregular Shape",         impact: -8,   icon: "⬟",   category: "negative" },
  { id: "waterlog",      label: "Waterlogging Risk",       impact: -12,  icon: "🌊",  category: "negative" },
  { id: "encumbrance",   label: "Encumbrance / Title Issue", impact: -20, icon: "⚠️", category: "negative" },
  { id: "no_utilities",  label: "No Water/Sewage Line",    impact: -6,   icon: "🚰",  category: "negative" },
  { id: "interior_plot", label: "Interior Plot (Not Road-Facing)", impact: -10, icon: "🏚️", category: "negative" },
  { id: "flood_zone",    label: "Flood Zone / Nala Adjacent", impact: -15, icon: "🌧️", category: "negative" },
];

type Comparable = {
  id: string;
  description: string;
  area: number;
  pricePerSqFt: number;
  corridor: string;
  adjustmentPct: number;
  // DB-sourced fields
  source?: string;        // "99acres" | "magicbricks" | "housing" | "local_site" | "manual"
  sourceUrl?: string;
  isVerified?: boolean;
  fromDb?: boolean;
};

type Signal = "BUY" | "HOLD" | "SELL" | "EVALUATE";

function UpliftGauge({ pct }: { pct: number }) {
  const clamped = Math.min(Math.max(pct, -30), 50);
  const normalized = ((clamped + 30) / 80) * 100;
  const color = pct >= 8 ? "#10b981" : pct >= 0 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000"
        style={{ width: `${normalized}%`, backgroundColor: color }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-black text-gray-700">
          {pct > 0 ? "+" : ""}{pct.toFixed(1)}% vs Circle Rate
        </span>
      </div>
    </div>
  );
}

let compIdCounter = 1;
function newComp(): Comparable {
  return {
    id: `comp-${++compIdCounter}`,
    description: "",
    area: 1000,
    pricePerSqFt: 2200,
    corridor: "wardha",
    adjustmentPct: 0,
  };
}

export default function PlotValuatorPage() {
  // ── Subject Plot ────────────────────────────────────────────────────────────
  const [plotArea, setPlotArea]         = useState(1000);
  const [corridorId, setCorridorId]     = useState("mihan");
  const [customCircleRate, setCustomCircleRate] = useState(2000);
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);

  // Derived corridor — declared early so hooks below can use it
  const corridor     = NAGPUR_CORRIDORS.find(c => c.id === corridorId) || NAGPUR_CORRIDORS[0];
  const circleRate   = corridorId === "custom" ? customCircleRate : corridor.circleRate;
  const [comps, setComps] = useState<Comparable[]>([]);
  const [isLoadingComps, setIsLoadingComps] = useState(false);
  const [isRefreshingPortals, setIsRefreshingPortals] = useState(false);
  const [compStats, setCompStats] = useState<{ count: number; avgPricePerSqFt: number | null; lastScraped: string | null; sources: string[] } | null>(null);

  // ── Auto-load comps from DB when corridor changes ───────────────────────────
  useEffect(() => {
    async function loadCompsFromDB() {
      setIsLoadingComps(true);
      try {
        const res = await fetch(`/api/plot-valuator/comps?corridor=${encodeURIComponent(corridor.label)}&limit=10`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.comps && data.comps.length > 0) {
          setComps(data.comps.map((c: any, i: number) => ({
            id: c.id,
            description: c.title || c.description || `${c.corridor} listing`,
            area: Math.round(c.areaSqFt || 1000),
            pricePerSqFt: Math.round(c.pricePerSqFt || 0),
            corridor: c.corridor,
            adjustmentPct: 0,
            source: c.source,
            sourceUrl: c.sourceUrl,
            isVerified: c.isVerified,
            fromDb: true,
          })));
          setCompStats(data.stats);
        } else {
          // No DB data yet — seed with corridor fallback comps
          setComps([
            { id: "seed-0", description: `${corridor.label} — road-facing (manual)`, area: 1000, pricePerSqFt: Math.round(corridor.circleRate * corridor.marketMult), corridor: corridor.label, adjustmentPct: 0, source: "manual", fromDb: false },
          ]);
          setCompStats(null);
        }
      } catch {
        // Fallback silently
      } finally {
        setIsLoadingComps(false);
      }
    }
    loadCompsFromDB();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corridorId]);

  // ── Refresh comps from property portals (triggers Apify scrape) ─────────────
  const refreshFromPortals = useCallback(async () => {
    setIsRefreshingPortals(true);
    try {
      const res = await fetch("/api/plot-valuator/comps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ corridor: corridor.label, city: "Nagpur" }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || `✅ ${data.saved} new comps saved from 99acres & MagicBricks`);
        // Reload from DB after scrape
        const reload = await fetch(`/api/plot-valuator/comps?corridor=${encodeURIComponent(corridor.label)}&limit=10`);
        if (reload.ok) {
          const fresh = await reload.json();
          if (fresh.comps?.length) {
            setComps(fresh.comps.map((c: any) => ({
              id: c.id,
              description: c.title || c.description || `${c.corridor} listing`,
              area: Math.round(c.areaSqFt || 1000),
              pricePerSqFt: Math.round(c.pricePerSqFt || 0),
              corridor: c.corridor,
              adjustmentPct: 0,
              source: c.source,
              sourceUrl: c.sourceUrl,
              isVerified: c.isVerified,
              fromDb: true,
            })));
            setCompStats(fresh.stats);
          }
        }
      } else {
        toast.error(data.error || "Scrape failed");
      }
    } catch (e: any) {
      toast.error(e.message || "Refresh failed");
    } finally {
      setIsRefreshingPortals(false);
    }
  }, [corridor.label]);

  // ── Result ──────────────────────────────────────────────────────────────────
  const [showResult, setShowResult]       = useState(false);
  const [aiNarrative, setAiNarrative]     = useState("");
  const [isGenerating, setIsGenerating]   = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("comps");

  // ── Adjustment sum ──────────────────────────────────────────────────────────
  const totalAdjustmentPct = selectedFactors.reduce((sum, fid) => {
    const f = ADJUSTMENT_FACTORS.find(af => af.id === fid);
    return sum + (f?.impact ?? 0);
  }, 0);

  // ── Sales Comparison Estimate ───────────────────────────────────────────────
  const compValues = comps
    .filter(c => c.description && c.pricePerSqFt > 0)
    .map(c => {
      const adjustedPPSF = c.pricePerSqFt * (1 + c.adjustmentPct / 100);
      return adjustedPPSF;
    });

  const avgCompPPSF = compValues.length > 0
    ? compValues.reduce((a, b) => a + b, 0) / compValues.length
    : circleRate * corridor.marketMult;

  const subjectPPSF         = avgCompPPSF * (1 + totalAdjustmentPct / 100);
  const estimatedValue      = subjectPPSF * plotArea;
  const circleRateValue     = circleRate * plotArea;
  const marketVsCircle      = ((subjectPPSF - circleRate) / circleRate) * 100;
  const loValue             = estimatedValue * 0.92;
  const hiValue             = estimatedValue * 1.10;

  // ── Signal ─────────────────────────────────────────────────────────────────
  const signal: Signal = marketVsCircle >= 10
    ? "BUY"
    : marketVsCircle >= 5
    ? "HOLD"
    : marketVsCircle < 0
    ? "SELL"
    : "EVALUATE";

  const SIGNAL_CONFIG = {
    BUY:      { color: "bg-emerald-500", border: "border-emerald-200", text: "text-emerald-700", bg: "bg-emerald-50",  label: "Strong Buy Signal 🚀",  desc: "Market price meaningfully above circle rate — strong infrastructure uplift. Consider buying." },
    HOLD:     { color: "bg-amber-400",   border: "border-amber-200",   text: "text-amber-700",   bg: "bg-amber-50",    label: "Hold / Monitor 📊",     desc: "Moderate premium over circle rate. Good corridor fundamentals but wait for clearer signal." },
    EVALUATE: { color: "bg-blue-400",    border: "border-blue-200",    text: "text-blue-700",    bg: "bg-blue-50",     label: "Evaluate Carefully 🔎",  desc: "Near-circle-rate pricing. Requires deeper due diligence before committing." },
    SELL:     { color: "bg-red-400",     border: "border-red-200",     text: "text-red-700",     bg: "bg-red-50",      label: "Consider Exiting ⚠️",    desc: "Market price below circle rate signals distress or over-pricing in the comps. Reassess." },
  };
  const sig = SIGNAL_CONFIG[signal];

  // ── Toggle factor ──────────────────────────────────────────────────────────
  const toggleFactor = (id: string) => {
    setSelectedFactors(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  // ── AI Narrative ──────────────────────────────────────────────────────────
  const generateNarrative = useCallback(async () => {
    setIsGenerating(true);
    try {
      const prompt = `You are an expert Nagpur real estate analyst with deep knowledge of Nagpur's micro-markets (Wardha Road, MIHAN, Ring Road, Besa, Hingna Road, Saraswati Nagri, Godni). Based on the following plot valuation inputs, produce a concise, professional land value commentary in 3-4 paragraphs. Be specific with Nagpur context. No generic phrases.

Plot Data:
- Area: ${plotArea} sq ft
- Corridor: ${corridor.label}
- Circle Rate: ₹${circleRate}/sqft
- Market Comp Avg: ₹${Math.round(avgCompPPSF)}/sqft
- Subject Estimated Rate: ₹${Math.round(subjectPPSF)}/sqft
- Total Adjustments: ${totalAdjustmentPct > 0 ? "+" : ""}${totalAdjustmentPct}%
- Applied Factors: ${selectedFactors.map(id => ADJUSTMENT_FACTORS.find(f => f.id === id)?.label).join(", ") || "None"}
- Market vs Circle Rate Premium: ${marketVsCircle.toFixed(1)}%
- Signal: ${signal}
- Estimated Value Range: ₹${(loValue / 100000).toFixed(2)}L – ₹${(hiValue / 100000).toFixed(2)}L

Write the narrative as if briefing an HNI investor or NRI buyer. Include: (1) corridor-specific fundamentals, (2) key value drivers applied, (3) risk factors if any, (4) buy/hold/sell rationale in one final line.`;

      const res = await fetch("/api/studio/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setAiNarrative(data.reply || "");
      setShowResult(true);
      toast.success("AI valuation narrative generated!");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate narrative");
    } finally {
      setIsGenerating(false);
    }
  }, [plotArea, corridor, circleRate, avgCompPPSF, subjectPPSF, totalAdjustmentPct, selectedFactors, marketVsCircle, signal, loValue, hiValue]);

  // ── Launch in Studio ─────────────────────────────────────────────────────
  const launchInStudio = useCallback(async () => {
    const goal = `Plot Value Analysis & Content Campaign for ${corridor.label} — ${plotArea} sq ft plot estimated at ${formatCr(estimatedValue)} (₹${Math.round(subjectPPSF)}/sqft). Signal: ${signal}. Create 3 investor-grade content pieces (LinkedIn article, WhatsApp broadcast, Instagram carousel).`;
    
    const context = {
      plotDetails: {
        area: plotArea,
        corridor: corridor.label,
        circleRate,
        marketPremium: marketVsCircle.toFixed(1),
        estimatedValue: estimatedValue,
        pricePerSqFt: Math.round(subjectPPSF),
        signal,
        factors: selectedFactors.map(id => ADJUSTMENT_FACTORS.find(f => f.id === id)?.label)
      },
      aiNarrative: aiNarrative || "Valuation generated manually by user."
    };

    try {
      const res = await fetch("/api/studio/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, context }),
      });
      if (res.ok) {
        toast.success("🚀 Launched in AI Studio! Check Live Tasks.");
      }
    } catch {
      toast.error("Failed to launch in Studio");
    }
  }, [corridor, plotArea, estimatedValue, subjectPPSF, signal, aiNarrative, selectedFactors, circleRate, marketVsCircle]);

  const formatCr = (v: number) => {
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
    if (v >= 100000)   return `₹${(v / 100000).toFixed(2)} L`;
    return `₹${v.toLocaleString("en-IN")}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Hero Header ───────────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-900 p-8 md:p-12 rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }} />
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-emerald-500 rounded-full mix-blend-screen filter blur-[120px] opacity-15 pointer-events-none animate-pulse" />
        <div className="absolute -bottom-10 left-20 w-64 h-64 bg-teal-400 rounded-full mix-blend-screen filter blur-[80px] opacity-10 pointer-events-none animate-pulse" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 backdrop-blur-md mb-4">
              <Calculator className="w-4 h-4 text-emerald-300 animate-pulse" />
              <span className="text-[10px] font-black tracking-widest text-emerald-100 uppercase">Nagpur Plot Valuator · v1.0</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-3">
              Plot Value{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-300">
                Estimator
              </span>
            </h1>
            <p className="text-emerald-100/80 font-medium text-sm max-w-xl">
              Sales-comparison engine calibrated to Nagpur corridors. Enter plot details, add comps, apply adjustment factors — get a market value range + Buy/Hold/Sell signal in seconds.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 px-3 py-2 rounded-xl">
              <MapPin className="w-4 h-4 text-emerald-300" />
              <span className="text-[11px] font-black text-emerald-300">Nagpur · NMRDA Corridors</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-2 rounded-xl">
              <Shield className="w-4 h-4 text-teal-300" />
              <span className="text-[11px] font-black text-teal-200">Circle Rate + RERA Aware</span>
            </div>
          </div>
        </div>

        {/* Quick stat bar */}
        <div className="relative z-10 mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Circle Rate",      value: `₹${circleRate}/sqft`,                     icon: Building2,  color: "text-emerald-300" },
            { label: "Market Multiplier", value: `${corridor.marketMult}×`,                  icon: TrendingUp, color: "text-teal-300" },
            { label: "Corridor Trend",   value: corridor.trend,                              icon: BarChart3,  color: "text-sky-300" },
            { label: "Your Estimate",    value: showResult ? formatCr(estimatedValue) : "—", icon: Target,     color: "text-amber-300" },
          ].map(s => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
              <s.icon className={`w-5 h-5 ${s.color}`} />
              <div>
                <p className="text-lg font-black text-white leading-none">{s.value}</p>
                <p className="text-[10px] text-white/50 font-bold uppercase mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT: Inputs ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Subject Plot - Basic Details */}
          <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden">
            <button
              className="w-full flex items-center gap-3 px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50 text-left"
              onClick={() => setExpandedSection(expandedSection === "plot" ? null : "plot")}
            >
              <div className="w-9 h-9 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-200">
                <Home className="w-4.5 h-4.5 text-white" style={{ width: "1.1rem", height: "1.1rem" }} />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-gray-900 text-sm">Subject Plot Details</h3>
                <p className="text-[11px] text-gray-400 font-medium">{plotArea} sq ft · {corridor.label}</p>
              </div>
              {expandedSection === "plot" ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {expandedSection === "plot" && (
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Area */}
                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase tracking-wide mb-2">
                    Plot Area (sq ft)
                  </label>
                  <input
                    type="number"
                    value={plotArea}
                    onChange={e => setPlotArea(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all bg-gray-50"
                    min={100}
                    step={50}
                  />
                  <p className="text-[11px] text-gray-400 mt-1 font-medium">
                    ≈ {(plotArea / 10.764).toFixed(0)} sq m · {(plotArea / 435.6).toFixed(2)} gunta
                  </p>
                </div>

                {/* Corridor */}
                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase tracking-wide mb-2">
                    Nagpur Corridor
                  </label>
                  <select
                    value={corridorId}
                    onChange={e => setCorridorId(e.target.value)}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all bg-gray-50 appearance-none"
                  >
                    {NAGPUR_CORRIDORS.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.label}{c.hot ? " 🔥" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Circle Rate */}
                {corridorId === "custom" && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black text-gray-700 uppercase tracking-wide mb-2">
                      Custom Circle Rate (₹/sq ft)
                    </label>
                    <input
                      type="number"
                      value={customCircleRate}
                      onChange={e => setCustomCircleRate(Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all bg-gray-50"
                    />
                  </div>
                )}

                {/* Corridor summary card */}
                <div className={`sm:col-span-2 p-4 rounded-2xl border ${corridor.hot ? "bg-amber-50 border-amber-100" : "bg-gray-50 border-gray-100"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-black text-gray-700">{corridor.label}</p>
                    {corridor.hot && <span className="text-[9px] font-black bg-orange-100 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full uppercase">Hot Corridor 🔥</span>}
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-sm font-black text-gray-900">₹{circleRate}/sqft</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Circle Rate</p>
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900">{corridor.marketMult}×</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Mkt Multiplier</p>
                    </div>
                    <div>
                      <p className="text-sm font-black text-emerald-600">{corridor.trend}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Appreciation</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Comparables */}
          <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden">
            <button
              className="w-full flex items-center gap-3 px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 text-left"
              onClick={() => setExpandedSection(expandedSection === "comps" ? null : "comps")}
            >
              <div className="w-9 h-9 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
                {isLoadingComps ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <BarChart3 className="w-4 h-4 text-white" />}
              </div>
              <div className="flex-1">
                <h3 className="font-black text-gray-900 text-sm">Market Comparables (Comps)</h3>
                <p className="text-[11px] text-gray-400 font-medium">
                  {isLoadingComps ? "Loading from database…" : `${comps.length} comps · avg ₹${Math.round(avgCompPPSF)}/sqft`}
                  {compStats?.lastScraped && (
                    <span className="ml-2 text-indigo-400">· last scraped {new Date(compStats.lastScraped).toLocaleDateString("en-IN")}</span>
                  )}
                </p>
              </div>
              {expandedSection === "comps" ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {expandedSection === "comps" && (
              <div className="p-6 space-y-4">
                {/* Source info bar */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {compStats?.sources?.length ? (
                      compStats.sources.map(s => (
                        <span key={s} className="text-[9px] font-black bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {s === "99acres" ? "99acres" : s === "magicbricks" ? "MagicBricks" : s === "housing" ? "Housing.com" : s === "local_site" ? "Local Site" : s}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-gray-400 font-medium">Auto-loads from 99acres · MagicBricks · Housing.com · local sites</span>
                    )}
                  </div>
                  <button
                    onClick={refreshFromPortals}
                    disabled={isRefreshingPortals}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black transition-all disabled:opacity-60"
                  >
                    {isRefreshingPortals ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    {isRefreshingPortals ? "Scraping…" : "Refresh from Portals"}
                  </button>
                </div>

                {isLoadingComps ? (
                  <div className="flex items-center justify-center py-8 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    <span className="text-sm font-medium">Loading comps from database…</span>
                  </div>
                ) : (
                  <>
                    {comps.map((comp, idx) => (
                      <div key={comp.id} className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Comp #{idx + 1}</span>
                            {comp.source && comp.source !== "manual" && (
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                                comp.source === "99acres" ? "bg-orange-50 text-orange-600 border border-orange-100" :
                                comp.source === "magicbricks" ? "bg-purple-50 text-purple-600 border border-purple-100" :
                                comp.source === "housing" ? "bg-blue-50 text-blue-600 border border-blue-100" :
                                "bg-gray-100 text-gray-500"
                              }`}>{comp.source}</span>
                            )}
                            {comp.isVerified && <span className="text-[8px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded-full">✓ Verified</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            {comp.sourceUrl && (
                              <a href={comp.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-indigo-400 transition-colors">
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            <button
                              onClick={() => setComps(prev => prev.filter(c => c.id !== comp.id))}
                              className="text-red-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <input
                          placeholder="Description (e.g. Road-facing plot, Wardha Road, near CBSE school)"
                          value={comp.description}
                          onChange={e => setComps(prev => prev.map(c => c.id === comp.id ? { ...c, description: e.target.value } : c))}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
                        />

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase mb-1 block">Area (sqft)</label>
                            <input
                              type="number"
                              value={comp.area}
                              onChange={e => setComps(prev => prev.map(c => c.id === comp.id ? { ...c, area: Number(e.target.value) } : c))}
                              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase mb-1 block">₹/sqft</label>
                            <input
                              type="number"
                              value={comp.pricePerSqFt}
                              onChange={e => setComps(prev => prev.map(c => c.id === comp.id ? { ...c, pricePerSqFt: Number(e.target.value) } : c))}
                              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase mb-1 block">Adjustment %</label>
                            <input
                              type="number"
                              value={comp.adjustmentPct}
                              onChange={e => setComps(prev => prev.map(c => c.id === comp.id ? { ...c, adjustmentPct: Number(e.target.value) } : c))}
                              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-300"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-400 font-medium">
                            Adjusted: ₹{Math.round(comp.pricePerSqFt * (1 + comp.adjustmentPct / 100)).toLocaleString("en-IN")}/sqft
                          </span>
                          <span className="text-gray-400 font-medium">
                            Total: {formatCr(comp.pricePerSqFt * (1 + comp.adjustmentPct / 100) * comp.area)}
                          </span>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => setComps(prev => [...prev, newComp()])}
                      className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-indigo-200 rounded-2xl text-indigo-600 text-xs font-black hover:bg-indigo-50 transition-all"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Add Manual Comparable
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Adjustment Factors */}
          <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden">
            <button
              className="w-full flex items-center gap-3 px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-fuchsia-50 text-left"
              onClick={() => setExpandedSection(expandedSection === "factors" ? null : "factors")}
            >
              <div className="w-9 h-9 rounded-2xl bg-violet-600 flex items-center justify-center shadow-md shadow-violet-200">
                <Zap className="w-4 h-4 text-white fill-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-gray-900 text-sm">Plot-Specific Adjustments</h3>
                <p className="text-[11px] text-gray-400 font-medium">
                  {selectedFactors.length} factors selected · {totalAdjustmentPct > 0 ? "+" : ""}{totalAdjustmentPct}% net adjustment
                </p>
              </div>
              {expandedSection === "factors" ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {expandedSection === "factors" && (
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {["positive", "negative"].map(cat => (
                    <div key={cat} className="space-y-2">
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${cat === "positive" ? "text-emerald-600" : "text-red-500"}`}>
                        {cat === "positive" ? "✅ Value Drivers" : "⚠️ Value Detractors"}
                      </p>
                      {ADJUSTMENT_FACTORS.filter(f => f.category === cat).map(factor => {
                        const selected = selectedFactors.includes(factor.id);
                        return (
                          <button
                            key={factor.id}
                            onClick={() => toggleFactor(factor.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all text-xs ${
                              selected
                                ? cat === "positive"
                                  ? "bg-emerald-50 border-emerald-200 shadow-sm"
                                  : "bg-red-50 border-red-200 shadow-sm"
                                : "bg-gray-50 border-gray-100 hover:border-gray-200"
                            }`}
                          >
                            <span className="text-base shrink-0">{factor.icon}</span>
                            <span className={`flex-1 font-semibold leading-tight ${selected ? (cat === "positive" ? "text-emerald-800" : "text-red-800") : "text-gray-600"}`}>
                              {factor.label}
                            </span>
                            <span className={`font-black shrink-0 ${factor.impact > 0 ? "text-emerald-600" : "text-red-600"}`}>
                              {factor.impact > 0 ? "+" : ""}{factor.impact}%
                            </span>
                            {selected && (
                              <CheckCircle2 className={`w-4 h-4 shrink-0 ${cat === "positive" ? "text-emerald-500" : "text-red-400"}`} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {selectedFactors.length > 0 && (
                  <div className={`mt-5 p-4 rounded-2xl border ${totalAdjustmentPct >= 0 ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"}`}>
                    <div className="flex items-center justify-between text-sm font-black">
                      <span className="text-gray-700">Net Adjustment</span>
                      <span className={totalAdjustmentPct >= 0 ? "text-emerald-700" : "text-red-700"}>
                        {totalAdjustmentPct > 0 ? "+" : ""}{totalAdjustmentPct}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 bg-white rounded-full overflow-hidden border border-gray-100">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${totalAdjustmentPct >= 0 ? "bg-emerald-500" : "bg-red-400"}`}
                        style={{ width: `${Math.min(Math.abs(totalAdjustmentPct * 2), 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Estimate Button ─────────────────────────────────────────── */}
          <button
            onClick={generateNarrative}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-black text-base shadow-lg shadow-emerald-200 transition-all disabled:opacity-60"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating AI Analysis…
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Plot Valuation{showResult ? " (Refresh)" : ""}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* ── RIGHT SIDEBAR: Live Estimate ─────────────────────────────── */}
        <div className="space-y-5">

          {/* Live Estimate Card */}
          <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden sticky top-4">
            <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-600" />
                <h3 className="font-black text-gray-900 text-sm">Live Estimate</h3>
              </div>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5">Updates as you change inputs</p>
            </div>

            <div className="p-5 space-y-4">
              {/* Primary value */}
              <div className="text-center py-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Estimated Market Value</p>
                <p className="text-4xl font-black text-gray-900">{formatCr(estimatedValue)}</p>
                <p className="text-xs text-gray-400 font-medium mt-1">
                  Range: {formatCr(loValue)} – {formatCr(hiValue)}
                </p>
              </div>

              {/* Rate */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-2xl p-3 text-center border border-gray-100">
                  <p className="text-lg font-black text-gray-900">₹{Math.round(subjectPPSF).toLocaleString("en-IN")}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">/sqft Market</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-3 text-center border border-gray-100">
                  <p className="text-lg font-black text-gray-700">₹{circleRate.toLocaleString("en-IN")}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">/sqft Circle</p>
                </div>
              </div>

              {/* Uplift vs circle rate */}
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Market Premium vs Circle Rate</p>
                <UpliftGauge pct={marketVsCircle} />
              </div>

              {/* Signal */}
              <div className={`p-4 rounded-2xl border ${sig.border} ${sig.bg}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${sig.color} shrink-0`} />
                  <p className={`text-sm font-black ${sig.text}`}>{sig.label}</p>
                </div>
                <p className={`text-[11px] font-medium ${sig.text} opacity-80 leading-relaxed`}>{sig.desc}</p>
              </div>

              {/* Breakdown */}
              <div className="space-y-2">
                {[
                  { label: "Comp Avg ₹/sqft",       value: `₹${Math.round(avgCompPPSF).toLocaleString("en-IN")}` },
                  { label: "Adjustments",            value: `${totalAdjustmentPct > 0 ? "+" : ""}${totalAdjustmentPct}%` },
                  { label: "Subject ₹/sqft",         value: `₹${Math.round(subjectPPSF).toLocaleString("en-IN")}` },
                  { label: "Circle Rate Value",      value: formatCr(circleRateValue) },
                  { label: "Stamp Duty (est ~7%)",   value: formatCr(estimatedValue * 0.07) },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-medium">{row.label}</span>
                    <span className="font-black text-gray-900">{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <button
                  onClick={launchInStudio}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs shadow-md shadow-indigo-200 transition-all"
                >
                  <BrainCircuit className="w-4 h-4" />
                  Launch Content Campaign in Studio
                </button>
                <Link
                  href="/market-watch"
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-2xl font-bold text-xs transition-all"
                >
                  <TrendingUp className="w-4 h-4" />
                  Check Market Hunt Signals
                </Link>
              </div>
            </div>
          </div>

          {/* Nagpur Corridor Benchmark Table */}
          <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50">
              <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                Nagpur Corridor Benchmarks
              </h3>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] text-gray-400 font-black uppercase tracking-wider border-b border-gray-50">
                    <th className="text-left pb-2">Corridor</th>
                    <th className="text-right pb-2">Circle</th>
                    <th className="text-right pb-2">Mkt</th>
                    <th className="text-right pb-2">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {NAGPUR_CORRIDORS.filter(c => c.id !== "custom").map(c => (
                    <tr
                      key={c.id}
                      className={`cursor-pointer hover:bg-gray-50 transition-colors ${corridorId === c.id ? "bg-emerald-50" : ""}`}
                      onClick={() => setCorridorId(c.id)}
                    >
                      <td className="py-2 font-semibold text-gray-800 flex items-center gap-1 leading-none">
                        {c.label}
                        {c.hot && <span className="text-orange-400">🔥</span>}
                      </td>
                      <td className="py-2 text-right text-gray-500">₹{c.circleRate}</td>
                      <td className="py-2 text-right font-bold text-gray-900">₹{Math.round(c.circleRate * c.marketMult)}</td>
                      <td className={`py-2 text-right font-black ${c.trend.startsWith("+") ? "text-emerald-600" : "text-gray-400"}`}>{c.trend}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[9px] text-gray-300 mt-3 font-medium">* Indicative. Verify with 99acres/MagicBricks and local registry.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── AI Valuation Narrative ──────────────────────────────────────────── */}
      {showResult && aiNarrative && (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-black text-white text-base">AI Valuation Narrative</h3>
                <p className="text-[10px] text-indigo-300 font-medium">Gravity Claw · Nagpur Real Estate Intelligence</p>
              </div>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(aiNarrative);
                toast.success("Copied to clipboard!");
              }}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white text-xs font-bold transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy
            </button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <p className="text-gray-200 text-sm font-medium leading-relaxed whitespace-pre-wrap">{aiNarrative}</p>
          </div>

          {/* Summary strip */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Estimated Value", value: formatCr(estimatedValue),                          color: "text-emerald-300" },
              { label: "Rate / sqft",     value: `₹${Math.round(subjectPPSF).toLocaleString("en-IN")}`, color: "text-teal-300" },
              { label: "Signal",          value: signal,                                              color: sig.color === "bg-emerald-500" ? "text-emerald-300" : sig.color === "bg-amber-400" ? "text-amber-300" : "text-red-300" },
              { label: "Corridor",        value: corridor.label,                                      color: "text-indigo-300" },
            ].map(s => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3">
                <p className={`text-base font-black ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-white/40 font-bold uppercase mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={launchInStudio}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-900/30 hover:shadow-xl transition-all"
            >
              <BrainCircuit className="w-4 h-4" />
              Launch Content Campaign
            </button>
            <button
              onClick={generateNarrative}
              disabled={isGenerating}
              className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl font-bold text-sm transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </button>
            <Link
              href="/market-watch"
              className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl font-bold text-sm transition-all"
            >
              <TrendingUp className="w-4 h-4" />
              Check Market Signals
            </Link>
          </div>
        </div>
      )}

      {/* ── Methodology Note ──────────────────────────────────────────────── */}
      <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-amber-800 mb-2">Methodology & Disclaimer</p>
            <p className="text-xs text-amber-700 font-medium leading-relaxed">
              This estimator uses the <strong>Sales Comparison Approach</strong> — the standard method for land valuation in India. Comp prices are adjusted for plot-specific factors (road-facing, metro proximity, shape, encumbrances, etc.) and applied to your subject plot. The resulting value is an indicative range — not a registered valuation. Always verify with a certified valuer (CE/RICS), check the current Ready Reckoner Rate (RRR) for your division, obtain a clean Encumbrance Certificate (EC), and confirm RERA registration status before transacting.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Sales Comparison Method", "Circle Rate Benchmarked", "RERA-Aware", "Maharashtra RRR FY25-26"].map(t => (
                <span key={t} className="text-[10px] font-black bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
