"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    businessName: "",
    niche: "",
    brandVoice: "formal",
    languages: [] as string[],
    platforms: [] as string[],
    firstTopic: "",
  });

  const nextStep = () => setStep((s) => Math.min(4, s + 1));
  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  const handleComplete = () => {
    // Save to local storage or API
    router.push("/dashboard");
  };

  const toggleArrayItem = (field: "languages" | "platforms", value: string) => {
    setFormData((prev) => {
      const arr = prev[field];
      if (arr.includes(value)) {
        return { ...prev, [field]: arr.filter((item) => item !== value) };
      }
      return { ...prev, [field]: [...arr, value] };
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-6">
      <div className="w-full max-w-2xl">
        <div className="mb-10 text-center">
          <div className="flex items-center gap-2 mb-8 justify-center">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black">C</span>
            </div>
            <span className="text-xl font-black text-gray-900 tracking-tighter">Contentsathi</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Welcome to your new Content HQ</h1>
          <p className="text-gray-500 mt-2">Let&apos;s set up your Content Brain in 4 quick steps.</p>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10 rounded-full"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 -z-10 rounded-full transition-all duration-300"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          ></div>
          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s} 
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${
                step >= s ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-white text-gray-400 border-2 border-gray-200"
              }`}
            >
              {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
            </div>
          ))}
        </div>

        {/* Content Card */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[400px] flex flex-col">
          {step === 1 && (
            <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold text-gray-900">1. Basic Info</h2>
              <p className="text-gray-500 text-sm">Tell us about your business so we can tailor the content.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                  <input 
                    type="text" 
                    value={formData.businessName}
                    onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                    placeholder="e.g. Apex Realtors Navimumbai" 
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Niche</label>
                  <input 
                    type="text" 
                    value={formData.niche}
                    onChange={(e) => setFormData({...formData, niche: e.target.value})}
                    placeholder="e.g. First-time homebuyers, Premium plots" 
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold text-gray-900">2. Brand Voice</h2>
              <p className="text-gray-500 text-sm">How do you want to sound to your audience?</p>
              
              <div className="grid grid-cols-2 gap-4">
                {["Professional & Formal", "Friendly & Casual", "Authoritative", "Humorous / Memey", "Hyper-local & Marathi/Hindi Native"].map((voice) => (
                  <button
                    key={voice}
                    onClick={() => setFormData({...formData, brandVoice: voice})}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.brandVoice === voice 
                        ? "border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold" 
                        : "border-gray-100 hover:border-indigo-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {voice}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold text-gray-900">3. Platforms & Languages</h2>
              <p className="text-gray-500 text-sm">Where and how do you post?</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Target Languages</label>
                  <div className="flex flex-wrap gap-3">
                    {["English", "Hindi", "Marathi", "Hinglish"].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => toggleArrayItem("languages", lang)}
                        className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                          formData.languages.includes(lang)
                            ? "border-indigo-600 bg-indigo-600 text-white" 
                            : "border-gray-200 text-gray-600 hover:bg-gray-50 bg-white"
                        }`}
                      >
                        {formData.languages.includes(lang) && "✓ "}
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Primary Platforms</label>
                  <div className="flex flex-wrap gap-3">
                    {["Instagram", "LinkedIn", "YouTube Shorts", "Facebook", "X (Twitter)", "WhatsApp"].map((plat) => (
                      <button
                        key={plat}
                        onClick={() => toggleArrayItem("platforms", plat)}
                        className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                          formData.platforms.includes(plat)
                            ? "border-indigo-600 bg-indigo-600 text-white" 
                            : "border-gray-200 text-gray-600 hover:bg-gray-50 bg-white"
                        }`}
                      >
                        {formData.platforms.includes(plat) && "✓ "}
                        {plat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold text-gray-900">4. First Campaign</h2>
              <p className="text-gray-500 text-sm">Let&apos;s create your first week of content! What&apos;s on your mind?</p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Topic / Idea</label>
                <textarea 
                  rows={4}
                  value={formData.firstTopic}
                  onChange={(e) => setFormData({...formData, firstTopic: e.target.value})}
                  placeholder="e.g. Why Nagpur is the new IT hub and why you should invest in land here..." 
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all resize-none"
                ></textarea>
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                step === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            
            {step < 4 ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all shadow-md shadow-indigo-200"
              >
                Next Step
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all shadow-md shadow-indigo-200"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
