"use client";

import { useState, useEffect } from "react";
import MarkdownContent from "@/components/MarkdownContent";
import {
  CheckCircle2, XCircle, RefreshCw, Eye, MessageSquare,
  TrendingUp, RotateCcw, Sparkles, Edit3, AlertTriangle,
  ChevronDown, ChevronUp, Loader2, BadgeCheck, Send
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import PublishModal from "@/components/PublishModal";

// Strip markdown formatting for plain-text previews
function stripMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/#+\s?/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^[-*>]\s/gm, "")
    .trim();
}

type ApprovalItem = {
  id: string | number;
  type: string;
  preview: string;
  fullContent?: string;
  agent: string;
  status: string;
  date: Date;
  qcScore?: number;
  platform?: string;
  agentMessages?: { from: string; to: string; question?: string }[];
};

type ApprovalAction =
  | "approve"
  | "approve_with_suggestion"
  | "reject_low_quality"
  | "reject_flag_competitor"
  | "approve_suggest_tone";

const ACTION_OPTIONS: { id: ApprovalAction; label: string; color: string; icon: any }[] = [
  { id: "approve", label: "Approve & Schedule", color: "bg-emerald-500 hover:bg-emerald-600 text-white", icon: CheckCircle2 },
  { id: "approve_suggest_tone", label: "Approve — Adjust Tone", color: "bg-amber-500 hover:bg-amber-600 text-white", icon: Edit3 },
  { id: "approve_with_suggestion", label: "Approve with Feedback", color: "bg-indigo-500 hover:bg-indigo-600 text-white", icon: MessageSquare },
  { id: "reject_flag_competitor", label: "Reject — Flag for Competitor Analysis", color: "bg-orange-100 hover:bg-orange-200 text-orange-800", icon: TrendingUp },
  { id: "reject_low_quality", label: "Reject — Low Quality", color: "bg-red-100 hover:bg-red-200 text-red-700", icon: XCircle },
];

