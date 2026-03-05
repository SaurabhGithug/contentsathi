"use client";

import { useState } from "react";
import { RefreshCw, Zap, Brain, Timer, AlertCircle, Copy, CheckCircle2 } from "lucide-react";

const PLATFORMS = ["Instagram", "WhatsApp"];
const LANGUAGES = ["English", "Hindi", "Marathi"];
const TONES = ["Conversational", "Professional", "Story-based", "Urgent"];

const SAMPLE_TOPICS = [
  "2BHK flats near Wardha Road Nagpur",
  "Plot investment opportunities in MIHAN corridor",
  "New RERA approved project launch in Beltarodi",
  "Festival Diwali offer on ready possession flats",
  "WhatsApp lead follow-up for site visit",
  "Vastu compliant homes near Ring Road",
  "NRI investment in Nagpur real estate 2025",
  "EMI calculator for first-time homebuyers",
  "Commercial shops in Sadar Nagpur",
  "Luxury villas with swimming pool near airport",
  "Affordable housing scheme under PMAY",
  "Land appreciation trends Nagpur 2025",
  "3BHK vs 2BHK which is better investment",
  "How to verify RERA registration of a project",
  "Benefits of buying during festive season",
  "Why Nagpur Ring Road property is booming",
  "Open plots near Kamptee Road development",
  "Site visit invitation for new project launch",
  "Customer testimonial post for completed project",
  "Monthly EMI less than rent campaign",
];

interface EngineResult {
  engine: string;
  content: string | null;
  thinkingResults?: any;
  timeMs: number;
  error?: string;
}

interface CompareResult {
  topic: string;
  platform: string;
  language: string;
  tone: string;
  sarvam: EngineResult;
  gemini: EngineResult;
}

interface ScoreEntry {
  topic: string;
  sarvamScore: number;
  geminiScore: number;
  notes: string;
}

