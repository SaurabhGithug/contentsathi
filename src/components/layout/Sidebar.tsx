import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  PenTool, 
  RefreshCw, 
  LayoutTemplate, 
  CalendarDays, 
  Settings,
  Activity,
  MessageSquare,
  Zap,
  Globe,
  Instagram,
  Linkedin,
  Youtube,
  Facebook,
  MessageCircle
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const navItems = [
  { name: "Content Generator", href: "/generator", icon: PenTool },
  { name: "Repurpose Source", href: "/repurpose", icon: RefreshCw },
  { name: "Real Estate Templates", href: "/templates", icon: LayoutTemplate },
  { name: "WhatsApp Sequences", href: "/whatsapp-sequences", icon: MessageSquare },
  { name: "Content Calendar", href: "/calendar", icon: CalendarDays },
  { name: "Analytics", href: "/analytics", icon: Activity },
];

const PLATFORM_ICONS: Record<string, any> = {
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
  facebook: Facebook,
  whatsapp: MessageCircle,
};

export function Sidebar() {
  const pathname = usePathname();
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const res = await fetch("/api/social-accounts");
        if (res.ok) {
          const data = await res.json();
          const platforms = (data.accounts || []).map((a: any) => a.platform.toLowerCase());
          setConnectedPlatforms(Array.from(new Set(platforms)) as string[]);
        }
      } catch (e) {
        console.error("Failed to fetch connected accounts for sidebar", e);
      }
    }
    fetchAccounts();
  }, []);

  return (
    <aside className="w-64 bg-white/80 backdrop-blur-xl border-r border-gray-100 flex flex-col h-full hidden md:flex">
      <div className="p-6">
        <div className="mb-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
          <Zap className="w-6 h-6 text-white fill-white" />
        </div>
        <span className="text-xl font-black text-gray-900 tracking-tighter">Contentsathi</span>
      </div>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium",
                isActive 
                  ? "bg-indigo-50/80 text-indigo-600 shadow-sm" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-indigo-600" : "text-gray-400")} />
              {item.name}
            </Link>
          );
        })}

        {/* Status Indicators (F1) */}
        <div className="mt-8 pt-6 border-t border-gray-50 px-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Connected Channels</p>
          <div className="flex flex-wrap gap-2">
            {Object.keys(PLATFORM_ICONS).map((p) => {
              const Icon = PLATFORM_ICONS[p];
              const isConnected = connectedPlatforms.includes(p);
              return (
                <div 
                  key={p} 
                  title={isConnected ? `${p} Connected` : `${p} Not Connected`}
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                    isConnected 
                      ? "bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100" 
                      : "bg-gray-50 text-gray-300 grayscale border border-gray-100 opacity-50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-gray-100">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium",
            pathname.startsWith("/settings") 
              ? "bg-indigo-50/80 text-indigo-600 shadow-sm" 
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          )}
        >
          <Settings className="w-5 h-5 text-gray-400" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
