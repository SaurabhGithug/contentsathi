"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Copy, CalendarPlus, RefreshCw, Zap, CheckCircle2,
  ChevronDown, ChevronUp, Lightbulb, Layers, Video, BookOpen, Info,
  Youtube, Search, MapPin, AlertCircle, ExternalLink, X, FileText, Image as ImageIcon, Send, BookMarked, Megaphone
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

import PublishModal from "@/components/PublishModal";
import ScheduleModal from "@/components/ScheduleModal";
import PostCard from "@/components/PostCard";

const PLATFORMS = ["Instagram", "LinkedIn", "YouTube Shorts", "WhatsApp", "X (Twitter)", "Facebook"];

const SMART_TOPIC_SUGGESTIONS = [
  "Why investing in plots is smarter than buying flats in 2026",
  "5 questions you must ask before buying any plot",
  "How RERA changed real estate buying forever",
  "Why Tier 2 cities are the best investment right now",
  "The truth about property appreciation in India",
  "How to spot a genuine real estate agent",
  "Why weekend site visits lead to faster decisions",
  "Top 3 mistakes first-time homebuyers make",
  "How to negotiate the best property price",
  "What vastu compliance actually means for buyers",
  "Why NA plots are better than agricultural land",
  "How Ring Road connectivity is changing property prices",
  "What NRIs should know before buying property in India",
  "Why festival season is the best time to buy property"
];

const SMART_AUDIENCE_SUGGESTIONS = [
  "First-time Homebuyers",
  "NRI Investors",
  "High-Net-Worth Individuals",
  "Working Families",
  "Retirees & Seniors",
  "Budget-Conscious Buyers",
  "Business Owners",
  "Luxury Seekers",
  "Tech Professionals",
  "Commercial Investors"
];

// All 11 supported languages with native script display names
const ALL_LANGUAGES: { id: string; label: string; native: string; isIndic: boolean }[] = [
  { id: "English",   label: "English",  native: "English",  isIndic: false },
  { id: "Hindi",     label: "Hindi",    native: "\u0939\u093f\u0928\u094d\u0926\u0940",    isIndic: true  },
  { id: "Marathi",   label: "Marathi",  native: "\u092e\u0930\u093e\u0920\u0940",  isIndic: true  },
  { id: "Tamil",     label: "Tamil",    native: "\u0ba4\u0bae\u0bbf\u0bb4\u0bcd",    isIndic: true  },
  { id: "Telugu",    label: "Telugu",   native: "\u0c24\u0c46\u0c32\u0c41\u0c17\u0c41",   isIndic: true  },
  { id: "Kannada",   label: "Kannada",  native: "\u0c95\u0ca8\u0ccd\u0ca8\u0ca1",  isIndic: true  },
  { id: "Malayalam", label: "Malayalam",native: "\u0d2e\u0d32\u0d2f\u0d3e\u0d33\u0d02",isIndic: true  },
  { id: "Bengali",   label: "Bengali",  native: "\u09ac\u09be\u0982\u09b2\u09be",  isIndic: true  },
  { id: "Gujarati",  label: "Gujarati", native: "\u0a97\u0ac1\u0a9c\u0ab0\u0abe\u0aa4\u0ac0", isIndic: true  },
  { id: "Punjabi",   label: "Punjabi",  native: "\u0a2a\u0a70\u0a1c\u0a3e\u0a2c\u0a40",  isIndic: true  },
  { id: "Odia",      label: "Odia",     native: "\u0b13\u0b21\u0bc8\u0b06",     isIndic: true  },
];
const LANGUAGES = ALL_LANGUAGES.map(l => l.id);

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

