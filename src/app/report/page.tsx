"use client";

import { useState } from "react";
import {
  FileText, Download, Loader2, Sparkles, CheckCircle2,
  TrendingUp, Users, BarChart3, Globe2, Zap, BookOpen,
  ArrowRight, Star, Share2, ChevronDown, ChevronUp,
  BrainCircuit, Building2, Megaphone
} from "lucide-react";
import toast from "react-hot-toast";

const KEY_STATS = [
  { num: "₹65,000Cr", label: "Indian Real Estate Marketing Sector", icon: "💰" },
  { num: "23%", label: "AI Adoption Among Indian Agencies", icon: "🤖" },
  { num: "68%", label: "Property Deals Start on WhatsApp", icon: "📱" },
  { num: "2.8x", label: "Vernacular vs English Engagement", icon: "🗣️" },
  { num: "82%", label: "Tier-2 Agents Never Used AI for Content", icon: "📊" },
  { num: "4.5x", label: "Video vs Static Content Inquiry Rate", icon: "🎬" },
];

const REPORT_SECTIONS = [
  {
    icon: "01",
    title: "Executive Summary",
    desc: "The current state of AI in Indian real estate marketing, key trends, and the single most important action for 2026.",
    tag: "Must Read",
    tagColor: "bg-purple-100 text-purple-700",
  },
  {
    icon: "02",
    title: "Market Landscape",
    desc: "Market size, platform ecosystem, key player strategies (MagicBricks, 99acres, NoBroker), and the SMB broker problem.",
    tag: "Data-Rich",
    tagColor: "bg-blue-100 text-blue-700",
  },
  {
    icon: "03",
    title: "AI Adoption Analysis",
    desc: "Adoption curves, tool usage patterns, the language barrier that's failing Tier-2 India, and early adopter case studies.",
    tag: "Benchmarks",
    tagColor: "bg-amber-100 text-amber-700",
  },
  {
    icon: "04",
    title: "Content Benchmarks",
    desc: "Platform performance data, language engagement matrix, optimal posting schedules, and AI vs human content statistics.",
    tag: "Actionable",
    tagColor: "bg-green-100 text-green-700",
  },
  {
    icon: "05",
    title: "Future Predictions",
    desc: "5 predictions for 2026-2027, the AI-first agent profile, RERA + AI compliance future, and your 30-day action plan.",
    tag: "Strategy",
    tagColor: "bg-rose-100 text-rose-700",
  },
];

const EXPERT_QUOTES = [
  {
    quote: "In 2026, the real estate agent who uses AI isn't replacing the human touch — they're amplifying it.",
    attr: "PropTech India Summit 2025",
  },
  {
    quote: "The Nagpur real estate market is at an inflection point. AI-powered content is the new cold call.",
    attr: "Vidarbha Realtors Association",
  },
  {
    quote: "Regional language content is the biggest untapped channel in Indian real estate marketing.",
    attr: "NAREDCO Digital Committee",
  },
];

type ReportState = "idle" | "generating" | "ready" | "downloading";

