"use client";

import { useEffect, useState, useCallback } from "react";
import MarkdownContent from "@/components/MarkdownContent";
import {
  Search, Filter, RefreshCw, PackageOpen, Copy,
  Trash2, Star, Instagram, Linkedin, Youtube,
  MessageCircle, Globe, Zap, ChevronDown, Eye,
  CheckCircle2, Clock, X, Sparkles, ExternalLink
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import toast from "react-hot-toast";

// ─── Types ──────────────────────────────────────────────────────────────────
type Asset = {
  id: string;
  type: string;
  platform: string | null;
  language: string | null;
  title: string | null;
  body: string;
  tags: string[];
  cta: string | null;
  qualityScore: number | null;
  isGoldenExample: boolean;
  publishCount: number;
  createdAt: string;
};

// ─── Platform config ─────────────────────────────────────────────────────────
const PLATFORMS = ["All", "instagram", "linkedin", "youtube", "whatsapp", "website"];
const PLATFORM_META: Record<string, { icon: any; color: string; label: string }> = {
  instagram: { icon: Instagram,     color: "text-pink-500 bg-pink-50 border-pink-100",    label: "Instagram" },
  linkedin:  { icon: Linkedin,      color: "text-blue-600 bg-blue-50 border-blue-100",    label: "LinkedIn" },
  youtube:   { icon: Youtube,       color: "text-red-500 bg-red-50 border-red-100",       label: "YouTube" },
  whatsapp:  { icon: MessageCircle, color: "text-emerald-500 bg-emerald-50 border-emerald-100", label: "WhatsApp" },
  website:   { icon: Globe,         color: "text-violet-500 bg-violet-50 border-violet-100",   label: "Website" },
};

const QUALITY_COLOR = (score: number | null) => {
  if (!score) return "bg-gray-100 text-gray-500";
  if (score >= 8) return "bg-emerald-100 text-emerald-700";
  if (score >= 6) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
};

// ─── Asset Card ───────────────────────────────────────────────────────────────
function AssetCard({ asset, onDelete, onCopy, onStar }: {
  asset: Asset;
  onDelete: (id: string) => void;
  onCopy: (body: string) => void;
  onStar: (id: string, current: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const platform = asset.platform?.toLowerCase() || "website";
  const meta = PLATFORM_META[platform] || PLATFORM_META["website"];
  const Icon = meta.icon;
  const preview = asset.body.substring(0, 180);

  return (
    <div className={`bg-white border-2 transition-all duration-200 rounded-[2rem] overflow-hidden hover:shadow-lg group ${asset.isGoldenExample ? "border-amber-200 shadow-amber-100/50 shadow-md" : "border-gray-100 hover:border-indigo-100"}`}>
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-black ${meta.color}`}>
              <Icon className="w-3.5 h-3.5" />
              {meta.label}
            </div>
            {asset.type && (
              <span className="text-[9px] font-black uppercase bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {asset.type.replace(/_/g, " ")}
              </span>
            )}
            {asset.language && (
              <span className="text-[9px] font-black uppercase bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full">
                {asset.language}
              </span>
            )}
            {asset.isGoldenExample && (
              <span className="flex items-center gap-1 text-[9px] font-black bg-amber-50 text-amber-600 border border-amber-200 px-2 py-1 rounded-full">
                <Star className="w-3 h-3 fill-amber-400" /> Golden
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onStar(asset.id, asset.isGoldenExample)} title="Toggle Golden Example"
              className={`p-1.5 rounded-xl transition-colors ${asset.isGoldenExample ? "text-amber-500 bg-amber-50" : "text-gray-400 hover:text-amber-500 hover:bg-amber-50"}`}>
              <Star className="w-4 h-4" />
            </button>
            <button onClick={() => onCopy(asset.body)}
              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
              <Copy className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(asset.id)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {asset.title && (
          <h3 className="font-black text-gray-900 text-sm mb-2 leading-tight">{asset.title}</h3>
        )}

        <div className="mt-1">
          {expanded ? (
            <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              <MarkdownContent content={asset.body} compact />
            </div>
          ) : (
            <MarkdownContent content={preview + (asset.body.length > 180 ? "..." : "")} compact />
          )}
        </div>

        {asset.body.length > 180 && (
          <button onClick={() => setExpanded(!expanded)}
            className="mt-1 text-xs font-black text-indigo-500 hover:text-indigo-700 transition-colors flex items-center gap-1">
            {expanded ? "Show less" : "Read full content"}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        )}

        {asset.cta && (
          <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
            <p className="text-[10px] font-black text-indigo-400 uppercase mb-0.5">CTA</p>
            <p className="text-xs font-bold text-indigo-800">{asset.cta}</p>
          </div>
        )}

        {asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {asset.tags.slice(0, 5).map((tag) => (
              <span key={tag} className="text-[10px] font-bold bg-gray-50 text-gray-500 border border-gray-100 px-2 py-0.5 rounded-full">#{tag}</span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3">
            {asset.qualityScore && (
              <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase ${QUALITY_COLOR(asset.qualityScore)}`}>
                QC {asset.qualityScore}/10
              </span>
            )}
            {asset.publishCount > 0 && (
              <span className="text-[9px] font-black bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full uppercase border border-emerald-100">
                Published {asset.publishCount}×
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[10px] font-medium">{format(new Date(asset.createdAt), "MMM d, yyyy")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Library Page ────────────────────────────────────────────────────────
export default function LibraryPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("All");
  const [goldenOnly, setGoldenOnly] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (platform !== "All") params.set("platform", platform);
      if (search) params.set("search", search);
      if (goldenOnly) params.set("golden", "true");
      const res = await fetch(`/api/generated-assets?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
      }
    } catch {}
    finally { setLoading(false); }
  }, [platform, search, goldenOnly]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleCopy = (body: string) => {
    navigator.clipboard.writeText(body);
    toast.success("Copied to clipboard!");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this asset permanently?")) return;
    const res = await fetch("/api/generated-assets", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    if (res.ok) {
      setAssets((prev) => prev.filter(a => a.id !== id));
      toast.success("Asset deleted.");
    }
  };

  const handleStar = async (id: string, currentValue: boolean) => {
    const res = await fetch(`/api/generated-assets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isGoldenExample: !currentValue }),
    });
    if (res.ok) {
      setAssets(prev => prev.map(a => a.id === id ? { ...a, isGoldenExample: !currentValue } : a));
      toast.success(!currentValue ? "⭐ Saved as Golden Example — AI will learn from this!" : "Removed from Golden Examples.");
    }
  };

  const handleBulkDelete = async () => {
    if (!selected.length || !confirm(`Delete ${selected.length} assets?`)) return;
    const res = await fetch("/api/generated-assets", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selected }),
    });
    if (res.ok) {
      setAssets(prev => prev.filter(a => !selected.includes(a.id)));
      setSelected([]);
      toast.success(`Deleted ${selected.length} assets.`);
    }
  };

  // Group by platform for summary counts
  const platformCounts = PLATFORMS.slice(1).reduce<Record<string, number>>((acc, p) => {
    acc[p] = assets.filter(a => a.platform?.toLowerCase() === p).length;
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-1">ContentSathi · Asset Vault</p>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Content Library</h1>
          <p className="text-gray-400 font-medium mt-1">
            {assets.length} assets generated by your AI team.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/studio"
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl shadow-md shadow-indigo-200 transition-all">
            <Sparkles className="w-4 h-4" />
            New Campaign
          </Link>
        </div>
      </div>

      {/* Platform Summary Pills */}
      <div className="flex flex-wrap gap-3">
        {PLATFORMS.map((p) => {
          const meta = PLATFORM_META[p] || null;
          const Icon = meta?.icon;
          const count = p === "All" ? assets.length : (platformCounts[p] || 0);
          return (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 font-bold text-sm transition-all ${platform === p ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200" : "bg-white text-gray-600 border-gray-100 hover:border-indigo-200 hover:text-indigo-600"}`}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {p === "All" ? "All Platforms" : meta?.label}
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${platform === p ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search content by keyword, title, or hashtag..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setGoldenOnly(!goldenOnly)}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl border-2 font-bold text-sm transition-all ${goldenOnly ? "bg-amber-50 border-amber-300 text-amber-700" : "bg-white border-gray-200 text-gray-600 hover:border-amber-300"}`}
        >
          <Star className={`w-4 h-4 ${goldenOnly ? "fill-amber-400 text-amber-400" : ""}`} />
          Golden Examples Only
        </button>
        <button onClick={fetchAssets}
          className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Bulk actions bar */}
      {selected.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl px-5 py-3 flex items-center justify-between">
          <span className="text-sm font-black text-indigo-800">{selected.length} items selected</span>
          <div className="flex gap-2">
            <button onClick={() => setSelected([])} className="text-xs font-black text-indigo-600 hover:text-indigo-800">Deselect all</button>
            <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white font-black text-xs rounded-xl transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
              Delete {selected.length}
            </button>
          </div>
        </div>
      )}

      {/* Content Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-[2rem] border border-gray-100 p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded-full w-1/3 mb-4" />
              <div className="h-24 bg-gray-50 rounded-2xl mb-3" />
              <div className="h-3 bg-gray-100 rounded-full w-2/3" />
            </div>
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 p-16 text-center">
          <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <PackageOpen className="w-10 h-10 text-indigo-300" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2">
            {search || platform !== "All" || goldenOnly ? "No results found" : "Your Vault is Empty"}
          </h3>
          <p className="text-gray-400 font-medium max-w-md mx-auto mb-6">
            {search || platform !== "All" || goldenOnly
              ? "Try clearing your filters or searching for something else."
              : "No content has been generated yet. Brief your AI team to start filling the vault."}
          </p>
          <div className="flex items-center gap-3 justify-center flex-wrap">
            {(search || goldenOnly || platform !== "All") && (
              <button onClick={() => { setSearch(""); setPlatform("All"); setGoldenOnly(false); }}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black rounded-2xl text-sm transition-all">
                Clear Filters
              </button>
            )}
            <Link href="/studio"
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-sm transition-all shadow-md shadow-indigo-200">
              <Sparkles className="w-4 h-4" />
              Brief AI Team
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {assets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onDelete={handleDelete}
              onCopy={handleCopy}
              onStar={handleStar}
            />
          ))}
        </div>
      )}

    </div>
  );
}
