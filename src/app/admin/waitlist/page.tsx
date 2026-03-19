"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Calendar, User, Download, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface WaitlistEntry {
  id: string;
  email: string;
  createdAt: string;
  userId?: string | null;
}

export default function WaitlistViewer() {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWaitlist = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/waitlist/view");
      const data = await res.json();
      setWaitlist(data.waitlist || []);
    } catch (error) {
      console.error("Failed to fetch waitlist:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const exportToCSV = () => {
    if (waitlist.length === 0) return;
    
    const headers = ["ID", "Email", "Joined At", "User ID"];
    const rows = waitlist.map(entry => [
      entry.id,
      entry.email,
      new Date(entry.createdAt).toLocaleString(),
      entry.userId || "N/A"
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `waitlist_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <Link 
              href="/admin" 
              className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors mb-4 group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
              Waitlist Management
            </h1>
            <p className="text-gray-400 mt-2">
              Review and manage early access registrations ({waitlist.length} total)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchWaitlist}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50"
              title="Refresh List"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-all font-medium"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-gray-400 animate-pulse">Loading waitlist data...</p>
            </div>
          ) : waitlist.length === 0 ? (
            <div className="text-center py-32">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No registrations yet</h3>
              <p className="text-gray-400">Waitlist entries will appear here as they sign up.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="px-6 py-5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                    <th className="px-6 py-5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Email Address</th>
                    <th className="px-6 py-5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Join Date</th>
                    <th className="px-6 py-5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence mode="popLayout">
                    {waitlist.map((entry, index) => (
                      <motion.tr
                        key={entry.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-6 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                              <User className="w-5 h-5 text-indigo-400" />
                            </div>
                            <span className="text-sm font-medium text-gray-300">
                              {entry.userId ? "Registered" : "Waitlist"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-200">{entry.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">
                              {new Date(entry.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            entry.userId 
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}>
                            {entry.userId ? "Active" : "Pending"}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
