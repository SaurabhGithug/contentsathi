"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft, CheckCircle2, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ── Type definitions ──────────────────────────────────────────────────────────
interface FormData {
  businessName: string;
  city: string; // City & Micro-market
  customers: string;
  businessType: string;
  businessSubType: string;
  productType?: string; // e.g. Plots, Flats, Villas, Commercial
  projectStage?: string; // e.g. Pre-launch, Ongoing, Ready to move
  brandDescription: string;
  brandVoice: string;
  languages: string[];
  platforms: string[];
  firstTopic: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const TOTAL_STEPS = 5;

const STEP_LABELS = ["Info", "Business", "Voice", "Connect", "Generate"];

const BUSINESS_TYPES = [
  { id: "real-estate",   emoji: "🏠", label: "Real Estate" },
  { id: "fitness",       emoji: "💪", label: "Fitness / Coaching" },
  { id: "food",          emoji: "🍕", label: "Food / Restaurant" },
  { id: "tech",          emoji: "💻", label: "Tech / Startup" },
  { id: "beauty",        emoji: "💄", label: "Beauty / Salon" },
  { id: "education",     emoji: "📚", label: "Education" },
];

const RE_SUB_TYPES = [
  { id: "developer",  emoji: "🏗️", label: "Developer / Builder" },
  { id: "agent",      emoji: "🏢", label: "Agent / Broker" },
  { id: "land",       emoji: "🌿", label: "Land / Plots" },
  { id: "society",    emoji: "🏘️", label: "Housing Society" },
];

const TOPIC_MAP: Record<string, string> = {
  "real-estate:developer": "Why buying a RERA-approved apartment from a premium developer is the smartest investment in 2026",
  "real-estate:agent":     "5 things every first-time homebuyer must check before signing the agreement",
  "real-estate:land":      "Why investing in Nagpur plots is the smartest decision in 2026",
  "real-estate:society":   "Why our premium residential society is the most preferred in Nagpur",
  "fitness":               "3 morning habits that will transform your body in 30 days",
  "food":                  "Why our hand-crafted recipes make every meal unforgettable",
  "tech":                  "How AI is helping Indian startups 10x their productivity in 2026",
  "beauty":                "5 skincare secrets that every Indian woman should know",
  "education":             "Why coaching from experts changes students' lives forever",
};

// ────────────────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    businessName: "",
    city: "",
    customers: "",
    businessType: "",
    businessSubType: "",
    brandDescription: "",
    brandVoice: "Professional & Formal",
    languages: [],
    platforms: [],
    firstTopic: "",
  });

  const nextStep = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  const handleComplete = async () => {
    try {
      await fetch("/api/content-brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: formData.businessName,
          brandDescription: formData.brandDescription || `${formData.city} - ${formData.productType} - ${formData.projectStage}`,
          industry: formData.businessType,
          audienceDescription: formData.customers,
          primaryLanguage: formData.languages[0] || "English",
          secondaryLanguage: formData.languages[1] || "",
          tone: formData.brandVoice,
        }),
      });
      await fetch("/api/user/complete-onboarding", { method: "POST" }).catch(() => {});
    } catch (e) {
      console.error(e);
    }
    router.push("/dashboard");
  };

  const toggleArray = (field: "languages" | "platforms", value: string) => {
    setFormData((prev) => {
      const arr = prev[field];
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter((i) => i !== value) : [...arr, value],
      };
    });
  };

  // Auto-fill topic when business type changes
  const setBusinessType = (id: string) => {
    setFormData((prev) => {
      const topicKey = `${id}${prev.businessSubType ? ":" + prev.businessSubType : ""}`;
      return {
        ...prev,
        businessType: id,
        businessSubType: "",
        firstTopic: TOPIC_MAP[id] || prev.firstTopic,
      };
    });
  };

  const setSubType = (id: string) => {
    setFormData((prev) => {
      const topicKey = `${prev.businessType}:${id}`;
      return {
        ...prev,
        businessSubType: id,
        firstTopic: TOPIC_MAP[topicKey] || prev.firstTopic,
      };
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center py-10 px-5">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 justify-center mb-10">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="text-xl font-black text-gray-900 tracking-tighter">Contentsathi</span>
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Welcome to your Content HQ</h1>
          <p className="text-gray-500 text-sm">Let&apos;s set up your Content Brain in 5 quick steps.</p>
        </div>

        {/* ── Progress Steps ──────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-10 relative">
          {/* Track line */}
          <div className="absolute left-0 top-5 w-full h-0.5 bg-gray-200 -z-10 rounded-full" />
          <div
            className="absolute left-0 top-5 h-0.5 bg-indigo-600 -z-10 rounded-full transition-all duration-500"
            style={{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
          />
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
            <div key={s} className="flex flex-col items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  step > s
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : step === s
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 ring-4 ring-indigo-100"
                    : "bg-white text-gray-400 border-2 border-gray-200"
                }`}
              >
                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              <span className={`text-[11px] font-semibold ${step >= s ? "text-indigo-600" : "text-gray-400"}`}>
                {STEP_LABELS[s - 1]}
              </span>
            </div>
          ))}
        </div>

        {/* ── Content Card ────────────────────────────────────────────── */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[380px] flex flex-col">

          {/* ── STEP 1: Basic Info ─────────────────────────────────────── */}
          {step === 1 && (
            <div className="flex-1 space-y-5">
              <div>
                <h2 className="text-xl font-black text-gray-900 mb-1">1. Basic Info</h2>
                <p className="text-gray-500 text-sm">Tell us about your business so Contentsathi can tailor every post.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="e.g. Apex Realtors Nagpur"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City & Micro-market</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Nagpur & Wardha Road corridor"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Who are your typical customers?</label>
                <input
                  type="text"
                  value={formData.customers}
                  onChange={(e) => setFormData({ ...formData, customers: e.target.value })}
                  placeholder="e.g. First-time homebuyers, NRI investors, IT professionals"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                />
              </div>

            </div>
          )}

          {/* ── STEP 2: Business Type ───────────────────────────────────── */}
          {step === 2 && (
            <div className="flex-1 space-y-5">
              <div>
                <h2 className="text-xl font-black text-gray-900 mb-1">2. Business Type</h2>
                <p className="text-gray-500 text-sm">This helps Contentsathi pick the best templates and prompts for you.</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {BUSINESS_TYPES.map((bt) => (
                  <button
                    key={bt.id}
                    onClick={() => setBusinessType(bt.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-semibold ${
                      formData.businessType === bt.id
                        ? "border-indigo-600 bg-indigo-50 text-indigo-800"
                        : "border-gray-100 hover:border-indigo-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-2xl">{bt.emoji}</span>
                    {bt.label}
                  </button>
                ))}
              </div>

              {formData.businessType === "real-estate" && (
                <div className="space-y-5 border-t border-gray-100 pt-5">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-3">What type of real estate?</p>
                    <div className="grid grid-cols-2 gap-3">
                      {RE_SUB_TYPES.map((st) => (
                        <button
                          key={st.id}
                          onClick={() => setSubType(st.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-sm font-semibold ${
                            formData.businessSubType === st.id
                              ? "border-violet-600 bg-violet-50 text-violet-800"
                              : "border-gray-100 hover:border-violet-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <span className="text-xl">{st.emoji}</span>
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Product Type</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {["Plots", "Flats/Apartments", "Villas", "Commercial"].map((pt) => (
                        <button
                          key={pt}
                          onClick={() => setFormData({ ...formData, productType: pt })}
                          className={`p-3 rounded-xl border-2 transition-all text-xs font-semibold ${
                            formData.productType === pt
                              ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                              : "border-gray-100 hover:border-emerald-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {pt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Marketing Stage (Project Phase)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "pre-launch", label: "Pre-Launch", desc: "Build Hype" },
                        { id: "ongoing", label: "Ongoing", desc: "Show Progress" },
                        { id: "ready", label: "Ready to Move", desc: "Drive Urgency" }
                      ].map((stage) => (
                        <button
                          key={stage.id}
                          onClick={() => setFormData({ ...formData, projectStage: stage.id })}
                          className={`p-3 flex flex-col items-center justify-center rounded-xl border-2 transition-all text-xs font-semibold ${
                            formData.projectStage === stage.id
                              ? "border-indigo-600 bg-indigo-50 text-indigo-800"
                              : "border-gray-100 hover:border-indigo-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <span className="block mb-1">{stage.label}</span>
                          <span className="text-[10px] font-normal opacity-70">{stage.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Brand Voice ─────────────────────────────────────── */}
          {step === 3 && (
            <div className="flex-1 space-y-6">
              <div>
                <h2 className="text-xl font-black text-gray-900 mb-1">3. Brand Voice</h2>
                <p className="text-gray-500 text-sm">How do you want to sound? Contentsathi will write every post in this voice.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Tone</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    "Professional & Formal",
                    "Friendly & Casual",
                    "Authoritative",
                    "Humorous / Memey",
                    "Hyper-local & Marathi/Hindi Native",
                  ].map((voice) => (
                    <button
                      key={voice}
                      onClick={() => setFormData({ ...formData, brandVoice: voice })}
                      className={`p-3 rounded-xl border-2 text-left transition-all text-sm ${
                        formData.brandVoice === voice
                          ? "border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold"
                          : "border-gray-100 hover:border-indigo-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {voice}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tell us about your business{" "}
                  <span className="text-gray-400 font-normal">(2-3 sentences)</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.brandDescription}
                  onChange={(e) => setFormData({ ...formData, brandDescription: e.target.value })}
                  placeholder="e.g. We sell premium residential plots near Nagpur airport with RERA approval. Our customers are IT professionals and NRI investors looking for safe, appreciating assets."
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all resize-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Languages</label>
                <div className="flex flex-wrap gap-2">
                  {["English", "Hindi", "Marathi", "Hinglish"].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => toggleArray("languages", lang)}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                        formData.languages.includes(lang)
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50 bg-white"
                      }`}
                    >
                      {formData.languages.includes(lang) && "✓ "}
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 4: Connect Accounts ────────────────────────────────── */}
          {step === 4 && (
            <div className="flex-1 space-y-5">
              <div>
                <h2 className="text-xl font-black text-gray-900 mb-1">4. Connect Your Accounts</h2>
                <p className="text-gray-500 text-sm">Connect at least one platform so you can publish with one click. You can skip and do this later in Settings.</p>
              </div>

              <div className="space-y-3">
                {[
                  { name: "Instagram", icon: "📷", color: "from-pink-500 to-rose-500" },
                  { name: "LinkedIn", icon: "💼", color: "from-blue-600 to-blue-700" },
                  { name: "WhatsApp Business", icon: "💬", color: "from-emerald-500 to-green-600" },
                  { name: "YouTube", icon: "▶️", color: "from-red-500 to-red-600" },
                ].map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{p.icon}</span>
                      <span className="font-semibold text-sm text-gray-800">{p.name}</span>
                    </div>
                    <a
                      href={`/api/auth/${p.name.toLowerCase().split(" ")[0]}/connect`}
                      onClick={(e) => {
                        e.preventDefault();
                        // Open OAuth in popup
                        window.open(
                          `/api/auth/${p.name.toLowerCase().split(" ")[0]}/connect`,
                          `connect_${p.name}`,
                          "width=600,height=700,scrollbars=yes"
                        );
                      }}
                      className={`px-4 py-2 bg-gradient-to-r ${p.color} text-white text-xs font-bold rounded-full shadow-sm hover:shadow-md transition-all`}
                    >
                      Connect →
                    </a>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-400 text-center">
                All connections use official OAuth. We never store your password.
              </p>
            </div>
          )}

          {/* ── STEP 5: Generate First Post ─────────────────────────────── */}
          {step === 5 && (
            <div className="flex-1 space-y-5">
              <div>
                <h2 className="text-xl font-black text-gray-900 mb-1">5. Generate Your First Post</h2>
                <p className="text-gray-500 text-sm">Here&apos;s a pre-filled topic based on your business. Edit it or use it as-is!</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Topic / Idea</label>
                <textarea
                  rows={4}
                  value={formData.firstTopic}
                  onChange={(e) => setFormData({ ...formData, firstTopic: e.target.value })}
                  placeholder="e.g. Why Nagpur plots are the smartest investment in 2026"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all resize-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {["Instagram", "LinkedIn", "WhatsApp", "YouTube Shorts", "X (Twitter)", "Facebook"].map((plat) => (
                    <button
                      key={plat}
                      onClick={() => toggleArray("platforms", plat)}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                        formData.platforms.includes(plat)
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50 bg-white"
                      }`}
                    >
                      {formData.platforms.includes(plat) && "✓ "}
                      {plat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="text-xs text-indigo-700 font-semibold">
                  🚀 Click &quot;Go to Dashboard&quot; below to save your settings and jump straight to the Content Generator where your first campaign will be ready to generate!
                </p>
              </div>
            </div>
          )}

          {/* ── Footer actions ──────────────────────────────────────────── */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all text-sm ${
                step === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="flex items-center gap-3">
              {step < TOTAL_STEPS && (
                <button
                  onClick={nextStep}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Skip for now
                </button>
              )}
              {step < TOTAL_STEPS ? (
                <button
                  onClick={nextStep}
                  className="flex items-center gap-2 px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-200 text-sm"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  className="flex items-center gap-2 px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-200 text-sm"
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
