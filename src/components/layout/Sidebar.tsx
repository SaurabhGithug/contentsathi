"use client";

import { cn } from "@/lib/utils";
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
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as Popover from "@radix-ui/react-popover";

const navItems = [
  { name: "Agency HQ",             href: "/dashboard",             icon: LayoutDashboard },
  { name: "AI Studio (New Campaign)", href: "/studio",               icon: BrainCircuit },
  { name: "Approvals & QC",        href: "/approvals",             icon: BookOpen },
  { name: "Asset Vault",           href: "/library",               icon: LayoutTemplate },
  { name: "Content Calendar",      href: "/calendar",              icon: CalendarDays },
  { name: "Market Hunter",         href: "/market-watch",          icon: TrendingUp },
  { name: "WhatsApp Agents",       href: "/whatsapp-sequences",    icon: MessageSquare },
  { name: "Team Economics",        href: "/analytics",             icon: Activity },
];

import { BrainCircuit } from "lucide-react";

const PLATFORM_ICONS: Record<string, any> = {
  instagram: Instagram,
  linkedin:  Linkedin,
  youtube:   Youtube,
  x:         Zap, // using Zap as X placeholder if X icon missing
  whatsapp:  MessageCircle,
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
          <span className="text-xl font-black text-gray-900 tracking-tighter">Contentsathi</span>
        </div>

        {/* Main nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
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
              </Link>
            );
          })}

          {/* Divider */}
          <div className="border-t border-gray-100 my-2" />

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
            <div className="flex flex-wrap gap-2">
              {Object.keys(PLATFORM_ICONS).map((p) => {
                const Icon = PLATFORM_ICONS[p];
                const isConnected = connectedPlatforms.includes(p);
                const platformName = p.charAt(0).toUpperCase() + p.slice(1);

                const buttonContent = (
                  <button
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                      isConnected
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm"
                        : "bg-gray-50 text-gray-400 border border-gray-100 opacity-60 hover:opacity-100"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );

                return (
                  <Tooltip.Root key={p}>
                    <Tooltip.Trigger asChild>
                      {isConnected ? (
                        <Popover.Root>
                          <Popover.Trigger asChild>
                            {buttonContent}
                          </Popover.Trigger>
                          <Popover.Portal>
                            <Popover.Content sideOffset={5} className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 z-50 text-sm w-48 animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95">
                              <p className="font-semibold text-gray-900 mb-1">{platformName}</p>
                              <p className="text-gray-500 text-xs mb-3">Currently connected</p>
                              <Link href="/settings">
                                <button className="w-full bg-red-50 text-red-600 font-medium py-1.5 rounded-lg text-xs hover:bg-red-100">
                                  Manage / Disconnect
                                </button>
                              </Link>
                              <Popover.Arrow className="fill-white" />
                            </Popover.Content>
                          </Popover.Portal>
                        </Popover.Root>
                      ) : (
                        <Link href="/settings" className="block">
                          {buttonContent}
                        </Link>
                      )}
                    </Tooltip.Trigger>
                    {/* Only show tooltip on hover. If Popover opens, it naturally handles focus too */}
                    <Tooltip.Portal>
                      <Tooltip.Content sideOffset={5} className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-sm z-50 animate-in fade-in">
                        {platformName} — {isConnected ? "Connected" : "Click to connect"}
                        <Tooltip.Arrow className="fill-gray-900" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                );
              })}
            </div>
          </Tooltip.Provider>
        </div>
      </aside>

      {/* ── Mobile bottom nav (375px) ───────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex items-center justify-around px-2 py-2 safe-area-inset-bottom pb-4">
        {[
          { name: "HQ",         href: "/dashboard",  icon: LayoutDashboard, emoji: "🏢" },
          { name: "Studio",     href: "/studio",     icon: BrainCircuit,    emoji: "🤖" },
          { name: "Approvals",  href: "/approvals",  icon: BookOpen,        emoji: "✅" },
          { name: "Calendar",   href: "/calendar",   icon: CalendarDays,    emoji: "📅" },
          { name: "Settings",   href: "/settings",   icon: Settings,        emoji: "⚙️" },
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
