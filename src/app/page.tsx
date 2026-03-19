"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Zap, Globe, Send, CalendarDays, Brain,
  CheckCircle, ChevronDown, ChevronUp, Menu, X, Star,
  Sparkles, Play, Linkedin, Mail, Users, Clock, Gift,
  TrendingUp, Shield, Rocket, Bell, Lock, BadgeCheck, LayoutDashboard
} from "lucide-react";
import { useSession } from "next-auth/react";

// ── Animation helpers ────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } }
};
const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

// ── Features ─────────────────────────────────────────────────────────────────
const features = [
  { icon: Linkedin, title: "LinkedIn-First AI", desc: "Writes professional LinkedIn posts, articles, and carousels that get real engagement — not generic corporate fluff. Trained on viral Indian B2B content.", color: "blue" },
  { icon: Globe, title: "10 Native Indian Languages", desc: "Real Marathi, Hindi, Hinglish — not translations. Sounds like it was written by a native speaker who lives in your city.", color: "indigo" },
  { icon: Brain, title: "Content Brain™", desc: "Permanently remembers your brand voice, USPs, audience, and CTAs. Set once, every post matches your identity perfectly.", color: "violet" },
  { icon: CalendarDays, title: "Content Calendar", desc: "Plan your entire month. Indian festival reminders built-in. Drag-and-drop scheduling with one-click publish.", color: "sky" },
  { icon: Send, title: "Direct Publishing", desc: "One-click publish to LinkedIn, Instagram, WhatsApp Business, YouTube Shorts, X, and Facebook via official APIs.", color: "emerald" },
  { icon: TrendingUp, title: "Market Intelligence", desc: "AI monitors competitor accounts and trending topics in your niche — you always post at the right time, on the right topic.", color: "amber" },
];

const colorMap: Record<string, string> = {
  blue:    "bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-600 group-hover:text-white",
  indigo:  "bg-indigo-50 text-indigo-600 border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white",
  violet:  "bg-violet-50 text-violet-600 border-violet-100 group-hover:bg-violet-600 group-hover:text-white",
  sky:     "bg-sky-50 text-sky-600 border-sky-100 group-hover:bg-sky-600 group-hover:text-white",
  emerald: "bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white",
  amber:   "bg-amber-50 text-amber-600 border-amber-100 group-hover:bg-amber-600 group-hover:text-white",
};

// ── Plans ─────────────────────────────────────────────────────────────────────
const plans = [
  {
    name: "Starter",
    price: "₹799",
    earlyBird: "₹499",
    period: "/month",
    tagline: "For solo creators",
    features: ["500 AI credits/month", "All 7 platforms", "All 10 languages", "Real estate templates", "Content Calendar"],
    highlight: false,
    comingSoon: true,
  },
  {
    name: "Growth",
    price: "₹1,999",
    earlyBird: "₹999",
    period: "/month",
    tagline: "Most popular",
    features: ["2,000 credits/month", "All platforms", "All languages", "Priority AI", "Content Brain™", "Market Watch"],
    highlight: true,
    comingSoon: true,
  },
  {
    name: "Agency",
    price: "₹4,999",
    earlyBird: "₹2,499",
    period: "/month",
    tagline: "For teams & agencies",
    features: ["Unlimited credits", "5 brand profiles", "White-label reports", "API Access", "Dedicated support", "Priority onboarding"],
    highlight: false,
    comingSoon: true,
  },
];

