"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Shield, ArrowRight } from "lucide-react";
import { usePathname } from "next/navigation";

export function AdminBar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const user = session?.user as any;

  // Only show if:
  // 1. User is an admin
  // 2. NOT already on the admin panel
  if (!user?.isAdmin) return null;
  if (pathname.startsWith("/admin")) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-safe sm:bottom-auto sm:top-0 sm:pb-0 pointer-events-none">
      <div className="pointer-events-auto mx-auto flex items-center gap-3 px-4 py-2 bg-gray-950/95 backdrop-blur-xl border border-gray-700/60 text-white shadow-2xl sm:rounded-full sm:mt-2 sm:mx-4 w-full sm:w-auto">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center">
            <Shield className="w-3 h-3 text-red-400" />
          </div>
          <span className="text-[11px] font-black text-red-400 uppercase tracking-widest">Admin Mode</span>
        </div>
        <span className="text-gray-600 text-xs hidden sm:block">—</span>
        <span className="text-xs text-gray-400 hidden sm:block">You are viewing ContentSathi as a user</span>
        <Link
          href="/admin"
          className="flex items-center gap-1.5 ml-auto sm:ml-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-[11px] transition-colors whitespace-nowrap"
        >
          Back to Admin <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
