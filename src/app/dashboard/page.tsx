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

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayPosts, setTodayPosts] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Credits Left</p>
                <p className="text-sm font-black text-indigo-600">{stats?.creditsBalance ?? 0}</p>
            </div>
            <Link href="/billing" className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
                <Plus className="w-4 h-4" />
            </Link>
        </div>
      </div>

      {/* ── Welcome Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Vibrant Morning, Saurabh!</h1>
          <p className="text-gray-500 mt-2 font-medium">Your Content Pipeline for Saraswati Nagari is looking strong.</p>
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
            <p className="text-[10px] font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full inline-block">+12% from last week</p>
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

        <div className="relative bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-200 text-white flex flex-col justify-between overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
            <Sparkles className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <p className="text-white/70 text-xs font-black uppercase tracking-widest mb-3">Today&apos;s Strategy</p>
            <h3 className="text-lg font-bold leading-tight" style={{ textWrap: 'balance' }}>
              {stats?.todayRecommendation?.title ?? "Time to fill your calendar with fresh real estate insights!"}
            </h3>
          </div>
          <Link href="/calendar" className="relative z-10 inline-flex items-center gap-2 text-sm font-black mt-6 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all w-fit">
            Explore Calendar <ArrowRight className="w-4 h-4" />
          </Link>
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
                suggestions.map((s) => (
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
                <div className="md:col-span-3 bg-gray-50 rounded-[2.5rem] p-10 text-center border border-dashed border-gray-200">
                    <p className="text-gray-400 font-bold">No fresh suggestions right now. Keep generating content!</p>
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
            <div className="bg-white/40 border-2 border-dashed border-gray-200 rounded-[3rem] p-16 text-center group hover:border-indigo-200 transition-all">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Clock className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-400 font-bold">No posts scheduled for today yet.</p>
                <Link href="/generator" className="mt-4 inline-flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest hover:underline">
                    Plan something now →
                </Link>
            </div>
        )}
      </div>


      {/* ── Quick Actions Grid ────────────────────────────────────────── */}
      <div className="space-y-6">
        <h2 className="text-xl font-black text-gray-900 tracking-tight px-2">Growth Accelerators</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Link href="/generator" className="group bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all hover:border-indigo-100 relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <PenTool className="w-32 h-32" />
            </div>
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
              <PenTool className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-gray-900">Content Maestro</h3>
            <p className="text-sm text-gray-400 mt-2 font-medium leading-relaxed">Input one core USP or topic, and get a week of platform-optimized content instantly.</p>
          </Link>
          
          <Link href="/repurpose" className="group bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all hover:border-emerald-100 relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <RefreshCw className="w-32 h-32" />
            </div>
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
              <RefreshCw className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-gray-900">Repurpose Lab</h3>
            <p className="text-sm text-gray-400 mt-2 font-medium leading-relaxed">Transform real estate listings, blogs, or YouTube URLs into viral social media formats.</p>
          </Link>
          
          <Link href="/templates" className="group bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all hover:border-amber-100 relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <LayoutTemplate className="w-32 h-32" />
            </div>
            <div className="w-16 h-16 rounded-3xl bg-amber-50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all duration-500">
              <LayoutTemplate className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-gray-900">Proven Blueprint</h3>
            <p className="text-sm text-gray-400 mt-2 font-medium leading-relaxed">Use battle-tested real estate content frameworks for investors, testimonials, and site visits.</p>
          </Link>
        </div>
      </div>

    </div>
  );
}