export default function ApprovalsPage() {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const [feedbackText, setFeedbackText] = useState<Record<string | number, string>>({});
  const [processingId, setProcessingId] = useState<string | number | null>(null);
  const [proactiveSuggestion, setProactiveSuggestion] = useState<string>("");
  const [showAgentComms, setShowAgentComms] = useState<string | number | null>(null);
  const [publishingPost, setPublishingPost] = useState<any>(null);
  // Saga-style inline editing state
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editedContent, setEditedContent] = useState<Record<string | number, string>>({});

  useEffect(() => {
    fetchItems();
    fetchProactiveSuggestion();
  }, []);

  const fetchProactiveSuggestion = async () => {
    try {
      const res = await fetch("/api/studio/chat");
      if (res.ok) {
        const data = await res.json();
        const brain = data?.brain;
        if (brain?.lastProactiveSuggestion) {
          setProactiveSuggestion(brain.lastProactiveSuggestion);
        }
      }
    } catch {}
  };

  const fetchItems = async () => {
    setLoading(true);
    // Safety timeout — never show a perpetual spinner
    const safetyTimer = setTimeout(() => setLoading(false), 8000);
    // Fetch real tasks from DB that are completed and pending human review
    try {
      const res = await fetch("/api/studio/tasks");
      if (res.ok) {
        const data = await res.json();
        const completedTasks = (data.tasks || []).filter(
          (t: any) => t.status === "completed" && t.generatedContent
        );
        const mapped: ApprovalItem[] = completedTasks.flatMap((task: any) =>
          (task.generatedContent || []).map((c: any) => ({
            id: `${task.id}_${c.id}`,
            type: c.platform + " Content",
            // Strip markdown so ** Campaign Title: ** shows as plain text
            preview: stripMarkdown((c.text || "").substring(0, 160)) + (c.text?.length > 160 ? "..." : ""),
            fullContent: c.text,
            agent: c.agent || "AI Team",
            status: c.status || "Needs Review",
            date: new Date(task.createdAt),
            qcScore: c.qcScore,
            platform: c.platform,
            agentMessages: task.logs?.slice(-3) || [],
          }))
        );

        if (mapped.length > 0) {
          setItems(mapped);
        } else {
          setItems([]);
        }
      }
    } catch {
      setItems([]);
    } finally {
      clearTimeout(safetyTimer);
      setLoading(false);
    }
  };

  const handleAction = async (id: string | number, action: ApprovalAction) => {
    setProcessingId(id);
    const feedback = feedbackText[id] || "";

    // POST feedback and PERSIST the approved content
    const [tId, cId] = String(id).split("_");
    
    try {
      await fetch("/api/studio/tasks/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: tId,
          contentId: cId || id,
          editedText: editedContent[id],
          action: action
        }),
      });

      if (feedback && (action === "approve_with_suggestion" || action === "approve_suggest_tone")) {
        await fetch("/api/studio/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `From now on, remember this feedback about content quality preference: "${feedback}". Apply this to all future content from the Copywriter.`,
          }),
        }).catch(() => {});
      }
    } catch (err) {
      console.error("Approval failed:", err);
      toast.error("Failed to sync approval to database.");
    }

    setItems((prev) => prev.filter((i) => i.id !== id));
    setProcessingId(null);
    setFeedbackText((prev) => { const n = {...prev}; delete n[id]; return n; });

    const toastMsg: Record<ApprovalAction, string> = {
      approve: "✅ Approved! Distribution Agent will schedule this.",
      approve_suggest_tone: "✅ Approved with tone note. ContentSathi AI has learned your preference.",
      approve_with_suggestion: "✅ Approved with feedback! ContentSathi AI updated its Brand Memory.",
      reject_flag_competitor: "🔎 Flagged for Research Specialist · Hunter Mode. Redirecting to Market Watch...",
      reject_low_quality: "🔄 Rejected. Sent back to Copywriter for full rewrite.",
    };

    if (action === "reject_flag_competitor") {
      toast.error(toastMsg[action]);
      setTimeout(() => { window.location.href = "/market-watch"; }, 1200);
      return;
    }

    if (action === "approve" || action === "approve_with_suggestion" || action === "approve_suggest_tone") {
      toast.success(toastMsg[action]);
    } else {
      toast.error(toastMsg[action]);
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return "bg-gray-100 text-gray-500";
    if (score >= 8) return "bg-green-50 text-green-700 border border-green-200";
    if (score >= 6) return "bg-amber-50 text-amber-700 border border-amber-200";
    return "bg-red-50 text-red-700 border border-red-200";
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Approvals & QC</h1>
          <p className="text-gray-500 font-medium mt-1">
            Your 7-agent team has delivered. Review, refine, and dispatch.
          </p>
        </div>
        <button
          onClick={fetchItems}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl shadow-sm hover:bg-gray-50 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Pipeline
        </button>
      </div>

      {/* Proactive Suggestion Banner */}
      {proactiveSuggestion && (
        <div className="bg-gradient-to-r from-indigo-50 to-fuchsia-50 border border-indigo-100 rounded-3xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1">ContentSathi AI — Proactive Suggestion</p>
            <p className="text-sm font-semibold text-indigo-900">{proactiveSuggestion}</p>
          </div>
          <button
            onClick={() => window.location.href = "/studio"}
            className="shrink-0 text-xs font-black text-indigo-600 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            Brief Team →
          </button>
        </div>
      )}

      {/* Content List */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-3xl overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Fetching pipeline from the agents...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <BadgeCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Pipeline is clear!</h3>
            <p className="text-gray-400 text-sm">The AI team has no pending approvals. Brief them a new campaign from the Studio.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item) => (
              <div key={item.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                {/* Row header */}
                <div className="flex flex-col md:flex-row gap-4 md:items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-indigo-100">
                        {item.type}
                      </span>
                      <span className="text-xs font-bold text-gray-400 uppercase">From: {item.agent}</span>
                      <span className="text-xs text-gray-400">{format(item.date, "PPp")}</span>
                      {item.qcScore && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${getScoreColor(item.qcScore)}`}>
                          QC Score: {item.qcScore}/10
                        </span>
                      )}
                    </div>
                    <MarkdownContent content={item.preview} compact />

                    {/* Agent-to-Agent Communications Log */}
                    {item.agentMessages && item.agentMessages.length > 0 && (
                      <button
                        onClick={() => setShowAgentComms(showAgentComms === item.id ? null : item.id)}
                        className="flex items-center gap-1.5 text-xs font-bold text-indigo-500 hover:text-indigo-700 transition-colors mt-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        View Agent-to-Agent Communications ({item.agentMessages.length})
                        {showAgentComms === item.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    {showAgentComms === item.id && item.agentMessages && (
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 mt-2">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-3">Agent Communication Log</p>
                        {item.agentMessages.map((msg, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            <span className="font-black text-indigo-700 shrink-0">{msg.from}</span>
                            <span className="text-slate-400">→</span>
                            <span className="font-bold text-slate-600 shrink-0">{msg.to}:</span>
                            <span className="text-slate-500">{msg.question}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Full content expand + Saga-style inline editor */}
                    {item.fullContent && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                            className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            {expandedId === item.id ? "Collapse" : "Preview Full Content"}
                            {expandedId === item.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => {
                              if (editingId === item.id) {
                                setEditingId(null);
                              } else {
                                setEditingId(item.id);
                                setEditedContent(prev => ({ ...prev, [item.id]: prev[item.id] ?? (item.fullContent || "") }));
                                setExpandedId(null);
                              }
                            }}
                            className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                              editingId === item.id
                                ? "text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg"
                                : "text-emerald-600 hover:text-emerald-700"
                            }`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            {editingId === item.id ? "✓ Done Editing" : "Edit Content"}
                          </button>
                        </div>
                        {expandedId === item.id && editingId !== item.id && (
                          <div className="bg-white border border-gray-200 rounded-2xl p-5 mt-2 max-h-60 overflow-y-auto pr-3 custom-scrollbar">
                            <MarkdownContent content={editedContent[item.id] ?? item.fullContent ?? ""} />
                          </div>
                        )}
                        {editingId === item.id && (
                          <div className="relative">
                            <textarea
                              value={editedContent[item.id] ?? item.fullContent ?? ""}
                              onChange={(e) => setEditedContent(prev => ({ ...prev, [item.id]: e.target.value }))}
                              className="w-full bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none font-medium leading-relaxed"
                              rows={8}
                              placeholder="Edit the post content directly..."
                            />
                            <span className="absolute top-2 right-3 text-[9px] font-black text-amber-500 uppercase tracking-wider">Editing Mode</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Inline Edit / Feedback */}
                <div className="mt-4 space-y-3">
                  <textarea
                    value={feedbackText[item.id] || ""}
                    onChange={(e) => setFeedbackText((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    placeholder='Optional: Add inline feedback (e.g. "Make tone on point 2 more visionary") — will be saved to Core Memory'
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none font-medium"
                    rows={2}
                  />
                  {feedbackText[item.id] && (
                    <p className="text-[10px] text-indigo-500 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      This feedback will be saved to ContentSathi AI&apos;s Brand Memory and applied to all future campaigns.
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button
                      onClick={() => setPublishingPost({ body: editedContent[item.id] || item.fullContent || item.preview, platform: item.platform || "General" })}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Instant Publish
                    </button>
                    {ACTION_OPTIONS.map((action) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.id}
                          disabled={processingId === item.id}
                          onClick={() => handleAction(item.id, action.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-sm disabled:opacity-50 ${action.color}`}
                        >
                          {processingId === item.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Icon className="w-3.5 h-3.5" />
                          )}
                          {action.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {publishingPost && (
        <PublishModal 
          post={publishingPost} 
          onClose={() => setPublishingPost(null)}
          onSuccess={(url) => {
            // we keep it on the dashboard or we could remove it.
          }}
        />
      )}
    </div>
  );
}
