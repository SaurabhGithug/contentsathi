"use client";

import { useState, useEffect } from "react";
import {
  Sparkles, ArrowRight, ArrowLeft, Loader2, CheckCircle2,
  Building2, Home, Landmark, Map, Layers,
  Users, TrendingUp, Globe, UserCheck,
  Shield, MapPin, IndianRupee, Star, Compass, Key,
  Zap, CalendarDays, Target
} from "lucide-react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────
interface WeekPlan {
  day: number;
  pillar: string;
  pillarLabel: string;
  topic: string;
  platform: string;
}

interface OnboardingWizardProps {
  onComplete: () => void;
}

// ── Pillar Colors ──────────────────────────────────────────────────────────
const PILLAR_COLORS: Record<string, string> = {
  trust: "bg-blue-50 text-blue-700 border-blue-100",
  authority: "bg-amber-50 text-amber-700 border-amber-100",
  proof: "bg-green-50 text-green-700 border-green-100",
  expertise: "bg-purple-50 text-purple-700 border-purple-100",
  relevance: "bg-pink-50 text-pink-700 border-pink-100",
  festival: "bg-orange-50 text-orange-700 border-orange-100",
  conversion: "bg-red-50 text-red-700 border-red-100",
};

// ── Options Data ──────────────────────────────────────────────────────────
const PROPERTY_TYPES = [
  { id: "residential_plots", icon: Map, label: "Residential Plots" },
  { id: "flats", icon: Building2, label: "Flats / Apartments" },
  { id: "commercial", icon: Landmark, label: "Commercial Property" },
  { id: "villas", icon: Home, label: "Villas / Bungalows" },
  { id: "mixed", icon: Layers, label: "Mixed (Multiple)" },
];

const CUSTOMER_TYPES = [
  { id: "first_time", icon: UserCheck, label: "First-time Homebuyers" },
  { id: "investors", icon: TrendingUp, label: "Investors" },
  { id: "nris", icon: Globe, label: "NRIs" },
  { id: "all", icon: Users, label: "All of the Above" },
];

const CONTENT_PURPOSES = [
  { id: "lead_generation", icon: Target, label: "Lead Generation" },
  { id: "brand_awareness", icon: Globe, label: "Brand Awareness" },
  { id: "education", icon: Layers, label: "Client Education" },
  { id: "sales", icon: TrendingUp, label: "Sales & Conversions" },
];

const USP_OPTIONS = [
  { id: "rera", icon: Shield, label: "RERA Approved" },
  { id: "near_highway", icon: MapPin, label: "Near Main Road / Highway" },
  { id: "affordable", icon: IndianRupee, label: "Affordable Pricing" },
  { id: "premium", icon: Star, label: "Premium Location" },
  { id: "vastu", icon: Compass, label: "Vastu Compliant" },
  { id: "ready_possession", icon: Key, label: "Ready Possession" },
  { id: "metro_connectivity", icon: Zap, label: "Metro Connectivity" },
];

const MARKETING_STAGES = [
  { id: "pre_launch", label: "Pre-Launch (Generating Buzz)" },
  { id: "launch", label: "Launch (Closing Early Deals)" },
  { id: "construction", label: "Construction (Maintaining Interest)" },
  { id: "ready", label: "Ready (Final Inventory Sales)" },
];

const MARKETING_GAPS = [
  { id: "leads_quality", label: "Getting leads, but low quality" },
  { id: "low_reach", label: "Great product, but no one knows" },
  { id: "no_trust", label: "People inquire, but don't trust enough to visit" },
  { id: "content_fatigue", label: "Need fresh angles for old stocks" },
];