// ── FAQs ──────────────────────────────────────────────────────────────────────
const faqs = [
  { q: "Who is ContentSathi built for?", a: "ContentSathi is built for Indian professionals and businesses on LinkedIn — real estate developers, consultants, coaches, SMB owners, and agencies who want to consistently publish great content without spending hours writing." },
  { q: "Why LinkedIn first?", a: "LinkedIn is where B2B decisions happen in India. Our AI is trained specifically on viral Indian LinkedIn content — the kind that gets actual reactions, comments, and DMs, not just vanity likes." },
  { q: "What does the video demo show?", a: "The demo shows how ContentSathi takes a single input (topic or YouTube link) and generates a week's worth of LinkedIn posts, carousels, and articles in under 3 minutes — in any Indian language." },
  { q: "What is the early-bird offer?", a: "Waitlist members lock in 50% off the regular price for life. When we launch, your rate never increases — even as we add more features. This offer closes when we hit our waitlist target." },
  { q: "When will ContentSathi launch?", a: "We're targeting a limited beta launch for waitlist members first. The sooner you join the waitlist, the earlier your access. We'll email you 48 hours before your invite goes out." },
];

// ── Testimonials ─────────────────────────────────────────────────────────────
const testimonials = [
  { name: "Vikram Patil", role: "Real Estate Developer, Nashik", text: "I used to blank out on what to post for weeks. ContentSathi gave me 30 LinkedIn posts in one session. My DMs tripled in the first month.", stars: 5, initial: "V" },
  { name: "Dr. Anjali Deshmukh", role: "Dental Surgeon & LinkedIn Creator, Pune", text: "The Marathi posts sound like I actually wrote them. My followers started tagging their dentist friends. I've never had that kind of engagement before.", stars: 5, initial: "A" },
  { name: "Ravi Sharma", role: "Startup Founder, Bangalore", text: "We tested 4 AI tools. ContentSathi is the only one that understands Indian context — the idioms, the festivals, the way we actually communicate. It's in a different league.", stars: 5, initial: "R" },
];

// ── Live counter hook ─────────────────────────────────────────────────────────
function useCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

