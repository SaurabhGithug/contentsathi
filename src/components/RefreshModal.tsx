"use client";

import { useState } from "react";
import { X, RefreshCw, ArrowRight, Loader2, Send } from "lucide-react";

interface RefreshModalProps {
  post: {
    id: string;
    platform: string;
    body: string;
    title: string;
  };
  onClose: () => void;
  onSuccess: (newPostBody: string) => void;
}

export default function RefreshModal({ post, onClose, onSuccess }: RefreshModalProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshedText, setRefreshedText] = useState("");
  const [error, setError] = useState("");

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError("");
    try {
      const res = await fetch("/api/refresh-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalContent: post.body, platform: post.platform }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRefreshedText(data.refreshedContent);
    } catch (e: any) {
      setError(e.message || "Failed to refresh post");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUseRefreshed = () => {
    onSuccess(refreshedText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Refresh & Republish</h2>
            <p className="text-sm text-gray-500">Rewrite &quot;{post.title}&quot; for {post.platform}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            
            {/* Original Post */}
            <div className="flex flex-col h-full border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 font-semibold text-sm text-gray-700">
                Original Post
              </div>
              <div className="p-4 bg-white flex-1 overflow-y-auto min-h-[250px] whitespace-pre-wrap text-sm text-gray-600">
                {post.body}
              </div>
            </div>

            {/* Middle arrow */}
            <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-gray-200 rounded-full items-center justify-center z-10 shadow-sm">
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>

            {/* Refreshed Post */}
            <div className={`flex flex-col h-full border rounded-xl overflow-hidden transition-colors ${refreshedText ? 'border-indigo-200 ring-2 ring-indigo-50' : 'border-gray-200 border-dashed'}`}>
              <div className={`px-4 py-2 border-b font-semibold text-sm flex items-center justify-between ${refreshedText ? 'bg-indigo-50 border-indigo-100 text-indigo-800' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                <span>Refreshed Post</span>
                {isRefreshing && <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />}
              </div>
              
              <div className="p-4 bg-white flex-1 relative min-h-[250px]">
                {isRefreshing ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-indigo-500 bg-white/80 backdrop-blur-sm z-10">
                    <RefreshCw className="w-8 h-8 animate-spin mb-3" />
                    <p className="text-sm font-medium">Rewriting with Context AI...</p>
                  </div>
                ) : refreshedText ? (
                  <textarea
                    value={refreshedText}
                    onChange={(e) => setRefreshedText(e.target.value)}
                    className="w-full h-full resize-none outline-none whitespace-pre-wrap text-sm text-gray-800 font-sans"
                  />
                ) : (
                  <div className="h-full flex flex-col flex-1 items-center justify-center text-center text-gray-400 p-6">
                    <RefreshCw className="w-10 h-10 mb-3 opacity-20" />
                    <p className="text-sm">Click &quot;AI Refresh&quot; below to magically rewrite this post for today&apos;s context.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {refreshedText ? "Regenerate" : "AI Refresh"}
          </button>

          <div className="flex items-center gap-3">
            <button 
              onClick={onClose} 
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleUseRefreshed}
              disabled={!refreshedText || isRefreshing}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md"
            >
              <Send className="w-4 h-4" />
              Use Text & Publish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
