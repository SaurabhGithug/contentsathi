"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  Loader2,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ChevronRight,
  TrendingUp,
  Target
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

// Represents the autonomous background task stored in DB
type AgentTask = {
  id: string;
  goal: string;
  source: string; // whatsapp, web
  status: "processing" | "completed" | "failed";
  progress: number;
  currentAgent: string;
  deepResearchData?: any;
  generatedContent?: any;
  logs: { time: string; message: string }[];
  createdAt: string;
};

export default function AgenticOrchestrator() {
  // ── Chat State ─────────────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Namaste! 🙏 Main hoon aapka AI Co-Founder. Mujhe WhatsApp se command do (e.g. 'Generate NRI leads for bespoke flats'), ya yahan direct type karo. Main background me sab handle karunga.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  // ── Core Memory State ──────────────────────────────────────────────
  const [coreMemory, setCoreMemory] = useState<string>("");
  const [isEditingMemory, setIsEditingMemory] = useState(false);
  const [editedMemory, setEditedMemory] = useState<string>("");
  const [isSavingMemory, setIsSavingMemory] = useState(false);
  const [memoryFlash, setMemoryFlash] = useState(false);

  // ── Queue & Autonomous Runs ─────────────────────────────────────────
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [activeTab, setActiveTab] = useState<"chat" | "queue" | "history">("queue");
  const [newRunGoal, setNewRunGoal] = useState("");
  const [isStartingRun, setIsStartingRun] = useState(false);
  const [proactiveSuggestion, setProactiveSuggestion] = useState("");
  const [campaignLog, setCampaignLog] = useState<any[]>([]);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  // Poll tasks & memory
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout;

    const fetchData = async () => {
      try {
        // Fetch Memory (only init once)
        const memoryRes = await fetch("/api/studio/chat");
        if (memoryRes.ok) {
          const data = await memoryRes.json();
          setCoreMemory((prev) => prev === "" ? (data.memory || "") : prev);
        }
        // Fetch background queue
        const tasksRes = await fetch("/api/studio/tasks");
        if (tasksRes.ok) {
          const tData = await tasksRes.json();
          setTasks(tData.tasks || []);
        }
        // Fetch proactive suggestion
        const proRes = await fetch("/api/studio/proactive");
        if (proRes.ok) {
          const proData = await proRes.json();
          if (proData.proactiveSuggestion) setProactiveSuggestion(proData.proactiveSuggestion);
          if (proData.campaignLog) setCampaignLog(proData.campaignLog);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    fetchData();
    pollingInterval = setInterval(fetchData, 3000); // Live sync every 3 seconds

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
        toast.success("Core Memory updated! 🧠");
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Maafi karo, server timeout. 🙏" },
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
      toast.success("Core Memory saved!");
    } catch {
      toast.error("Failed to save.");
    } finally {
      setIsSavingMemory(false);
    }
  };

  // ── Spawn Web Autonomous Run ───────────────────────────────────────
  const startAutonomousJob = async () => {
    if (!newRunGoal.trim()) {
      toast.error("Enter a lead generation goal first.");
      return;
    }
    setIsStartingRun(true);
    try {
      const res = await fetch("/api/studio/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: newRunGoal }),
      });
      if (res.ok) {
        toast.success("Background autonomous run launched! Queueing...");
        setNewRunGoal("");
      }
    } catch {
      toast.error("Failed to start job.");
    } finally {
      setIsStartingRun(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Hero ────────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 md:p-12 rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }} />
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-indigo-500 rounded-full mix-blend-screen filter blur-[100px] opacity-20 pointer-events-none animate-pulse" />
        <div className="absolute -bottom-10 left-20 w-64 h-64 bg-fuchsia-500 rounded-full mix-blend-screen filter blur-[80px] opacity-15 pointer-events-none animate-pulse" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 backdrop-blur-md mb-4">
              <BrainCircuit className="w-4 h-4 text-indigo-300 animate-pulse" />
              <span className="text-[10px] font-black tracking-widest text-indigo-100 uppercase">Fully Autonomous Agency Team</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-3">
              Content <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-indigo-300">Studio</span>
            </h1>
            <p className="text-indigo-100/90 font-medium text-sm max-w-xl">
              Tell your Content Lead what you want to achieve. The 7-agent team will autonomously run deep research, create briefs, design images, and generate ready-to-publish content across your channels.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 bg-green-500/20 border border-green-400/30 px-3 py-2 rounded-xl">
              <Smartphone className="w-4 h-4 text-green-300" />
              <span className="text-[11px] font-black text-green-300">WhatsApp Webhook Active</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-2 rounded-xl">
              <Shield className="w-4 h-4 text-indigo-300" />
              <span className="text-[11px] font-black text-indigo-200">Admin Mode — Full Pipeline Open</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT/MAIN Layout ─────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          <div className="flex bg-gray-100 p-1.5 rounded-2xl gap-1">
            <button
              onClick={() => setActiveTab("queue")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === "queue" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Zap className="w-4 h-4" />
              Live Tasks ({tasks.filter(t => t.status === "processing").length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === "history" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Campaign Log ({campaignLog.length})
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === "chat" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Bot className="w-4 h-4" />
              Chat & Instruct
            </button>
          </div>

          {/* ── QUEUE TAB ─────────────────────────────── */}
          {activeTab === "queue" && (
            <div className="space-y-6">

              {/* Proactive Suggestion from Gravity Claw */}
              {proactiveSuggestion && (
                <div className="bg-gradient-to-r from-indigo-50 to-fuchsia-50 border border-indigo-100 p-5 rounded-[2rem] flex items-start gap-4">
                  <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-1">Gravity Claw — Proactive Campaign Suggestion</p>
                    <p className="text-sm font-semibold text-indigo-900">{proactiveSuggestion}</p>
                    <button
                      onClick={() => setNewRunGoal(proactiveSuggestion.substring(0, 120))}
                      className="mt-3 text-xs font-black text-indigo-600 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      Accept & Brief Team →
                    </button>
                  </div>
                </div>
              )}
              <div className="bg-white border-2 border-dashed border-indigo-200 p-6 rounded-[2.5rem] shadow-sm">
                <h3 className="font-black text-gray-900 mb-2">Initialize New Run</h3>
                <p className="text-xs font-medium text-gray-500 mb-4">
                  Send a message to your WhatsApp number, or trigger it manually here. The AI will spin up deep research, competitor tracking, and produce ready-to-publish lead magnets.
                </p>
                <div className="flex gap-3">
                  <input
                    value={newRunGoal}
                    onChange={(e) => setNewRunGoal(e.target.value)}
                    placeholder="E.g. Get me 15 hot NRI leads for modern 3BHK villas near Wardha Road."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium"
                    onKeyDown={(e) => { if (e.key === "Enter") startAutonomousJob(); }}
                  />
                  <button
                    onClick={startAutonomousJob}
                    disabled={isStartingRun || !newRunGoal.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-6 py-3 font-bold flex items-center justify-center transition-all disabled:opacity-50"
                  >
                    {isStartingRun ? <Loader2 className="w-5 h-5 animate-spin" /> : "Deploy Agent"}
                  </button>
                </div>
              </div>

              {/* Task List */}
              <div className="space-y-4">
                {tasks.length === 0 ? (
                  <div className="text-center py-12">
                    <BrainCircuit className="w-16 h-16 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-bold text-sm">No active autonomous tasks. Send a whisper via WhatsApp.</p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div key={task.id} className={`border-2 rounded-[2rem] bg-white overflow-hidden transition-all duration-500 shadow-sm ${
                      task.status === "processing" ? "border-indigo-400 shadow-indigo-100/50 shadow-xl" :
                      task.status === "completed" ? "border-green-300" : "border-red-300"
                    }`}>
                      <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black ${
                            task.source === "whatsapp" ? "bg-green-500" : "bg-indigo-500"
                          }`}>
                            {task.source === "whatsapp" ? <Smartphone className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                          </div>
                          <div>
                            <h4 className="font-black text-gray-900 text-sm leading-tight flex items-center gap-2">
                              Goal: {task.goal}
                            </h4>
                            <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">
                              {task.source} Trigger • {new Date(task.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {task.status === "processing" && (
                            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg">
                              <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                              <span className="text-[10px] font-black text-indigo-700 tracking-wide uppercase">{task.currentAgent}</span>
                            </div>
                          )}
                          {task.status === "completed" && <CheckCircle2 className="w-6 h-6 text-green-500" />}
                          {task.status === "failed" && <AlertCircle className="w-6 h-6 text-red-500" />}
                        </div>
                      </div>

                      {/* Progress Bar for processing tasks */}
                      {task.status === "processing" && (
                        <div className="h-1.5 w-full bg-gray-100">
                          <div className="h-full bg-indigo-500 transition-all duration-1000 ease-in-out" style={{ width: `${task.progress}%` }} />
                        </div>
                      )}

                      <div className="p-5 flex flex-col md:flex-row gap-6">
                        {/* Logs */}
                        <div className="flex-1 space-y-2 max-h-48 overflow-y-auto pr-2">
                          <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 border-b pb-1">Orchestrator Logs</h5>
                          {task.logs.slice().reverse().map((log: any, i: number) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-gray-700 font-medium">
                              <ChevronRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                              <span className="leading-snug">{log.message}</span>
                            </div>
                          ))}
                        </div>

                        {/* Research Data & Final Output */}
                        <div className="flex-1 border-l pl-6 space-y-4">
                          {task.deepResearchData && (
                            <div>
                              <h5 className="flex items-center gap-1.5 text-[10px] font-black text-fuchsia-600 uppercase tracking-widest mb-2 border-b pb-1">
                                <TrendingUp className="w-3.5 h-3.5" /> Deep Research Insight
                              </h5>
                              <p className="text-xs text-gray-600 font-medium leading-relaxed bg-fuchsia-50/50 p-3 rounded-xl border border-fuchsia-100">
                                {task.deepResearchData.insights?.substring(0, 150)}...
                              </p>
                            </div>
                          )}
                          {task.generatedContent && (
                            <div>
                              <h5 className="flex items-center gap-1.5 text-[10px] font-black text-green-600 uppercase tracking-widest mb-2 border-b pb-1">
                                <Target className="w-3.5 h-3.5" /> Lead Generation Outputs
                              </h5>
                              <div className="flex flex-col gap-2">
                                {task.generatedContent.map((c: any) => (
                                  <div key={c.id} className="bg-green-50 border border-green-200 p-3 rounded-xl">
                                    <span className="text-[9px] font-black uppercase text-green-600 bg-white px-2 py-0.5 rounded shadow-sm border border-green-100 mb-1 inline-block">{c.platform}</span>
                                    <p className="text-xs text-gray-800 font-medium leading-snug">{c.text.substring(0, 80)}...</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── HISTORY TAB ─────────────────────────────── */}
          {activeTab === "history" && (
            <div className="space-y-4">
              {campaignLog.length === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 font-bold text-sm">No completed campaigns yet. Run your first campaign to build the performance log.</p>
                </div>
              ) : (
                campaignLog.map((log: any, i: number) => (
                  <div key={i} className="bg-white border border-gray-100 rounded-[2rem] p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <p className="text-[9px] font-black uppercase text-gray-400 mb-1">{log.completedAt ? new Date(log.completedAt).toLocaleDateString() : 'Unknown date'}</p>
                        <h4 className="font-black text-gray-900 text-sm">{log.goal}</h4>
                      </div>
                      <span className="bg-green-50 text-green-700 text-[9px] font-black uppercase px-2 py-1 rounded-full border border-green-100 shrink-0">Completed</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-[9px] font-black uppercase text-gray-400">Formats</p>
                        <p className="font-bold text-gray-700 text-xs mt-1">{(log.formats || []).join(', ')}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-[9px] font-black uppercase text-gray-400">Dynamic Reroutes</p>
                        <p className="font-bold text-gray-700 text-xs mt-1">{log.dynamicRedirects?.length || 0}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-[9px] font-black uppercase text-gray-400">QC Revision</p>
                        <p className={`font-bold text-xs mt-1 ${log.needsRevision ? 'text-amber-600' : 'text-green-600'}`}>{log.needsRevision ? 'Yes (auto-fixed)' : 'Passed'}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── CHAT TAB ─────────────────────────────── */}
          {activeTab === "chat" && (
            <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm flex flex-col h-[600px] overflow-hidden">
             
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex items-end gap-3 fade-in duration-300 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      msg.role === "assistant" ? "bg-gradient-to-br from-indigo-600 to-fuchsia-600" : "bg-gray-200"
                    }`}>
                      {msg.role === "assistant" ? <BrainCircuit className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-gray-600" />}
                    </div>
                    <div className="max-w-[75%] space-y-2">
                      <div className={`px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${
                        msg.role === "assistant" ? "bg-gray-50 border border-gray-100 text-gray-800 rounded-bl-sm" : "bg-indigo-600 text-white rounded-br-sm"
                      }`}>
                        {msg.role === "assistant" ? (
                          <div className="prose prose-sm max-w-none prose-p:leading-snug prose-a:text-indigo-600 prose-strong:text-indigo-900 prose-ul:my-1 prose-li:my-0 pb-1">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex items-center gap-1.5 p-4">
                    <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" /> <span className="text-xs font-bold text-gray-400">Brain is thinking...</span>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

               {/* Input */}
               <div className="px-4 pb-4">
                <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-indigo-400 transition-all">
                  <textarea
                    ref={chatInputRef}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if(e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="E.g. From now on, always add urgency for Nagpur leads..."
                    className="flex-1 bg-transparent outline-none resize-none text-sm text-gray-800 placeholder:text-gray-400 max-h-32 font-medium"
                    rows={1}
                    disabled={isChatLoading}
                  />
                  <button onClick={sendMessage} disabled={!chatInput.trim() || isChatLoading} className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-md">
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Core Memory Panel ───────────────────────── */}
        <div className="flex flex-col gap-4">
          <div className={`bg-white border-2 rounded-[2.5rem] shadow-sm overflow-hidden transition-all duration-500 ${memoryFlash ? "border-green-400 shadow-green-100 shadow-lg" : "border-gray-100"}`}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-indigo-50">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-violet-600" />
                <h3 className="font-black text-gray-900 text-sm">Core Memory</h3>
                <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[9px] font-black uppercase tracking-wider">soul.md</span>
              </div>
              {!isEditingMemory ? (
                <button onClick={() => { setIsEditingMemory(true); setEditedMemory(coreMemory); }} className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <button onClick={saveMemory} disabled={isSavingMemory} className="p-1.5 rounded-lg bg-green-100 text-green-600">
                    {isSavingMemory ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => setIsEditingMemory(false)} className="p-1.5 rounded-lg bg-red-50 text-red-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
            <div className="p-4">
              {!isEditingMemory ? (
                <div className="text-xs text-gray-600 font-mono leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto">
                  {coreMemory || <span className="text-gray-400 italic">No memory yet.</span>}
                </div>
              ) : (
                <textarea
                  value={editedMemory}
                  onChange={(e) => setEditedMemory(e.target.value)}
                  className="w-full h-[460px] text-xs font-mono text-gray-700 bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