// ── Loading Messages ──────────────────────────────────────────────────────
const LOADING_MESSAGES = [
  "Understanding your business DNA...",
  "Analyzing your target audience...",
  "Building your content strategy...",
  "Generating your first week plan...",
  "Almost there — finalizing your Sathi profile...",
];

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);

  // ── Step 2: 4 Questions ─────────────────────────────────────────────────
  const [propertyType, setPropertyType] = useState("");
  const [city, setCity] = useState("");
  const [microMarket, setMicroMarket] = useState("");
  const [marketingStage, setMarketingStage] = useState("");
  const [marketingGap, setMarketingGap] = useState("");
  const [customerType, setCustomerType] = useState("");
  const [contentPurpose, setContentPurpose] = useState("");
  const [usps, setUsps] = useState<string[]>([]);

  // ── Step 3: Loading State ───────────────────────────────────────────────
  const [brandProfileLoading, setBrandProfileLoading] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  // ── Step 4: Week Plan ───────────────────────────────────────────────────
  const [weekPlan, setWeekPlan] = useState<WeekPlan[]>([]);
  const [generating, setGenerating] = useState(false);

  // Cycle loading messages
  useEffect(() => {
    if (!brandProfileLoading) return;
    const interval = setInterval(() => {
      setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [brandProfileLoading]);

  const toggleUsp = (id: string) => {
    setUsps((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
    );
  };

  const canProceedStep2 = propertyType && city.trim().length >= 2 && customerType && contentPurpose && usps.length > 0;
  const canProceedStep3 = marketingStage && marketingGap && microMarket.trim().length >= 2;

  // ── Submit onboarding + generate brand profile ──────────────────────────
  async function submitOnboarding() {
    setBrandProfileLoading(true);
    setStep(4);

    try {
      const res = await fetch("/api/user/complete-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyType,
          city,
          microMarket,
          marketingStage,
          marketingGap,
          customerType,
          contentPurpose,
          usps,
        }),
      });

      const data = await res.json();
      if (data.weekPlan && data.weekPlan.length > 0) {
        setWeekPlan(data.weekPlan);
      } else {
        // Fallback week plan if API doesn't return one
        setWeekPlan(getDefaultWeekPlan(city, propertyType));
      }
    } catch (err) {
      console.error("[ONBOARDING_ERROR]", err);
      setWeekPlan(getDefaultWeekPlan(city, propertyType));
    } finally {
      setBrandProfileLoading(false);
      setStep(5);
    }
  }

  // ── Generate first post ─────────────────────────────────────────────────
  async function generateFirstPost(topic: string) {
    setGenerating(true);
    // Navigate to studio with topic pre-filled as a goal
    window.location.href = `/studio?goal=${encodeURIComponent(topic)}`;
  }

  function getDefaultWeekPlan(loc: string, propType: string): WeekPlan[] {
    const cityName = loc || "your city";
    const propLabel = PROPERTY_TYPES.find((p) => p.id === propType)?.label || "property";
    return [
      { day: 1, pillar: "trust", pillarLabel: "Trust Building", topic: `Why our ${propLabel.toLowerCase()} are the right investment right now`, platform: "Instagram" },
      { day: 2, pillar: "expertise", pillarLabel: "Expert Tip", topic: `The ONE thing most buyers miss when buying ${propLabel.toLowerCase()} in ${cityName}`, platform: "LinkedIn" },
      { day: 3, pillar: "proof", pillarLabel: "Social Proof", topic: `Customer story — "From rented house to own ${propLabel.toLowerCase()} in 18 months"`, platform: "Instagram" },
      { day: 4, pillar: "authority", pillarLabel: "Authority", topic: `5 questions you MUST ask before buying any ${propLabel.toLowerCase()}`, platform: "WhatsApp" },
      { day: 5, pillar: "relevance", pillarLabel: "Local Expert", topic: `What makes ${cityName} the best investment right now`, platform: "LinkedIn" },
      { day: 6, pillar: "festival", pillarLabel: "Timely", topic: `Weekend special — site visit offer for ${cityName}`, platform: "Instagram" },
      { day: 7, pillar: "conversion", pillarLabel: "Direct CTA", topic: `Limited ${propLabel.toLowerCase()} available — book your site visit today`, platform: "WhatsApp" },
    ];
  }

  return (
    <div className="fixed inset-0 z-50 bg-indigo-50/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-500">
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-200/50 w-full max-w-2xl overflow-hidden border border-white relative">

        {/* Progress Bar */}
        <div className="h-2 bg-gray-100 w-full">
          <div
            className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-700 ease-out"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        <div className="p-8 md:p-12">

          {/* ═══════════════════════ STEP 1: Welcome ═══════════════════════ */}
          {step === 1 && (
            <div className="text-center space-y-6 animate-in slide-in-from-right-8 duration-500">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-100">
                <Sparkles className="w-10 h-10 text-indigo-600" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight">
                Welcome! Let me understand<br />your business 🙏
              </h1>
              <p className="text-gray-500 font-medium max-w-md mx-auto leading-relaxed">
                Answer 4 quick questions so I can generate content that
                <strong className="text-gray-700"> actually sounds like you</strong>.
                Takes about 30 seconds.
              </p>
              <div className="pt-6 flex flex-col items-center gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="w-full md:w-auto px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-black transition-all shadow-xl shadow-indigo-200 text-lg flex items-center justify-center gap-2 group"
                >
                  Let&apos;s Go <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={onComplete} className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">
                  Skip setup — I&apos;ll do this later
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-500 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-1">Let&apos;s start with the basics</h2>
                <p className="text-sm text-gray-400 font-medium">Tell us about your business location and property type.</p>
              </div>

              {/* Q1: Property Type */}
              <div>
                <label className="font-bold text-sm text-gray-700 mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">1</span>
                  What do you sell?
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {PROPERTY_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setPropertyType(type.id)}
                      className={`p-3 rounded-xl border-2 flex items-center gap-2 transition-all text-sm font-bold ${
                        propertyType === type.id
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-gray-100 hover:border-indigo-100 text-gray-500"
                      }`}
                    >
                      <type.icon className={`w-4 h-4 shrink-0 ${propertyType === type.id ? "text-indigo-600" : "text-gray-300"}`} />
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q2: City */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-sm text-gray-700 mb-2 flex items-center gap-2">
                       City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g., Nagpur"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium text-sm"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-sm text-gray-700 mb-2 flex items-center gap-2">
                       Micro-market / Locality
                    </label>
                    <input
                      type="text"
                      value={microMarket}
                      onChange={(e) => setMicroMarket(e.target.value)}
                      placeholder="e.g., Wardha Road"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium text-sm"
                    />
                  </div>
                </div>

              {/* Q3: Customer Type */}
              <div>
                <label className="font-bold text-sm text-gray-700 mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">3</span>
                  Who is your main customer?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CUSTOMER_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setCustomerType(type.id)}
                      className={`p-3 rounded-xl border-2 flex items-center gap-2 transition-all text-sm font-bold ${
                        customerType === type.id
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-gray-100 hover:border-indigo-100 text-gray-500"
                      }`}
                    >
                      <type.icon className={`w-4 h-4 shrink-0 ${customerType === type.id ? "text-indigo-600" : "text-gray-300"}`} />
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

                <div className="flex justify-between items-center pt-2">
                <button onClick={() => setStep(1)} className="p-3 text-gray-400 hover:bg-gray-50 rounded-xl transition-all">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                  disabled={!(propertyType && city.trim().length >= 2 && customerType)}
                  onClick={() => setStep(3)}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 disabled:opacity-40 text-white rounded-xl font-bold flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-indigo-200"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════ STEP 3: Strategy Questions ══════════════════════ */}
          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-500 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-1">Market Position</h2>
                <p className="text-sm text-gray-400 font-medium">Where is your project today and what&apos;s your biggest challenge?</p>
              </div>

              {/* Marketing Stage */}
              <div>
                <label className="font-bold text-sm text-gray-700 mb-2">Current Project Stage</label>
                <div className="grid grid-cols-1 gap-2">
                  {MARKETING_STAGES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setMarketingStage(s.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all text-sm font-bold ${
                        marketingStage === s.id
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-gray-100 hover:border-indigo-100 text-gray-500"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Marketing Gap */}
              <div>
                <label className="font-bold text-sm text-gray-700 mb-2">Your Biggest Marketing Gap</label>
                <div className="grid grid-cols-1 gap-2">
                  {MARKETING_GAPS.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setMarketingGap(g.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all text-sm font-bold ${
                        marketingGap === g.id
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-gray-100 hover:border-indigo-100 text-gray-500"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q4: Content Purpose */}
              <div>
                <label className="font-bold text-sm text-gray-700 mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">4</span>
                  What is the main purpose of your content?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CONTENT_PURPOSES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setContentPurpose(type.id)}
                      className={`p-3 rounded-xl border-2 flex items-center gap-2 transition-all text-sm font-bold ${
                        contentPurpose === type.id
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-gray-100 hover:border-indigo-100 text-gray-500"
                      }`}
                    >
                      <type.icon className={`w-4 h-4 shrink-0 ${contentPurpose === type.id ? "text-indigo-600" : "text-gray-300"}`} />
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q5: USPs */}
              <div>
                <label className="font-bold text-sm text-gray-700 mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">5</span>
                  What makes your property special? <span className="text-gray-400 font-medium text-xs">(select all)</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {USP_OPTIONS.map((usp) => (
                    <button
                      key={usp.id}
                      onClick={() => toggleUsp(usp.id)}
                      className={`p-3 rounded-xl border-2 flex items-center gap-2 transition-all text-sm font-bold ${
                        usps.includes(usp.id)
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-gray-100 hover:border-indigo-100 text-gray-500"
                      }`}
                    >
                      <usp.icon className={`w-4 h-4 shrink-0 ${usps.includes(usp.id) ? "text-indigo-600" : "text-gray-300"}`} />
                      {usp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center pt-2">
                <button onClick={() => setStep(2)} className="p-3 text-gray-400 hover:bg-gray-50 rounded-xl transition-all">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                  disabled={!(contentPurpose && usps.length > 0)}
                  onClick={submitOnboarding}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 disabled:opacity-40 text-white rounded-xl font-bold flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-indigo-200 disabled:hover:shadow-none"
                >
                  Build My Profile <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ═══════════ STEP 4: "Your Sathi is learning..." ═══════════ */}
          {step === 4 && (
            <div className="text-center space-y-8 py-8 animate-in fade-in duration-500">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-30" />
                <div className="relative w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-2xl shadow-indigo-200">
                  <Sparkles className="w-12 h-12 text-white animate-pulse" />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-3">
                  Your AI Sathi is learning about you...
                </h2>
                <p className="text-gray-500 font-medium max-w-md mx-auto text-sm">
                  This takes about 15 seconds and makes every future post
                  <strong className="text-indigo-600"> 10x more relevant</strong>.
                </p>
              </div>

              <div className="h-12 flex items-center justify-center">
                <p className="text-indigo-600 font-bold text-sm animate-pulse">
                  {LOADING_MESSAGES[loadingMsgIndex]}
                </p>
              </div>

              <div className="flex justify-center gap-2">
                {LOADING_MESSAGES.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-500 ${
                      i <= loadingMsgIndex ? "bg-indigo-600 scale-110" : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ═══════════ STEP 5: First Week Preview ═══════════ */}
          {step === 5 && (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-100 mb-4">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-xs font-bold text-green-700">Profile Ready</span>
                </div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
                  Your first week of content is planned! 🎉
                </h2>
                <p className="text-sm text-gray-400 font-medium">
                  7 &ldquo;Why Buy From Me&rdquo; posts — the most powerful sales strategy in real estate.
                </p>
              </div>

              {/* Week Plan Cards */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                {weekPlan.map((day) => (
                  <div
                    key={day.day}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all hover:shadow-md ${
                      day.day === 1 ? "border-indigo-200 bg-indigo-50/50 ring-1 ring-indigo-100" : "border-gray-100 bg-white"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex flex-col items-center justify-center shrink-0">
                      <span className="text-[8px] font-bold uppercase leading-none">Day</span>
                      <span className="text-sm font-black leading-none">{day.day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${PILLAR_COLORS[day.pillar] || "bg-gray-50 text-gray-600 border-gray-100"}`}>
                          {day.pillarLabel}
                        </span>
                        <span className="text-[10px] font-bold text-gray-300">{day.platform}</span>
                      </div>
                      <p className="text-sm font-bold text-gray-800 truncate">{day.topic}</p>
                    </div>
                    {day.day === 1 && (
                      <button
                        onClick={() => generateFirstPost(day.topic)}
                        disabled={generating}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shrink-0 transition-all shadow-md shadow-indigo-100 disabled:opacity-60"
                      >
                        {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 fill-current" />}
                        Generate
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-col items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    if (weekPlan.length > 0) {
                      generateFirstPost(weekPlan[0].topic);
                    }
                  }}
                  disabled={generating}
                  className="w-full px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-200 group disabled:opacity-60"
                >
                  {generating ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-2xl" />
                      Generate Day 1 Post <Sparkles className="w-5 h-5" />
                    </>
                  )}
                </button>

                <button
                  onClick={onComplete}
                  className="text-sm font-bold text-gray-400 hover:text-gray-600 flex items-center gap-2"
                >
                  <CalendarDays className="w-4 h-4" />
                  Go to Dashboard — I&apos;ll generate later
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
