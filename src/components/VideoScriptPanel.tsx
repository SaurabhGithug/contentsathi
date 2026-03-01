"use client";

import { useState, useEffect } from "react";
import { Copy, CheckCircle2, Video, Clock, ChevronDown, ChevronUp, Loader2, BookmarkCheck } from "lucide-react";

interface VideoScriptPanelProps {
  isOpen: boolean;
  onClose: () => void;
  postContent: string;
  postPlatform: string;
  postTitle?: string;
}

function generateScript(content: string, platform: string, title?: string) {
  const subject = title || content.slice(0, 60).replace(/\n/g, " ").trim();
  const isShorts = platform === "YouTube Shorts" || platform === "Instagram";

  if (isShorts) {
    return {
      format: "YouTube Shorts / Reels",
      estimatedDuration: "30–45 sec",
      sections: [
        {
          label: "Hook (0–3s)",
          color: "violet",
          content: `🎯 Did you know? ${subject}! Stay for 30 seconds — this changes everything.`,
        },
        {
          label: "Content Body (3–25s)",
          color: "indigo",
          content: content
            .replace(/[#*_]/g, "")
            .split("\n")
            .filter(Boolean)
            .slice(0, 4)
            .map((line, i) => `${i + 1}. ${line.trim()}`)
            .join("\n"),
        },
        {
          label: "CTA (25–35s)",
          color: "green",
          content: `Follow for more insights like this! Drop a 💬 if this was helpful. Share with someone who needs to see this today.`,
        },
      ],
    };
  }

  return {
    format: "LinkedIn / Facebook Video",
    estimatedDuration: "60–90 sec",
    sections: [
      {
        label: "Opening Hook (0–5s)",
        color: "violet",
        content: `"${subject}" — here's what most people miss about this.`,
      },
      {
        label: "Main Content (5–75s)",
        color: "indigo",
        content: content
          .replace(/[#*_]/g, "")
          .split("\n")
          .filter(Boolean)
          .slice(0, 6)
          .map((line, i) => `Point ${i + 1}: ${line.trim()}`)
          .join("\n"),
      },
      {
        label: "Closing CTA (75–90s)",
        color: "green",
        content: `If this resonated with you, save this post and share it with your network. What's your take? Comment below 👇`,
      },
    ],
  };
}

const COLOR_CLASSES: Record<string, { bg: string; border: string; label: string }> = {
  violet: { bg: "bg-violet-50/60", border: "border-violet-100", label: "text-violet-600" },
  indigo: { bg: "bg-indigo-50/60", border: "border-indigo-100", label: "text-indigo-600" },
  green: { bg: "bg-green-50/60", border: "border-green-100", label: "text-green-600" },
};

export default function VideoScriptPanel({
  isOpen,
  onClose,
  postContent,
  postPlatform,
  postTitle,
}: VideoScriptPanelProps) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [voiceStyle, setVoiceStyle] = useState("conversational");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const script = generateScript(postContent, postPlatform, postTitle);
  const fullScript = script.sections.map((s) => `[${s.label}]\n${s.content}`).join("\n\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(fullScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/generate/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: fullScript, voiceStyle }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch {
      // silently fail — stub endpoint
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 fade-in duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-pink-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-pink-600 rounded-lg flex items-center justify-center shadow-sm">
              <Video className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Video Script</h2>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500">{script.format}</span>
                <span className="flex items-center gap-1 text-[10px] font-semibold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">
                  <Clock className="w-3 h-3" />
                  {script.estimatedDuration}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-white/60 rounded-lg transition-all"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Voice style */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
              Voice Style
            </label>
            <div className="flex gap-2">
              {["conversational", "energetic", "authoritative"].map((style) => (
                <button
                  key={style}
                  onClick={() => setVoiceStyle(style)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                    voiceStyle === style
                      ? "bg-violet-600 text-white border-violet-600"
                      : "text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Script sections */}
          {script.sections.map((section, idx) => {
            const colors = COLOR_CLASSES[section.color] || COLOR_CLASSES.indigo;
            const isExpanded = expandedIdx === idx;
            return (
              <div
                key={idx}
                className={`rounded-xl border ${colors.border} ${colors.bg} overflow-hidden`}
              >
                <button
                  className="w-full px-4 py-3 flex items-center justify-between text-left"
                  onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                >
                  <span className={`text-xs font-bold uppercase tracking-wider ${colors.label}`}>
                    {section.label}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                      {section.content}
                    </pre>
                  </div>
                )}
                {!isExpanded && (
                  <div className="px-4 pb-3">
                    <p className="text-xs text-gray-500 truncate">{section.content.split("\n")[0]}</p>
                  </div>
                )}
              </div>
            );
          })}

          {/* Saved notice */}
          {saved && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
              <BookmarkCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-green-700 text-xs font-medium">
                Script saved ✅ &mdash; Video generation coming soon. We&apos;ll notify you when it&apos;s ready.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
              saved
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
            }`}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            ) : (
              <BookmarkCheck className="w-4 h-4" />
            )}
            {saving ? "Saving..." : saved ? "Saved!" : "Save Script"}
          </button>
          <button
            onClick={handleCopy}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
              copied
                ? "bg-green-600 text-white"
                : "bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white hover:-translate-y-0.5"
            }`}
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Script
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
