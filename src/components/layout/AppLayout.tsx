"use client";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  // Do not show Sidebar and Header on the root/landing page if it's meant to be onboarding.
  // Actually, let's keep it simple: always show it unless it's /onboarding.
  const isOnboarding = pathname === "/onboarding" || pathname === "/" || pathname.startsWith("/auth");

  if (isOnboarding) {
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
