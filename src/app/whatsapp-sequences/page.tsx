"use client";

import { useState, useEffect } from "react";
import { MessageSquare, CalendarClock, Zap, Loader2, Send, Save, Edit3, ArrowRight } from "lucide-react";
import PublishModal from "@/components/PublishModal";

const SEQUENCES = [
  { id: "cold_lead", name: "Cold Lead Nurture", duration: "7 Days", desc: "Builds trust with absolute cold leads who inquired about plots." },
  { id: "post_visit", name: "Post Site-Visit Follow-up", duration: "3 Days", desc: "Creates urgency and offers assistance after a site visit." },
  { id: "festival", name: "Festival Campaign (Gudi Padwa/Diwali)", duration: "3 Days", desc: "Special festival offers to push fence-sitters." },
];

export default function WhatsAppSequences() {
  const [activeSequence, setActiveSequence] = useState(SEQUENCES[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Modals
  const [publishingPost, setPublishingPost] = useState<any>(null);
  const [brain, setBrain] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // L8: Trigger state
  const [savedSequenceId, setSavedSequenceId] = useState<string | null>(null);
  const [triggerContacts, setTriggerContacts] = useState("");
  const [broadcastName, setBroadcastName] = useState("");
  const [isTriggeringSeq, setIsTriggeringSeq] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState("");

  useEffect(() => {
    fetch("/api/content-brain").then(res => res.json()).then(data => setBrain(data));
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setMessages([]);

    const seqData = SEQUENCES.find(s => s.id === activeSequence);
    
    const brandName = brain?.brandName || "a real estate project";
    const brandTopic = brain?.brandDescription || "selling premium plots";
    const brandTone = brain?.tone || "Professional and persuasive";
    const audience = brain?.audienceDescription || "investors and home buyers";

    const promptContext = `
      Act as an expert real estate WhatsApp marketer.
      Brand Name: ${brandName}
      Project Context: ${brandTopic}
      Target Audience: ${audience}
      Tone: ${brandTone}
      
      TASK: Create a ${seqData?.name} sequence (${seqData?.duration}).
      Write 3 distinct WhatsApp messages spaced out over the duration.
      Primary Language: ${brain?.primaryLanguage || "English"}. 
      Use local flavor (Mix of Hindi/English/Marathi if appropriate). 
      Keep it conversational, not spammy. Include clear CTAs.
    `;

    try {
      const res = await fetch("/api/generate/week-from-topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Re-using the versatile /week-from-topic endpoint for generation
        body: JSON.stringify({
          topic: promptContext,
          platforms: ["WhatsApp", "WhatsApp", "WhatsApp"], // Force 3 WhatsApp messages
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // Tag with mock delays
        const formatted = (data.posts || []).slice(0, 3).map((p: any, i: number) => ({
          ...p,
          delay: i === 0 ? "Immediate" : i === 1 ? "Day 2" : "Day " + (activeSequence === "cold_lead" ? "7" : "3"),
        }));
        setMessages(formatted);
      } else {
        alert(data.error || "Generation failed");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToPrisma = async () => {
    if (messages.length === 0) return;
    setIsSaving(true);
    try {
      const seqData = SEQUENCES.find(s => s.id === activeSequence);
      const res = await fetch("/api/whatsapp-sequences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: seqData?.name || "New Sequence",
          description: seqData?.desc,
          steps: messages.map((m, i) => ({
            delayDays: i === 0 ? 0 : i === 1 ? 2 : 7,
            body: m.body,
          })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSavedSequenceId(data.id || null);
        alert("Sequence saved! You can now trigger it below.");
      } else {
        const error = await res.json();
        alert("Error saving: " + error.error);
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTriggerSequence = async () => {
    if (!savedSequenceId) {
      alert("Please save the sequence first before triggering it.");
      return;
    }
    const phones = triggerContacts.split(/[,\n]/).map(p => p.trim()).filter(Boolean);
    if (phones.length === 0) {
      alert("Please enter at least one contact number.");
      return;
    }
    setIsTriggeringSeq(true);
    setTriggerMsg("");
    try {
      const res = await fetch(`/api/whatsapp-sequences/${savedSequenceId}/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactNumbers: phones, broadcastName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTriggerMsg(data.message);
    } catch (err: any) {
      setTriggerMsg("Error: " + err.message);
    } finally {
      setIsTriggeringSeq(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-20">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-green-600" /> WhatsApp Sequences
        </h1>
        <p className="text-gray-500 mt-1">Automated multi-step WhatsApp campaigns to nurture leads and drive site visits.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Left pane: Sequence Selection */}
        <div className="w-full md:w-1/3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4 h-fit">
          <h2 className="font-bold text-gray-900 border-b pb-3 mb-2">Select Journey</h2>
          {SEQUENCES.map(seq => (
            <div 
              key={seq.id}
              onClick={() => setActiveSequence(seq.id)}
              className={`p-4 rounded-xl cursor-pointer transition-all border ${
                activeSequence === seq.id 
                  ? "border-green-500 bg-green-50 text-green-900 shadow-sm" 
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm leading-tight">{seq.name}</span>
                {activeSequence === seq.id && <ArrowRight className="w-4 h-4 text-green-600" />}
              </div>
              <span className="text-[10px] font-bold text-green-700 bg-green-100/50 px-2 py-0.5 rounded uppercase tracking-wider mb-2 inline-block">
                {seq.duration}
              </span>
              <p className={`text-xs ${activeSequence === seq.id ? "text-green-800" : "text-gray-500"}`}>
                {seq.desc}
              </p>
            </div>
          ))}

          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all shadow-md mt-4 flex justify-center items-center gap-2 disabled:opacity-70"
          >
            {isGenerating ? <><Loader2 className="w-5 h-5 animate-spin" /> Writing...</> : <><Zap className="w-5 h-5" /> Generate Sequence</>}
          </button>

          {/* L8: Trigger Section */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">🚀 Trigger Sequence</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Contact Numbers (comma or newline separated)</label>
                <textarea
                  rows={3}
                  value={triggerContacts}
                  onChange={e => setTriggerContacts(e.target.value)}
                  placeholder="+91-9876543210, +91-9123456789"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-400 outline-none text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Broadcast Name (optional)</label>
                <input
                  type="text"
                  value={broadcastName}
                  onChange={e => setBroadcastName(e.target.value)}
                  placeholder="e.g. Gudi Padwa Leads"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-400 outline-none text-sm"
                />
              </div>
              {triggerMsg && (
                <div className={`p-3 rounded-lg text-xs font-medium ${
                  triggerMsg.startsWith("Error") ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-800 border border-green-200"
                }`}>{triggerMsg}</div>
              )}
              <button
                onClick={handleTriggerSequence}
                disabled={isTriggeringSeq || !savedSequenceId}
                title={!savedSequenceId ? "Save the sequence first" : ""}
                className="w-full flex items-center justify-center gap-2 py-3 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isTriggeringSeq ? <><Loader2 className="w-4 h-4 animate-spin" /> Triggering...</> : <><Send className="w-4 h-4" /> Trigger Sequence</>}
              </button>
              {!savedSequenceId && (
                <p className="text-[10px] text-gray-400 text-center">Generate and save the sequence above first.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right pane: Generated Sequence */}
        <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 p-6 min-h-[500px] flex flex-col relative">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
              <CalendarClock className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">No Sequence Generated</h3>
              <p className="text-sm text-gray-500 max-w-xs">Select a journey on the left and click generate to create personalized AI WhatsApp messages.</p>
            </div>
          ) : (
            <div className="space-y-6 pb-20">
              <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Active Sequence Preview
                </h3>
              </div>
              
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent">
                {messages.map((msg, idx) => (
                  <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    {/* Timeline dot */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-green-100 text-green-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <span className="text-xs font-bold">{idx + 1}</span>
                    </div>

                    {/* Card container */}
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                         <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">Delay: {msg.delay}</span>
                         <button 
                           onClick={() => setEditingId(editingId === String(idx) ? null : String(idx))}
                           className="text-gray-400 hover:text-indigo-600 transition-colors"
                         >
                           <Edit3 className="w-4 h-4" />
                         </button>
                      </div>
                      
                      {editingId === String(idx) ? (
                        <textarea 
                          className="w-full h-32 text-sm text-gray-800 p-2 border border-indigo-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                          value={msg.body}
                          onChange={(e) => setMessages(messages.map((m, i) => i === idx ? { ...m, body: e.target.value } : m))}
                        />
                      ) : (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {msg.body}
                        </p>
                      )}

                      <div className="mt-4 pt-3 border-t border-gray-50 flex justify-end">
                        <button 
                          onClick={() => setPublishingPost({ ...msg, platform: 'WhatsApp', title: `Sequence Step ${idx+1}` })}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" /> Test Send
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Floating Save Bar */}
          {messages.length > 0 && (
             <div className="absolute bottom-6 left-6 right-6 bg-white border border-gray-200 shadow-xl rounded-xl p-4 flex items-center justify-between animate-in slide-in-from-bottom-5">
                <div>
                  <h4 className="font-bold text-gray-900text-sm">Sequence Ready</h4>
                  <p className="text-xs text-gray-500">Deploy this sequence to start nurturing imported leads.</p>
                </div>
                <button 
                  onClick={handleSaveToPrisma}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-colors disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Activate Sequence
                </button>
             </div>
          )}
        </div>
      </div>

      {publishingPost && (
        <PublishModal 
          post={publishingPost} 
          onClose={() => setPublishingPost(null)}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}
