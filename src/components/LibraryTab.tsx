"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Loader2, Layout, CalendarPlus, Copy, Send, CheckCircle2, History, Star, Download, Trash2, ListChecks, FilePlus, RefreshCw, RefreshCcw } from "lucide-react";
import PublishModal from "@/components/PublishModal";
import ScheduleModal from "@/components/ScheduleModal";
import RefreshModal from "@/components/RefreshModal";

export default function LibraryTab() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Golden Examples
  const [goldenIds, setGoldenIds] = useState<Set<string>>(new Set());
  
  // Modals
  const [publishingPost, setPublishingPost] = useState<any>(null);
  const [schedulingPost, setSchedulingPost] = useState<any>(null);
  const [refreshingPost, setRefreshingPost] = useState<any>(null);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (platformFilter !== "All") params.append("platform", platformFilter);
      if (search.trim()) params.append("search", search.trim());

      const res = await fetch(`/api/generated-assets?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch library");
      const data = await res.json();
      const fetchedAssets = data.assets || [];
      setAssets(fetchedAssets);
      // Sync golden state from DB
      setGoldenIds(new Set(fetchedAssets.filter((a: any) => a.isGoldenExample).map((a: any) => a.id)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, platformFilter]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Debounced search effect
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchAssets();
    }, 500);
    return () => clearTimeout(timeout);
  }, [search, fetchAssets]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleGolden = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCurrentlyGolden = goldenIds.has(id);
    const newSet = new Set(goldenIds);
    if (isCurrentlyGolden) {
      newSet.delete(id);
    } else {
      if (newSet.size >= 10) {
        alert("You can only have up to 10 Golden Examples at a time.");
        return;
      }
      newSet.add(id);
    }
    setGoldenIds(newSet);
    // Persist to DB
    try {
      await fetch(`/api/generated-assets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isGoldenExample: !isCurrentlyGolden }),
      });
    } catch (err) {
      console.error("Failed to update golden example", err);
      // Revert on error
      setGoldenIds(new Set(goldenIds));
    }
  };

  const exportCsv = () => {
    const selectedAssets = assets.filter((a: any) => selectedIds.has(a.id));
    if (selectedAssets.length === 0) return;

    const headers = ["Platform", "Language", "Title", "Body", "QualityScore"];
    const rows = selectedAssets.map((a: any) => [
      `"${(a.platform || "").replace(/"/g, '""')}"`,
      `"${(a.language || "").replace(/"/g, '""')}"`,
      `"${(a.title || "").replace(/"/g, '""')}"`,
      `"${(a.body || "").replace(/"/g, '""')}"`,
      a.qualityScore || "",
    ]);

    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `content_library_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // E10: bulk delete
  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} selected post(s)? This cannot be undone.`)) return;
    try {
      const res = await fetch("/api/generated-assets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (!res.ok) throw new Error("Delete failed");
      setSelectedIds(new Set());
      fetchAssets();
    } catch (err) {
      console.error(err);
      alert("Failed to delete selected posts.");
    }
  };

  // E11: bulk schedule (schedule all selected to next 7 days, 9am)
  const handleBulkSchedule = async () => {
    const selectedAssets = assets.filter((a: any) => selectedIds.has(a.id));
    if (selectedAssets.length === 0) return;

    const targetDate = prompt(
      `Schedule ${selectedAssets.length} post(s) to date (YYYY-MM-DD):`,
      new Date(Date.now() + 86400000).toISOString().split("T")[0]
    );
    if (!targetDate) return;

    try {
      await Promise.all(
        selectedAssets.map(async (asset: any, i: number) => {
          const scheduledAt = new Date(`${targetDate}T09:00:00`);
          scheduledAt.setHours(9 + i); // stagger by 1 hour each
          const res = await fetch("/api/calendar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              generatedAssetId: asset.id,
              platform: asset.platform || "instagram",
              scheduledAt: scheduledAt.toISOString(),
            }),
          });
          if (!res.ok) throw new Error("Failed to schedule: " + asset.title);
        })
      );
      alert(`✅ ${selectedAssets.length} posts scheduled!`);
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error(err);
      alert("Bulk schedule failed: " + err.message);
    }
  };

  return (
    <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
      
      {/* Header & Filters */}
      <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Content Library</h2>
            <p className="text-xs text-gray-500">Access all your previously generated content</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search content..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select 
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="pl-9 pr-8 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-600 outline-none bg-white appearance-none cursor-pointer"
            >
              <option value="All">All Platforms</option>
              <option value="Instagram">Instagram</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="X (Twitter)">X (Twitter)</option>
              <option value="Facebook">Facebook</option>
              <option value="WhatsApp">WhatsApp</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-indigo-50 border-b border-indigo-100 px-5 py-3 flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-indigo-800 font-medium text-sm">
            <ListChecks className="w-5 h-5 text-indigo-600" />
            {selectedIds.size} post{selectedIds.size !== 1 ? 's' : ''} selected
          </div>
          <div className="flex items-center gap-3">
            <button 
            onClick={handleBulkSchedule}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
            >
              <CalendarPlus className="w-3.5 h-3.5" /> Schedule All
            </button>
            <button 
              onClick={exportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 rounded-lg transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button 
            onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded-lg transition-colors shadow-sm ms-2"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-400" />
              <p className="text-sm font-medium">Loading library...</p>
            </div>
          </div>
        ) : assets.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <div className="max-w-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <History className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No content found</h3>
              <p className="text-sm text-gray-500">Your generated output will automatically save here for future use.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max" style={{ gridAutoRows: 'min-content' }}>
            {assets.map(asset => (
              <div 
                key={asset.id} 
                className={`bg-white rounded-xl border shadow-sm flex flex-col hover:shadow-md transition-all overflow-hidden group cursor-pointer ${
                  selectedIds.has(asset.id) ? 'border-indigo-400 ring-1 ring-indigo-400' : 'border-gray-200'
                }`}
                onClick={() => toggleSelection(asset.id)}
              >
                <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        selectedIds.has(asset.id) 
                          ? 'bg-indigo-600 border-indigo-600' 
                          : 'border-gray-300 bg-white group-hover:border-indigo-400'
                      }`}
                    >
                      {selectedIds.has(asset.id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <Layout className="w-4 h-4 text-gray-400 ml-1" />
                    <span className="font-bold text-gray-900 text-sm">{asset.platform || "Multipurpose"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {asset.language && (
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {asset.language}
                      </span>
                    )}
                    <button 
                      onClick={(e) => toggleGolden(asset.id, e)}
                      className="p-1 -mr-1 rounded hover:bg-amber-50 group transition-colors"
                      title={goldenIds.has(asset.id) ? "Remove from Golden Examples" : "Save as Golden Example"}
                    >
                      <Star className={`w-4 h-4 transition-colors ${
                        goldenIds.has(asset.id) ? "fill-amber-400 text-amber-500" : "text-gray-300 group-hover:text-amber-400"
                      }`} />
                    </button>
                  </div>
                </div>
                
                <div className="p-4 flex-1">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-6 font-sans leading-relaxed">
                    {asset.body || asset.content || "[No content]"}
                  </p>
                </div>
                
                <div className="px-4 py-3 border-t border-gray-50 flex items-center justify-between gap-2 bg-gray-50/30 mt-auto" onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={() => {
                        window.location.href = `/generator?remixId=${asset.id}`;
                      }}
                      className="flex items-center justify-center p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                      title="Remix This"
                    >
                      <FilePlus className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setRefreshingPost({ id: asset.id, title: asset.title || "Post", platform: asset.platform, body: asset.body || asset.content })}
                      className="flex items-center justify-center p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-100"
                      title="Refresh & Republish"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleCopy(asset.body || asset.content || "", asset.id)}
                      className="flex items-center justify-center p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                      title="Copy"
                    >
                      {copiedId === asset.id ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setSchedulingPost({ platform: asset.platform, body: asset.body || asset.content, type: asset.type })}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-100"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" /> Schedule
                    </button>
                    <button 
                      onClick={() => setPublishingPost({ platform: asset.platform, body: asset.body || asset.content, type: asset.type })}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" /> Publish
                    </button>
                  </div>
                </div>
                
                {/* Mock Stats Pill (Phase N Requirement) */}
                <div className="px-4 py-2 border-t border-gray-50 bg-gray-50 flex items-center gap-4 text-[10px] text-gray-500 font-medium">
                  <span className="flex items-center gap-1" title="Reach">👁 {Math.floor(Math.random() * 500) + 10}k</span>
                  <span className="flex items-center gap-1" title="Likes">❤️ {Math.floor(Math.random() * 200)}</span>
                  <span className="flex items-center gap-1" title="Comments">💬 {Math.floor(Math.random() * 50)}</span>
                  <span className="flex items-center gap-1" title="Shares">📤 {Math.floor(Math.random() * 20)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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

      {refreshingPost && (
        <RefreshModal
          post={refreshingPost}
          onClose={() => setRefreshingPost(null)}
          onSuccess={(newBody) => {
             // Open publish modal with the new text immediately
             setPublishingPost({ ...refreshingPost, body: newBody });
             setRefreshingPost(null);
          }}
        />
      )}
    </div>
  );
}
