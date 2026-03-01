"use client";

import { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Download,
  ImageIcon,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const STYLES = [
  {
    id: "realistic",
    label: "Realistic Photo",
    emoji: "📷",
    desc: "Lifelike photography style",
  },
  {
    id: "flat",
    label: "Flat Illustration",
    emoji: "🎨",
    desc: "Clean vector-style art",
  },
  {
    id: "bold",
    label: "Bold Graphic",
    emoji: "⚡",
    desc: "High-contrast marketing visual",
  },
];

interface ImageGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  postContent: string;
  postPlatform: string;
  postTitle?: string;
}

function deriveVisualPrompt(
  content: string,
  platform: string,
  title?: string,
): string {
  const base = title || content.slice(0, 80).replace(/\n/g, " ");
  const platformHint =
    platform === "Instagram"
      ? "Instagram-worthy, vibrant, lifestyle"
      : platform === "LinkedIn"
        ? "professional, corporate, clean"
        : platform === "YouTube Shorts"
          ? "eye-catching thumbnail, bold text overlay"
          : "social media visual, engaging";
  return `${platformHint} image for: "${base.trim()}" — high quality, modern design`;
}

export default function ImageGenerateModal({
  isOpen,
  onClose,
  postContent,
  postPlatform,
  postTitle,
}: ImageGenerateModalProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("realistic");
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isPlaceholder, setIsPlaceholder] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setPrompt(deriveVisualPrompt(postContent, postPlatform, postTitle));
      setImageUrl(null);
      setError("");
      setIsPlaceholder(false);
    }
  }, [isOpen, postContent, postPlatform, postTitle]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setImageUrl(null);
    setError("");

    try {
      const res = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style: selectedStyle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Image generation failed");
      setImageUrl(data.imageUrl);
      setIsPlaceholder(data.isPlaceholder ?? false);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `content-saarthi-image-${Date.now()}.jpg`;
    link.target = "_blank";
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-indigo-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">
                Generate Image
              </h2>
              <p className="text-[11px] text-gray-500">
                AI-powered visual for {postPlatform}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-white/60 rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Prompt */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Visual Prompt
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none leading-relaxed"
              placeholder="Describe the image you want..."
            />
          </div>

          {/* Style Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Visual Style
            </label>
            <div className="grid grid-cols-3 gap-2">
              {STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all ${
                    selectedStyle === style.id
                      ? "border-indigo-500 bg-indigo-50 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-xl">{style.emoji}</span>
                  <span
                    className={`text-[11px] font-semibold leading-tight ${
                      selectedStyle === style.id
                        ? "text-indigo-700"
                        : "text-gray-700"
                    }`}
                  >
                    {style.label}
                  </span>
                  <span className="text-[10px] text-gray-400 leading-tight">
                    {style.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Generated Image */}
          {imageUrl && (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Generated visual"
                  className="w-full object-cover max-h-64"
                />
                {isPlaceholder && (
                  <div className="absolute bottom-0 inset-x-0 bg-amber-500/90 backdrop-blur-sm px-3 py-2 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-white flex-shrink-0" />
                    <p className="text-white text-[11px] font-medium">
                      Add IMAGEN_API_KEY or STABILITY_API_KEY to enable real
                      image generation.
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-all"
              >
                <Download className="w-4 h-4" />
                Download Image
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-xs">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
              isGenerating || !prompt.trim()
                ? "bg-indigo-300 text-white cursor-not-allowed"
                : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white hover:-translate-y-0.5"
            }`}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4" />
                Generate Image
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
