import { useState } from "react";
import { X, Calendar as CalendarIcon, Clock, Send, Loader2, CheckCircle2 } from "lucide-react";

interface ScheduleModalProps {
  post: {
    title?: string;
    body: string;
    platform: string;
    imageUrl?: string;
    type?: string;
  };
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ScheduleModal({ post, onClose, onSuccess }: ScheduleModalProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSchedule = async () => {
    if (!date || !time) {
      setError("Please select both date and time.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Create a DateTime object combining date and time
      const datetime = new Date(`${date}T${time}:00`);

      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: post.platform,
          title: post.title || `${post.platform} Post`,
          body: post.body,
          type: post.type || "post",
          scheduledDate: datetime.toISOString(),
          scheduledTime: time, // For display
          status: "ready", // Ready to be picked up by cron
        }),
      });

      if (!res.ok) throw new Error("Failed to schedule post");
      
      setSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(onClose, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Schedule Post</h3>
            <p className="text-xs text-gray-500 font-medium">{post.platform}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-6 text-green-600">
              <CheckCircle2 className="w-10 h-10 mb-3" />
              <p className="font-bold">Post Scheduled!</p>
              <p className="text-sm font-medium mt-1 text-center">It will be automatically published via your connected account.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                  {error}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-indigo-500" /> Date
                </label>
                <input 
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all text-sm outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" /> Time
                </label>
                <input 
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all text-sm outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSchedule}
              disabled={loading || !date || !time}
              className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 w-4 h-4" />}
              Schedule
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