// ── Email capture component ───────────────────────────────────────────────────
function WaitlistForm({ variant = "hero" }: { variant?: "hero" | "inline" | "footer" }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) return setMsg("Enter a valid email.");
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMsg("🎉 You're on the list! Check your inbox.");
        setEmail("");
      } else {
        setStatus("error");
        setMsg(data.error || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMsg("Network error. Please try again.");
    }
  }

  if (variant === "hero") return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-3 p-2 bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200 shadow-xl shadow-gray-900/5">
        <div className="flex-1 flex items-center gap-3 pl-3">
          <Mail className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            id="hero-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 text-[15px] font-medium focus:outline-none py-2"
            disabled={status === "loading" || status === "success"}
          />
        </div>
        <button
          type="submit"
          disabled={status === "loading" || status === "success"}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-60 shrink-0 shadow-md"
        >
          {status === "loading" ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : status === "success" ? (
            <><BadgeCheck className="w-4 h-4" /> Joined!</>
          ) : (
            <>Get Early Access <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </div>
      <AnimatePresence>
        {msg && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`text-center text-sm font-medium mt-3 ${status === "success" ? "text-emerald-600" : "text-red-500"}`}
          >
            {msg}
          </motion.p>
        )}
      </AnimatePresence>
    </form>
  );

  if (variant === "footer") return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-indigo-500"
          disabled={status === "loading" || status === "success"}
        />
        <button
          type="submit"
          disabled={status === "loading" || status === "success"}
          className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-60"
        >
          {status === "loading" ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : status === "success" ? <BadgeCheck className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
      {msg && <p className={`text-xs font-medium mt-2 ${status === "success" ? "text-emerald-400" : "text-red-400"}`}>{msg}</p>}
    </form>
  );

  return null;
}

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function LandingPage() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const waitlistCount = useCounter(347, 2200);

  return (
    <div className="bg-[#f8f8ff] text-gray-900 font-sans min-h-screen overflow-x-hidden selection:bg-indigo-200 selection:text-indigo-900">

      {/* ─── NAVBAR ──────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-gray-200/60">
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-300">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-xl font-extrabold text-gray-900 tracking-tight">ContentSathi</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium text-gray-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#demo" className="hover:text-indigo-600 transition-colors">Demo</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-indigo-600 transition-colors">FAQ</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {session ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold text-sm transition-all shadow-md hover:-translate-y-0.5"
              >
                <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
              </Link>
            ) : (
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {waitlistCount}+ on waitlist
              </div>
            )}
            {!session && (
              <a
                href="#waitlist"
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-full font-semibold text-sm transition-all shadow-md hover:-translate-y-0.5"
              >
                Get Early Access <ArrowRight className="w-4 h-4" />
              </a>
            )}
          </div>

          <button className="md:hidden p-2 text-gray-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
            >
              <div className="px-6 py-5 flex flex-col gap-4">
                {["#features", "#demo", "#pricing", "#faq"].map((href) => (
                  <a key={href} href={href} onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium capitalize">
                    {href.replace("#", "")}
                  </a>
                ))}
                {!session && (
                  <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-indigo-600">
                    Log in
                  </Link>
                )}
                <a href="#waitlist" onClick={() => setMobileMenuOpen(false)} className="mt-2 px-5 py-3 bg-gray-900 text-white rounded-xl font-bold text-center">
                  Get Early Access
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ─── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative pt-36 pb-28 px-5 overflow-hidden flex flex-col items-center">
        {/* Gradient blobs */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute w-[900px] h-[600px] bg-indigo-300/20 rounded-full blur-[120px] top-[-10%] left-[-10%]" />
          <div className="absolute w-[700px] h-[500px] bg-blue-200/30 rounded-full blur-[100px] top-[20%] right-[-10%]" />
          <div className="absolute w-[600px] h-[600px] bg-violet-200/20 rounded-full blur-[120px] bottom-[-20%] left-[20%]" />
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="max-w-5xl mx-auto text-center relative z-10"
        >
          {/* Pre-launch badge */}
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full text-xs font-bold tracking-wide mb-8 shadow-lg shadow-indigo-600/30">
            <Rocket className="w-3.5 h-3.5" />
            <span>Pre-Launch — LinkedIn Edition</span>
            <span className="w-1 h-1 rounded-full bg-indigo-300" />
            <span className="text-indigo-200">Limited Early Access</span>
          </motion.div>

          {/* Headline */}
          <motion.div variants={fadeUp}>
            <h1 className="text-5xl sm:text-6xl md:text-[5.5rem] font-extrabold text-gray-900 leading-[1.05] tracking-tight mb-6">
              Your LinkedIn.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 animate-gradient bg-300%">
                On Autopilot.
              </span>
            </h1>
          </motion.div>

          <motion.p variants={fadeUp} className="text-xl md:text-[1.3rem] text-gray-600 max-w-3xl mx-auto leading-relaxed mb-4 font-medium">
            ContentSathi is India&apos;s first AI content engine built natively for LinkedIn professionals.
            One input. A week of posts. In any Indian language.
          </motion.p>

          {/* LinkedIn-specific proof */}
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-6 flex-wrap mb-10 text-sm font-semibold text-gray-500">
            <div className="flex items-center gap-1.5"><Linkedin className="w-4 h-4 text-[#0077b5]" /> LinkedIn-trained AI</div>
            <div className="w-1 h-1 rounded-full bg-gray-300" />
            <div className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-indigo-500" /> 10 Indian Languages</div>
            <div className="w-1 h-1 rounded-full bg-gray-300" />
            <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-emerald-500" /> From idea to post in &lt;3 min</div>
          </motion.div>

          {/* Waitlist form */}
          <motion.div variants={fadeUp} id="waitlist" className="mb-6">
            <WaitlistForm variant="hero" />
          </motion.div>

          <motion.p variants={fadeUp} className="text-xs text-gray-400 font-medium">
            🔒 No credit card. No spam. Unsubscribe anytime. Join{" "}
            <span className="text-gray-700 font-bold">{waitlistCount}+ professionals</span> already on the list.
          </motion.p>

          {/* Early bird offer pill */}
          <motion.div
            variants={fadeUp}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-full text-sm font-semibold text-amber-800 shadow-sm"
          >
            <Gift className="w-4 h-4 text-amber-500" />
            Early bird deal: 50% off for life — locked in when you join waitlist
          </motion.div>
        </motion.div>
      </section>

      {/* ─── LIVE STATS STRIP ────────────────────────────────────────────────── */}
      <section className="py-10 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { num: `${waitlistCount}+`, label: "On Waitlist", icon: Users, color: "text-indigo-600" },
              { num: "10", label: "Indian Languages", icon: Globe, color: "text-blue-600" },
              { num: "7", label: "Social Platforms", icon: Send, color: "text-emerald-600" },
              { num: "<3 min", label: "From idea to post", icon: Zap, color: "text-violet-600" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center gap-2"
              >
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                <p className={`text-3xl font-black ${stat.color}`}>{stat.num}</p>
                <p className="text-[13px] text-gray-500 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DEMO VIDEO SECTION ──────────────────────────────────────────────── */}
      <section id="demo" className="py-24 px-5 bg-[#f8f8ff]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs uppercase tracking-widest mb-4 border border-blue-100">
              <Play className="w-3.5 h-3.5 fill-blue-600" /> Product Demo
            </p>
            <h2 className="text-4xl md:text-[3rem] font-black text-gray-900 tracking-tight leading-tight mb-4">
              See ContentSathi in action
            </h2>
            <p className="text-gray-500 text-lg font-medium max-w-2xl mx-auto">
              Watch how a real estate professional in Nagpur generates a week of LinkedIn content in under 3 minutes.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative group"
          >
            {/* Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-violet-500 rounded-[2rem] blur-2xl opacity-15 group-hover:opacity-25 transition-opacity" />

            {/* Video container */}
            <div className="relative bg-gray-900 rounded-[2rem] overflow-hidden shadow-[0_30px_80px_-15px_rgba(0,0,0,0.2)] border border-white/10 aspect-video flex items-center justify-center">
              {/* Browser bar */}
              <div className="absolute top-0 inset-x-0 bg-gray-800/80 backdrop-blur-md px-6 py-3 flex items-center gap-3 border-b border-white/5 z-10">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <div className="w-3 h-3 rounded-full bg-green-400/80" />
                </div>
                <div className="flex-1 bg-white/5 rounded-md px-4 py-1 text-xs text-gray-400 text-center font-medium">
                  app.contentsathi.in/studio
                </div>
              </div>

              {/* Placeholder for real video — replace src with actual video URL */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-gray-900 to-violet-900 flex flex-col items-center justify-center text-center px-8">
                <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-6 cursor-pointer hover:bg-white/20 transition-all hover:scale-105"
                  onClick={() => setVideoOpen(true)}>
                  <Play className="w-8 h-8 text-white fill-white ml-1" />
                </div>
                <p className="text-white font-bold text-xl mb-2">Watch the Demo (2:47)</p>
                <p className="text-gray-400 text-sm max-w-sm">Real walkthrough — Real Estate Professional → 7 LinkedIn posts in 2 minutes 47 seconds</p>
                <div className="mt-6 flex items-center gap-6 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5"><Linkedin className="w-4 h-4 text-[#0077b5]" /> LinkedIn Focussed</span>
                  <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-indigo-400" /> Multilingual</span>
                  <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-400" /> Live AI</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CTA below video */}
          <div className="text-center mt-10">
            <a
              href="#waitlist"
              className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-lg transition-all shadow-xl shadow-indigo-600/25 hover:-translate-y-1"
            >
              <Rocket className="w-5 h-5" /> I want this for my LinkedIn
            </a>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-5 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs uppercase tracking-widest mb-4 border border-indigo-100">
              <Star className="w-3.5 h-3.5" /> Core Features
            </p>
            <h2 className="text-4xl md:text-[3rem] font-black text-gray-900 tracking-tight leading-tight">
              Everything you need to dominate{" "}
              <span className="text-indigo-600">LinkedIn</span>
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="group bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:border-indigo-100 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-6 transition-colors duration-300 ${colorMap[f.color]}`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">{f.title}</h3>
                <p className="text-gray-600 text-[15px] leading-relaxed font-medium">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section id="how" className="py-24 px-5 bg-[#f8f8ff]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 text-violet-700 font-bold text-xs uppercase tracking-widest mb-4 border border-violet-100">
              <Zap className="w-3.5 h-3.5" /> Fast Workflow
            </p>
            <h2 className="text-4xl md:text-[3rem] font-black text-gray-900 tracking-tight leading-tight">
              From idea to published post<br className="hidden sm:block" /> in under 3 minutes
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: "01", title: "Enter your topic", desc: "Type a topic, paste a YouTube link, or share a WhatsApp forward. ContentSathi also auto-suggests trending LinkedIn topics in your niche.", icon: Sparkles },
              { num: "02", title: "AI generates content", desc: "Your personal AI, trained on your ContentBrain™, creates LinkedIn posts, carousels, and articles in your exact voice — in any Indian language.", icon: Brain },
              { num: "03", title: "Review & publish", desc: "Edit inline, schedule on your calendar, and hit Publish. ContentSathi posts directly to LinkedIn via the official API.", icon: Send },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative group text-center"
              >
                {i < 2 && (
                  <div className="hidden md:block absolute top-10 left-[calc(100%-1rem)] w-8 h-0.5 bg-gradient-to-r from-indigo-200 to-transparent" />
                )}
                <div className="w-20 h-20 bg-white border border-gray-100 rounded-[1.5rem] flex items-center justify-center mb-6 mx-auto shadow-sm group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-300">
                  <span className="font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">{step.num}</span>
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 text-[15px] leading-relaxed font-medium">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF ────────────────────────────────────────────────────── */}
      <section className="py-24 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 font-bold text-xs uppercase tracking-widest mb-4 border border-amber-100">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Beta Users Love It
            </p>
            <h2 className="text-4xl md:text-[3rem] font-black text-gray-900 tracking-tight leading-tight">
              Real results. Real Indians.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-gray-50 rounded-3xl p-8 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all"
              >
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: t.stars }).map((_, s) => (
                    <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-[15px] leading-relaxed mb-8 font-medium">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-100 to-violet-100 flex items-center justify-center font-bold text-indigo-700 text-sm">
                    {t.initial}
                  </div>
                  <div>
                    <p className="font-extrabold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-gray-500 text-xs font-medium mt-0.5">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING — COMING SOON ───────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-5 bg-gray-950 text-white relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-6"
          >
            <p className="text-indigo-400 font-bold text-xs uppercase tracking-widest mb-4">Pricing</p>
            <h2 className="text-4xl md:text-[3rem] font-black tracking-tight mb-3">
              Honest Indian pricing.
            </h2>
            <p className="text-gray-400 text-lg mb-2">No hidden fees. No lock-in. Cancel anytime.</p>
          </motion.div>

          {/* Early bird banner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mb-10 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl px-6 py-4 flex items-center justify-center gap-3 text-center"
          >
            <Gift className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-amber-300 font-bold text-[15px]">
              🎁 Early Bird Deal: Join the waitlist now and lock in <span className="text-amber-400 underline">50% off for life</span>. Offer expires at launch.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center"
          >
            {plans.map((plan, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className={`rounded-3xl p-8 relative overflow-hidden transition-all duration-300 ${
                  plan.highlight
                    ? "bg-gradient-to-b from-indigo-500 to-indigo-700 text-white shadow-[0_20px_50px_rgba(79,70,229,0.3)] ring-1 ring-white/20 md:scale-105 z-10"
                    : "bg-white/5 backdrop-blur-md border border-white/10"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                )}
                {plan.highlight && (
                  <div className="absolute -top-4 right-6 px-4 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 text-[10px] font-black rounded-b-lg tracking-widest uppercase shadow-md">
                    Most Popular
                  </div>
                )}

                {/* Coming soon overlay badge */}
                <div className={`absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest ${
                  plan.highlight ? "bg-white/20 text-white" : "bg-white/10 text-gray-300"
                }`}>
                  <Clock className="w-3 h-3" /> Coming Soon
                </div>

                <div className="mt-8 mb-6">
                  <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${plan.highlight ? "text-indigo-200" : "text-gray-400"}`}>
                    {plan.tagline}
                  </p>
                  <h3 className="text-2xl font-black mb-3">{plan.name}</h3>
                  {/* Strikethrough regular price + early bird */}
                  <div className="flex items-end gap-2 flex-wrap">
                    <span className={`text-4xl font-black tracking-tighter text-amber-400`}>{plan.earlyBird}</span>
                    <div className="flex flex-col mb-1">
                      <span className={`text-xs line-through ${plan.highlight ? "text-indigo-300" : "text-gray-500"}`}>{plan.price}</span>
                      <span className={`text-xs font-medium ${plan.highlight ? "text-indigo-200" : "text-gray-400"}`}>/month</span>
                    </div>
                    <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold mb-1">Early Bird</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-2.5 text-sm font-medium">
                      <CheckCircle className={`w-4 h-4 shrink-0 ${plan.highlight ? "text-indigo-200" : "text-indigo-400"}`} />
                      <span className={plan.highlight ? "text-white/90" : "text-gray-300"}>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* Join waitlist instead of checkout */}
                <a
                  href="#waitlist"
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                    plan.highlight
                      ? "bg-white text-indigo-700 hover:bg-gray-50"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  <Bell className="w-4 h-4" /> Notify Me at Launch
                </a>
              </motion.div>
            ))}
          </motion.div>

          <p className="text-center text-gray-500 text-sm font-medium mt-8">
            💳 Payments coming soon via Razorpay (UPI, Cards, Netbanking, EMI) · GST Invoice included
          </p>
        </div>
      </section>

      {/* ─── WAITLIST CTA SECTION ────────────────────────────────────────────── */}
      <section id="join" className="py-24 px-5 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-violet-600/30 blur-[80px] rounded-full pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur rounded-full text-white text-xs font-bold tracking-widest">
              <Lock className="w-3.5 h-3.5" /> LIMITED EARLY ACCESS
            </div>
            <h2 className="text-4xl md:text-[3.5rem] font-black text-white tracking-tight leading-tight">
              Be first to post smarter<br /> on LinkedIn
            </h2>
            <p className="text-indigo-200 text-xl font-medium max-w-2xl mx-auto">
              Join {waitlistCount}+ Indian professionals already on the waitlist. Lock in your 50% lifetime discount before we launch.
            </p>

            {/* Perks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left my-8">
              {[
                { icon: Gift, title: "50% off forever", desc: "Early Bird pricing locked for life" },
                { icon: Rocket, title: "Beta access first", desc: "You'll get in before the public" },
                { icon: Shield, title: "No spam. Ever.", desc: "Just launch updates and early access" },
              ].map((perk, i) => (
                <div key={i} className="flex items-start gap-3 bg-white/10 rounded-2xl p-4">
                  <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center shrink-0">
                    <perk.icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{perk.title}</p>
                    <p className="text-indigo-200 text-xs font-medium mt-0.5">{perk.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <WaitlistForm variant="hero" />
          </motion.div>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-5 bg-white">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-bold text-xs uppercase tracking-widest mb-4 border border-gray-200">
              Questions & Answers
            </p>
            <h2 className="text-4xl md:text-[3rem] font-black text-gray-900 tracking-tight leading-tight">
              Got questions?<br className="hidden sm:block" /> We&apos;ve got answers.
            </h2>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={`border rounded-2xl overflow-hidden transition-all duration-300 ${openFaq === i ? "bg-white border-indigo-200 shadow-md ring-4 ring-indigo-50" : "bg-white border-gray-200 hover:border-gray-300"}`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-6 text-left"
                >
                  <span className={`font-extrabold text-[15px] pr-4 ${openFaq === i ? "text-indigo-700" : "text-gray-900"}`}>{faq.q}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${openFaq === i ? "bg-indigo-100" : "bg-gray-100"}`}>
                    {openFaq === i ? <ChevronUp className="w-5 h-5 text-indigo-600" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                  </div>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-2 border-t border-gray-100 bg-gray-50/50">
                        <p className="text-gray-600 text-[15px] leading-relaxed font-medium">{faq.a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="bg-gray-950 pt-20 pb-10 px-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-indigo-900/20 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 border-b border-gray-800 pb-16">
            {/* Brand + waitlist */}
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-6 group">
                <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <Zap className="w-4 h-4 text-white fill-white" />
                </div>
                <span className="text-xl font-black text-white tracking-tight">ContentSathi</span>
              </Link>
              <p className="text-[15px] text-gray-400 leading-relaxed max-w-sm font-medium mb-6">
                India&apos;s first AI content engine built natively for LinkedIn professionals. Pre-launch — early access only.
              </p>
              <p className="text-xs text-gray-500 font-semibold mb-3 uppercase tracking-widest">Join the Waitlist</p>
              <WaitlistForm variant="footer" />
              <div className="mt-6 flex items-center gap-2 text-sm text-gray-500 font-medium">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {waitlistCount}+ professionals already signed up
              </div>
            </div>

            {/* Product */}
            <div>
              <p className="text-white font-bold text-[15px] mb-5">Product</p>
              <ul className="space-y-3.5 text-[14px] font-medium text-gray-400">
                <li><a href="#features" className="hover:text-indigo-400 transition-colors">Features</a></li>
                <li><a href="#demo" className="hover:text-indigo-400 transition-colors">Demo Video</a></li>
                <li><a href="#pricing" className="hover:text-indigo-400 transition-colors">Pricing (Coming Soon)</a></li>
                <li><a href="#waitlist" className="hover:text-indigo-400 transition-colors">Join Waitlist</a></li>
                {!session && (
                  <li><Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">Admin Login</Link></li>
                )}
              </ul>
            </div>

            {/* Company */}
            <div>
              <p className="text-white font-bold text-[15px] mb-5">Company</p>
              <ul className="space-y-3.5 text-[14px] font-medium text-gray-400">
                <li><Link href="/about" className="hover:text-indigo-400 transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-indigo-400 transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-indigo-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-indigo-400 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-[14px] font-medium text-gray-500">
            <div className="flex items-center gap-2">
              <span className="text-xl">🇮🇳</span>
              <span>Made with care in India. © 2026 ContentSathi. Pre-launch.</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="https://linkedin.com/company/contentsathi" target="_blank" rel="noopener noreferrer" className="hover:text-[#0077b5] transition-colors flex items-center gap-1.5">
                <Linkedin className="w-4 h-4" /> LinkedIn
              </a>
              <a href="https://instagram.com/contentsathi" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a>
              <a href="https://x.com/contentsathi" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">X</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── VIDEO MODAL ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {videoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setVideoOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl aspect-video bg-gray-900 rounded-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setVideoOpen(false)}
                className="absolute top-4 right-4 z-10 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              {/* Replace this div with your actual <video> or <iframe> embed */}
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                <p>📹 Add your demo video here<br /><span className="text-xs">Replace with: &lt;video src=&quot;/demo.mp4&quot; controls /&gt; or YouTube embed</span></p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