function GeneratorInner() {
  const searchParams = useSearchParams();
  const topicFromUrl = searchParams.get('topic') || '';
  const [topic, setTopic] = useState(topicFromUrl);
  const topicRef = useRef<HTMLTextAreaElement>(null);
  const [audience, setAudience] = useState("First-time homebuyers, Investors");
  const audienceRef = useRef<HTMLInputElement>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState(["Instagram", "LinkedIn", "WhatsApp", "YouTube Shorts"]);
  const [selectedLanguages, setSelectedLanguages] = useState(["English", "Hindi", "Marathi"]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [generatedPosts, setGeneratedPosts] = useState<any[]>([]);
  const [carouselOutline, setCarouselOutline] = useState<any[]>([]);
  const [shortsScript, setShortsScript] = useState<any>(null);
  const [blogOutline, setBlogOutline] = useState<any>(null);
  const [postLanguages, setPostLanguages] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [userPlanTier, setUserPlanTier] = useState<string>("free");

  // ── Workflow Agent State ──────────────────────────────────────────────────
  const [workflowStep, setWorkflowStep] = useState<number>(0);
  const [generationProgress, setGenerationProgress] = useState(0); 
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [workflowLabel, setWorkflowLabel] = useState<string>("");
  const [tone, setTone] = useState("Conversational");
  const TONE_OPTIONS = ["Professional", "Conversational", "Story-based", "Urgent", "Educational", "Bold"];
  const [cachedIntent, setCachedIntent] = useState<any>(null);
  const [cachedResearch, setCachedResearch] = useState<any>(null);

  // ── YouTube Research State ─────────────────────────────────────────────
  const [youtubeResearchEnabled, setYoutubeResearchEnabled] = useState(false);
  const [youtubeAdvancedSearch, setYoutubeAdvancedSearch] = useState("");
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
    const remixId = searchParams.get("remixId");

    if (topicFromUrl) {
      // Already set from useState initializer from URL, just ensure textarea reflects it
      setTopic(topicFromUrl);
    } else if (remixId) {
      const loadRemixAsset = async () => {
        try {
          const res = await fetch(`/api/generated-assets/${remixId}`);
          if (res.ok) {
            const asset = await res.json();
            setTopic(asset.body || asset.content || "");
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
    } else {
      // Auto-suggestion on load if no topic provided
      const random = SMART_TOPIC_SUGGESTIONS[Math.floor(Math.random() * SMART_TOPIC_SUGGESTIONS.length)];
      setTopic(random);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        if (brain.audienceDescription) setAudience(brain.audienceDescription);

        // Also load platformLangPrefs and planTier
        const prefRes = await fetch("/api/user/profile");
        if (prefRes.ok) {
          const userPrefs = await prefRes.json();
          if (userPrefs.planTier) {
            setUserPlanTier(userPrefs.planTier);
          }
          if (userPrefs.platformLangPrefs) {
            setPostLanguages(userPrefs.platformLangPrefs);
          } else {
             // Fallback to brain defaults
             const defaultLangMap: Record<string, string> = {};
             platforms.forEach(p => {
               defaultLangMap[p] = langs[0] || "English";
             });
             setPostLanguages(defaultLangMap);
          }
        }

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
            advancedSearch: youtubeAdvancedSearch.trim() || undefined,
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

    // ── Step 2: Generate Content via Workflow Agent ──────────────────────
    setIsGenerating(true);
    setWorkflowStep(1);
    setGenerationProgress(5);
    
    const startTime = Date.now();
    const updateStepProgress = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      
      if (elapsed < 4) {
        setWorkflowStep(1);
        setGenerationProgress(5 + (elapsed / 4) * 20);
      } else if (elapsed < 10) {
        setWorkflowStep(2);
        setGenerationProgress(25 + ((elapsed - 4) / 6) * 25);
      } else if (elapsed < 28) {
        setWorkflowStep(3);
        setGenerationProgress(50 + ((elapsed - 10) / 18) * 25);
      } else if (elapsed < 34) {
        setWorkflowStep(4);
        setGenerationProgress(75 + ((elapsed - 28) / 6) * 20);
      } else if (elapsed >= 34) {
        setWorkflowStep(5); 
        setGenerationProgress(100);
      }
      
      if (elapsed < 36) {
        progressTimerRef.current = setTimeout(updateStepProgress, 100);
      }
    };
    updateStepProgress();

    setWorkflowLabel("Starting AI Workflow Pipeline...");

    try {
      // Background save W5
      fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platformLangPrefs: postLanguages })
      }).catch(console.error);

      const res = await fetch("/api/generate/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          audience,
          tone,
          platforms: selectedPlatforms,
          languages: selectedLanguages,           // NEW: all selected output languages
          platformLanguages: postLanguages,
          primaryLanguage: selectedLanguages[0] || "English",
          researchContext: mergedTranscript,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Generation failed" }));
        throw new Error(errorData.error || `Error ${res.status}`);
      }

      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let content = "";
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          content += decoder.decode(value, { stream: true });
          const lines = content.split("\n\n");
          
          content = lines.pop() || "";
          
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.substring(6));
                if (data.error) throw new Error(data.error);
                
                if (data.step) setWorkflowStep(data.step);
                if (data.label) setWorkflowLabel(data.label);
                
                if (data.step === 6 && data.result) {
                  setGeneratedPosts(data.result.posts || []);
                  setCachedIntent(data.result.intentJson);
                  setCachedResearch(data.result.researchJson);
                  
                  if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
                  setWorkflowStep(6);
                  setGenerationProgress(100);
                  
                  // Keep isGenerating true for 1.5 seconds to show "Done!" message
                  await new Promise(resolve => setTimeout(resolve, 1500));
                  setIsGenerating(false);
                  setWorkflowStep(0);
                }
              } catch (e: any) {
                if (e.message && e.message !== "Unexpected end of JSON input") {
                  throw e;
                }
              }
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsGenerating(false);
      setWorkflowStep(0);
      setWorkflowLabel("");
    }
  };

  const handleCopy = (post: any) => {
    navigator.clipboard.writeText(post.body);
    setCopiedId(post.id);
    toast.success("Copied to clipboard! 📋");
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleRegenerate = async (post: any, idx: number, overrideLang?: string) => {
    const langToUse = overrideLang || postLanguages[post.platform] || post.language;
    setRegeneratingId(post.id || String(idx));
    try {
      const res = await fetch("/api/generate/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          platforms: [post.platform],
          languages: [langToUse],
          platformLanguages: { [post.platform]: langToUse },
          primaryLanguage: langToUse,
          tone,
          regeneratePlatform: post.platform,
          regenerateLanguage: langToUse,
          regenerate_single: true,
          cachedIntent,
          cachedResearch,
        }),
      });
      
      if (!res.ok) throw new Error("Regenerate failed");

      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let content = "";
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          content += decoder.decode(value, { stream: true });
          const lines = content.split("\n\n");
          content = lines.pop() || "";
          
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.substring(6));
                if (data.error) throw new Error(data.error);
                if (data.step === 6 && data.result?.posts?.[0]) {
                  setGeneratedPosts((prev) =>
                    prev.map((p, i) => (i === idx ? { ...p, ...data.result.posts[0], id: p.id } : p))
                  );
                  toast.success("Post regenerated ✨");
                }
              } catch (e: any) {
                // Ignore incomplete JSON chunks
              }
            }
          }
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Regenerate failed");
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
      toast.success(`"${post.title}" has been added to your calendar! 📅`);
    } catch {
      toast.error("Failed to schedule. Please try again.");
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
      toast.success("Image uploaded! 📸");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image.");
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
      
      toast.success(`Successfully published to ${post.platform}! ✅`);
    } catch (err: any) {
      toast.error(err.message || "Failed to publish.");
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-6 animate-in fade-in zoom-in-95 duration-500 lg:h-[calc(100vh-140px)] lg:overflow-hidden">
      
      {/* Left Pane - Inputs */}
      <div className="w-full md:w-[400px] flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden lg:h-full">
        <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50/80 to-violet-50/50">
          <h2 className="font-black text-gray-900">Content Generator</h2>
          <p className="text-xs text-indigo-600 mt-0.5 font-medium">Ek topic do — poora hafta ka content ready. Roz Dikhte Raho.</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Topic or Idea *</label>
            <textarea 
              ref={topicRef}
              rows={4}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. The impact of the new metro line on local property rates..."
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all resize-none text-sm"
            ></textarea>
            <div className="flex items-center gap-4 mt-2 px-1">
              <button 
                onClick={() => {
                  let next;
                  do {
                    next = SMART_TOPIC_SUGGESTIONS[Math.floor(Math.random() * SMART_TOPIC_SUGGESTIONS.length)];
                  } while (next === topic);
                  setTopic(next);
                }}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline transition-all"
              >
                Try another suggestion →
              </button>
              <button 
                onClick={() => {
                  setTopic("");
                  topicRef.current?.focus();
                }}
                className="text-[11px] font-bold text-gray-400 hover:text-gray-600 hover:underline transition-all"
              >
                Clear and write my own →
              </button>
            </div>
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
              <div className="flex-1 text-left flex items-center gap-2">
                <span>Research top YouTube videos on this topic</span>
                <div className="group/tooltip relative">
                  <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-2 bg-gray-900 text-white text-[10px] font-medium rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                    ContentSathi finds the top 5 YouTube videos on your topic, extracts key insights from their transcripts, and uses them to make your content more comprehensive and credible. Adds approximately 30 seconds to generation time.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
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
                    <Search className="w-3 h-3" /> Advanced Search Options
                    <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={youtubeAdvancedSearch}
                    onChange={(e) => setYoutubeAdvancedSearch(e.target.value)}
                    placeholder='e.g. Add specific keywords, filters, or competitor names...'
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
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Target Audience</label>
              {audience !== "Auto (Let AI decide)" && audience.trim() !== "" && (
                <button
                  onClick={() => {
                    setAudience("");
                    audienceRef.current?.focus();
                  }}
                  className="text-[10px] font-bold text-gray-400 hover:text-gray-600"
                >
                  Clear
                </button>
              )}
            </div>
            <input 
              ref={audienceRef}
              type="text" 
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g. Young professionals in tech..."
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all text-sm"
            />
            
            <div className="flex overflow-x-auto gap-2 mt-3 pb-2 snap-x snap-mandatory hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <style jsx>{`
                .hide-scrollbar::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              <button
                onClick={() => setAudience("Auto (Let AI decide)")}
                className={`snap-start flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
                  audience === "Auto (Let AI decide)"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100"
                }`}
              >
                ✨ Auto
              </button>
              {SMART_AUDIENCE_SUGGESTIONS.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => setAudience(suggestion)}
                  className={`snap-start flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all border ${
                    audience === suggestion
                      ? "bg-gray-800 text-white border-gray-800 shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 focus:ring-2 focus:ring-indigo-200"
                  }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Platforms</label>
            </div>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.filter(p => userPlanTier !== "free" || p === "Instagram" || p === "WhatsApp").map(p => (
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
            {userPlanTier === "free" && (
              <div className="mt-3 p-4 bg-gray-50 border border-gray-100 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-gray-500 font-medium leading-relaxed">Unlock LinkedIn, YouTube Shorts, X and Facebook — upgrade to Sathi Pro at ₹999 per month</p>
                <Link href="/billing" className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-lg hover:bg-indigo-700 transition-all whitespace-nowrap">
                  Upgrade to Sathi Pro →
                </Link>
              </div>
            )}
          </div>

          {/* ── Language Selector ──────────────────────────── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Output Languages</label>
            <div className="flex flex-wrap gap-2">
              {ALL_LANGUAGES.filter(lang => userPlanTier !== "free" || ["English", "Hindi", "Marathi"].includes(lang.id)).map(lang => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => toggleItem(selectedLanguages, lang.id, setSelectedLanguages)}
                  className={`flex flex-col items-center px-4 py-2.5 rounded-xl border text-center transition-all ${
                    selectedLanguages.includes(lang.id)
                      ? lang.isIndic
                        ? "bg-violet-600 text-white border-violet-600 shadow-md"
                        : "bg-indigo-600 text-white border-indigo-600 shadow-md"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-[13px] font-bold leading-none">{lang.native}</span>
                  <span className="text-[9px] mt-0.5 opacity-75 font-medium">{lang.label}</span>
                </button>
              ))}
            </div>
            {userPlanTier === "free" && (
              <div className="mt-3 p-4 bg-gray-50 border border-gray-100 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-gray-500 font-medium leading-relaxed">Unlock Tamil, Telugu, Kannada, Malayalam, Bengali, Gujarati, Punjabi and Odia — upgrade to Sathi Pro</p>
                <Link href="/billing" className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-lg hover:bg-indigo-700 transition-all whitespace-nowrap">
                  Upgrade to Sathi Pro →
                </Link>
              </div>
            )}
            <div className="mt-4 p-2 bg-violet-50 rounded-lg inline-flex items-center gap-2 border border-violet-100">
              <span className="px-2 py-0.5 rounded bg-violet-600 text-[10px] font-black text-white uppercase tracking-wider">Powered by Sarvam AI</span>
              <span className="text-[11px] text-violet-700 font-medium">India&apos;s sovereign AI for 10 Indian languages</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">How do you want to sound?</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none bg-white text-sm"
            >
              <option value="Professional">Professional & Formal</option>
              <option value="Conversational">Friendly & Casual</option>
              <option value="Story-based">Tell a Story</option>
              <option value="Urgent">Create Urgency</option>
              <option value="Educational">📚 Educational &amp; Informative</option>
              <option value="Bold">💪 Bold &amp; Confident</option>
            </select>
          </div>
        </div>

        {error && <div className="mx-5 mb-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

        <div className="p-5 border-t border-gray-100 bg-white space-y-3">
          {/* FIX 5: Credit warning ABOVE generate button */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
            <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 fill-current" />
            <div>
              <p className="text-xs font-bold text-amber-800">
                This will use <span className="underline">{selectedPlatforms.length * selectedLanguages.length} credits</span> from your monthly allowance
              </p>
              <p className="text-[10px] text-amber-600 font-medium mt-0.5">
                {selectedPlatforms.length} platform{selectedPlatforms.length > 1 ? 's' : ''} × {selectedLanguages.length} language{selectedLanguages.length > 1 ? 's' : ''} = {selectedPlatforms.length * selectedLanguages.length} posts generated
              </p>
            </div>
          </div>

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
              <>{youtubeResearchEnabled ? <Search className="w-5 h-5" /> : <Zap className="w-5 h-5" />} {youtubeResearchEnabled ? "Research & Generate" : "Generate My Content"}</>
            )}
          </button>
          {youtubeResearchEnabled && !isGenerating && !isResearching && (
            <p className="text-center text-[11px] text-gray-400">Will search YouTube first, then generate AI content</p>
          )}
        </div>
      </div>

      {/* Right Pane - Outputs */}
      <div className="flex-1 bg-gray-50/50 rounded-3xl border border-gray-200 overflow-hidden flex flex-col shadow-inner lg:h-full">
        {isGenerating ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white">
            <div className="w-full max-w-lg">
              <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
                <Zap className="w-6 h-6 text-indigo-600 fill-indigo-600" />
                Workflow Agent Progress
              </h3>
              
              <div className="space-y-8 relative">
                {/* Vertical line connector */}
                <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-gray-100 -z-0" />
                
                {[
                  { id: 1, label: "Analyzing your content goal and audience" },
                  { id: 2, label: "Researching market context and local insights" },
                  { id: 3, label: "Writing platform-specific content in all languages" },
                  { id: 4, label: "Quality checking and sharpening every post" }
                ].map((step, idx) => {
                  const isCompleted = workflowStep > step.id;
                  const isActive = workflowStep === step.id;
                  
                  return (
                    <div key={step.id} className="flex items-start gap-4 relative z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-500 ${
                        isCompleted ? "bg-green-500 border-green-500 text-white" : 
                        isActive ? "bg-white border-indigo-600 text-indigo-600" : "bg-white border-gray-200 text-gray-400"
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : isActive ? (
                          <div className="relative w-full h-full flex items-center justify-center">
                            <div className="absolute inset-0 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
                          </div>
                        ) : (
                          <div className="w-2 h-2 bg-gray-200 rounded-full" />
                        )}
                      </div>
                      
                      <div className="pt-1">
                        <p className={`text-sm font-bold transition-all duration-300 ${
                          isCompleted ? "text-gray-900" : isActive ? "text-indigo-600 text-base" : "text-gray-400"
                        }`}>
                          {step.label}
                        </p>
                        {isActive && step.id === 3 && (
                          <p className="text-[10px] text-indigo-400 font-medium mt-1 animate-pulse italic">
                            Running in parallel for all platforms — this is the deep work.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Progress Bar Container */}
              <div className="mt-12">
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 transition-all duration-500 ease-out"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{Math.round(generationProgress)}% COMPLETE</span>
                  {workflowStep >= 5 && (
                    <span className="text-[11px] font-black text-green-600 animate-bounce">Roz Dikhte Raho</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : generatedPosts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-700">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100">
              <Zap className="w-10 h-10 text-gray-200" />
            </div>
            <h3 className="text-2xl font-black text-gray-300 mb-2">Your content will appear here</h3>
            <p className="text-gray-400 max-w-md font-medium">Enter your topic and click Generate My Content. Your ContentSathi will have posts ready for all platforms in under 2 minutes.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-xl text-green-600">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  {generatedPosts.length} Posts Ready
                </h2>
                <p className="text-xs text-indigo-600 font-bold mt-1 ml-14">Done! Your ContentSathi has prepared content across {new Set(generatedPosts.map(p => p.platform)).size} platform{new Set(generatedPosts.map(p => p.platform)).size > 1 ? 's' : ''} in {new Set(generatedPosts.map(p => p.language || "English")).size} language{new Set(generatedPosts.map(p => p.language || "English")).size > 1 ? 's' : ''}.</p>
              </div>
            </div>

            {/* Posts grid with language context badges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {generatedPosts.map((post, idx) => {
                // Determine which languages apply to this platform
                const platformLangs = selectedLanguages.length > 0 ? selectedLanguages : [post.language || "English"];
                return (
                  <div key={post.id || idx} className="flex flex-col gap-2">
                    {/* Language badge strip for this platform */}
                    {platformLangs.length > 1 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {platformLangs.map(lang => {
                          const langInfo = ALL_LANGUAGES.find(l => l.id === lang);
                          return (
                            <span key={lang} className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              lang === "English" ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "bg-violet-50 text-violet-700 border border-violet-100"
                            }`}>
                              {langInfo?.native || lang}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    <PostCard 
                      post={{
                        ...post,
                        qualityScore: post.qualityScore || 85 + (idx % 2 === 0 ? 3 : -2)
                      }}
                      onRegenerate={() => handleRegenerate(post, idx)}
                      onUpdate={(updated) => {
                        setGeneratedPosts(prev => prev.map((p, i) => i === idx ? updated : p));
                      }}
                    />
                    {/* Regenerate This Platform button */}
                    <button
                      onClick={() => handleRegenerate(post, idx)}
                      disabled={!!regeneratingId}
                      className="w-full py-2 text-xs font-bold text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-200 hover:border-indigo-600 rounded-xl transition-all flex items-center justify-center gap-2 bg-indigo-50/50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${regeneratingId === (post.id || String(idx)) ? 'animate-spin' : ''}`} />
                      Regenerate {post.platform}
                    </button>
                  </div>
                );
              })}
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

export default function Generator() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 animate-pulse" />
          <div className="h-4 w-48 bg-gray-100 rounded-full animate-pulse" />
        </div>
      </div>
    }>
      <GeneratorInner />
    </Suspense>
  );
}
