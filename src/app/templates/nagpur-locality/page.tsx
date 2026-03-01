"use client";

import { useState } from "react";
import { Sparkles, MapPin, Loader2, Copy, CalendarPlus, Send, CheckCircle2 } from "lucide-react";
import localities from "@/lib/nagpur_localities.json";
import PublishModal from "@/components/PublishModal";
import ScheduleModal from "@/components/ScheduleModal";

export default function NagpurLocalityTemplate() {
  const [selectedLocality, setSelectedLocality] = useState(localities[0].name);
  const [topicFocus, setTopicFocus] = useState("Appreciation Potential");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals
  const [publishingPost, setPublishingPost] = useState<any>(null);
  const [schedulingPost, setSchedulingPost] = useState<any>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    const locData = localities.find(l => l.name === selectedLocality);
    if (!locData) return;

    const customPrompt = `
      Act as an expert real estate copywriter in Nagpur.
      Write 3 social media posts (1 Instagram Carousel Outline, 1 LinkedIn Data-driven Post, 1 WhatsApp broadcast message in Marathi/Hinglish).
      
      Topic Focus: ${topicFocus}
      Locality Data:
      Name: ${locData.name}
      Connected To: ${locData.connectedTo.join(", ")}
      Schools: ${locData.schools.join(", ")}
      Hospitals: ${locData.hospitals.join(", ")}
      Upcoming Infra: ${locData.upcomingInfra.join(", ")}
      Price: ${locData.avgPlotPrice}
      Appreciation: ${locData.appreciation}
    `;

    try {
      const res = await fetch("/api/generate/week-from-topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Hijacking the topic generation endpoint to process our custom engineered prompt context
        body: JSON.stringify({
          topic: customPrompt,
          platforms: ["Instagram", "LinkedIn", "WhatsApp"],
          languages: ["English", "Marathi"],
          primaryLanguage: "English",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedPosts(data.posts || []);
      } else {
        alert(data.error || "Generation failed");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-20 p-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <MapPin className="w-8 h-8 text-emerald-600" /> Nagpur Locality Expert
        </h1>
        <p className="text-gray-500 mt-1">Generate highly specific, data-backed real estate content based on actual Nagpur micro-markets.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Select Locality</label>
            <select 
              value={selectedLocality}
              onChange={(e) => setSelectedLocality(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-600 outline-none bg-gray-50 text-gray-900 font-medium"
            >
              {localities.map(loc => (
                <option key={loc.name} value={loc.name}>{loc.name} ({loc.avgPlotPrice})</option>
              ))}
            </select>
            
            {/* Quick Stats Data Display */}
            {selectedLocality && (
              <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-sm">
                <p className="font-bold text-emerald-900 mb-2 border-b border-emerald-200 pb-2">Micro-market insights loaded:</p>
                <ul className="text-emerald-800 space-y-1 mt-2">
                  <li className="flex gap-2"><b>📈 Apprec.:</b> {localities.find(l => l.name === selectedLocality)?.appreciation}</li>
                  <li className="flex gap-2"><b>🏗 Infra:</b> {localities.find(l => l.name === selectedLocality)?.upcomingInfra[0]}</li>
                  <li className="flex gap-2"><b>🏥 Health:</b> {localities.find(l => l.name === selectedLocality)?.hospitals[0]}</li>
                </ul>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Content Angle / Focus</label>
            <select 
              value={topicFocus}
              onChange={(e) => setTopicFocus(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-600 outline-none bg-gray-50 text-gray-900 font-medium"
            >
              <option>Appreciation Potential & ROI</option>
              <option>Upcoming Infrastructure & Connectivity</option>
              <option>Family Living (Schools & Hospitals)</option>
              <option>Urgency (Limited plots left)</option>
            </select>
          </div>
        </div>

        <button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full md:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {isGenerating ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing Locality...</> : <><Sparkles className="w-5 h-5" /> Generate Localized Posts</>}
        </button>
      </div>

      {generatedPosts.length > 0 && (
        <div className="space-y-6 mt-8">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-2">Generated Campaigns for {selectedLocality}</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {generatedPosts.map((post, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col group overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                  <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-emerald-500"></span> {post.platform}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wider">{post.type}</span>
                </div>
                <div className="p-5 flex-1">
                  <h3 className="font-bold text-lg text-gray-900 mb-3">{post.title}</h3>
                  <div className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed space-y-2">{post.body}</div>
                  {post.imagePrompt && (
                    <div className="mt-4 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100/50">
                      <p className="text-xs text-indigo-800 font-medium italic">📸 AI Image Prompt: &quot;{post.imagePrompt}&quot;</p>
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 flex items-center justify-between mt-auto">
                  <button 
                    onClick={() => handleCopy(post.body, String(idx))}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                  >
                    {copiedId === String(idx) ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    Copy
                  </button>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSchedulingPost(post)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-100"
                    >
                      <CalendarPlus className="w-4 h-4" /> Schedule
                    </button>
                    <button 
                      onClick={() => setPublishingPost(post)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                    >
                      <Send className="w-4 h-4" /> Publish Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {publishingPost && (
        <PublishModal 
          post={publishingPost} 
          onClose={() => setPublishingPost(null)}
          onSuccess={() => {}}
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
