"use client";

import { useEffect, useState } from "react";
import { 
  PenTool, 
  RefreshCw, 
  LayoutTemplate, 
  ArrowRight, 
  TrendingUp, 
  CalendarCheck,
  Zap,
  Instagram,
  Linkedin,
  Youtube,
  MessageCircle,
  Twitter,
  Facebook,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import PostCard from "@/components/PostCard";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import EmptyState from "@/components/EmptyState";
import toast from "react-hot-toast";


interface SocialAccount {
  platform: string;
  isActive: boolean;
  accountName: string | null;
}

interface DashboardStats {
  postsPlanned: number;
  postsPublished: number;
  creditsBalance: number;
  todayRecommendation: { title: string; platform: string } | null;
  upcomingPosts: Array<{
    id: string;
    platform: string;
    title: string;
    scheduledAt: string;
    status: string;
  }>;
  socialAccounts: SocialAccount[];
  onboardingCompleted: boolean;
}

const PLATFORM_ICONS: Record<string, any> = {
  instagram: Instagram,
  linkedin: Linkedin,
  x: Twitter,
  youtube: Youtube,
  facebook: Facebook,
  whatsapp: MessageCircle,
};

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}

const SMART_TOPIC_SUGGESTIONS = [
  "Why investing in plots is smarter than buying flats in 2026",
  "5 questions you must ask before buying any plot",
  "How RERA changed real estate buying forever",
  "Why Tier 2 cities are the best investment right now",
  "The truth about property appreciation in India",
  "How to spot a genuine real estate agent",
  "Why weekend site visits lead to faster decisions",
  "Top 3 mistakes first-time homebuyers make",
  "How to negotiate the best property price",
  "What vastu compliance actually means for buyers",
  "Why NA plots are better than agricultural land",
  "How Ring Road connectivity is changing property prices",
  "What NRIs should know before buying property in India",
  "Why festival season is the best time to buy property"
];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayPosts, setTodayPosts] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistError, setWaitlistError] = useState("");
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [planTier, setPlanTier] = useState("free");
  
  const FREE_PLATFORMS = ["Instagram", "WhatsApp"];
  
  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistError("");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!waitlistEmail || !emailRegex.test(waitlistEmail)) {
        setWaitlistError("Sahi email daalo! e.g. sachin@gmail.com");
        return;
    }
    setWaitlistLoading(true);
    try {
        const res = await fetch("/api/waitlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: waitlistEmail })
        });
        if (res.ok) {
            setWaitlistSuccess(true);
            toast.success("You're on the waitlist! 🚀");
            setWaitlistEmail("");
        } else {
            toast.error("Failed to join waitlist. Please try again.");
        }
    } catch {
        toast.error("Something went wrong");
    } finally {
        setWaitlistLoading(false);
    }
  };

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [statsRes, todayRes, suggRes] = await Promise.all([
          fetch("/api/dashboard/stats"),
          fetch("/api/calendar/today"),
          fetch("/api/suggestions/today")
        ]);

        if (!statsRes.ok || !todayRes.ok || !suggRes.ok) throw new Error("Failed to load");
        
        const statsData = await statsRes.json();
        const todayData = await todayRes.json();
        const suggData = await suggRes.json();

        setStats(statsData);
        setTodayPosts(todayData);
        setSuggestions(suggData);

        // Load user's plan to filter suggestions
        const profileRes = await fetch("/api/user/profile");
        if (profileRes.ok) {
          const profile = await profileRes.json();
          setPlanTier(profile.planTier || "free");
        }
      } catch {
        setError("Could not load dashboard data.");
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const connectedPlatforms = stats?.socialAccounts.map(a => a.platform.toLowerCase()) || [];

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {!loading && stats && !stats.onboardingCompleted && (
        <OnboardingWizard onComplete={() => setStats({...stats, onboardingCompleted: true})} />
      )}

      {/* ── Connected Accounts Bar ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 backdrop-blur-md border border-gray-100 p-4 rounded-3xl shadow-sm">
        <div className="flex items-center gap-4 border-r border-gray-100 pr-6 mr-2">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">Connected</h2>
            <div className="flex items-center gap-3">
                {Object.keys(PLATFORM_ICONS).map((p) => {
                    const Icon = PLATFORM_ICONS[p];
                    const isConnected = connectedPlatforms.includes(p);
                    return (
                        <Link key={p} href="/settings" className="relative group">
                            <div className={cn(
                                "p-2 rounded-xl transition-all duration-300",
                                isConnected ? "bg-indigo-50 text-indigo-600" : "bg-gray-50 text-gray-300 grayscale"
                            )}>
                                <Icon className="w-5 h-5" />
                            </div>
                            {isConnected && (
                                <div className="absolute -top-1 -right-1 bg-green-500 border-2 border-white rounded-full p-0.5">
                                    <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                                </div>
                            )}
                        </Link>
                    );
                })}
            </div>
        </div>

        {connectedPlatforms.length === 0 && !loading && (
            <div className="flex-1 flex items-center gap-3 text-amber-700 bg-amber-50 px-4 py-2 rounded-2xl border border-amber-100 animate-pulse">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="text-xs font-bold">No accounts connected. Connect your social channels to enable direct publishing.</p>
                <Link href="/settings" className="ml-auto text-xs font-black underline underline-offset-4">Connect Now</Link>
            </div>
        )}

        <div className="flex items-center gap-4 ml-auto">
            <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Posts Remaining This Month</p>
                <p className="text-sm font-black text-indigo-600">
                  {stats?.creditsBalance != null 
                    ? stats.creditsBalance > 10000 
                      ? "Unlimited" 
                      : Math.max(0, Math.floor(stats.creditsBalance / 5)).toLocaleString()
                    : "30"}
                </p>
            </div>
            <Link href="/billing" className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
                <Plus className="w-4 h-4" />
            </Link>
        </div>
      </div>

      {/* ── Welcome Header ───────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Namaskar, Saurabh!</h1>
          </div>
          <p className="text-gray-500 font-medium">Your ContentSathi has your content pipeline ready.</p>
          <p className="text-xs text-indigo-500 font-semibold mt-1" title="Sathi means Partner. Always by your side.">✦ Sathi (साथी) means Partner. Always by your side.</p>
        </div>
        <Link
          href="/generator"
          className="group relative inline-flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black transition-all shadow-xl shadow-indigo-200 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          <Zap className="w-5 h-5 fill-current" />
          Generate This Week&apos;s Content
        </Link>
      </div>

      {/* ── Stats Highlights ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all">
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Pipeline</p>
            <h3 className="text-4xl font-black text-gray-900">{stats?.postsPlanned ?? 0}</h3>
            {/* FIX 2: Only show % badge when there is actual data */}
            {(stats?.postsPlanned ?? 0) > 0 ? (
              <p className="text-[10px] font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full inline-block">+12% from last week</p>
            ) : (
              <p className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full inline-block">Aapka pehla post generate karo! 🚀</p>
            )}
          </div>
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
            <CalendarCheck className="w-8 h-8" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-green-100 transition-all">
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live Reach</p>
            <h3 className="text-4xl font-black text-gray-900">{stats?.postsPublished ?? 0}</h3>
            <p className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full inline-block">Total published posts</p>
          </div>
          <div className="w-16 h-16 rounded-3xl bg-green-50 flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
            <TrendingUp className="w-8 h-8" />
          </div>
        </div>

        <div className="relative bg-gradient-to-br from-indigo-600 to-purple-700 p-6 md:p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-200 text-white flex flex-col justify-between overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700 pointer-events-none">
            <Sparkles className="w-32 h-32" />
          </div>
          <div className="relative z-10 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-white/70 text-xs font-black uppercase tracking-widest">Today&apos;s suggested topic:</span>
            </div>
            <h3 className="text-lg font-bold leading-tight line-clamp-3 mb-2" style={{ textWrap: 'balance' }}>
              {SMART_TOPIC_SUGGESTIONS[Math.floor(Math.random() * SMART_TOPIC_SUGGESTIONS.length)]}
            </h3>
            {suggestions?.[0]?.description && (
              <p className="text-sm text-indigo-100 line-clamp-2">
                {suggestions[0].description}
              </p>
            )}
          </div>

          <div className="relative z-10 mt-6 flex flex-col gap-2">
            <Link 
              href={`/generator?topic=${encodeURIComponent(suggestions?.[0]?.topic || "")}&platform=${suggestions?.[0]?.platform || "Instagram"}`}
              className="inline-flex items-center justify-center gap-2 text-sm font-black bg-white text-indigo-700 hover:bg-indigo-50 px-4 py-3 rounded-xl transition-all shadow-lg hover:-translate-y-0.5"
            >
              Use this topic <Zap className="w-4 h-4 fill-current" />
            </Link>
            <Link 
              href="/generator" 
              className="inline-flex items-center justify-center gap-2 text-xs font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl transition-all"
            >
              Enter your own topic <span className="opacity-60">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Smart Suggestions ─────────────────────────────────────────────── */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
            <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">AI Strategy Recommendations</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
                [1, 2, 3].map(i => (
                    <div key={i} className="h-44 bg-gray-50 rounded-[2.5rem] animate-pulse border border-gray-100" />
                ))
            ) : suggestions.length > 0 ? (
                suggestions
                  .filter(s => planTier !== "free" || FREE_PLATFORMS.includes(s.platform))
                  .map((s) => (
                    <div key={s.id} className="group relative bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all hover:border-indigo-100 overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            {s.type === 'festival' ? <Plus className="w-24 h-24" /> : <Zap className="w-24 h-24" />}
                        </div>
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-4">
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                    s.urgency === 'high' ? "bg-red-50 text-red-600 border border-red-100" : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                                )}>
                                    {s.type.replace('_', ' ')}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400">{s.platform}</span>
                            </div>
                            <h3 className="text-lg font-black text-gray-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">
                                {s.title}
                            </h3>
                            <p className="text-sm text-gray-500 font-medium mb-6 line-clamp-2">
                                {s.description}
                            </p>
                            <Link 
                                href={`/generator?topic=${encodeURIComponent(s.topic)}&platform=${s.platform}${s.festivalTag ? `&festival=${s.festivalTag}` : ''}`}
                                className="mt-auto inline-flex items-center gap-2 text-xs font-black text-indigo-600 group-hover:gap-3 transition-all"
                            >
                                Generate Now <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                ))
            ) : (
                <div className="md:col-span-3">
                    <EmptyState 
                      type="dashboard" 
                      title="No Fresh AI Suggestions" 
                      description="Our AI needs more context to generate strategy recommendations. Start by creating a few campaigns." 
                    />
                </div>
            )}
        </div>
      </div>


      {/* ── Publishing Today (Phase F2, H6) ───────────────────────────────────────────── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                    <Clock className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Publishing Today</h2>
            </div>
            {todayPosts.length > 0 && (
                <span className="text-xs font-black text-gray-400 uppercase bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                    {todayPosts.length} Items Scheduled
                </span>
            )}
        </div>

        {todayPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {todayPosts.map((item) => (
                    <div key={item.id} className="relative group">
                        <div className="absolute -top-3 left-6 z-10 px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black rounded-full shadow-lg flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {item.scheduledAt ? format(new Date(item.scheduledAt), "hh:mm a") : "Today"}
                        </div>
                        <PostCard 
                            post={{
                                ...item.generatedAsset,
                                platform: item.platform,
                                qualityScore: item.generatedAsset?.qualityScore || 85,
                            }} 
                        />
                    </div>
                ))}
            </div>
        ) : (
            <div className="w-full">
                <EmptyState 
                  type="calendar" 
                  title="No Posts Today" 
                  description="You don't have any posts scheduled to go live today. Fill up your calendar to stay consistent." 
                />
            </div>
        )}
      </div>


      {/* ── How to start Grid ────────────────────────────────────────── */}
      <div className="space-y-6 pt-6">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight px-2 text-center md:text-left uppercase">HOW DO YOU WANT TO START?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <Link href="/generator" className="group bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all hover:-translate-y-1 hover:border-indigo-100 relative overflow-hidden flex flex-col items-center md:items-start text-center md:text-left">
            <div className="absolute -right-4 -bottom-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <PenTool className="w-32 h-32" />
            </div>
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm">
              <span className="text-3xl">💡</span>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">I have a topic idea</h3>
            <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">Enter a topic and generate a full week of optimized content in multiple languages.</p>
            <div className="mt-auto flex items-center gap-2 text-indigo-600 font-bold text-sm">
                Go to Content Generator <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
          
          <Link href="/repurpose" className="group bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all hover:-translate-y-1 hover:border-emerald-100 relative overflow-hidden flex flex-col items-center md:items-start text-center md:text-left">
            <div className="absolute -right-4 -bottom-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Youtube className="w-32 h-32" />
            </div>
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 shadow-sm">
              <span className="text-3xl">🎥</span>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">I have a YouTube/URL</h3>
            <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">Transform existing videos or articles into fresh viral social media posts instantly.</p>
            <div className="mt-auto flex items-center gap-2 text-emerald-600 font-bold text-sm">
                Go to Repurpose Source <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
          
          <Link href="/templates" className="group bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all hover:-translate-y-1 hover:border-amber-100 relative overflow-hidden flex flex-col items-center md:items-start text-center md:text-left">
            <div className="absolute -right-4 -bottom-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <LayoutTemplate className="w-32 h-32" />
            </div>
            <div className="w-16 h-16 rounded-3xl bg-amber-50 flex items-center justify-center mb-6 group-hover:bg-amber-600 group-hover:text-white transition-all duration-500 shadow-sm">
              <span className="text-3xl">📋</span>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2 group-hover:text-amber-600 transition-colors">Use a proven template</h3>
            <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">Access battle-tested real estate scripts, carousels, and frameworks that covert.</p>
            <div className="mt-auto flex items-center gap-2 text-amber-600 font-bold text-sm">
                Go to Real Estate Templates <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        {/* ── AutoPilot Banner ────────────────────────────────────────────── */}
        <div className="relative overflow-hidden mt-8 rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 shadow-xl border border-indigo-900">
          {/* Subtle Background Glow/Noise */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-screen filter blur-[100px] opacity-20 pointer-events-none animate-pulse"></div>
          <div className="absolute -bottom-10 left-10 w-64 h-64 bg-fuchsia-500 rounded-full mix-blend-screen filter blur-[80px] opacity-20 pointer-events-none animate-pulse" style={{ animationDelay: "2s" }}></div>

          <div className="relative z-10 p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex-1 pr-6 flex flex-col md:items-start items-center text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6 shadow-sm">
                <Sparkles className="w-4 h-4 text-indigo-300" />
                <span className="text-xs font-bold tracking-widest text-indigo-100 uppercase">Coming Soon</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight lg:leading-[1.1] mb-5">
                Contentsathi <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-indigo-300">AutoPilot</span> 🚀
              </h2>
              <p className="text-indigo-100 max-w-xl text-lg md:text-xl font-medium leading-relaxed opacity-90 drop-shadow-sm">
                Set your weekly content goal. Your AI Content Partner handles the rest — picks topics, writes in 10 Indian languages, schedules, and publishes every day without you clicking anything. Built on agentic AI.
              </p>
            </div>

            <div className="w-full md:w-[420px] shrink-0">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                {waitlistSuccess ? (
                  <div className="text-center py-6 animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-5 border border-green-500/30">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">You&apos;re on the list!</h3>
                    <p className="text-indigo-100 font-medium opacity-90">We&apos;ll notify you the moment AutoPilot launches. You&apos;ll get 500 bonus credits at launch.</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-6 text-center md:text-left">
                        <h4 className="text-xl font-bold text-white mb-2">Join the Waitlist</h4>
                        <p className="text-sm text-indigo-200">Get early access to skip the queue and receive 500 bonus credits.</p>
                    </div>
                    <form onSubmit={handleWaitlistSubmit} className="flex flex-col gap-4 relative z-20">
                      <input 
                        type="email" 
                        required
                        value={waitlistEmail}
                        onChange={(e) => { setWaitlistEmail(e.target.value); setWaitlistError(""); }}
                        placeholder="Enter your email address"
                        className={`w-full px-5 py-4 bg-white/5 border rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:bg-white/10 transition-all font-medium backdrop-blur-md ${
                          waitlistError ? "border-red-400" : "border-white/20"
                        }`}
                      />
                      {waitlistError && (
                        <p className="text-red-400 text-xs font-semibold -mt-2 ml-1">{waitlistError}</p>
                      )}
                      <button 
                        type="submit"
                        disabled={waitlistLoading}
                        className="w-full relative group overflow-hidden bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-black px-6 py-4 rounded-2xl transition-all shadow-lg hover:shadow-indigo-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {waitlistLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Secure My Spot — Free"}
                        </span>
                        <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-[0%] transition-transform duration-300"></div>
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
