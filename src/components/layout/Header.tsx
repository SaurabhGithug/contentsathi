"use client";

import { Bell, ChevronDown, LogOut, Menu, Settings, User, UserCircle, Check, Info, AlertTriangle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export function Header() {
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]); // Initialize as empty
  const [isSystemPaused, setIsSystemPaused] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Fetch initial pause state
  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.systemPaused === "boolean") {
          setIsSystemPaused(data.systemPaused);
        }
      })
      .catch((err) => console.error("Health check failed", err));
  }, []);

  const togglePause = async () => {
    setIsPausing(true);
    try {
      const res = await fetch("/api/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pause: !isSystemPaused }),
      });
      const data = await res.json();
      if (res.ok && data.success) setIsSystemPaused(data.paused);
    } catch (e) {
      console.error("Failed to toggle pause", e);
    } finally {
      setIsPausing(false);
    }
  };


  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userName = session?.user?.name || "Saurabh";
  const userRole = (session?.user as any)?.role || "Real Estate";

  return (
    <header className="h-16 px-6 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button className="md:hidden text-gray-500 hover:text-gray-900 transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-sm font-medium text-gray-500 hidden sm:inline-block">
          Your Content Partner is ready. ✨
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Pause Button */}
        <button
          onClick={togglePause}
          disabled={isPausing}
          className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide border flex items-center gap-2 transition-colors shadow-sm ${
            isSystemPaused 
              ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' 
              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          {isPausing ? (
             <span className="w-3.5 h-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <>
              <span className={`w-2 h-2 rounded-full ${isSystemPaused ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
              {isSystemPaused ? "System Paused" : "Active Mode"}
            </>
          )}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`relative text-gray-400 hover:text-gray-900 transition-colors p-2 rounded-full hover:bg-gray-100 ${isNotificationsOpen ? 'bg-gray-100 text-gray-900' : ''}`}
          >
            <Bell className="w-5 h-5" />
            {notifications.some(n => !n.read) && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white"></span>
            )}
          </button>

          <AnimatePresence>
            {isNotificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                  <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                  {notifications.length > 0 && (
                    <button className="text-[10px] font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-700">Mark all as read</button>
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div key={n.id} className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer group ${!n.read ? 'bg-indigo-50/30' : ''}`}>
                        <div className="flex gap-3">
                          <div className={`mt-1 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            n.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 
                            n.type === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {n.type === 'success' ? <Check className="w-4 h-4" /> : 
                             n.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{n.title}</p>
                            <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5 line-clamp-2">{n.description}</p>
                            <p className="text-[10px] text-gray-400 mt-1 font-medium">{n.time}</p>
                          </div>
                          {!n.read && (
                            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 px-6 text-center">
                      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Bell className="w-6 h-6 text-gray-300" />
                      </div>
                      <p className="text-sm font-bold text-gray-900">All caught up!</p>
                      <p className="text-xs text-gray-500 mt-1">No new notifications at the moment.</p>
                    </div>
                  )}
                </div>

                <div className="p-2 border-t border-gray-50 bg-gray-50/50 text-center">
                  <button className="w-full py-2 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors">View all activity</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 pl-4 border-l border-gray-100 cursor-pointer group hover:opacity-80 transition-opacity"
          >
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">{userName}</span>
              <span className="text-xs text-gray-500">{userRole}</span>
            </div>
            <div className="relative">
              <UserCircle className="w-8 h-8 text-gray-400 group-hover:text-gray-600 transition-colors" />
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border border-gray-100">
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-gray-50 mb-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                  <p className="text-xs text-gray-500 truncate">{session?.user?.email || "demo@contentsathi.in"}</p>
                </div>

                <div className="p-1">
                  <Link 
                    href="/settings?tab=profile"
                    onClick={() => setIsDropdownOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors group"
                  >
                    <User className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                    Profile Settings
                  </Link>
                  <Link 
                    href="/settings?tab=accounts"
                    onClick={() => setIsDropdownOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors group"
                  >
                    <Settings className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                    Account Settings
                  </Link>
                </div>

                <div className="mt-1 pt-1 border-t border-gray-50 p-1">
                  <button 
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50/50 rounded-lg transition-colors group"
                  >
                    <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-600" />
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
