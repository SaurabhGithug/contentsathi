"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Zap,
  Globe,
  Home,
  Send,
  CalendarDays,
  Youtube,
  Brain,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  Star,
} from "lucide-react";
import { useSession } from "next-auth/react";

// ── Feature cards data ────────────────────────────────────────────────────────
const features = [
  {
    icon: Globe,
    title: "Multilingual AI",
    desc: "Writes natural content in 10 native Indian languages — not just translations. Sounds like it was written by a native speaker.",
    color: "indigo",
  },
  {
    icon: Home,
    title: "Real Estate Templates",
    desc: "RERA-compliant posts, project walkthroughs, investor ROI posts, plot highlight reels. Trained on Indian real estate.",
    color: "violet",
  },
  {
    icon: Send,
    title: "Direct Publishing",
    desc: "One-click post to Instagram, LinkedIn, WhatsApp Business, YouTube Shorts, X, and Facebook via official APIs.",
    color: "blue",
  },
  {
    icon: CalendarDays,
    title: "Content Calendar",
    desc: "Plan your entire month visually. Drag-and-drop scheduling with Indian festival reminders built in.",
    color: "sky",
  },
  {
    icon: Youtube,
    title: "YouTube Research",
    desc: "Auto-find the top videos on your topic, extract transcripts, and repurpose insights into original posts.",
    color: "red",
  },
  {
    icon: Brain,
    title: "Content Brain",
    desc: "AI permanently remembers your brand voice, CTAs, local area specialties, and target audience. Set once, used forever.",
    color: "emerald",
  },
];

const colorMap: Record<string, string> = {
  indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  violet: "bg-violet-50 text-violet-600 border-violet-100",
  blue:   "bg-blue-50 text-blue-600 border-blue-100",
  sky:    "bg-sky-50 text-sky-600 border-sky-100",
  red:    "bg-red-50 text-red-600 border-red-100",
  emerald:"bg-emerald-50 text-emerald-600 border-emerald-100",
};

// ── Testimonials ──────────────────────────────────────────────────────────────
const testimonials = [
  {
    name: "Dr. Anjali Deshmukh",
    role: "Dental Surgeon, Pune",
    text: "I used to spend 3 hours making posts. Now Contentsathi does it in 2 minutes and my Marathi posts get 3x more engagement. My patients now ask who manages my social media!",
    stars: 5,
  },
  {
    name: "Vikram Patil",
    role: "Real Estate Broker, Nashik",
    text: "The Hinglish content it writes sounds exactly like me. My buyers think I write everything myself. It even uses the same emojis and local expressions I use.",
    stars: 5,
  },
  {
    name: "Sneha Kadam",
    role: "Plot Developer, Wardha",
    text: "The real estate templates are gold. RERA posts, walkthrough scripts, investor posts — all ready in seconds. It knows local areas better than I do!",
    stars: 5,
  },
];

// ── Plans preview ─────────────────────────────────────────────────────────────
const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "/month",
    tagline: "Forever free",
    features: ["30 posts/month", "2 platforms", "English, Hindi, Marathi", "Basic templates"],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Starter",
    price: "₹799",
    period: "/month",
    tagline: "Most popular",
    features: ["500 credits/month", "All 7 platforms", "All 10 languages", "Real estate templates", "Content Calendar"],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Creator",
    price: "₹1,999",
    period: "/month",
    tagline: "Everything unlimited",
    features: ["2,000 credits/month", "All platforms", "All 10 languages", "Priority AI", "API Access", "White-label"],
    cta: "Go Creator",
    highlight: false,
  },
];

// ── FAQ data ──────────────────────────────────────────────────────────────────
const faqs = [
  {
    q: "How does Contentsathi differ from Make.com or n8n?",
    a: "Make.com and n8n are generic workflow builders — you'd spend weeks building and maintaining a content pipeline. Contentsathi is purpose-built for Indian content creators: it has a ContentBrain that learns your brand voice, knows Nagpur localities, tracks the Indian festival calendar, and writes in Marathi the way real Nagpurkars speak. No pipelines to maintain, no API headaches — just click Generate.",
  },
  {
    q: "Does it really write in Marathi and Hindi?",
    a: "Yes — not just translated English. Contentsathi supports 10 Indian languages. It writes natural conversational Marathi, Hindi, Telugu, Tamil, Bengali, and more, as spoken locally, plus modern Hinglish. It uses expressions, idioms, and even emojis that local audiences recognise as authentic.",
  },
  {
    q: "Which social media platforms are supported?",
    a: "Instagram, LinkedIn, X (Twitter), Facebook, YouTube Shorts, and WhatsApp Business. Direct publishing happens via official APIs — your posts go live with one click, no copy-pasting.",
  },
  {
    q: "Is my data safe?",
    a: "Yes. All data is stored on Supabase (Mumbai region). OAuth tokens are encrypted with AES-256. We never sell, share, or train on your data. You can delete your account and all data at any time.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. No contracts, no lock-in. Cancel from account settings anytime. Your free plan stays free forever — 30 posts per month, no credit card required.",
  },
];

