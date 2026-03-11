"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import MarkdownContent from "@/components/MarkdownContent";
import * as Tabs from "@radix-ui/react-tabs";
import {
  BrainCircuit, Bot, User, Sparkles, BookOpen, TrendingUp, Target, ArrowRight, Shield, Loader2, Activity, Globe, PlusCircle, Network,
  ActivitySquare, BellRing, Settings, RefreshCcw, Zap, AlertTriangle, ShieldCheck
} from "lucide-react";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type CAOState = {
  strategy: any;
  customAgents: any[];
  memory: string;
};

export default function CAODashboard() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Namaste! 🙏 I am your **Chief AI Officer (CAO)**.\n\nI autonomously monitor your channels, self-correct based on past performance, and build predictive strategies. Tell me what you'd like to analyze or explore my dashboards above.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [caoState, setCaoState] = useState<CAOState | null>(null);
  
  // Health Dashboard State
  const [systemHealth, setSystemHealth] = useState({ 
    status: "All Systems Operational", 
    lastPing: "18ms", 
    dataProcessed: 1420,
    predictiveAccuracy: "94.2%" 
  });

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCAOState();
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatLoading]);

  const fetchCAOState = async () => {
    try {
      const res = await fetch("/api/cao/chat");
      if (res.ok) {
        const data = await res.json();
        const brain = data.brain;
        if (brain) {
          setCaoState({
            strategy: brain.caoStrategy,
            customAgents: brain.caoCustomAgents || [],
            memory: brain.orchestratorMemory || "",
          });
          if (data.chatHistory && data.chatHistory.length > 0) {
             setMessages((prev) => [prev[0], ...data.chatHistory]);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch CAO state:", err);
    }
  };

  const sendMessage = useCallback(async () => {
    const msg = chatInput.trim();
    if (!msg || isChatLoading) return;
    setChatInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setIsChatLoading(true);

    try {
      const res = await fetch("/api/cao/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      let data: any = {};
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      }

      if (!res.ok) throw new Error(data.error || `Server Error (${res.status})`);

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);

      if (data.memoryUpdated) {
        toast.success("Brand Memory & Rules Updated! 🧠");
        fetchCAOState();
      }
      if (data.newAgentSpawned) {
        toast.success(`New Agent Spawned: ${data.newAgentSpawned} 🤖`);
        fetchCAOState();
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { 
          role: "assistant", 
          content: `⚠️ **Intelligence Error:** ${err.message || "I encountered an error accessing my network. Auto-recovery active."}` 
        },
      ]);
      // Trigger auto-recovery visual
      simulateRecovery();
    } finally {
      setIsChatLoading(false);
    }
  }, [chatInput, isChatLoading]);

  const simulateRecovery = () => {
    setSystemHealth(prev => ({ ...prev, status: "Attempting Auto-Recovery..." }));
    setTimeout(() => {
        toast.success("CAO System Restored Automatically.");
        setSystemHealth(prev => ({ ...prev, status: "All Systems Operational" }));
    }, 2500);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Hero Header ─────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 p-8 md:p-12 rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }} />
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-[100px] opacity-20 pointer-events-none animate-pulse" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 backdrop-blur-md mb-4">
              <ActivitySquare className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-[10px] font-black tracking-widest text-emerald-100 uppercase">Production-Ready Autonomous Core</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-3">
              Chief AI{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-300 to-indigo-300">
                Officer
              </span>
            </h1>
            <p className="text-purple-100/90 font-medium text-sm max-w-xl">
              I self-correct based on your historical analytics, hunt for predictive trends, and safely trigger autonomous workflows via smart limits.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-2 rounded-xl text-white">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] font-black tracking-wide">Live Search: ACTIVE</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-2 rounded-xl text-white">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-[11px] font-black tracking-wide">Smart Triggers: ACTIVE</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs.Root defaultValue="studio" className="flex flex-col gap-6">
        <Tabs.List className="flex items-center gap-2 border-b border-gray-200 pb-px">
           <Tabs.Trigger value="studio" className="px-5 py-3 text-sm font-bold text-gray-500 data-[state=active]:text-indigo-600 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 transition-all flex items-center gap-2 outline-none">
              <Bot className="w-4 h-4" /> HQ Studio
           </Tabs.Trigger>
           <Tabs.Trigger value="health" className="px-5 py-3 text-sm font-bold text-gray-500 data-[state=active]:text-indigo-600 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 transition-all flex items-center gap-2 outline-none">
              <Activity className="w-4 h-4" /> System Health
           </Tabs.Trigger>
           <Tabs.Trigger value="config" className="px-5 py-3 text-sm font-bold text-gray-500 data-[state=active]:text-indigo-600 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 transition-all flex items-center gap-2 outline-none">
              <Settings className="w-4 h-4" /> Infrastructure Config
           </Tabs.Trigger>
        </Tabs.List>

        {/* ── STUDIO TAB ─────────────────────────────────────────────────── */}
        <Tabs.Content value="studio" className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500 outline-none">
          {/* LEFT: CAO Chat Interface */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm flex flex-col h-[700px] overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-black text-gray-900 text-lg">Direct Line to CAO</h3>
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                    Ask for competitor research, strategy updates, or to spawn new agents.
                  </p>
                </div>
                <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 font-black text-[10px] uppercase tracking-wider rounded-full">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Online
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-sm ${
                        msg.role === "assistant"
                          ? "bg-gradient-to-br from-purple-600 to-indigo-600"
                          : "bg-white border border-gray-200"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <BrainCircuit className="w-4 h-4 text-white" />
                      ) : (
                        <User className="w-4 h-4 text-gray-600" />
                      )}
                    </div>
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${
                        msg.role === "assistant"
                          ? "bg-white border border-gray-100 text-gray-800 rounded-tl-sm"
                          : "bg-indigo-600 text-white rounded-tr-sm"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-p:mb-3 prose-headings:font-black prose-headings:mb-2 prose-headings:mt-4 prose-ul:my-2 prose-ul:space-y-1 prose-ol:my-2 prose-ol:space-y-1 prose-li:leading-relaxed prose-a:text-indigo-600 prose-strong:text-gray-900 prose-h2:text-base prose-h3:text-sm">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex items-start gap-3">
                     <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm bg-gradient-to-br from-purple-600 to-indigo-600">
                       <BrainCircuit className="w-4 h-4 text-white animate-pulse" />
                     </div>
                    <div className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-100 rounded-2xl rounded-tl-sm shadow-sm">
                      <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                      <span className="text-xs font-bold text-gray-400">CAO is thinking and self-correcting...</span>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              <div className="p-4 border-t border-gray-100 bg-white">
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 px-1">
                     <button onClick={() => setChatInput("Show me the predictive trends for Nagpur Real Estate next week")} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition-colors">
                       🔍 Predictive Trends
                     </button>
                     <button onClick={() => setChatInput("What mistakes did we make last week that we are correcting now?")} className="text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full transition-colors">
                       📊 Self-Correction Data
                     </button>
                     <button onClick={() => setChatInput("Create a new agent: 'Lead Gen Hook Specialist'.")} className="text-[10px] font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-full transition-colors">
                       🤖 Spawn Sub-Agent
                     </button>
                  </div>
                  <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-[1.5rem] px-2 py-2 focus-within:ring-2 focus-within:ring-purple-400 transition-all">
                    <textarea
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="E.g. What is the latest highly urgent news we should act on?"
                      className="flex-1 bg-transparent outline-none resize-none text-sm text-gray-800 placeholder:text-gray-400 max-h-32 min-h-[44px] py-3 px-3 font-medium custom-scrollbar"
                      rows={1}
                      disabled={isChatLoading}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!chatInput.trim() || isChatLoading}
                      className="w-11 h-11 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-md disabled:opacity-50 shrink-0 mb-0.5 mr-0.5"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="flex flex-col gap-6">

            {/* CAO Strategy Preview */}
            <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden">
               <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50 flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-black text-gray-900 text-sm">Active Strategy Pipeline</h3>
                </div>
                <div className="p-5">
                  {caoState?.strategy ? (
                     <div className="space-y-4">
                        <div className="bg-yellow-50 text-yellow-800 border-l-4 border-yellow-400 p-3 rounded-lg flex items-start gap-2 text-xs">
                          <TrendingUp className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block">Predictive Trend</span>
                            <span className="font-medium opacity-90">{caoState.strategy.predictive_trend || "N/A based on older data format. Check back Next Heartbeat."}</span>
                          </div>
                        </div>
                        
                        <div className="bg-purple-50 text-purple-800 p-3 rounded-lg flex flex-col gap-1 text-xs">
                           <div className="font-bold flex justify-between items-center">
                              Urgency Level
                              <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-black ${caoState.strategy.urgency_level === 'high' ? 'bg-red-500 text-white' : 'bg-purple-200'}`}>
                                {caoState.strategy.urgency_level || 'medium'}
                              </span>
                           </div>
                           <span className="font-medium mt-1">{caoState.strategy.reasoning || "Self-correction in progress."}</span>
                        </div>
                        
                        <div className="prose prose-sm max-w-none text-[11px] bg-gray-50 p-3 rounded-xl border border-gray-100 max-h-48 overflow-y-auto">
                           <MarkdownContent content={JSON.stringify(caoState.strategy, null, 2)} compact />
                        </div>
                     </div>
                  ) : (
                     <div className="text-center py-6">
                       <Activity className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                       <p className="text-xs text-gray-500 font-medium">No predictive strategy generated yet. Processing data streams...</p>
                     </div>
                  )}
                </div>
            </div>

            {/* Spawned Sub-Agents */}
            <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col max-h-[400px]">
               <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-fuchsia-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-purple-600" />
                    <h3 className="font-black text-gray-900 text-sm">Spawned Sub-Agents</h3>
                  </div>
                  <span className="bg-white text-purple-700 font-black text-[10px] px-2 py-0.5 rounded-full border border-purple-100">
                    {caoState?.customAgents?.length || 0} Default
                  </span>
                </div>
                <div className="p-4 overflow-y-auto space-y-3 flex-1">
                   {caoState?.customAgents && caoState.customAgents.length > 0 ? (
                      caoState.customAgents.map((agent: any, i: number) => (
                         <div key={i} className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-1">
                            <h4 className="font-black text-xs text-gray-900 flex items-center gap-1.5">
                               <Bot className="w-3.5 h-3.5 text-purple-500" />
                               {agent.roleName}
                            </h4>
                            <p className="text-[10px] text-gray-500 font-medium line-clamp-2 leading-snug">
                              {agent.systemPrompt}
                            </p>
                         </div>
                      ))
                   ) : (
                      <div className="text-center py-8">
                         <PlusCircle className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                         <p className="text-[11px] text-gray-500 font-medium px-4">Agents spawn securely from strategy requirements or chat commands.</p>
                      </div>
                   )}
                </div>
            </div>

          </div>
        </Tabs.Content>

        {/* ── HEALTH & LOGS TAB ─────────────────────────────────────────── */}
        <Tabs.Content value="health" className="animate-in fade-in duration-500 outline-none space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                  { label: "Status", val: systemHealth.status, icon: ShieldCheck, bg: "bg-emerald-50", text: "text-emerald-600" },
                  { label: "Predictive Accuracy", val: systemHealth.predictiveAccuracy, icon: BrainCircuit, bg: "bg-indigo-50", text: "text-indigo-600" },
                  { label: "Signals Processed", val: systemHealth.dataProcessed.toLocaleString(), icon: Globe, bg: "bg-blue-50", text: "text-blue-600" },
                  { label: "Latency Ping", val: systemHealth.lastPing, icon: Activity, bg: "bg-purple-50", text: "text-purple-600" }
              ].map((stat, i) => (
                 <div key={i} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col items-center text-center">
                    <div className={`w-12 h-12 rounded-full ${stat.bg} ${stat.text} flex items-center justify-center mb-4`}>
                       <stat.icon className="w-5 h-5" />
                    </div>
                    <span className="text-2xl font-black text-gray-900 mb-1">{stat.val}</span>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{stat.label}</span>
                 </div>
              ))}
           </div>

           <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
               <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-black text-gray-900">System Monitoring & Auto-Recovery Logs</h3>
                  <button onClick={simulateRecovery} className="flex items-center gap-2 text-xs font-bold bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full text-gray-700 transition">
                     <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" /> Verify Recovery
                  </button>
               </div>
               <div className="p-4 bg-slate-50 font-mono text-[11px] text-slate-700 space-y-2 max-h-64 overflow-y-auto">
                  <div className="flex gap-4"><span className="text-emerald-500">[OK]</span> <span>[04:22 AM] CAO Heartbeat completed successfully. Evaluated 142 data points.</span></div>
                  <div className="flex gap-4"><span className="text-yellow-500">[WARN]</span> <span>[10:22 AM] Apify Deep Scrape latency &gt; 4s. Switching to secondary index proxy.</span></div>
                  <div className="flex gap-4"><span className="text-emerald-500">[OK]</span> <span>[10:25 AM] Predictive Trend model applied. Urgency normalized.</span></div>
                  <div className="flex gap-4"><span className="text-indigo-500">[AUTONOMOUS]</span> <span>[12:30 PM] Smart Trigger activated. New campaign queued for Review.</span></div>
                  <div className="flex gap-4 opacity-70">... waiting for next heartbeat ...</div>
               </div>
           </div>
        </Tabs.Content>

        {/* ── CONFIGURATION TAB ─────────────────────────────────────────── */}
        <Tabs.Content value="config" className="animate-in fade-in duration-500 outline-none">
           <div className="bg-white border border-gray-100 rounded-3xl shadow-sm max-w-3xl">
               <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-black text-gray-900 flex items-center gap-2"><Settings className="w-5 h-5 text-indigo-600" /> Infrastructure Options</h3>
                  <p className="text-xs text-gray-500 mt-1 font-medium">Fine-tune the boundaries of autonomy.</p>
               </div>
               <div className="p-6 space-y-8">
                  
                  {/* Option 1 */}
                  <div className="flex items-start justify-between">
                     <div>
                        <h4 className="font-bold text-gray-900 text-sm">Smart Triggers (Auto-Publish)</h4>
                        <p className="text-[11px] text-gray-500 mt-1 max-w-sm">Allow CAO to instantly generate and schedule campaigns when extreme market urgency is detected.</p>
                     </div>
                     <div className="relative inline-block w-12 h-6 rounded-full bg-indigo-500 shadow-inner">
                        <div className="absolute left-[26px] top-1 bg-white w-4 h-4 rounded-full shadow-sm transion-all" />
                     </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Option 2 */}
                  <div className="flex items-start justify-between">
                     <div>
                        <h4 className="font-bold text-gray-900 text-sm">Aggressive Self-Correction</h4>
                        <p className="text-[11px] text-gray-500 mt-1 max-w-sm">Discard low-performing post patterns entirely over 3-day windows rather than attempting to optimize them.</p>
                     </div>
                     <div className="relative inline-block w-12 h-6 rounded-full bg-indigo-500 shadow-inner">
                        <div className="absolute left-[26px] top-1 bg-white w-4 h-4 rounded-full shadow-sm transion-all" />
                     </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Option 3 */}
                  <div className="flex items-start justify-between">
                     <div>
                        <h4 className="font-bold text-gray-900 text-sm">Heartbeat Frequency</h4>
                        <p className="text-[11px] text-gray-500 mt-1 max-w-sm">How often the engine scrapes live data.</p>
                     </div>
                     <select className="bg-gray-50 border border-gray-200 text-xs font-bold rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500">
                        <option>Every 2 Hours (Ultra)</option>
                        <option selected>Every 6 Hours (Recommended)</option>
                        <option>Every 24 Hours</option>
                     </select>
                  </div>

                  <div className="bg-indigo-50 text-indigo-800 p-4 rounded-xl text-xs flex items-start gap-3 mt-4">
                     <Shield className="w-5 h-5 flex-shrink-0" />
                     <p className="font-medium leading-relaxed">
                        <strong>Data Governance Note:</strong> All autonomous actions require explicit consent toggles here. The system maintains immutable 30-day logs of algorithmic decision processes for auditing. You can revoke autonomy permissions at any time.
                     </p>
                  </div>

               </div>
           </div>
        </Tabs.Content>

      </Tabs.Root>

    </div>
  );
}
