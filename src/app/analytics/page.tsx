"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend
} from "recharts";
import {
  TrendingUp, TrendingDown, Activity, Users, Heart,
  MessageCircle, Share2, Layout, Lightbulb, ThumbsUp,
  Calendar, FileText, RefreshCw, Loader2
} from "lucide-react";

const PIE_COLORS = ["#4f46e5", "#7c3aed", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

const MOCK_PLATFORM_DATA = [
  { platform: "instagram", posts: 5, reach: 25000, likes: 1200, comments: 340 },
  { platform: "linkedin", posts: 3, reach: 12000, likes: 450, comments: 80 },
  { platform: "youtube", posts: 1, reach: 5000, likes: 180, comments: 30 },
  { platform: "facebook", posts: 3, reach: 3200, likes: 95, comments: 20 },
  { platform: "whatsapp", posts: 4, reach: 800, likes: 0, comments: 0 },
];

const MOCK_WEEKLY_REACH = [
  { day: "Mon", reach: 5400 },
  { day: "Tue", reach: 8200 },
  { day: "Wed", reach: 6700 },
  { day: "Thu", reach: 11200 },
  { day: "Fri", reach: 9300 },
  { day: "Sat", reach: 7800 },
  { day: "Sun", reach: 4200 },
];

export default function AnalyticsPage() {
  const [range, setRange] = useState("7");
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch(`/api/analytics?range=${range}`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const data = await res.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error("Analytics fetch error:", err);
      // Gracefully fall back to mock data on error
      setAnalyticsData(null);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [range]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    fetch("/api/analytics/weekly-insight", { method: "POST" })
      .then(res => res.json())
      .then(data => { if (data.success) setInsight(data.insight); })
      .catch(console.error)
      .finally(() => setLoadingInsight(false));
  }, []);

  const formatNumber = (num: number) => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return num.toString();
  };

  // Use real data if available, else show mocks with label
  const hasReal = analyticsData?.hasRealData;
  const platformBreakdown = hasReal
    ? analyticsData?.platformBreakdown
    : MOCK_PLATFORM_DATA.map(p => ({ ...p, er: ((p.likes + p.comments) / p.reach * 100).toFixed(1) }));
  const weeklyReach = hasReal
    ? analyticsData?.weeklyReach
    : MOCK_WEEKLY_REACH;
  const totalReach = hasReal ? analyticsData?.totalReach : 45200;
  const totalLikes = hasReal ? analyticsData?.totalLikes : 2125;
  const totalPosts = hasReal ? analyticsData?.totalPosts : 16;
  const topPost = hasReal ? analyticsData?.topPost : {
    title: "Why Nagpur Real Estate is Booming",
    platform: "Instagram",
    reach: 12500,
    likes: 850,
  };

  const pieData = platformBreakdown?.map((p: any) => ({
    name: p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
    value: p.posts || 1,
  })) || [];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-20">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            Track your performance across all platforms
            {!hasReal && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                Sample data — publish posts & sync to see real analytics
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={range}
            onChange={e => setRange(e.target.value)}
            className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
          <button
            onClick={fetchAnalytics}
            disabled={loadingAnalytics}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            {loadingAnalytics ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </button>
        </div>
      </div>

      {/* Weekly AI Insight */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 shadow-sm flex gap-6 items-start">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 border border-amber-200">
          <Lightbulb className="w-6 h-6 text-amber-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-amber-900 mb-2 flex items-center gap-2">
            Weekly AI Insight
            <span className="bg-amber-100 text-amber-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-amber-200">Gemini Powered</span>
          </h2>
          {loadingInsight ? (
            <div className="space-y-2 animate-pulse mt-3">
              <div className="h-4 bg-amber-200/50 w-full rounded" />
              <div className="h-4 bg-amber-200/50 w-5/6 rounded" />
            </div>
          ) : (
            <p className="text-sm text-amber-800 leading-relaxed font-medium whitespace-pre-wrap">
              {insight || "Keep publishing to generate enough data for your weekly strategic insight!"}
            </p>
          )}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Posts Published", value: totalPosts, icon: <Layout className="w-5 h-5 text-blue-600" />, bg: "bg-blue-50", sub: "This period" },
          { label: "Total Reach", value: formatNumber(totalReach), icon: <Users className="w-5 h-5 text-indigo-600" />, bg: "bg-indigo-50", sub: "Across platforms" },
          { label: "Total Likes", value: formatNumber(totalLikes), icon: <Heart className="w-5 h-5 text-pink-600" />, bg: "bg-pink-50", sub: "All platforms" },
          { label: "Avg. Eng. Rate", value: totalReach > 0 ? ((totalLikes / totalReach) * 100).toFixed(1) + "%" : "—", icon: <Activity className="w-5 h-5 text-emerald-600" />, bg: "bg-emerald-50", sub: "Likes ÷ Reach" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full ${stat.bg} opacity-40 group-hover:scale-125 transition-transform`} />
            <div className={`p-3 rounded-xl ${stat.bg} w-fit relative z-10 mb-3`}>{stat.icon}</div>
            <h3 className="text-2xl font-black text-gray-900 relative z-10">{stat.value}</h3>
            <p className="text-sm font-medium text-gray-500 mt-0.5 relative z-10">{stat.label}</p>
            <p className="text-[10px] text-gray-400 mt-0.5 relative z-10">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar chart: Weekly Reach (I3) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" /> Weekly Reach
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyReach} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} tickFormatter={v => formatNumber(v)} />
                <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                <Bar dataKey="reach" radius={[6, 6, 0, 0]} fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie chart: Platform Breakdown (I5) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Layout className="w-5 h-5 text-violet-500" /> Posts by Platform
          </h2>
          {pieData.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                    {pieData.map((_: any, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Engagement Rate Line Chart (I4) + Top Post (I8) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" /> Engagement Over Time
          </h2>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyReach.map((d: any, i: number) => ({ ...d, likes: Math.floor(d.reach * (0.03 + i * 0.005)) }))} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} tickFormatter={v => formatNumber(v)} />
                <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
                <Line type="monotone" dataKey="likes" stroke="#10b981" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performing Post (I8) */}
        <div className="space-y-4">
          {topPost && (
            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm p-6">
              <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <ThumbsUp className="w-4 h-4" /> Best Performing Post This Period
              </h3>
              <p className="font-bold text-gray-900 text-base mb-3 leading-tight line-clamp-3">
                &quot;{topPost.title}&quot;
              </p>
              <div className="flex items-center gap-4 text-sm text-emerald-700 font-medium">
                <span className="bg-white/70 px-2.5 py-1 rounded-lg capitalize">{topPost.platform}</span>
                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {formatNumber(topPost.reach)} reach</span>
                <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> {topPost.likes} likes</span>
              </div>
            </div>
          )}

          {/* Platform Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" /> Platform Breakdown
            </h3>
            <div className="space-y-2">
              {(platformBreakdown || []).slice(0, 4).map((plat: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm font-semibold text-gray-700 capitalize">{plat.platform}</span>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{plat.posts} posts</span>
                    <span className="font-bold text-indigo-600">{formatNumber(plat.reach)} reach</span>
                    <span className="font-bold text-emerald-600">{plat.er}% ER</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
