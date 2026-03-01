"use client";

import { useState } from "react";
import {
  Link as LinkIcon,
  FileText,
  Zap,
  CheckCircle2,
  RefreshCw,
  Copy,
  CalendarPlus,
  AlertCircle,
  Layout,
  Video,
  Layers,
  Youtube,
  ChevronDown,
  ChevronUp,
  MapPin,
  X,
  ExternalLink,
  Lightbulb,
  Search,
  Image as ImageIcon,
  Send
} from "lucide-react";

import PublishModal from "@/components/PublishModal";
import ScheduleModal from "@/components/ScheduleModal";
import LibraryTab from "@/components/LibraryTab";
import PostCard from "@/components/PostCard";

interface VideoInfo {
  title: string;
  channel: string;
  videoId: string;
  url: string;
}

// ── Helper: render tags from string or string[] ───────────────────────────
function renderTags(tags: string[] | string | undefined) {
  if (!tags) return null;
  const tagList = Array.isArray(tags)
    ? tags
    : tags.split(/[\s,]+/).filter(Boolean);
  if (!tagList.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {tagList.map((tag: string, tIdx: number) => (
        <span key={tIdx} className="text-[11px] font-medium text-indigo-500">
          {tag.startsWith("#") ? tag : `#${tag}`}
        </span>
      ))}
    </div>
  );
}

// ── Why this works tooltip component ─────────────────────────────────────
function WhyItWorks({ notes }: { notes?: string }) {
  const [open, setOpen] = useState(false);
  if (!notes) return null;
  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
      >
        <Lightbulb className="w-3.5 h-3.5" />
        Why this works
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {open && (
        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
          {notes}
        </div>
      )}
    </div>
  );
}

