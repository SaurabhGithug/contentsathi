"use client";

import { useState, useEffect } from "react";
import {
  Copy, CalendarPlus, RefreshCw, Zap, CheckCircle2,
  ChevronDown, ChevronUp, Lightbulb, Layers, Video, BookOpen,
  Youtube, Search, MapPin, AlertCircle, ExternalLink, X, FileText, Image as ImageIcon, Send
} from "lucide-react";

import PublishModal from "@/components/PublishModal";
import ScheduleModal from "@/components/ScheduleModal";
import PostCard from "@/components/PostCard";

const PLATFORMS = ["Instagram", "LinkedIn", "YouTube Shorts", "WhatsApp", "X (Twitter)", "Facebook"];
const LANGUAGES = ["English", "Hindi", "Marathi", "Hinglish"];

// ── Helper: render tags from string or string[] ───────────────────────────
function renderTags(tags: string[] | string | undefined) {
  if (!tags) return null;
  const tagList = Array.isArray(tags)
    ? tags
    : tags.split(/[\s,]+/).filter(Boolean);
  return (
    <p className="px-5 pb-2 text-xs text-indigo-500 font-medium flex flex-wrap gap-1">
      {tagList.map((t, i) => <span key={i}>{t.startsWith("#") ? t : `#${t}`}</span>)}
    </p>
  );
}