export default function ReportPage() {
  const [state, setState] = useState<ReportState>("idle");
  const [report, setReport] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [email, setEmail] = useState("");

  const generateReport = async () => {
    setState("generating");
    setProgress(0);

    // Simulate progress while generating
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 2, 85));
    }, 800);

    try {
      const res = await fetch("/api/report/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      clearInterval(interval);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }

      const data = await res.json();
      setProgress(100);
      setReport(data.report);
      setState("ready");
      toast.success("🎉 Report generated! Click Download PDF to save.");
    } catch (e: any) {
      clearInterval(interval);
      setState("idle");
      toast.error(e.message || "Generation failed");
    }
  };

  const downloadPDF = async () => {
    if (!report) return;
    setState("downloading");

    try {
      const res = await fetch("/api/report/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report }),
      });

      if (!res.ok) throw new Error("Download failed");

      const html = await res.text();
      
      // Open in new tab and trigger print dialog
      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(html);
        newWindow.document.close();
        newWindow.onload = () => {
          setTimeout(() => newWindow.print(), 500);
        };
      }

      toast.success("📄 Report opened! Use 'Save as PDF' in the print dialog.");
    } catch (e: any) {
      toast.error(e.message || "Download failed");
    } finally {
      setState("ready");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[2.5rem] p-8 md:p-12">
        {/* Background orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6 w-fit">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-3 py-1.5 rounded-full">
              🏆 Industry Benchmark Report · Free Download
            </span>
          </div>

          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
              The State of AI in{" "}
              <span className="text-indigo-300">Indian Real Estate</span>
              <br />Marketing — 2026
            </h1>
            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
              India&apos;s first benchmark report on AI-powered property content strategy. 
              Multi-source intelligence from LinkedIn, MagicBricks, 99acres, forums, news portals, 
              and podcast transcripts. Free forever.
            </p>
          </div>

          {state === "idle" && (
            <button
              onClick={generateReport}
              className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-indigo-500/30 transition-all hover:scale-105 hover:shadow-2xl"
            >
              <Sparkles className="w-5 h-5" />
              Generate Free Report
              <ArrowRight className="w-5 h-5" />
            </button>
          )}

          {state === "generating" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                <span className="text-white font-bold text-lg">
                  Gathering intelligence from 6+ sources...
                </span>
              </div>
              <div className="w-full max-w-md bg-white/10 rounded-full h-2">
                <div
                  className="h-2 bg-gradient-to-r from-indigo-400 to-teal-400 rounded-full transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-slate-400 text-sm">
                Searching LinkedIn · MagicBricks · 99acres · Forums · News Portals · Podcasts...
              </p>
            </div>
          )}

          {(state === "ready" || state === "downloading") && (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-2 rounded-xl">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-bold text-sm">Report Generated!</span>
              </div>
              <button
                onClick={downloadPDF}
                disabled={state === "downloading"}
                className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-100 text-slate-900 font-black rounded-2xl shadow-lg transition-all hover:scale-105 disabled:opacity-60"
              >
                {state === "downloading"
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Download className="w-4 h-4" />
                }
                {state === "downloading" ? "Preparing PDF..." : "Download PDF"}
              </button>
              <button
                onClick={generateReport}
                className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all text-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Regenerate
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Key Stats ──────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-indigo-500" />
          <p className="text-xs font-black uppercase tracking-widest text-indigo-500">Key Numbers Inside</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {KEY_STATS.map((stat, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-[1.5rem] p-4 shadow-sm hover:shadow-md transition-all">
              <p className="text-2xl mb-1">{stat.icon}</p>
              <p className="text-xl font-black text-slate-900">{stat.num}</p>
              <p className="text-[10px] text-slate-500 font-medium leading-tight mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Report Sections Preview ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-slate-500" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">What&apos;s Inside (5 Sections)</p>
          </div>

          {REPORT_SECTIONS.map((section, i) => (
            <div
              key={i}
              className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              <button
                className="w-full flex items-start gap-4 p-5 text-left"
                onClick={() => setExpandedSection(expandedSection === i ? null : i)}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400 shrink-0">
                  {section.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-black text-slate-900 text-base">{section.title}</h3>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${section.tagColor}`}>
                      {section.tag}
                    </span>
                  </div>
                  {expandedSection === i && (
                    <p className="text-sm text-slate-500 mt-2">{section.desc}</p>
                  )}
                </div>
                {expandedSection === i
                  ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                  : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                }
              </button>
              {expandedSection === i && report?.sections && (
                <div className="px-5 pb-5 border-t border-gray-50">
                  <div
                    className="text-sm text-slate-600 leading-relaxed mt-3 max-h-48 overflow-y-auto custom-scrollbar prose prose-sm"
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {Object.values(report.sections)[i] as string || section.desc}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Report card */}
          <div className="bg-gradient-to-b from-indigo-50 to-purple-50 border border-indigo-100 rounded-[2rem] p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h3 className="font-black text-indigo-900">Free PDF Report</h3>
            </div>
            <div className="space-y-3 mb-6">
              {[
                "40+ pages of market intelligence",
                "6 sources searched in real-time",
                "Benchmark tables & data",
                "30-day action plan included",
                "Free forever — no email required",
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-sm text-slate-700 font-medium">{feat}</span>
                </div>
              ))}
            </div>
            <button
              onClick={(state === "ready" || state === "downloading") ? downloadPDF : generateReport}
              disabled={state === "generating" || state === "downloading"}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black rounded-xl shadow-lg shadow-indigo-200 transition-all hover:shadow-xl disabled:opacity-50"
            >
              {state === "generating"
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                : state === "ready"
                ? <><Download className="w-4 h-4" /> Download PDF</>
                : <><Sparkles className="w-4 h-4" /> Get Free Report</>
              }
            </button>
          </div>

          {/* Expert Quotes */}
          <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              Expert Perspectives
            </h4>
            <div className="space-y-4">
              {EXPERT_QUOTES.map((q, i) => (
                <div key={i} className="border-l-2 border-indigo-200 pl-4">
                  <p className="text-sm italic text-slate-700 leading-relaxed">&ldquo;{q.quote}&rdquo;</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">— {q.attr}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sources */}
          <div className="bg-slate-900 text-white rounded-[2rem] p-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <Globe2 className="w-3.5 h-3.5" />
              Sources Searched
            </h4>
            <div className="space-y-2">
              {[
                { icon: "💼", label: "LinkedIn", desc: "Industry posts & trends" },
                { icon: "🏘️", label: "MagicBricks + 99acres", desc: "Portal listing data" },
                { icon: "💬", label: "Property Forums", desc: "Buyer questions & pain points" },
                { icon: "📰", label: "ET · Mint · Business Standard", desc: "Breaking news signals" },
                { icon: "🎙️", label: "Podcast Transcripts", desc: "Expert insights" },
                { icon: "📝", label: "PropTech Blogs", desc: "Case studies & strategies" },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-base">{s.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-white">{s.label}</p>
                    <p className="text-[10px] text-slate-400">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Share CTA ─────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center">
            <Share2 className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h3 className="font-black text-teal-900">Share with Your Network</h3>
            <p className="text-sm text-teal-700 font-medium">
              This is free intelligence for the entire Indian real estate community.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://contentsathi.com/report")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-[#0A66C2] text-white font-bold text-sm rounded-xl"
          >
            Share on LinkedIn
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent("📊 Free Report: The State of AI in Indian Real Estate Marketing 2026 — Download at contentsathi.com/report")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white font-bold text-sm rounded-xl"
          >
            Share on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
