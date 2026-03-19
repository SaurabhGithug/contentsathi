"use client";

import { cn } from "@/lib/utils/utils";
import {
  LayoutDashboard,
  PenTool,
  RefreshCw,
  LayoutTemplate,
  BookOpen,
  CalendarDays,
  MessageSquare,
  Activity,
  TrendingUp,
  CreditCard,
  Settings,
  Zap,
  Instagram,
  Linkedin,
  Youtube,
  Facebook,
  MessageCircle,
  Users,
  Shield,
  FileText,
  Calculator,
  BrainCircuit,
  Star,
  SearchCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as Popover from "@radix-ui/react-popover";

const navGroups = [
  {
    title: "CREATE",
    items: [
      { name: "AI Studio",              href: "/studio",             icon: BrainCircuit },
      { name: "Content Calendar",       href: "/calendar",           icon: CalendarDays },
      { name: "Asset Vault",            href: "/library",            icon: LayoutTemplate },
    ]
  },
  {
    title: "INTELLIGENCE",
    items: [
      { name: "Chief AI Officer",       href: "/cao",                icon: Shield },
      { name: "Research · Hunter Mode", href: "/market-watch",       icon: TrendingUp },
      { name: "Buyer Intelligence",     href: "/intelligence",       icon: Star, badge: "NEW" },
      { name: "2026 Industry Report",   href: "/report",             icon: FileText, badge: "SOON" },  
    ]
  },
  {
    title: "MANAGE",
    items: [
      { name: "Dashboard",              href: "/dashboard",          icon: LayoutDashboard },
      { name: "Agent Team",             href: "/agents",             icon: Users, badge: "SOON" },
      { name: "Approvals & QC",         href: "/approvals",          icon: BookOpen },
      { name: "Leads & Conversion",     href: "/leads",              icon: Users, badge: "LIVE" },
      { name: "Analytics",              href: "/analytics",          icon: Activity },
      { name: "Account Audit",          href: "/account-audit",      icon: SearchCheck, badge: "SOON" },
    ]
  },
  {
    title: "TOOLS",
    items: [
      { name: "Plot Value Estimator",   href: "/plot-valuator",      icon: Calculator, badge: "NEW" },
      { name: "WhatsApp Setup",         href: "/settings?tab=accounts", icon: MessageCircle },
    ]
  }
];


const PLATFORM_ICONS: Record<string, any> = {
  instagram: { icon: Instagram, label: "Instagram" },
  linkedin:  { icon: Linkedin, label: "LinkedIn" },
  youtube:   { icon: Youtube, label: "YouTube" },
  x:         { icon: Zap, label: "X (Twitter)" },
  whatsapp:  { icon: MessageCircle, label: "WhatsApp" },
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
        console.error("Sidebar: failed to fetch connected accounts", e);
      }
    }
    fetchAccounts();
  }, []);

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside className="w-64 bg-white/80 backdrop-blur-xl border-r border-gray-100 flex flex-col h-full hidden md:flex shrink-0">
        {/* Logo */}
        <div className="px-6 py-5 flex items-center gap-3 border-b border-gray-100">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="text-xl font-black text-gray-900 tracking-tighter">ContentSathi</span>
        </div>

        {/* Main nav */}
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              <p className="px-3 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                {group.title}
              </p>
              {group.items.map((item: any) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-sm font-medium",
                      isActive
                        ? "bg-indigo-50 text-indigo-700 shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon
                      className={cn("w-4.5 h-4.5 shrink-0", isActive ? "text-indigo-600" : "text-gray-400")}
                      style={{ width: "1.125rem", height: "1.125rem" }}
                    />
                    {item.name}
                    {item.badge && (
                      <span className={cn(
                        "ml-auto text-[9px] font-black px-1.5 py-0.5 rounded-full",
                        item.badge === "SOON" ? "bg-amber-100 text-amber-700" :
                        item.badge === "LIVE" ? "bg-emerald-100 text-emerald-700" :
                        "bg-purple-500 text-white"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}

          {/* Divider */}
          <div className="border-t border-gray-100 my-4" />

          <Link
            href="/pricing"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-sm font-medium",
              pathname.startsWith("/pricing")
                ? "bg-indigo-50 text-indigo-700 shadow-sm"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <CreditCard
              className={cn("shrink-0", pathname.startsWith("/pricing") ? "text-indigo-600" : "text-gray-400")}
              style={{ width: "1.125rem", height: "1.125rem" }}
            />
            Pricing
          </Link>

          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-sm font-medium",
              pathname.startsWith("/settings")
                ? "bg-indigo-50 text-indigo-700 shadow-sm"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <Settings
              className={cn("shrink-0", pathname.startsWith("/settings") ? "text-indigo-600" : "text-gray-400")}
              style={{ width: "1.125rem", height: "1.125rem" }}
            />
            Settings
          </Link>
        </nav>

        {/* Connected channels strip */}
        <div className="px-5 py-4 border-t border-gray-100">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-3">
            Connected Channels
          </p>
          <Tooltip.Provider delayDuration={300}>
            <div className="space-y-2">
              {Object.keys(PLATFORM_ICONS).map((p) => {
                const { icon: Icon, label } = PLATFORM_ICONS[p];
                const isConnected = connectedPlatforms.includes(p);

                return (
                  <Link 
                    key={p} 
                    href="/settings?tab=accounts"
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all border",
                      isConnected 
                        ? "bg-emerald-50/50 border-emerald-100 text-emerald-700" 
                        : "bg-gray-50/50 border-gray-100 text-gray-400 opacity-60 hover:opacity-100"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", isConnected ? "text-emerald-600" : "text-gray-400")} />
                    <span className="text-[11px] font-black uppercase tracking-wider">{label}</span>
                    {isConnected && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    )}
                  </Link>
                );
              })}
            </div>
          </Tooltip.Provider>
        </div>
      </aside>

      {/* ── Mobile bottom nav (375px) ───────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex items-center justify-around px-2 py-2 safe-area-inset-bottom pb-4">
        {[
          { name: "HQ",       href: "/dashboard",    emoji: "🏢" },
          { name: "Studio",   href: "/studio",       emoji: "🤖" },
          { name: "Agents",   href: "/agents",       emoji: "👥" },
          { name: "Hunter",   href: "/market-watch", emoji: "🕵️" },
          { name: "Vault",    href: "/library",      emoji: "🗃️" },
        ].map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-3 py-1"
            >
              <div className={cn("text-lg", isActive ? "" : "opacity-60 grayscale")}>
                {item.emoji}
              </div>
              <span className={cn("text-[10px] font-medium leading-none", isActive ? "text-indigo-700 font-bold" : "text-gray-500")}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
