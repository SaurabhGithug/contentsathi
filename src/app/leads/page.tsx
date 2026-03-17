"use client";

import { useState, useEffect } from "react";
import { 
  Users, UserPlus, Phone, Mail, MessageSquare, 
  Search, Filter, MoreHorizontal, ChevronRight, 
  MapPin, IndianRupee, Clock, CheckCircle2, 
  AlertCircle, History, ExternalLink, Calendar,
  ArrowRight, Download, RefreshCw, LayoutGrid, List
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const STATUS_CONFIG: Record<string, { label: string, color: string, bg: string, border: string }> = {
  "NEW": { label: "New Lead", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
  "CONTACTED": { label: "Contacted", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
  "INTERESTED": { label: "Interested", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
  "VISITED": { label: "Site Visit", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
  "BOOKED": { label: "Converted", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  "LOST": { label: "Lost", color: "text-gray-400", bg: "bg-gray-50", border: "border-gray-100" },
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    setLoading(true);
    try {
      const res = await fetch("/api/leads");
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (err) {
      toast.error("Failed to sync leads");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, newStatus: string) {
    try {
      const res = await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Moved to ${newStatus}`);
        fetchLeads();
      }
    } catch (err) {
      toast.error("Update failed");
    }
  }

  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase()) || 
                          (l.phone && l.phone.includes(search));
    const matchesFilter = filter === "all" || l.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-1">Intelligence HQ · ROI Tracking</p>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            Inquiry Pipeline
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase tracking-widest">Live Sync</span>
          </h1>
          <p className="text-gray-400 font-medium mt-1">Manage your leads from social media and track conversion performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 text-gray-700 font-black text-sm rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-95">
            <UserPlus className="w-4 h-4" /> Add Lead
          </button>
        </div>
      </div>

      {/* ── Controls Row ────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-white/50 backdrop-blur-md p-2 rounded-3xl border border-gray-100">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by name or phone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all text-sm font-medium"
          />
        </div>
        <div className="flex bg-gray-100/50 p-1 rounded-2xl gap-1">
          {["all", "NEW", "CONTACTED", "INTERESTED", "VISITED", "BOOKED"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                filter === f ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {f === "all" ? "All Leads" : f}
            </button>
          ))}
        </div>
        <div className="flex bg-gray-100/50 p-1 rounded-2xl gap-1">
          <button 
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-xl transition-all ${viewMode === "grid" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-xl transition-all ${viewMode === "list" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Content Area ────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="font-black text-gray-400 uppercase tracking-widest text-xs">Syncing your pipeline...</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="bg-white rounded-[3rem] border border-dashed border-gray-200 py-32 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2">No inquiries found</h3>
          <p className="text-gray-400 font-medium max-w-sm mx-auto">
            Once you start publishing content from the Studio, leads will appear here automatically.
          </p>
        </div>
      ) : (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          <AnimatePresence>
            {filteredLeads.map((lead, idx) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className={`bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:border-indigo-200 hover:shadow-xl transition-all group ${viewMode === "list" ? "flex items-center p-4 gap-6" : ""}`}
              >
                {/* Top Strip / Status bar */}
                {viewMode === "grid" && (
                   <div className="px-6 py-4 flex items-center justify-between border-b border-gray-50 bg-gray-50/30">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${STATUS_CONFIG[lead.status].bg} ${STATUS_CONFIG[lead.status].color} ${STATUS_CONFIG[lead.status].border}`}>
                        {STATUS_CONFIG[lead.status].label}
                      </span>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><History className="w-3.5 h-3.5" /></button>
                         <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><MoreHorizontal className="w-3.5 h-3.5" /></button>
                      </div>
                   </div>
                )}

                <div className={`${viewMode === "list" ? "flex-1 flex items-center gap-6" : "p-6"}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center text-indigo-600 font-black text-lg border border-indigo-100">
                      {lead.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 tracking-tight group-hover:text-indigo-600 transition-colors">{lead.name}</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{lead.source} · {new Date(lead.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {lead.phone && (
                      <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                        <Phone className="w-4 h-4 text-gray-400" /> {lead.phone}
                      </div>
                    )}
                    {lead.location && (
                      <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400" /> {lead.location}
                      </div>
                    )}
                    {lead.budget && (
                      <div className="flex items-center gap-3 text-sm font-black text-gray-900">
                        <IndianRupee className="w-4 h-4 text-emerald-500" /> ₹{lead.budget.toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="flex-1 py-2.5 bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all border border-gray-100 hover:border-indigo-100 flex items-center justify-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                    </button>
                    <button 
                      onClick={() => setSelectedLead(lead)}
                      className="w-10 h-10 bg-white border border-gray-100 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-all text-gray-400 hover:text-gray-900"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {viewMode === "list" && (
                   <div className="flex items-center gap-4 pr-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${STATUS_CONFIG[lead.status].bg} ${STATUS_CONFIG[lead.status].color} ${STATUS_CONFIG[lead.status].border}`}>
                        {STATUS_CONFIG[lead.status].label}
                      </span>
                      <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><MoreHorizontal className="w-4 h-4" /></button>
                   </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Lead Detail Modal (Simplified for MVP) ─────────────────────── */}
      <AnimatePresence>
        {selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-3xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-100">
                    {selectedLead.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">{selectedLead.name}</h2>
                    <p className="text-sm font-medium text-gray-400">Inquiry from Nagpur {selectedLead.location || ""}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedLead(null)}
                  className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all"
                >
                  &times;
                </button>
              </div>

              <div className="p-8 grid grid-cols-2 gap-8">
                 <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Timeline & Status</p>
                      <div className="space-y-3">
                         {["NEW", "CONTACTED", "INTERESTED", "VISITED", "BOOKED"].map((s) => (
                           <button 
                             key={s}
                             onClick={() => updateStatus(selectedLead.id, s)}
                             className={`w-full p-3 rounded-2xl flex items-center justify-between border transition-all ${
                               selectedLead.status === s 
                                ? "bg-indigo-50 border-indigo-200 border-2" 
                                : "bg-white border-gray-100 hover:border-indigo-100 hover:bg-gray-50/50"
                             }`}
                           >
                             <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${selectedLead.status === s ? "bg-indigo-600 animate-pulse" : "bg-gray-300"}`} />
                                <span className={`text-xs font-black uppercase tracking-wider ${selectedLead.status === s ? "text-indigo-700" : "text-gray-500"}`}>{s}</span>
                             </div>
                             {selectedLead.status === s && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                           </button>
                         ))}
                      </div>
                    </div>
                 </div>

                 <div className="space-y-8">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Deep Intelligence</p>
                      <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                         <div className="flex items-center gap-2 mb-2 text-indigo-600 font-black text-xs uppercase tracking-wider">
                           <Target className="w-3.5 h-3.5 text-indigo-600" /> Context Match: 94%
                         </div>
                         <p className="text-sm text-gray-600 leading-relaxed font-medium italic">
                            &quot;Lead was captured after clicking on the &apos;MIHAN ROI &apos; post. Interests suggests high focus on long-term appreciation and clear RERA status.&quot;
                         </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                       <button className="w-full py-4 bg-indigo-600 text-white font-black text-sm rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                          <MessageSquare className="w-4 h-4" /> Open WhatsApp CRM
                       </button>
                       <button className="w-full py-4 bg-white border border-gray-100 text-gray-700 font-black text-sm rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                          <Clock className="w-4 h-4" /> Schedule Follow-up
                       </button>
                    </div>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function Target({ className }: any) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
