import { Zap } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center p-6">
      {/* Logo at top */}
      <div className="mb-8 flex items-center gap-2">
        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
          <Zap className="w-5 h-5 text-white fill-white" />
        </div>
        <span className="text-xl font-black text-gray-900 tracking-tighter">Contentsathi</span>
      </div>

      {/* Page content (login/register card) */}
      {children}

      {/* Back to home */}
      <Link
        href="/"
        className="mt-8 text-sm text-gray-400 hover:text-gray-700 transition-colors"
      >
        ← Back to Home
      </Link>
    </div>
  );
}
