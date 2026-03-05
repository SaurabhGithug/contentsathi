"use client";

import { useState } from "react";
import {
  BarChart2, TrendingUp, AlertTriangle, Zap, Brain,
  Clock, Calendar, ChevronDown, Sparkles, X, CheckCircle2
} from "lucide-react";

interface PredictionResult {
  predictedReachMin: number;
  predictedReachMax: number;
  engagementScore: number;
  viralPotential: "low" | "medium" | "high";
  bestTimeToPost: string;
  bestDayToPost: string;
  strengths: string[];
  improvements: string[];
  confidenceLevel: "low" | "medium" | "high";
  summary: string;
  historicalBaseline: {
    avgReach: number;
    avgEngagement: string | number;
    postsAnalyzed: number;
  };
}

interface PerformancePredictorProps {
  postBody: string;
  platform: string;
  language?: string;
  postType?: string;
  onClose: () => void;
}

const VIRAL_STYLES = {
  high: { color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30", emoji: "🚀", label: "High Viral Potential" },
  medium: { color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30", emoji: "📈", label: "Good Performance Expected" },
  low: { color: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/30", emoji: "💡", label: "Steady Performance" },
};

const CONFIDENCE_LABELS = {
  high: { text: "High Confidence", color: "text-emerald-400" },
  medium: { text: "Medium Confidence", color: "text-amber-400" },
  low: { text: "Limited Data — Estimate Only", color: "text-slate-400" },
};

export default function PerformancePredictor({ postBody, platform, language, postType, onClose }: PerformancePredictorProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState("");

  const runPrediction = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/analytics/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postBody, platform, language, postType }),
      });
      if (res.ok) {
        setResult(await res.json());
      } else {
        setError("Prediction failed. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const viral = result ? VIRAL_STYLES[result.viralPotential] : null;
  const confidence = result ? CONFIDENCE_LABELS[result.confidenceLevel] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-600/30 to-purple-600/20 px-6 py-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                <Brain className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Performance Predictor</h3>
                <p className="text-slate-400 text-xs">AI-powered post analysis for {platform}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {!result && !loading && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BarChart2 className="w-8 h-8 text-indigo-400" />
              </div>
              <h4 className="text-white font-semibold mb-2">Predict How This Post Will Perform</h4>
              <p className="text-slate-400 text-sm mb-6">
                Our AI will analyze your post and predict reach, engagement, best posting time, and give improvement tips.
              </p>
              <button
                onClick={runPrediction}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold mx-auto hover:opacity-90 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Analyze My Post
              </button>
              {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center py-10 gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin" />
                <Brain className="absolute inset-0 m-auto w-6 h-6 text-indigo-400" />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold">Analyzing your post...</p>
                <p className="text-slate-400 text-sm mt-1">Checking historical performance data</p>
              </div>
            </div>
          )}

          {result && viral && confidence && (
            <div className="space-y-4">
              {/* Summary Banner */}
              <div className={`${viral.bg} border ${viral.border} rounded-2xl p-4`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{viral.emoji}</span>
                  <span className={`${viral.color} font-bold text-sm`}>{viral.label}</span>
                </div>
                <p className="text-white text-sm">{result.summary}</p>
                <p className={`text-xs mt-1 ${confidence.color}`}>{confidence.text}</p>
              </div>

              {/* Reach Prediction */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Predicted Reach</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black text-white">
                    {result.predictedReachMin.toLocaleString()}
                  </span>
                  <span className="text-slate-400 text-lg font-light mb-1">–</span>
                  <span className="text-3xl font-black text-white">
                    {result.predictedReachMax.toLocaleString()}
                  </span>
                  <span className="text-slate-500 text-sm mb-1">people</span>
                </div>
                {result.historicalBaseline.postsAnalyzed > 0 && (
                  <p className="text-slate-500 text-xs mt-2">
                    Based on avg {result.historicalBaseline.avgReach.toLocaleString()} reach from {result.historicalBaseline.postsAnalyzed} past posts
                  </p>
                )}
                {/* Engagement Score Bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Engagement Score</span>
                    <span className="font-bold text-white">{result.engagementScore}/100</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-400 transition-all"
                      style={{ width: `${result.engagementScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Best Time to Post */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <p className="text-xs text-slate-400">Best Time</p>
                  </div>
                  <p className="text-white font-bold text-sm">{result.bestTimeToPost}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    <p className="text-xs text-slate-400">Best Day</p>
                  </div>
                  <p className="text-white font-bold text-sm">{result.bestDayToPost}</p>
                </div>
              </div>

              {/* Strengths */}
              {result.strengths && result.strengths.length > 0 && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                  <p className="text-emerald-400 text-xs font-bold mb-2">✅ Strengths</p>
                  {result.strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-slate-300 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      {s}
                    </div>
                  ))}
                </div>
              )}

              {/* Improvements */}
              {result.improvements && result.improvements.length > 0 && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                  <p className="text-amber-400 text-xs font-bold mb-2">💡 Improve This Post</p>
                  {result.improvements.map((imp, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-slate-300 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                      {imp}
                    </div>
                  ))}
                </div>
              )}

              {/* Re-analyze */}
              <button
                onClick={runPrediction}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5 transition-all"
              >
                <TrendingUp className="w-4 h-4" />
                Re-analyze
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
