import Link from "next/link";
import { Sparkles, ArrowRight, LayoutDashboard, Calendar, BarChart2, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils/utils";

interface EmptyStateProps {
  type: "calendar" | "analytics" | "library" | "dashboard";
  title: string;
  description: string;
}

const ICONS = {
  calendar: Calendar,
  analytics: BarChart2,
  library: FolderOpen,
  dashboard: LayoutDashboard,
};

const COLORS = {
  calendar: "text-indigo-600 bg-indigo-50 border-indigo-100",
  analytics: "text-blue-600 bg-blue-50 border-blue-100",
  library: "text-emerald-600 bg-emerald-50 border-emerald-100",
  dashboard: "text-purple-600 bg-purple-50 border-purple-100",
};

export default function EmptyState({ type, title, description }: EmptyStateProps) {
  const Icon = ICONS[type];
  const colorClass = COLORS[type];

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white/40 backdrop-blur-md border border-gray-100 rounded-[3rem] shadow-sm animate-in fade-in zoom-in-95 duration-500">
      <div className={cn("w-24 h-24 rounded-[2rem] flex items-center justify-center mb-6 border shadow-inner relative overflow-hidden group", colorClass)}>
        <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
        <Icon className="w-10 h-10 relative z-10" />
        <Sparkles className="w-4 h-4 absolute top-4 right-4 animate-pulse opacity-50" />
      </div>

      <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-3">
        {title}
      </h3>
      
      <p className="text-gray-500 font-medium max-w-sm mx-auto mb-8 leading-relaxed">
        {description}
      </p>

      <Link 
        href="/generator"
        className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-black transition-all shadow-xl shadow-gray-200 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        <span>Generate First Campaign</span>
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}
