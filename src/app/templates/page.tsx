"use client";

import { useState } from "react";
import {
  Copy, CalendarPlus, RefreshCw, Zap, CheckCircle2,
  Building, ArrowRight, LayoutTemplate, ChevronDown, ChevronUp, Lightbulb, Send, MapPin
} from "lucide-react";
import Link from "next/link";

import PublishModal from "@/components/PublishModal";
import ScheduleModal from "@/components/ScheduleModal";
import PostCard from "@/components/PostCard";

const TEMPLATES = [
  { id: "listing", name: "New Project Announcement", icon: Building },
  { id: "price", name: "Price Revision / Offer", icon: Building },
  { id: "edu", name: "Educational Post (RERA, etc)", icon: Building },
  { id: "script", name: "Walkthrough Script", icon: Building },
  { id: "area", name: "Local Area Guide", icon: Building },
];

// ── Helper: render tags from string or string[] ───────────────────────────
function renderTags(tags: string[] | string | undefined) {
  if (!tags) return null;
  const tagList = Array.isArray(tags)
    ? tags
    : tags.split(/[\s,]+/).filter(Boolean);
  if (!tagList.length) return null;
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
    <div className="px-5 mb-3">
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

export default function Templates() {
  const [activeTemplate, setActiveTemplate] = useState(TEMPLATES[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<any[]>([]);
  
  const [publishingPost, setPublishingPost] = useState<any>(null);
  const [schedulingPost, setSchedulingPost] = useState<any>(null);

  const [propertyName, setPropertyName] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [usps, setUsps] = useState("");
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!propertyName || !location || !price) {
      setError("Please fill in the project name, location, and price.");
      return;
    }
    setError("");
    setIsGenerating(true);
    setGeneratedPosts([]);

    try {
      const res = await fetch("/api/generate/real-estate-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: activeTemplate,
          propertyName,
          location,
          startingPrice: price,
          usps: usps.split(",").map(s => s.trim()).filter(Boolean),
          platforms: ["Instagram", "WhatsApp", "LinkedIn"],
          languages: ["English", "Hinglish"],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setGeneratedPosts(data.posts || []);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (post: any) => {
    navigator.clipboard.writeText(post.content || post.body || "");
    setCopiedId(post.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <>
      <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Left Pane - Inputs */}
      <div className="w-full md:w-[450px] flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-bold text-gray-900">Real Estate Templates</h2>
          <p className="text-xs text-gray-500 mt-1">High-converting posts using proven Indian RE frameworks.</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Select a Template</label>
            <div className="space-y-2">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTemplate(t.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    activeTemplate === t.id 
                      ? "border-indigo-600 bg-indigo-50 text-indigo-900" 
                      : "border-gray-100 hover:border-gray-200 text-gray-700"
                  }`}
                >
                  <span className="font-medium text-sm">{t.name}</span>
                  {activeTemplate === t.id && <ArrowRight className="w-4 h-4 text-indigo-600" />}
                </button>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link 
                href="/templates/nagpur-locality"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-emerald-100 bg-emerald-50 hover:bg-emerald-100 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                    <MapPin className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-emerald-900 block">Nagpur Locality Posts</span>
                    <span className="text-[10px] text-emerald-700 font-medium">Data-driven micro-market content</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-600 transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 space-y-4 animate-in fade-in slide-in-from-right-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project/Property Name</label>
              <input 
                type="text" 
                value={propertyName}
                onChange={e => setPropertyName(e.target.value)}
                placeholder="e.g. Apex Green Valley Phase 2" 
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input 
                  type="text" 
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Panvel" 
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Starting Price</label>
                <input 
                  type="text" 
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="e.g. ₹25 Lakhs" 
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Top 3 USPs (Comma separated)</label>
              <textarea 
                rows={2}
                value={usps}
                onChange={e => setUsps(e.target.value)}
                placeholder="Near Metro, Clear Title, Flexible Payment"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all resize-none text-sm"
              ></textarea>
            </div>
          </div>

        </div>

        {error && <div className="mx-5 mb-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

        <div className="p-5 border-t border-gray-100 bg-white">
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all shadow-md ${
              isGenerating ? "bg-indigo-400 text-white cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 text-white hover:-translate-y-0.5"
            }`}
          >
            {isGenerating ? (
               <><RefreshCw className="w-5 h-5 animate-spin" /> Generating...</>
            ) : (
               <><Zap className="w-5 h-5" /> Generate Post</>
            )}
          </button>
        </div>
      </div>

      {/* Right Pane - Outputs */}
      <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden flex flex-col shadow-inner">
        {generatedPosts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <LayoutTemplate className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-400 mb-2">Fill the template</h3>
            <p className="text-gray-400 max-w-sm">Select a framework and fill in your property details to generate high-converting posts instantly.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                {generatedPosts.length} Posts Generated
              </h2>
            </div>

            {generatedPosts.map((post, idx) => (
              <PostCard 
                key={post.id || idx}
                post={{
                    ...post,
                    body: post.content || post.body || "",
                    qualityScore: post.qualityScore || 85
                }}
                onUpdate={(updated) => {
                    setGeneratedPosts(prev => prev.map((p, i) => i === idx ? updated : p));
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
      
      {/* Modals - already handled inside PostCard but keeping these for legacy if needed or removing if unused */}
    </>
  );
}