export default function Repurpose() {
  const [viewMode, setViewMode] = useState<"create" | "library">("create");

  // ── Source state ──────────────────────────────────────────────────────
  const [sourceType, setSourceType] = useState<"url" | "text">("url");
  const [sourceUrl, setSourceUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);

  // ── YouTube Research State ─────────────────────────────────────────────
  const [youtubeResearchEnabled, setYoutubeResearchEnabled] = useState(false);
  const [youtubeTopic, setYoutubeTopic] = useState(""); // Independent topic
  const [youtubeCity, setYoutubeCity] = useState("");
  const [youtubeLink, setYoutubeLink] = useState("");
  const [researchedVideos, setResearchedVideos] = useState<VideoInfo[]>([]);
  const [videosExpanded, setVideosExpanded] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [researchWarning, setResearchWarning] = useState("");
  const [researchTranscript, setResearchTranscript] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);

  // ── Publish & Schedule Modals State ──────────────────────────────────────
  const [publishingPost, setPublishingPost] = useState<any>(null);
  const [schedulingPost, setSchedulingPost] = useState<any>(null);

  // ── Generate Handler ──────────────────────────────────────────────────
  const handleGenerate = async () => {
    const input = sourceType === "url" ? sourceUrl : rawText;
    
    // If YouTube research is off, we need input.
    // If YouTube research is on, we need input OR a youtubeTopic.
    if (!youtubeResearchEnabled && !input.trim()) {
      setError(`Please provide a ${sourceType === "url" ? "URL" : "text"}.`);
      return;
    }
    if (youtubeResearchEnabled && !input.trim() && !youtubeTopic.trim() && !youtubeLink.trim()) {
      setError("Please provide source content OR a topic/link for YouTube research.");
      return;
    }

    setError("");
    setIsGenerating(false);
    setResults(null);
    setResearchWarning("");
    setResearchedVideos([]);
    setVideosExpanded(false);

    let mergedTranscript: string | undefined;

    // ── Step 1: YouTube research (if enabled) ────────────────────────
    if (youtubeResearchEnabled) {
      // Use independent topic, fallback to derived topic
      const topicForSearch = youtubeTopic.trim() || (sourceType === "text" ? rawText.slice(0, 100) : sourceUrl);

      setIsResearching(true);
      try {
        const res = await fetch("/api/youtube/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: topicForSearch,
            city: youtubeCity.trim() || undefined,
            youtubeLink: youtubeLink.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "YouTube research failed.");
          setIsResearching(false);
          return;
        }
        setResearchedVideos(data.videos || []);
        setVideosExpanded(true);
        if (data.warning) setResearchWarning(data.warning);
        
        // Ensure mergedTranscript is at least an empty string if research was done
        const finalTranscript = data.mergedTranscript || "";
        mergedTranscript = finalTranscript;
        setResearchTranscript(finalTranscript);
        
        // If transcripts are missing but videos exist, create a tiny context from titles
        if (!mergedTranscript && data.videos?.length > 0) {
          mergedTranscript = "Top researched video titles:\n" + 
            data.videos.map((v: any) => `- ${v.title}`).join("\n");
        }
      } catch (err: any) {
        setError("YouTube research failed: " + (err.message || "Network error"));
        setIsResearching(false);
        return;
      } finally {
        setIsResearching(false);
      }
    }

    // ── Step 2: Repurpose ─────────────────────────────────────────────
    setIsGenerating(true);

    try {
      // If we have research context (even if just titles), and NO source input, we can still proceed
      const hasResearch = mergedTranscript && mergedTranscript.length > 0;
      const hasInput = input.trim().length > 0;

      const effectiveEndpoint = (!hasInput && hasResearch) 
        ? "/api/repurpose/from-text" 
        : (sourceType === "url" ? "/api/repurpose/from-url" : "/api/repurpose/from-text");

      let payload: Record<string, any>;
      if (effectiveEndpoint === "/api/repurpose/from-url") {
        payload = { url: sourceUrl, researchContext: mergedTranscript };
      } else {
        const sourceText = input.trim();
        const enrichedText = hasResearch
          ? `## YouTube Research Context\n${mergedTranscript}\n\n${sourceText ? `## Source Content\n${sourceText}` : ""}`
          : sourceText;
        payload = { rawText: enrichedText, researchContext: mergedTranscript };
      }

      const res = await fetch(effectiveEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setResults(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleSaveToCalendar = async (item: any) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: item.platform,
          title: item.title,
          body: item.body,
          scheduledDate: tomorrow.toISOString(),
          scheduledTime: "10:00 AM",
        }),
      });
      if (res.ok) {
        alert(`"${item.title}" added to your calendar!`);
      } else {
        throw new Error();
      }
    } catch {
      alert("Failed to save to calendar.");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, postIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImageId(String(postIndex));
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Update the specific post with the imageUrl
      setResults((prev: any) => {
        if (!prev || !prev.posts) return prev;
        const newPosts = [...prev.posts];
        newPosts[postIndex] = { ...newPosts[postIndex], imageUrl: data.publicUrl };
        return { ...prev, posts: newPosts };
      });
    } catch (err: any) {
      alert(err.message || "Failed to upload image. Please try again.");
    } finally {
      setUploadingImageId(null);
    }
  };

  const loadingLabel = isResearching
    ? "🔍 Researching YouTube..."
    : isGenerating
    ? "Repurposing..."
    : null;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-500">
      
      {/* ── Top View Toggle ─────────────────────────────────────────────── */}
      <div className="flex bg-white rounded-xl p-1 border border-gray-100 shadow-sm w-full md:w-fit">
        <button 
          onClick={() => setViewMode("create")}
          className={`flex-1 md:w-32 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === "create" ? "bg-indigo-50 text-indigo-700" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}
        >
          Create New
        </button>
        <button 
          onClick={() => setViewMode("library")}
          className={`flex-1 md:w-32 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === "library" ? "bg-indigo-50 text-indigo-700" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}
        >
          My Library
        </button>
      </div>

      {viewMode === "create" ? (
        <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
          
          {/* ── Left Pane: Input ─────────────────────────────────────────────── */}
      <div className="w-full md:w-[420px] flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-bold text-gray-900">Repurpose Content</h2>
          <p className="text-xs text-gray-500 mt-1">Convert source materials into multi-platform campaigns</p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Source type toggle ──────────────────────────────────────────── */}
          <div className="bg-gray-100 p-1 rounded-xl flex items-center">
            <button
              onClick={() => { setSourceType("url"); setError(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${sourceType === "url" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
            >
              <LinkIcon className="w-4 h-4" /> Link
            </button>
            <button
              onClick={() => { setSourceType("text"); setError(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${sourceType === "text" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
            >
              <FileText className="w-4 h-4" /> Text
            </button>
          </div>

          {/* Source input ───────────────────────────────────────────────── */}
          {sourceType === "url" ? (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Article or Social URL</label>
              <div className="relative">
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://example.com/blog-post"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-sm bg-gray-50/30"
                />
                <LinkIcon className="absolute right-4 top-3.5 w-4 h-4 text-gray-400" />
              </div>
              <p className="text-[10px] text-gray-400 italic">Supports blog links and YouTube links.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Paste Source Content</label>
              <textarea
                rows={sourceType === "text" && !youtubeResearchEnabled ? 12 : 6}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste your blog content, transcript, or notes..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all resize-none text-sm bg-gray-50/30 font-sans"
              />
            </div>
          )}

          {/* YouTube Research Toggle ─────────────────────────────────────── */}
          <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => {
                setYoutubeResearchEnabled((v) => !v);
                setResearchedVideos([]);
                setResearchWarning("");
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all ${
                youtubeResearchEnabled
                  ? "bg-red-50 text-red-700 border-b border-red-100"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Youtube
                className={`w-4 h-4 flex-shrink-0 ${youtubeResearchEnabled ? "text-red-600" : "text-gray-400"}`}
              />
              <span className="flex-1 text-left">🔍 Research top YouTube videos</span>
              <span
                className={`w-9 h-5 rounded-full flex items-center transition-all flex-shrink-0 px-0.5 ${
                  youtubeResearchEnabled ? "bg-red-500 justify-end" : "bg-gray-300 justify-start"
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </span>
            </button>

            {youtubeResearchEnabled && (
              <div className="p-4 space-y-3 bg-red-50/30">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                    <Search className="w-3 h-3 text-red-500" /> Research Topic
                    <span className="font-normal text-gray-400">(Required if no source link/text)</span>
                  </label>
                  <input
                    type="text"
                    value={youtubeTopic}
                    onChange={(e) => setYoutubeTopic(e.target.value)}
                    placeholder='e.g. "Future of real estate in India"'
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-400 outline-none text-sm bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" /> Location
                    </label>
                    <input
                      type="text"
                      value={youtubeCity}
                      onChange={(e) => setYoutubeCity(e.target.value)}
                      placeholder='e.g. "Pune"'
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-400 outline-none text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5 text-red-700">
                      <Youtube className="w-3 h-3" /> Exact Link
                    </label>
                    <input
                      type="url"
                      value={youtubeLink}
                      onChange={(e) => setYoutubeLink(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-400 outline-none text-sm bg-white"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed bg-white/50 p-2 rounded border border-red-50">
                  Searches top 5 videos transcript to add expert context to your repurposing results.
                </p>
              </div>
            )}
          </div>

          {/* Research Results ───────────────────────────────────────────── */}
          {researchedVideos.length > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 overflow-hidden">
              <button
                type="button"
                onClick={() => setVideosExpanded((v) => !v)}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="flex-1 text-left">
                  📺 Researched {researchedVideos.length} videos
                </span>
                {videosExpanded ? (
                  <ChevronUp className="w-4 h-4 text-emerald-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-emerald-600" />
                )}
              </button>
              {videosExpanded && (
                <div className="border-t border-emerald-100 divide-y divide-emerald-100">
                  {researchedVideos.map((v, i) => (
                    <a
                      key={v.videoId || i}
                      href={v.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 px-4 py-2.5 hover:bg-emerald-50 transition-colors group"
                    >
                      <div className="w-6 h-6 rounded-md bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Youtube className="w-3 h-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 line-clamp-1 group-hover:text-indigo-700 transition-colors">{v.title}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{v.channel}</p>
                      </div>
                      <ExternalLink className="w-3 h-3 text-gray-300 flex-shrink-0 mt-1" />
                    </a>
                  ))}
                </div>
              )}

              {researchTranscript && (
                <div className="px-4 py-3 bg-white/50 border-t border-emerald-100">
                  <button
                    onClick={() => setShowTranscript(!showTranscript)}
                    className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1 hover:text-emerald-800"
                  >
                    <FileText className="w-3 h-3" />
                    {showTranscript ? "Hide Knowledge Base" : "View Knowledge Base (Transcripts)"}
                  </button>
                  {showTranscript && (
                    <div className="mt-2 p-3 bg-white rounded-lg border border-emerald-100 text-[10px] text-gray-600 font-mono leading-relaxed max-h-40 overflow-y-auto shadow-inner">
                      {researchTranscript.substring(0, 3000)}
                      {researchTranscript.length > 3000 && "..."}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {researchWarning && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{researchWarning}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mx-5 mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-5 border-t border-gray-100 bg-white shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || isResearching}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all shadow-md ${
              isGenerating || isResearching
                ? "bg-indigo-400 text-white cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 text-white hover:-translate-y-0.5 active:translate-y-0"
            }`}
          >
            {loadingLabel ? (
              <><RefreshCw className="w-5 h-5 animate-spin" /> {loadingLabel}</>
            ) : (
              <><Zap className="w-5 h-5 fill-white" /> {youtubeResearchEnabled ? "Research & Repurpose" : "Repurpose Now"}</>
            )}
          </button>
        </div>
      </div>

      {/* ── Right Pane: Results ──────────────────────────────────────────── */}
      <div className="flex-1 bg-gray-50/50 rounded-2xl border border-gray-200 overflow-hidden flex flex-col shadow-inner">
        {!results && !isGenerating && !isResearching ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100">
              <RefreshCw className="w-10 h-10 text-gray-200" />
            </div>
            <h3 className="text-xl font-bold text-gray-400">Campaign Distribution</h3>
            <p className="text-gray-400 max-w-xs mt-2 text-sm leading-relaxed">
              Convert any URL, script, or topic into a full multi-platform distribution engine.
            </p>
          </div>
        ) : (isResearching || isGenerating) && !results ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-full max-w-md space-y-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="relative">
                  {isResearching ? (
                    <Youtube className="w-14 h-14 text-red-500 animate-pulse" />
                  ) : (
                    <>
                      <RefreshCw className="w-14 h-14 text-indigo-600 animate-spin" />
                      <Zap className="absolute inset-0 m-auto w-6 h-6 text-indigo-400" />
                    </>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  {isResearching ? "Gathering YouTube Insights..." : "Repurposing content..."}
                </h3>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full animate-pulse-width" style={{ width: "60%" }} />
                </div>
                <p className="text-sm text-gray-500 animate-pulse">
                  Applying expert copywriting frameworks and cultural nuances...
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wide">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                Distribution Hub
                {researchedVideos.length > 0 && (
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full flex items-center gap-1 ml-2">
                    <Youtube className="w-3 h-3" /> RESEARCHED
                  </span>
                )}
              </h2>
              <button
                onClick={handleGenerate}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 bg-white border border-indigo-100 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4" /> Start Over
              </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pb-10">
              {/* Standard Posts */}
              {results.posts?.map((post: any, idx: number) => (
                <PostCard 
                  key={idx}
                  post={{
                    ...post,
                    qualityScore: post.qualityScore || 85
                  }}
                  onUpdate={(updated) => {
                    const updatedPosts = [...results.posts];
                    updatedPosts[idx] = updated;
                    setResults({ ...results, posts: updatedPosts });
                  }}
                />
              ))}

              {/* YouTube Shorts Script */}
              {results.shortsScript && (
                <div className="bg-white rounded-2xl border border-violet-100 shadow-sm flex flex-col hover:shadow-md transition-all overflow-hidden">
                  <div className="px-5 py-4 border-b border-violet-50 flex items-center justify-between bg-violet-50/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-violet-100 text-violet-700">
                        <Video className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-gray-900">YouTube Shorts Creator</span>
                    </div>
                  </div>
                  <div className="p-5 flex-1 space-y-4">
                    {[
                      { label: "HOOK (0–3s)", key: "hook", color: "text-violet-500", bg: "bg-violet-50/50" },
                      { label: "PROBLEM (3–10s)", key: "problem", color: "text-red-500", bg: "bg-red-50/50" },
                      { label: "SOLUTION (10–45s)", key: "solution", color: "text-blue-500", bg: "bg-blue-50/50" },
                      { label: "CTA (45–60s)", key: "cta", color: "text-green-600", bg: "bg-green-50/50" },
                    ].map(({ label, key, color, bg }) => {
                      const text = results.shortsScript[key] || (key === "solution" ? results.shortsScript.body : null);
                      if (!text) return null;
                      return (
                        <div key={key} className="space-y-1">
                          <span className={`text-[10px] uppercase font-bold ${color} tracking-wider`}>{label}</span>
                          <p className={`text-sm font-medium text-gray-800 ${bg} p-2.5 rounded-lg border border-gray-100 leading-relaxed font-sans`}>{text}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-end bg-gray-50/5">
                    <button
                      onClick={() => {
                        const script = [
                          `[HOOK]\n${results.shortsScript.hook}`,
                          `[PROBLEM]\n${results.shortsScript.problem}`,
                          `[SOLUTION]\n${results.shortsScript.solution || results.shortsScript.body}`,
                          `[CTA]\n${results.shortsScript.cta}`,
                        ].filter(Boolean).join("\n\n");
                        handleCopy(script, "shorts");
                      }}
                      className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all"
                    >
                      {copiedId === "shorts" ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Carousel Outline */}
              {(results.carousel || results.carouselOutline) && (
                <div className="bg-white rounded-2xl border border-amber-100 shadow-sm flex flex-col hover:shadow-md transition-all overflow-hidden">
                  <div className="px-5 py-4 border-b border-amber-50 flex items-center justify-between bg-amber-50/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                        <Layers className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-gray-900">Instagram Carousel Outline</span>
                    </div>
                  </div>
                  <div className="p-5 flex-1 overflow-y-auto max-h-[450px] space-y-4">
                    {(results.carousel || results.carouselOutline || []).map((slide: any, sIdx: number) => (
                      <div key={sIdx} className="p-4 bg-amber-50/40 rounded-xl border border-amber-100/30 relative">
                        <span className="absolute -top-2 -right-2 w-7 h-7 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md">
                          {slide.slide || slide.slideNumber || sIdx + 1}
                        </span>
                        <h5 className="font-bold text-sm text-amber-950 mb-1.5">{slide.title || slide.headline}</h5>
                        <p className="text-xs text-amber-900/80 leading-relaxed font-sans">{slide.content || slide.bodyText}</p>
                        {(slide.visualSuggestion) && (
                          <div className="mt-3 pt-2 border-t border-amber-200/40 text-[10px] text-amber-600 italic flex items-center gap-1.5">
                            <LinkIcon className="w-2.5 h-2.5" /> 
                            Visual: {slide.visualSuggestion}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  ) : (
    <LibraryTab />
  )}

      {/* Modals */}
      {publishingPost && (
        <PublishModal 
          post={publishingPost} 
          onClose={() => setPublishingPost(null)}
          onSuccess={(url) => {}}
        />
      )}

      {schedulingPost && (
        <ScheduleModal
          post={schedulingPost}
          onClose={() => setSchedulingPost(null)}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}