// ── Steps ─────────────────────────────────────────────────────────────────────
const steps = [
  {
    num: "01",
    title: "Enter your topic or paste any URL",
    desc: "Type a topic like 'Why Nagpur plots are the best investment in 2026' or paste a YouTube link, article, or WhatsApp forward.",
  },
  {
    num: "02",
    title: "AI generates posts for all platforms in your language",
    desc: "Contentsathi uses your ContentBrain to write Instagram captions, LinkedIn articles, WhatsApp broadcasts, and YouTube scripts — simultaneously in up to 10 Indian languages.",
  },
  {
    num: "03",
    title: "Review, schedule, and publish with one click",
    desc: "Edit any post inline, score it with our AI quality checker, drag it onto the calendar, and hit Publish. Done.",
  },
];

export default function LandingPage() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="bg-white text-gray-900 font-sans min-h-screen">
      {/* ═══════════════════════════════════════════════════════════╗
          SECTION 1 — NAVBAR
      ╚═══════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-200">
              <Zap className="w-4.5 h-4.5 text-white fill-white" style={{ width: "1.1rem", height: "1.1rem" }} />
            </div>
            <span className="text-lg font-black text-gray-900 tracking-tighter">Contentsathi <span className="text-gray-400 font-medium text-xs ml-2 hidden sm:inline-block">Sathi (साथी) = Partner. Not a tool. A partner.</span></span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600 font-medium">
            <Link href="#features" className="hover:text-gray-900 transition-colors">Features</Link>
            <Link href="#how" className="hover:text-gray-900 transition-colors">How It Works</Link>
            <Link href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</Link>
            <Link href="#faq" className="hover:text-gray-900 transition-colors">FAQ</Link>
          </nav>

          {/* CTA buttons */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold text-sm transition-all shadow-md"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors">
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold text-sm transition-all shadow-md shadow-indigo-200"
                >
                  Get Started — Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-5 py-4 space-y-3">
            <Link href="#features" className="block text-sm font-medium text-gray-700" onClick={() => setMobileMenuOpen(false)}>Features</Link>
            <Link href="#how" className="block text-sm font-medium text-gray-700" onClick={() => setMobileMenuOpen(false)}>How It Works</Link>
            <Link href="#pricing" className="block text-sm font-medium text-gray-700" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
            <Link href="#faq" className="block text-sm font-medium text-gray-700" onClick={() => setMobileMenuOpen(false)}>FAQ</Link>
            <div className="pt-2 border-t border-gray-100 flex flex-col gap-3">
              {session ? (
                <Link href="/dashboard" className="text-center py-3 bg-indigo-600 text-white rounded-full font-bold text-sm">
                  Go to Dashboard →
                </Link>
              ) : (
                <>
                  <Link href="/auth/login" className="text-center py-3 border border-gray-200 rounded-full font-semibold text-sm text-gray-700">
                    Login
                  </Link>
                  <Link href="/auth/register" className="text-center py-3 bg-indigo-600 text-white rounded-full font-bold text-sm">
                    Get Started — Free
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ═══════════════════════════════════════════════════════════╗
          SECTION 2 — HERO
      ╚═══════════════════════════════════════════════════════════ */}
      <section className="relative bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-24 pb-28 px-5 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold tracking-wide mb-6">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            India&apos;s AI Content Partner for Real Estate Solopreneurs
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-[1.05] tracking-tight mb-6">
            Create a Week of{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Content in 2 Minutes
            </span>
          </h1>

          <p className="text-2xl font-bold text-indigo-600 mb-8 italic">
            &quot;Roz Dikhte Raho. Baaki Hum Sambhalenge.&quot;
          </p>

          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-10">
            Your AI partner creates Instagram posts, LinkedIn articles, WhatsApp broadcasts,
            and YouTube scripts — in{" "}
            <span className="font-semibold text-gray-800">10 Native Indian Languages</span>.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link
              href="/auth/register"
              className="flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-lg transition-all shadow-xl shadow-indigo-200 hover:-translate-y-1"
            >
              Start for Free <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#how"
              className="flex items-center gap-2 px-8 py-4 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 rounded-full font-semibold text-lg transition-all shadow-sm hover:-translate-y-0.5"
            >
              See How It Works ↓
            </a>
          </div>

          <p className="text-sm text-gray-500">
            No credit card required &nbsp;•&nbsp; Free 30 posts/month &nbsp;•&nbsp; Cancel anytime
          </p>

          {/* Dashboard mockup */}
          <div className="mt-16 relative">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden mx-auto max-w-3xl">
              {/* Browser chrome */}
              <div className="bg-gray-100 border-b border-gray-200 px-5 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-400 text-center">
                  app.contentsathi.in/generator
                </div>
              </div>
              {/* Mock UI */}
              <div className="p-6 bg-gradient-to-br from-indigo-50/60 to-purple-50/60">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-10 bg-white rounded-lg border border-gray-200 flex items-center px-4">
                      <span className="text-sm text-gray-500">Why Nagpur plots are the best investment in 2026</span>
                    </div>
                    <div className="h-10 w-28 bg-indigo-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">✨ Generate</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                    {["Instagram • Marathi", "LinkedIn • English", "WhatsApp • Hinglish"].map((label, i) => (
                      <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{label}</span>
                          <span className="text-[10px] text-emerald-600 font-bold">92/100</span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="h-2 bg-gray-100 rounded-full w-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                          <div className="h-2 bg-gray-100 rounded-full w-4/5 animate-pulse" style={{ animationDelay: `${i * 0.2 + 0.1}s` }} />
                          <div className="h-2 bg-gray-100 rounded-full w-3/5 animate-pulse" style={{ animationDelay: `${i * 0.2 + 0.2}s` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════╗
          SECTION 3 — HOW IT WORKS
      ╚═══════════════════════════════════════════════════════════ */}
      <section id="how" className="py-24 px-5 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-indigo-600 font-semibold text-sm uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
              From idea to published — in minutes
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-indigo-200 to-transparent -translate-x-4 z-0" />
                )}
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl mb-6 shadow-lg shadow-indigo-200">
                    {step.num}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════╗
          SECTION 4 — FEATURES
      ╚═══════════════════════════════════════════════════════════ */}
      <section id="features" className="py-24 px-5 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-indigo-600 font-semibold text-sm uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
              Everything you need to dominate social media
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200"
              >
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-5 ${colorMap[f.color]}`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════╗
          SECTION 5 — TESTIMONIALS
      ╚═══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-indigo-600 font-semibold text-sm uppercase tracking-widest mb-3">Social Proof</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
              Loved by Indian creators &amp; builders
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-7 border border-gray-100">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, s) => (
                    <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-6 italic">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════╗
          SECTION 6 — PRICING PREVIEW
      ╚═══════════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-24 px-5 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-indigo-600 font-semibold text-sm uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
              Simple, honest pricing
            </h2>
            <p className="text-gray-600 mt-4 text-lg">No hidden fees. Indian pricing. Cancel anytime.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`rounded-2xl p-7 border-2 relative ${
                  plan.highlight
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-2xl shadow-indigo-200 scale-105"
                    : "bg-white border-gray-100 text-gray-900"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-400 text-amber-900 text-xs font-black rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <div className="mb-6">
                  <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${plan.highlight ? "text-indigo-200" : "text-gray-500"}`}>
                    {plan.tagline}
                  </p>
                  <h3 className="text-2xl font-black mb-1">{plan.name}</h3>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-black">{plan.price}</span>
                    <span className={`text-sm mb-1 ${plan.highlight ? "text-indigo-200" : "text-gray-500"}`}>{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-2 text-sm">
                      <CheckCircle className={`w-4 h-4 shrink-0 ${plan.highlight ? "text-indigo-200" : "text-indigo-600"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/pricing"
                  className={`block text-center py-3 rounded-xl font-bold text-sm transition-all ${
                    plan.highlight
                      ? "bg-white text-indigo-600 hover:bg-indigo-50"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════╗
          SECTION 7 — FAQ
      ╚═══════════════════════════════════════════════════════════ */}
      <section id="faq" className="py-24 px-5 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-indigo-600 font-semibold text-sm uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
              Questions? We&apos;ve got answers
            </h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-bold text-gray-900 text-sm pr-4">{faq.q}</span>
                  {openFaq === i ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5">
                    <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════╗
          SECTION 8 — FOOTER
      ╚═══════════════════════════════════════════════════════════ */}
      <footer className="bg-gray-950 text-gray-400 pt-16 pb-8 px-5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Zap className="text-white fill-white" style={{ width: "1rem", height: "1rem" }} />
                </div>
                <span className="text-lg font-black text-white tracking-tighter">Contentsathi</span>
              </Link>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                AI content partner for India. Built for solopreneurs, real estate professionals, and small businesses.
              </p>
              <p className="mt-6 text-sm">Made with ❤️ in India 🇮🇳</p>
            </div>

            {/* Product */}
            <div>
              <p className="text-white font-semibold text-sm mb-4">Product</p>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/docs" className="hover:text-white transition-colors">API Docs</Link></li>
                <li><Link href="/auth/register" className="hover:text-white transition-colors">Get Started Free</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <p className="text-white font-semibold text-sm mb-4">Company</p>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600">
            <p>© 2026 Contentsathi. All rights reserved. GST: [TBD]</p>
            <div className="flex items-center gap-5">
              <a href="https://instagram.com/contentsathi" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a>
              <a href="https://linkedin.com/company/contentsathi" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">LinkedIn</a>
              <a href="https://x.com/contentsathi" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">X</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
