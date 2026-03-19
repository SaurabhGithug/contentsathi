"use client";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  // Path check for public pages, auth, and admin (admin handles its own layout)
  const isPublicLayout = 
    pathname === "/" || 
    pathname.startsWith("/auth") || 
    pathname === "/onboarding" ||
    pathname === "/privacy" || 
    pathname === "/privacy-policy" || 
    pathname === "/terms" || 
    pathname === "/about" || 
    pathname === "/contact" ||
    pathname === "/pricing" ||
    pathname.startsWith("/admin");

  if (isPublicLayout) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50/50 font-sans text-gray-900 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto w-full flex flex-col">
          <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
