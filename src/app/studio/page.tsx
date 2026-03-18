"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import MarkdownContent from "@/components/MarkdownContent";
import PublishModal from "@/components/PublishModal";
import {
  BrainCircuit,
  Bot,
  User,
  Sparkles,
  BookOpen,
  Pencil,
  Save,
  X,
  Zap,
  Shield,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ChevronRight,
  TrendingUp,
  Target,
  Play,
  ArrowRight,
  Lightbulb,
  Clock,
  BarChart3,
  Send,
} from "lucide-react";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  memoryUpdated?: boolean;
  newRule?: string;
};

type AgentTask = {
  id: string;
  goal: string;
  source: string;
  status: "processing" | "completed" | "failed";
  progress: number;
  currentAgent: string;
  deepResearchData?: any;
  generatedContent?: any;
  logs: { time: string; message: string }[];
  createdAt: string;
};

const BUYING_PATTERNS = [
  { id: "roi", label: "ROI/Investment", icon: "📈", desc: "Focus on capital appreciation and rental yield." },
  { id: "emi", label: "EMI/Security", icon: "🛡️", desc: "Focus on monthly affordability and family safety." },
  { id: "fomo", label: "FOMO/Urgency", icon: "🔥", desc: "Focus on limited stock and price hike alerts." },
  { id: "legacy", label: "Legacy/Pride", icon: "🏆", desc: "Focus on premium status and luxury lifestyle." },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function stripMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/^#+\s+/gm, "")               // # Headings
    .replace(/\*\*(.*?)\*\*/g, "$1")       // **bold**
    .replace(/\*(.*?)\*/g, "$1")           // *italic*
    .replace(/__(.*?)__/g, "$1")           // __bold__
    .replace(/_(.*?)_/g, "$1")             // _italic_
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [link](url)
    .replace(/`([^`]+)`/g, "$1")           // `code`
    .trim();
}

// ── Campaign Brief Templates ─────────────────────────────────────────────────
const BRIEF_TEMPLATES = [
  {
    icon: "🏠",
    label: "Investor Lead-Gen (NRI)",
    tag: "LinkedIn + WhatsApp",
    goal: "Generate 5 investor-focused LinkedIn posts and a WhatsApp broadcast targeting NRIs interested in Nagpur plots near MIHAN. Highlight Ready Reckoner appreciation, RERA compliance, and airport connectivity. Include Hinglish hooks and strong CTAs.",
  },
  {
    icon: "🛣️",
    label: "Competitor Channel Audit",
    tag: "Research Report",
    goal: "Run a full competitor channel audit for Nagpur real estate. Score top 5 active channels on LinkedIn, Instagram, and Facebook using our auth criteria (engagement quality, RERA compliance, local relevance). Output a ranked list with scores and recommended counter-angles.",
  },
  {
    icon: "⚡",
    label: "Battle Card: Price War",
    tag: "Instagram + WhatsApp",
    goal: "A competitor in Wardha Road is running a price-drop campaign. Counter with a 'RERA Trust vs. Price War' battle card in Hinglish for Instagram and Marathi for WhatsApp. Emphasize our NMRDA sanction, infrastructure timeline, and possession guarantee. No price mentions.",
  },
  {
    icon: "📅",
    label: "Daily Morning Brief",
    tag: "All Channels",
    goal: "Generate today's daily content brief for all 3 active channels (Instagram, WhatsApp, LinkedIn). Include 1 market signal from Nagpur infrastructure news, 2 content angles per channel with RERA-safe language, and flag any competitor activity from yesterday's scan.",
  },
  {
    icon: "🎠",
    label: "Educational Carousel",
    tag: "Instagram",
    goal: "Create a 6-slide Instagram carousel: 'Why Saraswati Nagri is Nagpur's most undervalued investment corridor right now.' Slides: 1) Bold hook, 2) Infrastructure story (Ring Road+Metro), 3) Ready Reckoner data, 4) NMRDA approval proof, 5) Buyer story, 6) CTA. Hinglish, no guaranteed return claims.",
  },
  {
    icon: "📊",
    label: "Weekly Performance Report",
    tag: "Summary",
    goal: "Compile this week's Nagpur content performance summary. Include: channels that performed best, top 3 engaging posts, audience signals by corridor (Wardha/MIHAN/Besa), and next week's recommended content angles. Update soul.md with any new learned rules.",
  },
];

export default function AgenticOrchestrator() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [publishingPost, setPublishingPost] = useState<any>(null);

  const [coreMemory, setCoreMemory] = useState<string>("");
  const [isEditingMemory, setIsEditingMemory] = useState(false);
  const [editedMemory, setEditedMemory] = useState<string>("");
  const [isSavingMemory, setIsSavingMemory] = useState(false);
  const [memoryFlash, setMemoryFlash] = useState(false);
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);

  // ── Queue & Autonomous Runs ─────────────────────────────────────────
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [activeTab, setActiveTab] = useState<"brief" | "running" | "history">("brief");
  const [newRunGoal, setNewRunGoal] = useState("");
  const [isStartingRun, setIsStartingRun] = useState(false);
  const [proactiveSuggestion, setProactiveSuggestion] = useState("");
  const [campaignLog, setCampaignLog] = useState<any[]>([]);
  const [selectedPattern, setSelectedPattern] = useState("roi");
  
  // Guided inputs
  const [selectedPlatform, setSelectedPlatform] = useState("Instagram");
  const [selectedLanguage, setSelectedLanguage] = useState("Hinglish");
  const [selectedTone, setSelectedTone] = useState("Professional");
  const [marketingStage, setMarketingStage] = useState("Awareness");
  const [researchPlatforms, setResearchPlatforms] = useState<string[]>(["LinkedIn", "YouTube"]);

  const [trendingBriefing, setTrendingBriefing] = useState<any[]>([]);
  const [isLoadingTrends, setIsLoadingTrends] = useState(false);

  const [brandInfo, setBrandInfo] = useState({ name: "", niche: "" });

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // ── Poll tasks & memory ─────────────────────────────────────────────
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout;

    // Load dynamic intro context
    fetch("/api/content-brain").then(r => r.json()).then(data => {
      const bn = data?.brandName || "Your Brand";
      const niche = data?.niche || "Your Industry";
      setBrandInfo({ name: bn, niche: niche });
      
      setMessages([{
        role: "assistant",
        content: `Namaste! 🙏 I am **ContentSathi AI**, your autonomous Copilot for **${bn}**. I specialize in ${niche}.\n\nTell me what you want to achieve today — I will handle the research, writing, and platform distribution. Let's grow ${bn} together! 🚀`
      }]);
    }).catch(() => {
      setMessages([{ role: "assistant", content: "Namaste! 🙏 I am **ContentSathi AI**. Ready to produce your next viral campaign!" }]);
    });

    const fetchData = async () => {
      try {
        const memoryRes = await fetch("/api/studio/chat");
        if (memoryRes.ok) {
          const data = await memoryRes.json();
          setCoreMemory((prev) => (prev === "" ? data.memory || "" : prev));
        }
        const tasksRes = await fetch("/api/studio/tasks");
        if (tasksRes.ok) {
          const tData = await tasksRes.json();
          setTasks(tData.tasks || []);
        }
        const proRes = await fetch("/api/studio/proactive");
        if (proRes.ok) {
          const proData = await proRes.json();
          if (proData.proactiveSuggestion)
            setProactiveSuggestion(proData.proactiveSuggestion);
          if (proData.campaignLog) setCampaignLog(proData.campaignLog);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    const fetchTrends = async () => {
      setIsLoadingTrends(true);
      try {
        const res = await fetch("/api/trending");
        if (res.ok) {
          const data = await res.json();
          setTrendingBriefing(data.topics || []);
        }
      } catch {} finally { setIsLoadingTrends(false); }
    };

    fetchData();
    fetchTrends();
    pollingInterval = setInterval(fetchData, 3000);
    return () => clearInterval(pollingInterval);
  }, []);

  // ── Send Chat Message ──────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const msg = chatInput.trim();
    if (!msg || isChatLoading) return;
    setChatInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setIsChatLoading(true);

    try {
      const res = await fetch("/api/studio/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const aiMsg: ChatMessage = {
        role: "assistant",
        content: data.reply,
        memoryUpdated: data.memoryUpdated,
        newRule: data.newRule,
      };
      setMessages((prev) => [...prev, aiMsg]);

      if (data.memoryUpdated && data.currentMemory) {
        setCoreMemory(data.currentMemory);
        setMemoryFlash(true);
        setTimeout(() => setMemoryFlash(false), 2000);
        toast.success("Brand Memory updated! 🧠");
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Maafi karo, kuch error aaya. 🙏 Dobara try karo." },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  }, [chatInput, isChatLoading]);

  // ── Save Edited Memory ─────────────────────────────────────────────
  const saveMemory = async () => {
    setIsSavingMemory(true);
    try {
      await fetch("/api/studio/chat", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memory: editedMemory }),
      });
      setCoreMemory(editedMemory);
      setIsEditingMemory(false);
      toast.success("Brand Memory saved!");
    } catch {
      toast.error("Failed to save.");
    } finally {
      setIsSavingMemory(false);
    }
  };

  // ── Launch Campaign ────────────────────────────────────────────────
  const handleApprove = async (taskId: string, contentId: string, platform: string, content: string) => {
    try {
      const res = await fetch("/api/studio/tasks/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          taskId, 
          contentId, 
          editedText: content,
          action: "approve" 
        })
      });
      if (res.ok) {
        toast.success(`Success! ${platform} post saved to Asset Vault & Calendar. 📅`);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to approve content.");
      }
    } catch {
      toast.error("Error approving content.");
    }
  };

  const startAutonomousJob = async () => {
    if (!newRunGoal.trim()) {
      toast.error("Write your campaign goal first.");
      return;
    }
    // Build structured goal
    const structuredGoal = `Marketing Stage: ${marketingStage}\nPlatform: ${selectedPlatform}\nLanguage: ${selectedLanguage}\nTone: ${selectedTone}\n\nTask: ${newRunGoal}`;

    setIsStartingRun(true);
    try {
      const res = await fetch("/api/studio/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          goal: structuredGoal,
          pattern: selectedPattern,
          deepResearchPlatforms: researchPlatforms
        }),
      });
      if (res.ok) {
        toast.success("🚀 Campaign launched! Your agent team is at work…");
        setNewRunGoal("");
        setActiveTab("running"); // auto-switch to live view
      }
    } catch (err: any) {
      console.error("Launch error:", err);
      toast.error(`Error: ${err.message || "Failed to start campaign"}`);
    } finally {
      setIsStartingRun(false);
    }
  };

  const activeTasks = tasks.filter((t) => t.status === "processing");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Hero Header ─────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 md:p-12 rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }} />
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-indigo-500 rounded-full mix-blend-screen filter blur-[100px] opacity-20 pointer-events-none animate-pulse" />
        <div className="absolute -bottom-10 left-20 w-64 h-64 bg-fuchsia-500 rounded-full mix-blend-screen filter blur-[80px] opacity-15 pointer-events-none animate-pulse" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 backdrop-blur-md mb-4">
              <BrainCircuit className="w-4 h-4 text-indigo-300 animate-pulse" />
              <span className="text-[10px] font-black tracking-widest text-indigo-100 uppercase">7-Agent Autonomous Team</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-3">
              AI{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-indigo-300">
                Studio
              </span>
            </h1>
            <p className="text-indigo-100/90 font-medium text-sm max-w-xl">
              Tell your team what you want to achieve. They&apos;ll handle the research, writing, SEO, visuals, QC, and publishing — end to end.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 px-3 py-2 rounded-xl">
              <Smartphone className="w-4 h-4 text-emerald-300" />
              <span className="text-[11px] font-black text-emerald-300">WhatsApp Briefing Active</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-2 rounded-xl">
              <Shield className="w-4 h-4 text-indigo-300" />
              <span className="text-[11px] font-black text-indigo-200">Full Pipeline Unlocked</span>
            </div>
          </div>
        </div>

        {/* ── Live status bar ── */}
        <div className="relative z-10 mt-8 grid grid-cols-3 gap-3">
          {[
            { label: "Active Now", value: activeTasks.length, icon: Zap, color: "text-indigo-300" },
            { label: "Completed", value: completedTasks.length, icon: CheckCircle2, color: "text-emerald-300" },
            { label: "Campaign Log", value: campaignLog.length, icon: BarChart3, color: "text-fuchsia-300" },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
              <s.icon className={`w-5 h-5 ${s.color}`} />
              <div>
                <p className="text-2xl font-black text-white leading-none">{s.value}</p>
                <p className="text-[10px] text-white/50 font-bold uppercase mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT: Main Content ────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* ── Step Tabs ── */}
          <div className="flex bg-gray-100 p-1.5 rounded-2xl gap-1">
            {[
              { id: "brief", label: "① Brief Your Team", icon: Lightbulb },
              { id: "running", label: `② Live Tasks (${activeTasks.length})`, icon: Play },
              { id: "history", label: `③ Campaign Log (${campaignLog.length})`, icon: BarChart3 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  activeTab === tab.id ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(" ")[1]}</span>
              </button>
            ))}
          </div>

          {/* ═══════════ TAB 1: BRIEF ═══════════ */}
          {activeTab === "brief" && (
            <div className="space-y-6">

              {/* Proactive suggestion banner */}
              {proactiveSuggestion && (
                <div className="bg-gradient-to-r from-indigo-50 to-fuchsia-50 border border-indigo-100 p-5 rounded-[2rem] flex items-start gap-4">
                  <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-1">
                      ContentSathi AI — Suggested Campaign
                    </p>
                    <p className="text-sm font-semibold text-indigo-900">{proactiveSuggestion}</p>
                    <button
                      onClick={() => {
                        setNewRunGoal(proactiveSuggestion.substring(0, 240));
                        toast.success("Suggestion loaded! Review and launch.");
                      }}
                      className="mt-3 text-xs font-black text-indigo-600 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      Use This Suggestion →
                    </button>
                  </div>
                </div>
              )}

              {/* ── Main Campaign Brief Input ── */}
              <div className="bg-white border border-gray-200 p-6 rounded-[2.5rem] shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
                    <BrainCircuit className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-lg leading-tight">Brief Your Agent Team</h3>
                    <p className="text-xs text-gray-400 font-medium">Define your strategy, then describe your specific request.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Platform</label>
                    <select value={selectedPlatform} onChange={e => setSelectedPlatform(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-400">
                      <option value="Instagram">Instagram</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Facebook">Facebook</option>
                      <option value="Twitter">X (Twitter)</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="YouTube Shorts">YouTube Shorts</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Language</label>
                    <select value={selectedLanguage} onChange={e => setSelectedLanguage(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-400">
                      <option value="English">English</option>
                      <option value="Hinglish">Hinglish</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Marathi">Marathi</option>
                      <option value="Bilingual">Bilingual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tone</label>
                    <select value={selectedTone} onChange={e => setSelectedTone(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-400">
                      <option value="Professional & Authoritative">Professional & Authoritative</option>
                      <option value="Aggressive & Urgency">Aggressive & Urgency</option>
                      <option value="Casual & Friendly">Casual & Friendly</option>
                      <option value="Educational & Helpful">Educational & Helpful</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Marketing Stage</label>
                    <select value={marketingStage} onChange={e => setMarketingStage(e.target.value)} className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs font-bold text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-400">
                      <option value="Awareness">Awareness (Top Funnel)</option>
                      <option value="Consideration">Consideration (Mid Funnel)</option>
                      <option value="Conversion">Conversion (Bottom Funnel)</option>
                      <option value="Retention">Retention</option>
                    </select>
                  </div>
                </div>

                <textarea
                  value={newRunGoal}
                  onChange={(e) => setNewRunGoal(e.target.value)}
                  placeholder="Describe your campaign goal. (E.g. Create a holiday offer highlighting the new infrastructure nearby...)"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium resize-none h-28 transition-all"
                />

                <div className="mt-5">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                    Human Buying Pattern (Psychological Trigger)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {BUYING_PATTERNS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPattern(p.id)}
                        className={`flex flex-col items-start gap-1 p-3 rounded-2xl border-2 transition-all ${
                          selectedPattern === p.id 
                            ? "border-indigo-600 bg-indigo-50 shadow-inner" 
                            : "border-gray-50 bg-gray-50/50 hover:border-gray-200"
                        }`}
                      >
                        <span className="text-xl">{p.icon}</span>
                        <p className={`text-[11px] font-black ${selectedPattern === p.id ? "text-indigo-700" : "text-gray-700"}`}>{p.label}</p>
                        <p className="text-[9px] text-gray-400 font-medium leading-tight">{p.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Search className="w-3.5 h-3.5 text-indigo-500" />
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Deep Research Platforms (Scraper Tool)
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "LinkedIn", icon: "🔗" },
                      { id: "YouTube", icon: "📺" },
                      { id: "Instagram", icon: "📸" },
                      { id: "Google Maps", icon: "📍" },
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setResearchPlatforms(prev => 
                            prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id]
                          );
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 transition-all text-[11px] font-bold ${
                          researchPlatforms.includes(p.id)
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"
                        }`}
                      >
                        <span>{p.icon}</span>
                        {p.id}
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-gray-400 mt-2 italic">
                    * Selecting these will trigger real-time scrapers (LinkedIn, YT API) for deeper insights.
                  </p>
                </div>

                <div className="flex items-center justify-between mt-6 gap-3 pt-6 border-t border-gray-100">
                  <p className="text-xs text-gray-400 font-medium">
                    💡 The AI team will adapt the hooks and emotional triggers based on your selection.
                  </p>
                  <button
                    onClick={startAutonomousJob}
                    disabled={isStartingRun || !newRunGoal.trim()}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-6 py-3 font-bold text-sm transition-all shadow-md shadow-indigo-200 disabled:opacity-50 shrink-0"
                  >
                    {isStartingRun ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-current" />
                        Launch Campaign
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* ── Quick Templates ── */}
              <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-orange-600" />
                    <h3 className="font-black text-gray-900 text-sm">Start from a Template</h3>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">Click to pre-fill your goal</span>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {BRIEF_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.label}
                      onClick={() => {
                        setNewRunGoal(tpl.goal);
                        toast.success(`Template loaded: ${tpl.label}`);
                      }}
                      className="w-full flex items-start gap-3 p-3 bg-gray-50 hover:bg-orange-50 hover:border-orange-100 border border-transparent rounded-2xl text-left transition-all group"
                    >
                      <span className="text-lg shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                        {tpl.icon}
                      </span>
                      <div className="flex-1">
                        <p className="text-xs font-black text-gray-800">{tpl.label}</p>
                        <span className="text-[9px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded-full inline-block mt-1">
                          {tpl.tag}
                        </span>
                        <p className="text-[9px] text-gray-500 mt-1 line-clamp-2 leading-tight">
                          {tpl.goal}
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-orange-500 ml-auto mt-0.5 transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ TAB 2: RUNNING ═══════════ */}
          {activeTab === "running" && (
            <div className="space-y-4">
              {tasks.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm text-center py-16">
                  <BrainCircuit className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500 font-bold">No active campaigns yet.</p>
                  <p className="text-gray-400 text-sm font-medium mt-1">
                    Go to{" "}
                    <button
                      onClick={() => setActiveTab("brief")}
                      className="text-indigo-600 font-black hover:underline"
                    >
                      Brief Your Team
                    </button>{" "}
                    to get started.
                  </p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`border-2 rounded-[2rem] bg-white overflow-hidden transition-all duration-500 shadow-sm ${
                      task.status === "processing"
                        ? "border-indigo-400 shadow-indigo-100/50 shadow-xl"
                        : task.status === "completed"
                        ? "border-emerald-300"
                        : "border-red-300"
                    }`}
                  >
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black ${
                            task.source === "whatsapp" ? "bg-emerald-500" : "bg-indigo-500"
                          }`}
                        >
                          {task.source === "whatsapp" ? (
                            <Smartphone className="w-5 h-5" />
                          ) : (
                            <Zap className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                           <div className="flex flex-wrap gap-1 mb-1">
                             {task.goal.includes("Platform:") && (
                               <span className="text-[8px] font-black bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md uppercase">
                                 {task.goal.split("Platform:")[1].split("\n")[0].trim()}
                               </span>
                             )}
                             {task.goal.includes("Stage:") && (
                               <span className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md uppercase">
                                 {task.goal.split("Stage:")[1].split("\n")[0].trim()}
                               </span>
                             )}
                           </div>
                           <h4 className="font-black text-gray-900 text-sm leading-tight group relative cursor-help">
                             {(() => {
                               const cleaned = task.goal.includes("Task:") 
                                 ? task.goal.split("Task:")[1].trim()
                                 : task.goal.split(/Tone:\s*[^\s]+\s*/i).pop()?.trim() || task.goal;
                               return stripMarkdown(cleaned).length > 80 
                                 ? stripMarkdown(cleaned).substring(0, 80) + "…" 
                                 : stripMarkdown(cleaned);
                             })()}
                             <span className="absolute z-50 invisible group-hover:visible bg-slate-900 text-white p-3 rounded-xl w-64 -left-2 top-full mt-2 text-[10px] font-medium shadow-2xl border border-white/10 leading-relaxed pointer-events-none">
                               <span className="block font-black text-indigo-400 mb-2 border-b border-white/10 pb-1">Full Brief Input:</span>
                               {task.goal}
                              </span>
                           </h4>
                           <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                             {task.source === "whatsapp" ? "📱 WhatsApp" : "💻 Web"} ·{" "}
                             {new Date(task.createdAt).toLocaleTimeString()}
                           </p>
                         </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {task.status === "processing" && (
                          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg">
                            <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                            <span className="text-[10px] font-black text-indigo-700 tracking-wide uppercase">
                              {task.currentAgent}
                            </span>
                          </div>
                        )}
                        {task.status === "completed" && (
                          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="text-[10px] font-black text-emerald-700">Done</span>
                          </div>
                        )}
                        {task.status === "failed" && (
                          <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <span className="text-[10px] font-black text-red-600">Failed</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white px-5 py-6 border-b border-gray-100">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest">
                        <span>Live Agent Pipeline</span>
                        <span className={task.status === "completed" ? "text-emerald-600" : "text-indigo-600"}>{task.progress}% Overall Progress</span>
                      </div>
                      <div className="flex flex-wrap sm:flex-nowrap items-start justify-between gap-1 relative">
                        {[
                          { name: "Brief", role: "Content Lead", p: 5, icon: "🧠" },
                          { name: "Research", role: "Search", p: 14, icon: "🔍" },
                          { name: "Copy", role: "Writer", p: 38, icon: "✍️" },
                          { name: "SEO", role: "Optimizer", p: 52, icon: "🎯" },
                          { name: "Visuals", role: "Designer", p: 65, icon: "🎨" },
                          { name: "QC", role: "Auditor", p: 78, icon: "✅" },
                          { name: "Dispatch", role: "Distributor", p: 90, icon: "🚀" },
                        ].map((step, idx, arr) => {
                          const nextP = arr[idx + 1]?.p || 100;
                          const isDone = task.progress >= nextP || task.status === "completed";
                          const isActive = task.progress >= step.p && task.progress < nextP && task.status === "processing";
                          const isPending = !isDone && !isActive;

                          return (
                            <div key={step.name} className="flex-1 flex flex-col items-center gap-2 relative z-10 w-[14%]">
                              {/* Connector line behind */}
                              {idx < arr.length - 1 && (
                                <div className={`hidden sm:block absolute top-5 left-[50%] w-full h-1 -mt-[2px] -z-10 rounded-r-full ${
                                  isDone ? "bg-emerald-100" : "bg-gray-100"
                                }`}>
                                  {isActive && (
                                    <div className="h-full bg-indigo-400 animate-pulse rounded-r-full w-full" style={{ width: '50%' }} />
                                  )}
                                </div>
                              )}
                              
                              {/* Icon node */}
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg relative transition-all duration-500 shadow-sm ${
                                isDone ? "bg-emerald-50 border border-emerald-200" :
                                isActive ? "bg-indigo-600 text-white shadow-indigo-300 shadow-lg scale-110 -translate-y-1" :
                                "bg-gray-50 border border-gray-100 opacity-60 grayscale"
                              }`}>
                                 {isActive && <div className="absolute -inset-1 bg-indigo-500 rounded-2xl opacity-20 animate-ping" />}
                                 <span className="relative z-10 drop-shadow-sm">{step.icon}</span>
                              </div>
                              
                              {/* Text labels */}
                              <div className={`text-center transition-all ${isActive ? "opacity-100 translate-y-1" : "opacity-80"} w-full`}>
                                 <p className={`text-[10px] font-black uppercase tracking-wider truncate mb-0.5 ${isActive ? "text-indigo-600" : isDone ? "text-emerald-700" : "text-gray-400"}`}>{step.name}</p>
                                 <p className={`text-[8px] font-bold text-gray-400 truncate hidden md:block`}>{step.role}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-5 flex flex-col md:flex-row gap-6">
                      <div className="flex-1 space-y-2 max-h-48 overflow-y-auto pr-2">
                        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 border-b pb-1">
                          Agent Logs
                        </h5>
                        {task.logs.slice().reverse().map((log: any, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-gray-700 font-medium">
                            <ChevronRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                            <span className="leading-snug">{log.message}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex-1 border-l pl-6 space-y-4 max-h-[32rem] overflow-y-auto custom-scrollbar pr-2">
                        {task.deepResearchData && (
                          <div>
                            <h5 className="flex items-center gap-1.5 text-[10px] font-black text-fuchsia-600 uppercase tracking-widest mb-2 border-b pb-1">
                              <TrendingUp className="w-3.5 h-3.5" /> Research Insight
                            </h5>
                            <div className="bg-fuchsia-50/50 p-3 rounded-xl border border-fuchsia-100">
                              <MarkdownContent
                                content={task.deepResearchData.insights || ""}
                                compact
                              />
                            </div>
                          </div>
                        )}
                        {task.generatedContent && (
                          <div className="space-y-4">
                            <h5 className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 border-b pb-1">
                              <Target className="w-3.5 h-3.5" /> Generated Content
                            </h5>
                            <div className="flex flex-col gap-4">
                              {Array.isArray(task.generatedContent) ? task.generatedContent.map((c: any) => (
                                <div key={c.id} className="bg-emerald-50/30 border border-emerald-100 p-4 rounded-2xl shadow-sm">
                                  <div className="flex items-center justify-between mb-3 border-b border-emerald-100/50 pb-2">
                                    <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200">
                                      {c.platform || "GENERAL"}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <button 
                                        onClick={() => handleApprove(task.id, c.id, c.platform, c.text)}
                                        className="text-[9px] font-black uppercase bg-white border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1.5 shadow-sm"
                                      >
                                        <Clock className="w-3.5 h-3.5" /> Approve
                                      </button>
                                      <button 
                                        onClick={() => setPublishingPost({ body: c.text, platform: c.platform })}
                                        className="text-[9px] font-black uppercase bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-sm"
                                      >
                                        <Send className="w-3.5 h-3.5" /> Publish
                                      </button>
                                    </div>
                                  </div>
                                  <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                    <MarkdownContent content={c.text || ""} compact />
                                  </div>
                                </div>
                              )) : (
                                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs italic">
                                  Content structure is invalid.
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ═══════════ TAB 3: HISTORY ═══════════ */}
          {activeTab === "history" && (
            <div className="space-y-4">
              {campaignLog.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm text-center py-16">
                  <BarChart3 className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500 font-bold">No completed campaigns yet.</p>
                  <p className="text-gray-400 text-sm font-medium mt-1">
                    Completed campaigns will appear here with performance metrics.
                  </p>
                </div>
              ) : (
                campaignLog.map((log: any, i: number) => (
                  <div key={i} className="bg-white border border-gray-100 rounded-[2rem] p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <p className="text-[9px] font-black uppercase text-gray-400 mb-1">
                          {log.completedAt ? new Date(log.completedAt).toLocaleDateString() : "Unknown date"}
                        </p>
                        <h4 className="font-black text-gray-900 text-sm">{log.goal}</h4>
                      </div>
                      <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase px-2 py-1 rounded-full border border-emerald-100 shrink-0">
                        Completed
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-[9px] font-black uppercase text-gray-400">Formats</p>
                        <p className="font-bold text-gray-700 text-xs mt-1">
                          {(log.formats || []).join(", ")}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-[9px] font-black uppercase text-gray-400">Agent Redirects</p>
                        <p className="font-bold text-gray-700 text-xs mt-1">
                          {log.dynamicRedirects?.length || 0}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-[9px] font-black uppercase text-gray-400">QC Result</p>
                        <p className={`font-bold text-xs mt-1 ${log.needsRevision ? "text-amber-600" : "text-emerald-600"}`}>
                          {log.needsRevision ? "Revised" : "✓ Passed"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT SIDEBAR ────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* ── Market Briefing Card ───────────── */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2.5rem] p-6 text-white border border-indigo-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[80px] opacity-20 -mr-16 -mt-16 pointer-events-none" />
            
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-indigo-300" />
              <h3 className="text-sm font-black uppercase tracking-widest text-indigo-100">Nagpur Intelligence</h3>
            </div>

            {isLoadingTrends ? (
               <div className="flex items-center justify-center py-8">
                 <Loader2 className="w-5 h-5 text-indigo-300 animate-spin" />
               </div>
            ) : trendingBriefing.length > 0 ? (
               <div className="space-y-4">
                 {trendingBriefing.slice(0, 2).map((trend, i) => (
                    <div key={i} className="group cursor-help">
                      <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">{trend.platform} TREND</p>
                      <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors leading-snug">{trend.title}</p>
                      <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">{trend.angle}</p>
                    </div>
                 ))}
                 <button className="w-full mt-2 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                    View Full Briefing →
                 </button>
               </div>
            ) : (
               <p className="text-[10px] text-indigo-300/60 font-medium">Scanning local corridors for market signals...</p>
            )}
          </div>
          <div
            className={`bg-white border-2 rounded-[2.5rem] shadow-sm overflow-hidden transition-all duration-500 ${
              memoryFlash ? "border-green-400 shadow-green-100 shadow-lg" : "border-gray-100"
            }`}
          >
            <button
              className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-indigo-50"
              onClick={() => setShowMemoryPanel((p) => !p)}
            >
              <div className="flex items-center gap-2 flex-1 overflow-hidden">
                <BookOpen className="w-4 h-4 text-violet-600 shrink-0" />
                <h3 className="font-black text-gray-900 text-sm shrink-0">Brand Memory</h3>
                <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[9px] font-black uppercase tracking-wider shrink-0">
                  soul.md
                </span>
                <p className="text-[10px] text-gray-400 truncate opacity-70 ml-1">
                  {coreMemory ? stripMarkdown(coreMemory) : "No memory saved yet..."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!isEditingMemory ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingMemory(true);
                      setEditedMemory(coreMemory);
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        saveMemory();
                      }}
                      disabled={isSavingMemory}
                      className="p-1.5 rounded-lg bg-green-100 text-green-600"
                    >
                      {isSavingMemory ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingMemory(false);
                      }}
                      className="p-1.5 rounded-lg bg-red-50 text-red-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <ChevronRight
                  className={`w-4 h-4 text-gray-400 transition-transform ${showMemoryPanel ? "rotate-90" : ""}`}
                />
              </div>
            </button>

            {showMemoryPanel && (
              <div className="p-4">
                {!isEditingMemory ? (
                  <div className="text-xs text-gray-600 font-mono leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                    {coreMemory || (
                      <span className="text-gray-400 italic">
                        No brand memory yet. Chat with your AI team to build it.
                      </span>
                    )}
                  </div>
                ) : (
                  <textarea
                    value={editedMemory}
                    onChange={(e) => setEditedMemory(e.target.value)}
                    className="w-full h-[360px] text-xs font-mono text-gray-700 bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                  />
                )}
              </div>
            )}
          </div>

          {/* ── AI Chat — Instruct the Team ─────── */}
          <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm flex flex-col h-[480px] overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-fuchsia-50">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-600" />
                <h3 className="font-black text-gray-900 text-sm">Instruct Your Team</h3>
              </div>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                Give standing instructions or update your brand rules.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      msg.role === "assistant"
                        ? "bg-gradient-to-br from-indigo-600 to-fuchsia-600"
                        : "bg-gray-200"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <BrainCircuit className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-gray-600" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                      msg.role === "assistant"
                        ? "bg-gray-50 border border-gray-100 text-gray-800 rounded-bl-sm"
                        : "bg-indigo-600 text-white rounded-br-sm"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-xs max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex items-center gap-1.5 p-2">
                  <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                  <span className="text-xs font-bold text-gray-400">Team is thinking…</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            <div className="p-3 border-t border-gray-100">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-400 transition-all">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="E.g. From now on, always emphasise RERA trust…"
                  className="flex-1 bg-transparent outline-none resize-none text-xs text-gray-800 placeholder:text-gray-400 max-h-24 font-medium"
                  rows={1}
                  disabled={isChatLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!chatInput.trim() || isChatLoading}
                  className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-md disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ── Strategic Goals ─────────────────── */}
          <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h3 className="font-black text-gray-900 text-sm">Strategic Roadmap</h3>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {[
                {
                  horizon: "12 Weeks",
                  color: "bg-amber-500",
                  items: [
                    "4–6 active channels ranked & optimized",
                    "Establish daily automated posting rhythm",
                    "Baseline engagement metrics captured",
                  ],
                },
                {
                  horizon: "6 Months",
                  color: "bg-blue-500",
                  items: [
                    "Golden Loop mirroring highest-performing hooks",
                    "Live market signal integration",
                    "<5% revision rate across all agents",
                  ],
                },
                {
                  horizon: "12 Months",
                  color: "bg-violet-500",
                  items: [
                    "Full cross-channel omni-presence",
                    "Optimized conversion tracking via CRM",
                    "Hyper-localized dialect engines activated",
                  ],
                },
              ].map((goal) => (
                <div key={goal.horizon} className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${goal.color} shrink-0`} />
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                      {goal.horizon}
                    </p>
                  </div>
                  {goal.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 mb-1">
                      <span className="text-gray-300 text-xs mt-0.5 shrink-0">·</span>
                      <p className="text-[10px] font-medium text-gray-600 leading-snug">{item}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {publishingPost && (
        <PublishModal 
          post={publishingPost} 
          onClose={() => setPublishingPost(null)}
          onSuccess={(url) => {
            // handle success if necessary
          }}
        />
      )}
    </div>
  );
}
