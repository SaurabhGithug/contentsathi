"use client";

import { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Filter, 
  Plus, 
  Clock,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  MessageCircle,
  Facebook,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  subDays,
  parseISO
} from "date-fns";
import { cn } from "@/lib/utils";
import ScheduleModal from "@/components/ScheduleModal";
import PostCard from "@/components/PostCard";
import RefreshModal from "@/components/RefreshModal";
import EmptyState from "@/components/EmptyState";

const PLATFORM_ICONS: Record<string, any> = {
  instagram: Instagram,
  linkedin: Linkedin,
  x: Twitter,
  twitter: Twitter,
  youtube: Youtube,
  facebook: Facebook,
  whatsapp: MessageCircle,
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "bg-pink-500",
  linkedin: "bg-blue-600",
  x: "bg-black",
  twitter: "bg-black",
  youtube: "bg-red-600",
  facebook: "bg-blue-700",
  whatsapp: "bg-green-500",
};

export default function CalendarPage() {
  const [view, setView] = useState<"month" | "week" | "list">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showRefreshModal, setShowRefreshModal] = useState(false);
  const [suggestedItems, setSuggestedItems] = useState<any[]>([
    { id: 's1', title: 'Local Market Insight', platform: 'LinkedIn', scheduledAt: addDays(startOfMonths(new Date()), 10).toISOString(), isSuggested: true, festivalTag: 'Market Update' },
    { id: 's2', title: 'Weekend Property Tour', platform: 'Instagram', scheduledAt: addDays(startOfMonths(new Date()), 12).toISOString(), isSuggested: true, festivalTag: 'Site Visit' },
    { id: 's3', title: 'Investment Tips', platform: 'YouTube Shorts', scheduledAt: addDays(startOfMonths(new Date()), 14).toISOString(), isSuggested: true, festivalTag: 'Educational' },
  ]);
  const [autoScheduleRecs, setAutoScheduleRecs] = useState<any[]>([]);
  const [showAutoSchedule, setShowAutoSchedule] = useState(false);
  const [autoScheduleLoading, setAutoScheduleLoading] = useState(false);

  const fetchAutoSchedule = async () => {
    setAutoScheduleLoading(true);
    setShowAutoSchedule(true);
    try {
      const res = await fetch("/api/auto-schedule");
      if (res.ok) {
        const data = await res.json();
        setAutoScheduleRecs(data.recommendations ?? []);
      }
    } catch {} finally { setAutoScheduleLoading(false); }
  };

  function startOfMonths(date: Date) {
    return startOfMonth(date);
  }

  useEffect(() => {
    const fetchCalendarData = async () => {
      setLoading(true);
      try {
        let from, to;
        if (view === "month") {
          from = startOfMonth(currentDate).toISOString();
          to = endOfMonth(currentDate).toISOString();
        } else if (view === "week") {
          from = startOfWeek(currentDate, { weekStartsOn: 1 }).toISOString();
          to = endOfWeek(currentDate, { weekStartsOn: 1 }).toISOString();
        } else {
            // For list view, fetch next 30 days
            from = new Date().toISOString();
            to = addDays(new Date(), 30).toISOString();
        }

        const res = await fetch(`/api/calendar?from=${from}&to=${to}`);
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch calendar:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarData();
  }, [currentDate, view]);

  const next = () => setCurrentDate(view === "month" ? addMonths(currentDate, 1) : addDays(currentDate, 7));
  const prev = () => setCurrentDate(view === "month" ? subMonths(currentDate, 1) : subDays(currentDate, 7));
  const today = () => setCurrentDate(new Date());

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/50 backdrop-blur-md p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-100">
                <CalendarIcon className="w-8 h-8" />
            </div>
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Content Calendar</h1>
                <p className="text-sm font-medium text-gray-400">Your content distribution master plan.</p>
            </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-2xl">
            {(["month", "week", "list"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-6 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                  view === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <button className="p-3 bg-white border border-gray-200 text-gray-900 rounded-2xl hover:bg-gray-50 transition-all shadow-sm">
            <Filter className="w-5 h-5" />
          </button>
          <button
            onClick={fetchAutoSchedule}
            className="flex items-center gap-2 px-5 py-3 bg-violet-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-violet-100 hover:bg-violet-700 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Auto-Schedule AI
          </button>
          <button 
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            Schedule
          </button>
        </div>
      </div>

      {/* ── Auto-Schedule Intelligence Panel ────────────────────────────── */}
      {showAutoSchedule && (
        <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-violet-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="font-black text-violet-900">AI-Recommended Posting Slots</p>
                <p className="text-xs text-violet-600 font-medium">Based on audience behaviour patterns for Nagpur real estate</p>
              </div>
            </div>
            <button onClick={() => setShowAutoSchedule(false)} className="p-2 text-violet-400 hover:text-violet-700 rounded-xl hover:bg-violet-100 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          {autoScheduleLoading ? (
            <div className="flex items-center gap-3 py-4 justify-center">
              <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-bold text-violet-600">Analyzing your calendar for empty slots...</span>
            </div>
          ) : autoScheduleRecs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {autoScheduleRecs.slice(0, 6).map((rec: any, i: number) => (
                <div key={i} className="bg-white rounded-2xl border border-violet-100 p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[8px] font-bold text-violet-500 uppercase">{new Date(rec.scheduledAt).toLocaleDateString("en", { weekday: "short" })}</span>
                    <span className="text-sm font-black text-violet-900">{new Date(rec.scheduledAt).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase text-gray-400">{rec.platform} · {new Date(rec.scheduledAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}</p>
                    <p className="text-xs font-bold text-gray-700 truncate">{rec.suggestion?.angle ?? rec.reason}</p>
                  </div>
                  <a href={`/studio?goal=${encodeURIComponent(rec.suggestion?.angle ?? "Create a post for this slot")}`}
                    className="shrink-0 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-black text-[10px] rounded-xl transition-colors">
                    Fill
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-black text-gray-700">Your calendar is well-optimised!</p>
              <p className="text-sm text-gray-400">No critical empty slots found in the next 7 days.</p>
            </div>
          )}
        </div>
      )}

      {showScheduleModal && (
        <ScheduleModal 
          post={{ title: "", body: "", platform: "Instagram" }} 
          onClose={() => setShowScheduleModal(false)}
          onSuccess={() => {
            setShowScheduleModal(false);
            // Refresh items - should ideally be handled by a mutate function
            window.location.reload(); 
          }}
        />
      )}

      {showRefreshModal && selectedItem && (
        <RefreshModal
          post={{
            id: selectedItem.generatedAsset?.id || selectedItem.id,
            title: selectedItem.generatedAsset?.title || "Post",
            body: selectedItem.generatedAsset?.body || "No content found.",
            platform: selectedItem.platform
          }}
          onClose={() => setShowRefreshModal(false)}
          onSuccess={() => {
            setShowRefreshModal(false);
            window.location.reload();
          }}
        />
      )}

      {/* ── Controls & Legend ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black text-gray-900 min-w-[200px]">
            {format(currentDate, view === "month" ? "MMMM yyyy" : "'Week of' MMM d")}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={prev} className="p-2.5 hover:bg-white rounded-xl border border-transparent hover:border-gray-100 transition-all text-gray-400 hover:text-gray-900">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={today} className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-indigo-600 transition-all">Today</button>
            <button onClick={next} className="p-2.5 hover:bg-white rounded-xl border border-transparent hover:border-gray-100 transition-all text-gray-400 hover:text-gray-900">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 border-r border-gray-100 pr-6">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Published</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Scheduled</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Failed</span>
                </div>
            </div>
            {loading && <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 animate-pulse">Syncing...</div>}
        </div>
      </div>

      {/* ── Calendar Body ─────────────────────────────────────────────────── */}
      <div className="bg-white/40 backdrop-blur-xl border border-white rounded-[3rem] p-4 shadow-sm overflow-x-auto min-h-[700px]">
        <div className="min-w-[1000px]">
            {view === "month" && (
                <MonthView 
                    currentDate={currentDate} 
                    items={[...(items || []), ...suggestedItems]} 
                    onSelect={(item: any) => {
                      if (item.isSuggested) {
                        // G8: Implementation of auto-generation from suggestion
                        window.location.href = `/generator?topic=${encodeURIComponent(item.title)}&suggested=true`;
                      } else {
                        setSelectedItem(item);
                      }
                    }} 
                    onAdd={(date: Date) => {
                      // Pre-fill date logic could go here
                      setShowScheduleModal(true);
                    }}
                />
            )}
            {view === "week" && (
                <WeekView 
                    currentDate={currentDate} 
                    items={items} 
                    onSelect={setSelectedItem} 
                />
            )}
        </div>
        {view === "list" && (
            <div className="space-y-6 p-6 min-w-full">
                {items.length > 0 ? items.map((item) => (
                    <div key={item.id} className="group bg-white p-6 rounded-[2.5rem] border border-gray-50 hover:border-indigo-100 hover:shadow-xl transition-all flex items-center gap-6">
                        <div className="w-24 text-center border-r border-gray-50 flex flex-col justify-center">
                            <span className="text-2xl font-black text-gray-900 leading-none">{format(parseISO(item.scheduledAt), "dd")}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{format(parseISO(item.scheduledAt), "MMM")}</span>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <PlatformIcon platform={item.platform} className="w-4 h-4 text-gray-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{item.platform}</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors uppercase truncate max-w-md">
                                {item.generatedAsset?.title || "Untitled Post"}
                            </h3>
                            <p className="text-sm text-gray-400 font-medium line-clamp-1 mt-1">{item.generatedAsset?.body}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-black text-gray-900">{format(parseISO(item.scheduledAt), "hh:mm a")}</p>
                            <StatusBadge status={item.status} />
                        </div>
                        <button onClick={() => setSelectedItem(item)} className="p-4 bg-gray-50 rounded-2xl text-gray-400 hover:bg-indigo-600 hover:text-white transition-all">
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                )) : (
                    <div className="py-12 max-w-2xl mx-auto">
                        <EmptyState 
                          type="calendar" 
                          title="Your Calendar is Empty" 
                          description="You have no content scheduled for this period. Time to generate a new batch of fresh posts." 
                        />
                    </div>
                )}
            </div>
        )}
      </div>

      {/* ── Side Panel ────────────────────────────────────────────────────── */}
      {selectedItem && (
          <div className="fixed inset-0 z-50 flex justify-end">
              <div 
                className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={() => setSelectedItem(null)}
              />
              <div className="relative w-full max-w-xl bg-white h-full shadow-2xl animate-in slide-in-from-right duration-500 overflow-y-auto">
                    <div className="flex items-center justify-between p-8 border-b border-gray-50">
                        <div className="flex items-center gap-4">
                            <PlatformIcon platform={selectedItem.platform} className="w-6 h-6 text-indigo-600" />
                            <h2 className="text-2xl font-black text-gray-900">Post Details</h2>
                        </div>
                        <button onClick={() => setSelectedItem(null)} className="p-3 hover:bg-gray-100 rounded-2xl transition-all">
                            <X className="w-6 h-6 text-gray-400" />
                        </button>
                    </div>

                    <div className="p-8 space-y-8">
                        <div className="flex items-center justify-between bg-gray-50 p-6 rounded-3xl">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Scheduled for</p>
                                <p className="text-lg font-black text-gray-900">{format(parseISO(selectedItem.scheduledAt), "EEEE, MMM d, hh:mm a")}</p>
                            </div>
                            <div className="flex flex-col gap-2 items-end">
                                <StatusBadge status={selectedItem.status} />
                                {selectedItem.status === 'published' && (
                                  <button onClick={() => setShowRefreshModal(true)} className="text-[10px] font-black underline text-amber-600 uppercase tracking-widest px-2">Refresh & Republish</button>
                                )}
                                <button className="text-[10px] font-black underline text-indigo-600 uppercase tracking-widest px-2">Reschedule</button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Content Preview</h4>
                                <button className="text-xs font-black text-indigo-600 hover:underline">Edit Content</button>
                            </div>
                            <PostCard 
                                post={{
                                    ...selectedItem.generatedAsset,
                                    platform: selectedItem.platform
                                }} 
                            />
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Settings & Logs</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl border border-gray-100 bg-white">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Auto-Publish</p>
                                    <p className="text-sm font-black text-green-600">Enabled</p>
                                </div>
                                <div className="p-4 rounded-2xl border border-gray-100 bg-white">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Retry Count</p>
                                    <p className="text-sm font-black text-gray-900">{selectedItem.retryCount || 0}</p>
                                </div>
                            </div>
                        </div>

                        {selectedItem.status === 'failed' && (
                            <div className="p-6 bg-red-50 border border-red-100 rounded-3xl">
                                <div className="flex items-center gap-2 mb-2 text-red-600">
                                    <AlertCircle className="w-5 h-5" />
                                    <span className="font-black text-xs uppercase tracking-widest">Failure Reason</span>
                                </div>
                                <p className="text-sm font-medium text-red-700">{selectedItem.errorMessage || "Unknown connection error."}</p>
                                <button className="mt-4 w-full py-4 bg-red-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-red-100 hover:bg-red-700 transition-all">
                                    Retry Publishing Now
                                </button>
                            </div>
                        )}
                    </div>
              </div>
          </div>
      )}

    </div>
  );
}

// ── Components ──────────────────────────────────────────────────────

function WeekView({ currentDate, items, onSelect, onAdd }: any) {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: startDate, end: addDays(startDate, 6) });
    const timeSlots = ["09:00", "13:00", "19:00", "22:00"];

    return (
        <div className="flex flex-col min-h-[600px] bg-white rounded-[2.5rem] border border-gray-50 overflow-hidden shadow-2xl shadow-indigo-50/20">
            {/* Week Header */}
            <div className="grid grid-cols-8 border-b border-gray-50 bg-gray-50/50">
                <div className="p-4 border-r border-gray-50 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-gray-400" />
                </div>
                {weekDays.map((day) => (
                    <div key={day.toString()} className="p-4 text-center border-r border-gray-50 last:border-0">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 block mb-1">
                            {format(day, "eee")}
                        </span>
                        <span className={cn(
                            "text-lg font-black",
                            isSameDay(day, new Date()) ? "text-indigo-600" : "text-gray-900"
                        )}>
                            {format(day, "d")}
                        </span>
                    </div>
                ))}
            </div>

            {/* Time Rows */}
            <div className="flex-1 overflow-y-auto">
                {timeSlots.map((slot) => (
                    <div key={slot} className="grid grid-cols-8 border-b border-gray-50 hover:bg-gray-50/20 transition-all group">
                        <div className="p-4 border-r border-gray-50 flex items-start justify-center pt-8">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{slot}</span>
                        </div>
                        {weekDays.map((day) => {
                            const slotItems = items.filter((item: any) => {
                                const itemDate = parseISO(item.scheduledAt);
                                return isSameDay(itemDate, day) && format(itemDate, "HH:mm").startsWith(slot.split(":")[0]);
                            });

                            return (
                                <div key={day.toString()} className="p-3 border-r border-gray-50 last:border-0 min-h-[140px] space-y-2">
                                    {slotItems.map((item: any) => (
                                        <button 
                                            key={item.id}
                                            onClick={() => onSelect(item)}
                                            className={cn(
                                                "w-full text-left p-3 rounded-2xl border transition-all flex flex-col gap-2 group/card",
                                                item.status === 'published' ? "bg-green-50/50 border-green-100 text-green-800" : 
                                                item.status === 'failed' ? "bg-red-50 border-red-100 text-red-800" : 
                                                "bg-white border-gray-100 text-gray-900 hover:border-indigo-200 hover:shadow-lg"
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className={cn("w-2 h-2 rounded-full", 
                                                    item.status === 'published' ? "bg-green-500" : 
                                                    item.status === 'failed' ? "bg-red-500" : 
                                                    "bg-indigo-500"
                                                )} />
                                                <PlatformIcon platform={item.platform} className="w-3.5 h-3.5 text-gray-400" />
                                            </div>
                                            <p className="text-[10px] font-black uppercase leading-tight line-clamp-2">
                                                {item.generatedAsset?.title || "Post"}
                                            </p>
                                        </button>
                                    ))}
                                    <button className="w-full py-6 rounded-2xl border-2 border-dashed border-gray-50 flex items-center justify-center text-gray-200 hover:border-indigo-100 hover:text-indigo-200 hover:bg-indigo-50/30 transition-all opacity-0 group-hover:opacity-100">
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}

function MonthView({ currentDate, items, onSelect, onAdd }: any) {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
        <div className="grid grid-cols-7 border border-gray-50 rounded-[2.5rem] overflow-hidden bg-white shadow-2xl shadow-indigo-50/20">
            {/* Days row */}
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="py-6 text-center border-b border-gray-50 bg-gray-50/50">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{day}</span>
                </div>
            ))}
            {/* Grid days */}
            {calendarDays.map((day, i) => {
                const dayItems = items.filter((item: any) => isSameDay(parseISO(item.scheduledAt), day));
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isToday = isSameDay(day, new Date());

                return (
                    <div 
                        key={i} 
                        className={cn(
                            "min-h-[140px] p-4 border-r border-b border-gray-50 transition-all overflow-hidden relative group",
                            !isCurrentMonth ? "bg-gray-50/30 opacity-40" : "bg-white",
                            isToday && "ring-2 ring-inset ring-indigo-500/10"
                        )}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className={cn(
                                "text-sm font-black",
                                isToday ? "text-indigo-600 underline underline-offset-8" : "text-gray-900",
                                !isCurrentMonth && "text-gray-300"
                            )}>
                                {format(day, "d")}
                            </span>
                            {dayItems.length > 3 && (
                                <span className="text-[10px] font-black text-indigo-400">+{dayItems.length - 3}</span>
                            )}
                        </div>

                        <div className="space-y-1.5 overflow-hidden">
                            {dayItems.slice(0, 3).map((item: any) => (
                                <button 
                                    key={item.id}
                                    onClick={() => onSelect(item)}
                                    className={cn(
                                        "w-full text-left px-2 py-1.5 rounded-lg border border-transparent transition-all flex items-center gap-2 truncate",
                                        item.isSuggested ? "bg-amber-50 text-amber-700 border-amber-100" :
                                        item.status === 'published' ? "bg-green-50/50 text-green-700" : 
                                        item.status === 'failed' ? "bg-red-50 text-red-600" : 
                                        "bg-indigo-50 text-indigo-700 hover:border-indigo-200"
                                    )}
                                >
                                    <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", 
                                        item.isSuggested ? "bg-amber-500 animate-pulse" :
                                        item.status === 'published' ? "bg-green-500" : 
                                        item.status === 'failed' ? "bg-red-500" : 
                                        "bg-indigo-500"
                                    )} />
                                    <PlatformIcon platform={item.platform} className="w-3 h-3 shrink-0" />
                                    <span className="text-[10px] font-bold uppercase truncate tracking-tighter">
                                        {item.generatedAsset?.title || item.title || "Post"}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Hover Action */}
                        <button 
                          onClick={() => onAdd(day)}
                          className="absolute bottom-2 right-2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

function PlatformIcon({ platform, className }: { platform: string, className?: string }) {
    const Icon = PLATFORM_ICONS[platform.toLowerCase()] || Sparkles;
    return <Icon className={className} />;
}

function StatusBadge({ status }: { status: string }) {
    const config = {
        published: { bg: "bg-green-50 text-green-700 border-green-100", icon: CheckCircle2, text: "LIVE" },
        scheduled: { bg: "bg-indigo-50 text-indigo-700 border-indigo-100", icon: Clock, text: "QUEUED" },
        failed: { bg: "bg-red-50 text-red-700 border-red-100", icon: AlertCircle, text: "FAILED" },
        ready: { bg: "bg-indigo-50 text-indigo-700 border-indigo-100", icon: Clock, text: "READY" },
    }[status] || { bg: "bg-gray-50 text-gray-700 border-gray-100", icon: Clock, text: "DRAFT" };

    const Icon = config.icon;

    return (
        <div className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5", config.bg)}>
            <Icon className="w-3 h-3" />
            {config.text}
        </div>
    );
}
