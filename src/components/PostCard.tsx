"use client";

import { useState, useEffect } from "react";
import { 
  Instagram, 
  Linkedin, 
  Twitter, 
  Youtube, 
  MessageCircle, 
  Facebook, 
  Calendar, 
  Send, 
  MoreHorizontal, 
  Edit3, 
  Trash2, 
  Copy, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
  Star,
  ArrowRight,
  Languages,
  Loader2,
  BarChart2,
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils/utils";
import ScheduleModal from "./ScheduleModal";
import PublishModal from "./PublishModal";
import RefreshModal from "./RefreshModal";
import PerformancePredictor from "./PerformancePredictor";
import { analyzeContent, QualityScore } from "@/lib/utils/quality-checker";

interface PostCardProps {
  post: {
    id?: string;
    title?: string;
    body: string;
    platform: string;
    imageUrl?: string;
    imagePrompt?: string;
    qualityScore?: number;
    tags?: string[];
    cta?: string;
    notes?: string;
    isGoldenExample?: boolean;
    status?: string;
    platformPostUrl?: string;
  };
  onRegenerate?: () => void;
  onDelete?: () => void;
  onUpdate?: (updatedPost: any) => void;
}

const PLATFORM_CONFIG: Record<string, { icon: any, color: string, bg: string, text: string, limit: number }> = {
  instagram: { icon: Instagram, color: "#E4405F", bg: "bg-pink-50", text: "text-pink-600", limit: 2200 },
  linkedin: { icon: Linkedin, color: "#0A66C2", bg: "bg-blue-50", text: "text-blue-600", limit: 3000 },
  x: { icon: Twitter, color: "#000000", bg: "bg-gray-50", text: "text-gray-900", limit: 280 },
  twitter: { icon: Twitter, color: "#000000", bg: "bg-gray-50", text: "text-gray-900", limit: 280 },
  youtube: { icon: Youtube, color: "#FF0000", bg: "bg-red-50", text: "text-red-600", limit: 5000 },
  facebook: { icon: Facebook, color: "#1877F2", bg: "bg-blue-50", text: "text-blue-700", limit: 63206 },
  whatsapp: { icon: MessageCircle, color: "#25D366", bg: "bg-green-50", text: "text-green-600", limit: 4096 },
};

export default function PostCard({ post: initialPost, onRegenerate, onDelete, onUpdate }: PostCardProps) {
  const [post, setPost] = useState(initialPost);
  const [isEditing, setIsEditing] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [showRefresh, setShowRefresh] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showPredictor, setShowPredictor] = useState(false);
  const [tempBody, setTempBody] = useState(post.body);
  const [tempTitle, setTempTitle] = useState(post.title || "");
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [hasWebsites, setHasWebsites] = useState(false);
  const [isGolden, setIsGolden] = useState(post.isGoldenExample || false);
  const [isUpdatingGolden, setIsUpdatingGolden] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslateMenu, setShowTranslateMenu] = useState(false);
  const [analysis, setAnalysis] = useState<QualityScore | null>(
    post.body ? analyzeContent(post.body, post.platform) : null
  );

  useEffect(() => {
    async function checkWebsites() {
      try {
        const res = await fetch("/api/website-connections");
        const data = await res.json();
        setHasWebsites(data.websites?.length > 0);
      } catch {}
    }
    checkWebsites();
  }, []);

  const toggleGolden = async () => {
    if (!post.id) return;
    setIsUpdatingGolden(true);
    try {
      const res = await fetch(`/api/generated-assets/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isGoldenExample: !isGolden })
      });
      if (res.ok) setIsGolden(!isGolden);
    } catch {} finally {
      setIsUpdatingGolden(false);
    }
  };

  const handleTranslate = async (lang: string) => {
    setIsTranslating(true);
    setShowTranslateMenu(false);
    try {
      const res = await fetch("/api/generate/translate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalText: post.body,
          targetLanguage: lang,
          platform: post.platform
        })
      });
      if (!res.ok) throw new Error("Translation failed");
      const data = await res.json();
      if (data.translatedText) {
        setTempBody(data.translatedText);
        setPost({ ...post, body: data.translatedText });
        setIsEditing(true); // Open in edit mode to review
      }
    } catch (err) {
      console.error(err);
      alert("Failed to translate post.");
    } finally {
      setIsTranslating(false);
    }
  };

  const platform = post.platform.toLowerCase();
  const config = PLATFORM_CONFIG[platform] || { icon: Sparkles, color: "#6366F1", bg: "bg-indigo-50", text: "text-indigo-600", limit: 2000 };
  const Icon = config.icon;

  const charCount = tempBody.length;
  const isOverLimit = charCount > config.limit;

  const handleSave = () => {
    const updated = { ...post, body: tempBody, title: tempTitle };
    const newAnalysis = analyzeContent(tempBody, post.platform);
    setPost({ ...updated, qualityScore: newAnalysis.score });
    setAnalysis(newAnalysis);
    setIsEditing(false);
    if (onUpdate) onUpdate(updated);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(post.body);
  };

  const getQualityColor = (score?: number) => {
    if (!score) return "bg-gray-100 text-gray-500";
    if (score >= 80) return "bg-green-100 text-green-700 border-green-200";
    if (score >= 60) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  return (
    <div className="group relative bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col min-h-[400px] animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 bg-gradient-to-r from-gray-50/50 to-transparent">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-2xl", config.bg)}>
            <Icon className={cn("w-5 h-5", config.text)} />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block leading-none mb-1">
              {post.platform}
            </span>
            {isEditing ? (
              <input 
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                className="text-sm font-bold text-gray-900 bg-transparent border-b border-indigo-200 outline-none w-full"
                placeholder="Post Title..."
              />
            ) : (
              <h3 className="text-sm font-bold text-gray-900 truncate max-w-[150px]">
                {post.title || "Untitled Post"}
              </h3>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {(post.qualityScore || analysis?.score) && (
            <button 
                onClick={() => setShowAnalysis(!showAnalysis)}
                className={cn(
                    "px-2 py-1 rounded-lg text-[10px] font-black border flex items-center gap-1 transition-all hover:scale-105", 
                    getQualityColor(analysis?.score || post.qualityScore)
                )}
            >
              <Sparkles className="w-3 h-3" />
              {(analysis?.score || post.qualityScore || 0)}%
              {showAnalysis ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
          <button 
                onClick={toggleGolden}
                disabled={isUpdatingGolden || !post.id}
                className={cn(
                    "p-2 hover:bg-amber-50 rounded-full transition-all text-gray-400",
                    isGolden && "text-amber-500 fill-amber-500"
                )}
            >
              <Star className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Analysis Breakdown */}
      {showAnalysis && analysis && (
        <div className="px-5 py-3 bg-indigo-50/50 border-b border-indigo-100/50 animate-in slide-in-from-top-2 duration-300 max-h-40 overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-3.5 h-3.5 text-indigo-600" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Optimization Feedback</h4>
            </div>
            <ul className="space-y-2">
                {analysis.feedback.length > 0 ? analysis.feedback.map((f, i) => (
                    <li key={i} className="text-[11px] font-medium text-gray-600 flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                        {f}
                    </li>
                )) : (
                    <li className="text-[11px] font-medium text-green-600 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5" /> This content is perfectly optimized!
                    </li>
                )}
            </ul>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-5 space-y-4">
        {isEditing ? (
          <div className="space-y-2">
            <textarea 
              value={tempBody}
              onChange={(e) => setTempBody(e.target.value)}
              className="w-full h-40 text-sm leading-relaxed text-gray-700 bg-gray-50 p-4 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all outline-none resize-none font-medium"
            />
            <div className="flex items-center justify-between">
              <span className={cn("text-[10px] font-bold", isOverLimit ? "text-red-500" : "text-gray-400")}>
                {charCount} / {config.limit} chars
              </span>
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(false)} className="px-3 py-1 text-[10px] font-bold text-gray-500 hover:text-gray-700">Cancel</button>
                <button onClick={handleSave} className="px-3 py-1 text-[10px] font-bold bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700">Save Changes</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative group/content">
            <p className="text-sm leading-relaxed text-gray-700 font-medium whitespace-pre-wrap">
              {post.body}
            </p>
            <button 
              onClick={() => setIsEditing(true)}
              className="absolute -top-2 -right-2 p-2 bg-white shadow-md rounded-xl opacity-0 group-hover/content:opacity-100 transition-opacity hover:bg-indigo-50 hover:text-indigo-600 border border-gray-100"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Media Preview or Prompt */}
        {post.imageUrl ? (
          <div className="relative rounded-2xl overflow-hidden border border-gray-100 aspect-video bg-gray-50 group/img">
            <img src={post.imageUrl} alt="Post media" className="object-cover w-full h-full" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button className="p-2 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/40"><RefreshCw className="w-4 h-4" /></button>
              <button onClick={() => setPost({...post, imageUrl: undefined})} className="p-2 bg-white/20 backdrop-blur-md rounded-xl text-red-100 hover:bg-red-500/40"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ) : post.imagePrompt && (
          <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50">
            <button 
              onClick={() => setShowPrompt(!showPrompt)}
              className="flex items-center justify-between w-full text-indigo-600 font-bold text-[10px] uppercase tracking-wider"
            >
              <span className="flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5" /> AI Image Prompt
              </span>
              {showPrompt ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showPrompt && (
              <div className="mt-3 text-[11px] text-indigo-900/70 font-medium leading-relaxed italic animate-in fade-in slide-in-from-top-2 duration-300">
                &quot;{post.imagePrompt}&quot;
                <button className="mt-2 w-full py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-sm">
                  <Sparkles className="w-3 h-3" /> Generate from Prompt
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-auto p-4 border-t border-gray-50 flex flex-wrap items-center justify-between gap-4 bg-gray-50/30">
        <div className="flex gap-1 relative flex-wrap">
          <button onClick={copyToClipboard} title="Copy Body" className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
            <Copy className="w-4 h-4" />
          </button>
          <button onClick={() => setShowRefresh(true)} title="Refresh & Republish" className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setShowTranslateMenu(!showTranslateMenu)} 
            disabled={isTranslating}
            title="Translate Post" 
            className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
          >
            {isTranslating ? <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> : <Languages className="w-4 h-4" />}
          </button>
          
          {showTranslateMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-32 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20 animate-in fade-in slide-in-from-bottom-2">
              {["English", "Hindi", "Marathi", "Hinglish"].map((lang) => (
                <button 
                  key={lang}
                  onClick={() => handleTranslate(lang)}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                >
                  {lang}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          {post.platformPostUrl && (
             <a 
               href={post.platformPostUrl} 
               target="_blank" 
               rel="noreferrer"
               className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all border border-indigo-100 shadow-sm"
             >
               View Live Post <ArrowRight className="w-3.5 h-3.5" />
             </a>
          )}
          <button 
            onClick={() => setShowSchedule(true)}
            className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2.5 text-[10px] md:text-xs font-bold text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-gray-100 bg-white shadow-sm"
          >
            <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4" /> Schedule
          </button>
          
          {hasWebsites && (
            <button 
                onClick={() => {
                    alert("Pushing to connected website...");
                }}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all border border-emerald-100 bg-white shadow-sm"
            >
                <Globe className="w-4 h-4" /> Push to Site
            </button>
          )}

          <button 
            onClick={() => setShowPublish(true)}
            className="flex items-center gap-1 md:gap-2 px-3 md:px-5 py-2.5 text-[10px] md:text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-indigo-200 shadow-lg"
          >
            <Send className="w-3.5 h-3.5 md:w-4 md:h-4" /> Publish
          </button>

          <button 
            onClick={() => setShowPredictor(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-all border border-purple-100 bg-white shadow-sm"
            title="AI Performance Prediction"
          >
            <BarChart2 className="w-4 h-4" /> Predict
          </button>
        </div>
      </div>

      {/* Modals */}
      {showSchedule && (
        <ScheduleModal 
          post={post} 
          onClose={() => setShowSchedule(false)} 
          onSuccess={() => console.log("Scheduled")}
        />
      )}
      {showPublish && (
        <PublishModal 
          post={post} 
          onClose={() => setShowPublish(false)} 
          onSuccess={(url) => {
             setPost({...post, status: "published", platformPostUrl: url});
             setShowPublish(false);
          }}
        />
      )}
      {showRefresh && post.id && (
        <RefreshModal
          post={{ id: post.id, title: post.title || "Post", body: post.body, platform: post.platform }}
          onClose={() => setShowRefresh(false)}
          onSuccess={(newBody) => {
             setTempBody(newBody);
             setPost({...post, body: newBody});
             setShowRefresh(false);
             setIsEditing(true); // Open in edit mode to review before saving
          }}
        />
      )}
      {showPredictor && (
        <PerformancePredictor
          postBody={post.body}
          platform={post.platform}
          language={(post as any).language}
          postType={(post as any).type}
          onClose={() => setShowPredictor(false)}
        />
      )}
    </div>
  );
}