export default function ComparePage() {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [language, setLanguage] = useState("Hindi");
  const [tone, setTone] = useState("Conversational");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [error, setError] = useState("");
  const [copiedSide, setCopiedSide] = useState<string | null>(null);

  // Scoring state
  const [sarvamScore, setSarvamScore] = useState(7);
  const [geminiScore, setGeminiScore] = useState(8);
  const [scoreNotes, setScoreNotes] = useState("");
  const [scoreHistory, setScoreHistory] = useState<ScoreEntry[]>([]);

  const handleCompare = async () => {
    if (!topic.trim()) { setError("Enter a topic first."); return; }
    setError("");
    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/test/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), platform, language, tone }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${res.status}`);
      }
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Comparison failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, side: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSide(side);
    setTimeout(() => setCopiedSide(null), 1500);
  };

  const handleSaveScore = () => {
    if (!result) return;
    setScoreHistory(prev => [...prev, {
      topic: result.topic,
      sarvamScore,
      geminiScore,
      notes: scoreNotes,
    }]);
    setScoreNotes("");
  };

  const avgGap = scoreHistory.length > 0
    ? (scoreHistory.reduce((sum, s) => sum + (s.geminiScore - s.sarvamScore), 0) / scoreHistory.length).toFixed(1)
    : "—";

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 md:p-10">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Sarvam vs Gemini — Quality Comparison</h1>
            <p className="text-sm text-gray-400 font-medium">Dev-only page. Test the same topic through both engines side-by-side.</p>
          </div>
        </div>

        <div className="mt-2 px-4 py-2 bg-amber-900/30 border border-amber-700/50 rounded-xl text-xs text-amber-300 font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          This page is for development testing only. Not visible to production users.
        </div>

        {/* Controls */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Topic</label>
            <textarea
              rows={3}
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. 2BHK flats near Wardha Road Nagpur"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Platform</label>
            <select value={platform} onChange={e => setPlatform(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-violet-500 outline-none">
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Language</label>
            <select value={language} onChange={e => setLanguage(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-violet-500 outline-none">
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tone</label>
            <select value={tone} onChange={e => setTone(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-violet-500 outline-none">
              {TONES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={handleCompare}
          disabled={isLoading}
          className={`mt-4 w-full md:w-auto px-8 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            isLoading
              ? "bg-violet-800 text-violet-300 cursor-not-allowed"
              : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 hover:-translate-y-0.5 shadow-lg shadow-violet-900/50"
          }`}
        >
          {isLoading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Running Both Engines...</> : <><Zap className="w-4 h-4" /> Compare Now</>}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-900/40 border border-red-700/50 rounded-xl text-sm text-red-300">{error}</div>
        )}

        {/* Sample Topics */}
        <div className="mt-6">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Quick Topics (click to load)</p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_TOPICS.map((t, i) => (
              <button
                key={i}
                onClick={() => setTopic(t)}
                className="px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-gray-400 hover:text-violet-300 hover:border-violet-700 transition-colors"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sarvam Panel */}
            <div className="bg-gray-900 border border-violet-700/30 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-violet-900/60 to-purple-900/40 border-b border-violet-700/30 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-violet-200">Sarvam-M (Two-Pass)</h3>
                  <p className="text-[11px] text-violet-400 font-medium mt-0.5">Free Tier Engine — ₹0 cost</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Timer className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-violet-300 font-bold">{((result.sarvam.timeMs || 0) / 1000).toFixed(1)}s</span>
                </div>
              </div>
              <div className="p-6">
                {result.sarvam.error ? (
                  <div className="p-4 bg-red-900/30 border border-red-800/50 rounded-xl text-sm text-red-300">{result.sarvam.error}</div>
                ) : (
                  <>
                    <pre className="whitespace-pre-wrap text-sm text-gray-200 leading-relaxed font-sans">{result.sarvam.content}</pre>
                    <button
                      onClick={() => handleCopy(result.sarvam.content || "", "sarvam")}
                      className="mt-4 flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 font-semibold"
                    >
                      {copiedSide === "sarvam" ? <><CheckCircle2 className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                    </button>
                    {result.sarvam.thinkingResults && (
                      <details className="mt-4">
                        <summary className="text-[11px] text-violet-500 font-bold uppercase cursor-pointer hover:text-violet-300">Pass 1 Thinking Results</summary>
                        <pre className="mt-2 text-[11px] text-gray-500 bg-gray-950 p-3 rounded-lg overflow-x-auto">{JSON.stringify(result.sarvam.thinkingResults, null, 2)}</pre>
                      </details>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Gemini Panel */}
            <div className="bg-gray-900 border border-blue-700/30 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-900/60 to-cyan-900/40 border-b border-blue-700/30 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-blue-200">Gemini 2.5 Flash (Full Pipeline)</h3>
                  <p className="text-[11px] text-blue-400 font-medium mt-0.5">Paid Tier Engine — API cost</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Timer className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-blue-300 font-bold">{((result.gemini.timeMs || 0) / 1000).toFixed(1)}s</span>
                </div>
              </div>
              <div className="p-6">
                {result.gemini.error ? (
                  <div className="p-4 bg-red-900/30 border border-red-800/50 rounded-xl text-sm text-red-300">{result.gemini.error}</div>
                ) : (
                  <>
                    <pre className="whitespace-pre-wrap text-sm text-gray-200 leading-relaxed font-sans">{result.gemini.content}</pre>
                    <button
                      onClick={() => handleCopy(result.gemini.content || "", "gemini")}
                      className="mt-4 flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      {copiedSide === "gemini" ? <><CheckCircle2 className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                    </button>
                    {result.gemini.thinkingResults && (
                      <details className="mt-4">
                        <summary className="text-[11px] text-blue-500 font-bold uppercase cursor-pointer hover:text-blue-300">Gemini Analysis Details</summary>
                        <pre className="mt-2 text-[11px] text-gray-500 bg-gray-950 p-3 rounded-lg overflow-x-auto">{JSON.stringify(result.gemini.thinkingResults, null, 2)}</pre>
                      </details>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Scoring Section */}
        {result && !result.sarvam.error && !result.gemini.error && (
          <div className="mt-8 bg-gray-900 border border-gray-700 rounded-2xl p-6">
            <h3 className="font-bold text-gray-200 mb-4 text-sm">Score This Comparison</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs text-gray-400 font-semibold mb-1">Sarvam Score (1-10)</label>
                <input
                  type="range" min={1} max={10} step={0.5}
                  value={sarvamScore}
                  onChange={e => setSarvamScore(parseFloat(e.target.value))}
                  className="w-full accent-violet-500"
                />
                <span className="text-lg font-black text-violet-400">{sarvamScore}</span>
              </div>
              <div>
                <label className="block text-xs text-gray-400 font-semibold mb-1">Gemini Score (1-10)</label>
                <input
                  type="range" min={1} max={10} step={0.5}
                  value={geminiScore}
                  onChange={e => setGeminiScore(parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <span className="text-lg font-black text-blue-400">{geminiScore}</span>
              </div>
              <div>
                <label className="block text-xs text-gray-400 font-semibold mb-1">Notes</label>
                <input
                  type="text"
                  value={scoreNotes}
                  onChange={e => setScoreNotes(e.target.value)}
                  placeholder="e.g. Sarvam hook stronger"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <button
                onClick={handleSaveScore}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-bold transition-colors"
              >
                Save Score
              </button>
            </div>
          </div>
        )}

        {/* Score History Table */}
        {scoreHistory.length > 0 && (
          <div className="mt-8 bg-gray-900 border border-gray-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-200 text-sm">Score History</h3>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-800 text-gray-300">
                Avg Gap: <span className={`${parseFloat(avgGap as string) > 2 ? "text-red-400" : parseFloat(avgGap as string) > 0 ? "text-amber-400" : "text-emerald-400"}`}>{avgGap}</span> (Gemini - Sarvam)
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase border-b border-gray-800">
                    <th className="text-left pb-3 font-bold">Topic</th>
                    <th className="text-center pb-3 font-bold">Sarvam</th>
                    <th className="text-center pb-3 font-bold">Gemini</th>
                    <th className="text-center pb-3 font-bold">Gap</th>
                    <th className="text-left pb-3 font-bold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {scoreHistory.map((s, i) => {
                    const gap = s.geminiScore - s.sarvamScore;
                    return (
                      <tr key={i} className="border-b border-gray-800/50">
                        <td className="py-3 text-gray-300 max-w-xs truncate">{s.topic}</td>
                        <td className="py-3 text-center font-bold text-violet-400">{s.sarvamScore}</td>
                        <td className="py-3 text-center font-bold text-blue-400">{s.geminiScore}</td>
                        <td className={`py-3 text-center font-black ${gap > 2 ? "text-red-400" : gap > 0 ? "text-amber-400" : gap < 0 ? "text-emerald-400" : "text-gray-400"}`}>
                          {gap > 0 ? `+${gap}` : gap}
                        </td>
                        <td className="py-3 text-gray-500 text-xs">{s.notes}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