// ── Why this works tooltip component ─────────────────────────────────────
function WhyItWorks({ notes }: { notes?: string }) {
  const [open, setOpen] = useState(false);
  if (!notes) return null;
  return (
    <div className="mx-5 mb-3">
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

const PLATFORM_TO_BRAIN: Record<string, string[]> = {
  instagram: ["Instagram"],
  linkedin: ["LinkedIn"],
  youtube: ["YouTube Shorts"],
  whatsapp: ["WhatsApp"],
  twitter: ["X (Twitter)"],
  facebook: ["Facebook"],
};

export default function Generator() {
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("First-time homebuyers, Investors");
  const [selectedPlatforms, setSelectedPlatforms] = useState(["Instagram", "LinkedIn", "WhatsApp", "YouTube Shorts"]);
  const [selectedLanguages, setSelectedLanguages] = useState(["Hindi", "Marathi", "Hinglish"]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [generatedPosts, setGeneratedPosts] = useState<any[]>([]);
  const [carouselOutline, setCarouselOutline] = useState<any[]>([]);
  const [shortsScript, setShortsScript] = useState<any>(null);
  const [blogOutline, setBlogOutline] = useState<any>(null);
  const [postLanguages, setPostLanguages] = useState<Record<number, string>>({});
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  // ── YouTube Research State ─────────────────────────────────────────────
  const [youtubeResearchEnabled, setYoutubeResearchEnabled] = useState(false);
  const [youtubeCity, setYoutubeCity] = useState("");
  const [youtubeLink, setYoutubeLink] = useState("");
  const [researchedVideos, setResearchedVideos] = useState<Array<{title:string;channel:string;videoId:string;url:string}>>([]);
  const [videosExpanded, setVideosExpanded] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [researchWarning, setResearchWarning] = useState("");
  const [researchTranscript, setResearchTranscript] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);

  // ── Publish & Schedule Modals State ──────────────────────────────────────
  const [publishingPost, setPublishingPost] = useState<any>(null);
  const [schedulingPost, setSchedulingPost] = useState<any>(null);

  // ── Handle Remix ID from query params ──────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const remixId = params.get("remixId");
    if (remixId) {
      const loadRemixAsset = async () => {
        try {
          const res = await fetch(`/api/generated-assets/${remixId}`);
          if (res.ok) {
            const asset = await res.json();
            setTopic(asset.body || asset.content || "");
            // Trigger research if it's a URL or has meaningful context
            if (asset.body?.includes("http")) {
              setYoutubeLink(asset.body.match(/https?:\/\/[^\s]+/)?.[0] || "");
              setYoutubeResearchEnabled(true);
            }
          }
        } catch (e) {
          console.error("Failed to load remix asset", e);
        }
      };
      loadRemixAsset();
    }
  }, []);

  // ── Load Content Brain defaults on mount ───────────────────────────────
  useEffect(() => {
    async function loadBrainDefaults() {
      try {
        const res = await fetch("/api/content-brain");
        if (!res.ok) return;
        const brain = await res.json();
        if (!brain) return;

        // Map stored platform preferences
        const platforms: string[] = [];
        if (brain.primaryLanguage) {
          // Load platforms from brain if available (stored as JSON or string)
          const platformList = brain.platforms ? JSON.parse(brain.platforms).map((p: string) =>
            PLATFORM_TO_BRAIN[p.toLowerCase()]?.[0] || p
          ) : ["Instagram", "LinkedIn", "WhatsApp", "YouTube Shorts"];
          platforms.push(...platformList);
        }

        // Load languages
        const langs: string[] = [];
        if (brain.primaryLanguage && LANGUAGES.includes(brain.primaryLanguage)) {
          langs.push(brain.primaryLanguage);
        }
        if (brain.secondaryLanguage && LANGUAGES.includes(brain.secondaryLanguage)) {
          langs.push(brain.secondaryLanguage);
        }
        if (langs.length === 0) langs.push("Hinglish");

        if (platforms.length > 0) setSelectedPlatforms(platforms);
        if (langs.length > 0) setSelectedLanguages(langs);
        if (brain.audienceDescription) setAudience(brain.audienceDescription);
      } catch {
        // Silently fail — defaults remain
      }
    }
    loadBrainDefaults();
  }, []);

  const toggleItem = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) { setError("Please enter a topic or idea."); return; }
    setError("");
    setResearchWarning("");
    setResearchedVideos([]);
    setVideosExpanded(false);
    setGeneratedPosts([]);
    setCarouselOutline([]);
    setShortsScript(null);
    setBlogOutline(null);

    let mergedTranscript: string | undefined;

    // ── Step 1: YouTube Research (if enabled) ──────────────────────────
    if (youtubeResearchEnabled) {
      setIsResearching(true);
      try {
        const res = await fetch("/api/youtube/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
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
        if (data.mergedTranscript) {
          const finalTranscript = data.mergedTranscript;
          mergedTranscript = finalTranscript;
          setResearchTranscript(finalTranscript);
        }
      } catch (err: any) {
        setError("YouTube research failed: " + (err.message || "Network error"));
        setIsResearching(false);
        return;
      } finally {
        setIsResearching(false);
      }
    }

    // ── Step 2: Generate Content ───────────────────────────────────────
    setIsGenerating(true);

    try {
      const res = await fetch("/api/generate/week-from-topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          audience,
          platforms: selectedPlatforms,
          languages: selectedLanguages,
          primaryLanguage: selectedLanguages[0] || "English",
          researchContext: mergedTranscript,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setGeneratedPosts(data.posts || []);
      setCarouselOutline(data.carouselOutline || []);
      setShortsScript(data.shortsScript || null);
      setBlogOutline(data.blogOutline || null);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (post: any) => {
    navigator.clipboard.writeText(post.body);
    setCopiedId(post.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleRegenerate = async (post: any, idx: number, overrideLang?: string) => {
    const langToUse = overrideLang || postLanguages[idx] || post.language;
    setRegeneratingId(post.id || String(idx));
    try {
      const res = await fetch("/api/generate/week-from-topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: `Write a ${post.type} for ${post.platform} in ${langToUse} about: ${topic}`,
          platforms: [post.platform],
          languages: [langToUse],
          primaryLanguage: langToUse,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.posts?.[0]) {
        setGeneratedPosts((prev) =>
          prev.map((p, i) => (i === idx ? { ...p, ...data.posts[0], id: p.id } : p))
        );
      }
    } catch (err: any) {
      alert("Regenerate failed: " + (err.message || "Unknown error"));
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleSchedule = async (post: any) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    try {
      await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: post.platform,
          title: post.title,
          body: post.body,
          scheduledDate: tomorrow.toISOString(),
          scheduledTime: "10:00 AM",
        }),
      });
      alert(`"${post.title}" has been added to your calendar!`);
    } catch {
      alert("Failed to schedule. Please try again.");
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
      setGeneratedPosts(prev => prev.map((p, i) => 
        i === postIndex ? { ...p, imageUrl: data.publicUrl } : p
      ));
    } catch (err: any) {
      alert(err.message || "Failed to upload image. Please try again.");
    } finally {
      setUploadingImageId(null);
    }
  };

  const handlePublishNow = async (post: any, idx: number) => {
    setPublishingId(String(idx));
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: post.platform,
          title: post.title,
          body: post.body,
          imageUrl: post.imageUrl
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Add the live URL to the post so the user can click it
      setGeneratedPosts(prev => prev.map((p, i) => 
        i === idx ? { ...p, platformPostUrl: data.platformPostUrl } : p
      ));
      
      alert(`Successfully published to ${post.platform}!`);
    } catch (err: any) {
      alert(err.message || "Failed to publish. Please try again.");
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Left Pane - Inputs */}
      <div className="w-full md:w-[400px] flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-bold text-gray-900">Content Engine</h2>
          <p className="text-xs text-gray-500 mt-1">One topic → One week of content</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Topic or Idea *</label>
            <textarea 
              rows={4}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. The impact of the new metro line on local property rates..."
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all resize-none text-sm"
            ></textarea>
          </div>

          {/* ── YouTube Research Toggle ─────────────────────────────── */}
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => {
                setYoutubeResearchEnabled(v => !v);
                setResearchedVideos([]);
                setResearchWarning("");
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all ${
                youtubeResearchEnabled
                  ? "bg-red-50 text-red-700 border-b border-red-100"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Youtube className={`w-4 h-4 flex-shrink-0 ${youtubeResearchEnabled ? "text-red-600" : "text-gray-400"}`} />
              <span className="flex-1 text-left">🔍 Research top YouTube videos on this topic</span>
              <span className={`w-9 h-5 rounded-full flex items-center transition-all flex-shrink-0 px-0.5 ${
                youtubeResearchEnabled ? "bg-red-500 justify-end" : "bg-gray-300 justify-start"
              }`}>
                <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </span>
            </button>

            {youtubeResearchEnabled && (
              <div className="p-4 space-y-3 bg-red-50/30">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" /> Location or product name
                    <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={youtubeCity}
                    onChange={(e) => setYoutubeCity(e.target.value)}
                    placeholder='e.g. "Nagpur", "2BHK flats", "Saraswati Nagari"'
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                    <Youtube className="w-3 h-3 text-red-500" /> Or paste a specific YouTube link
                    <span className="font-normal text-gray-400">(skips search)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={youtubeLink}
                      onChange={(e) => setYoutubeLink(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full pl-3 pr-8 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none text-sm bg-white"
                    />
                    {youtubeLink && (
                      <button onClick={() => setYoutubeLink("")} className="absolute right-2 top-2 text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed bg-white border border-red-100 rounded-lg px-3 py-2">
                  <strong className="text-red-600">Requires:</strong> YOUTUBE_API_KEY in your .env file.
                  If a link is pasted, only that video is used. Otherwise, top 5 by view count are researched.
                </p>
              </div>
            )}
          </div>

          {/* ── Researched Videos ─────────────────────────────────────── */}
          {researchedVideos.length > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 overflow-hidden">
              <button
                type="button"
                onClick={() => setVideosExpanded(v => !v)}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="flex-1 text-left">📺 Researched {researchedVideos.length} video{researchedVideos.length > 1 ? "s" : ""}</span>
                {videosExpanded ? <ChevronUp className="w-4 h-4 text-emerald-600" /> : <ChevronDown className="w-4 h-4 text-emerald-600" />}
              </button>
              {videosExpanded && (
                <div className="border-t border-emerald-100 divide-y divide-emerald-100">
                  {researchedVideos.map((v, i) => (
                    <a key={v.videoId || i} href={v.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-start gap-3 px-4 py-2.5 hover:bg-emerald-50 transition-colors group">
                      <div className="w-6 h-6 rounded-md bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Youtube className="w-3 h-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 line-clamp-1 group-hover:text-indigo-700 transition-colors">{v.title}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{v.channel}</p>
                      </div>
                      <ExternalLink className="w-3 h-3 text-gray-300 flex-shrink-0 mt-1 group-hover:text-indigo-400 transition-colors" />
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
            <input 
              type="text" 
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Platforms</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => (
                <button
                  key={p}
                  onClick={() => toggleItem(selectedPlatforms, p, setSelectedPlatforms)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    selectedPlatforms.includes(p)
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {selectedPlatforms.includes(p) && "✓ "}{p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map(l => (
                <button
                  key={l}
                  onClick={() => toggleItem(selectedLanguages, l, setSelectedLanguages)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    selectedLanguages.includes(l)
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {selectedLanguages.includes(l) && "✓ "}{l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <div className="mx-5 mb-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

        <div className="p-5 border-t border-gray-100 bg-white">
          <button 
            onClick={handleGenerate}
            disabled={isGenerating || isResearching}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all shadow-md ${
              isGenerating || isResearching ? "bg-indigo-400 text-white cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 text-white hover:-translate-y-0.5"
            }`}
          >
            {isResearching ? (
              <><RefreshCw className="w-5 h-5 animate-spin" /> 🔍 Researching YouTube...</>
            ) : isGenerating ? (
              <><RefreshCw className="w-5 h-5 animate-spin" /> Generating AI Content...</>
            ) : (
              <>{youtubeResearchEnabled ? <Search className="w-5 h-5" /> : <Zap className="w-5 h-5" />} {youtubeResearchEnabled ? "Research & Generate" : "Generate Campaign"}</>
            )}
          </button>
          {youtubeResearchEnabled && !isGenerating && !isResearching && (
            <p className="text-center text-[11px] text-gray-400 mt-2">Will search YouTube first, then generate AI content</p>
          )}
        </div>
      </div>

      {/* Right Pane - Outputs */}
      <div className="flex-1 bg-gray-50/50 rounded-3xl border border-gray-200 overflow-hidden flex flex-col shadow-inner">
        {isGenerating ? (
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            <div className="flex items-center gap-3 mb-2 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="h-6 w-48 bg-gray-200 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-[400px] bg-white rounded-3xl border border-gray-100 shadow-sm animate-pulse flex flex-col p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="h-4 w-24 bg-gray-100 rounded-full" />
                            <div className="h-8 w-8 bg-gray-100 rounded-full" />
                        </div>
                        <div className="h-4 w-full bg-gray-50 rounded-full" />
                        <div className="h-4 w-5/6 bg-gray-50 rounded-full" />
                        <div className="h-4 w-4/6 bg-gray-50 rounded-full" />
                        <div className="flex-1 bg-gray-50 rounded-2xl" />
                        <div className="h-10 w-full bg-gray-100 rounded-xl" />
                    </div>
                ))}
            </div>
          </div>
        ) : generatedPosts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-700">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100">
              <Zap className="w-10 h-10 text-gray-200" />
            </div>
            <h3 className="text-2xl font-black text-gray-300 mb-2">Awaiting Your Brilliance</h3>
            <p className="text-gray-400 max-w-sm font-medium">Input your topic on the left and hit generate to see the magic happen.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-xl text-green-600">
                    <CheckCircle2 className="w-6 h-6" />
                </div>
                {generatedPosts.length} Masterpieces Ready
              </h2>
            </div>

            {/* Social Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {generatedPosts.map((post, idx) => (
                    <PostCard 
                        key={post.id || idx}
                        post={{
                            ...post,
                            qualityScore: post.qualityScore || 85 + (idx % 2 === 0 ? 3 : -2)
                        }}
                        onRegenerate={() => handleRegenerate(post, idx)}
                        onUpdate={(updated) => {
                            setGeneratedPosts(prev => prev.map((p, i) => i === idx ? updated : p));
                        }}
                    />
                ))}
            </div>


            {/* Carousel Outline */}
            {carouselOutline.length > 0 && (
              <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-amber-100 bg-amber-50/30 flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg text-amber-700"><Layers className="w-4 h-4" /></div>
                  <span className="font-bold text-gray-900">Instagram Carousel Outline</span>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{carouselOutline.length} slides</span>
                </div>
                <div className="p-5 space-y-3">
                  {carouselOutline.map((slide: any, sIdx: number) => (
                    <div key={sIdx} className="p-3 bg-amber-50/40 rounded-xl border border-amber-100/80 relative">
                      <span className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                        {slide.slideNumber || sIdx + 1}
                      </span>
                      <h5 className="font-bold text-xs text-amber-900 mb-1">{slide.headline || slide.title}</h5>
                      <p className="text-xs text-amber-800/80 leading-relaxed">{slide.bodyText || slide.content}</p>
                      {slide.visualSuggestion && (
                        <p className="text-[10px] text-amber-600 mt-1.5 italic">📸 {slide.visualSuggestion}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shorts Script */}
            {shortsScript && (
              <div className="bg-white rounded-xl border border-violet-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-violet-100 bg-violet-50/20 flex items-center gap-3">
                  <div className="p-2 bg-violet-100 rounded-lg text-violet-700"><Video className="w-4 h-4" /></div>
                  <span className="font-bold text-gray-900">YouTube Shorts Script</span>
                  {shortsScript.totalWords && (
                    <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">~{shortsScript.totalWords} words</span>
                  )}
                </div>
                <div className="p-5 space-y-3">
                  {[
                    { label: "HOOK (0–3s)", key: "hook", color: "violet" },
                    { label: "PROBLEM (3–10s)", key: "problem", color: "red" },
                    { label: "SOLUTION (10–45s)", key: "solution", color: "blue" },
                    { label: "CTA (45–60s)", key: "cta", color: "green" },
                  ].map(({ label, key, color }) => (
                    shortsScript[key] && (
                      <div key={key}>
                        <span className={`text-[10px] uppercase font-bold tracking-wider text-${color}-600`}>{label}</span>
                        <div className={`mt-1 text-sm text-gray-800 bg-${color}-50/60 p-3 rounded-lg border border-${color}-100 leading-relaxed whitespace-pre-wrap`}>
                          {shortsScript[key]}
                        </div>
                      </div>
                    )
                  ))}
                </div>
                <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => {
                      const script = [
                        `[HOOK]\n${shortsScript.hook}`,
                        `[PROBLEM]\n${shortsScript.problem}`,
                        `[SOLUTION]\n${shortsScript.solution || shortsScript.body}`,
                        `[CTA]\n${shortsScript.cta}`,
                      ].filter(Boolean).join("\n\n");
                      navigator.clipboard.writeText(script);
                      setCopiedId("shorts");
                      setTimeout(() => setCopiedId(null), 1500);
                    }}
                    className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all"
                  >
                    {copiedId === "shorts" ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Blog Outline */}
            {blogOutline && (
              <div className="bg-white rounded-xl border border-emerald-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-emerald-100 bg-emerald-50/20 flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700"><BookOpen className="w-4 h-4" /></div>
                  <span className="font-bold text-gray-900">Blog Outline</span>
                </div>
                <div className="p-5">
                  <h4 className="font-bold text-gray-800 mb-3 text-sm">{blogOutline.title}</h4>
                  <div className="space-y-2">
                    {blogOutline.sections?.map((section: string, sIdx: number) => (
                      <div key={sIdx} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">{sIdx + 1}</span>
                        <span className="capitalize">{section.replace(/_/g, " ")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {publishingPost && (
        <PublishModal 
          post={publishingPost} 
          onClose={() => setPublishingPost(null)}
          onSuccess={(url) => {
            // Optional: update post row with active link or checkmark locally
          }}
        />
      )}

      {schedulingPost && (
        <ScheduleModal
          post={schedulingPost}
          onClose={() => setSchedulingPost(null)}
          onSuccess={() => {
            // Optional: show toast message
          }}
        />
      )}
    </div>
  );
}
