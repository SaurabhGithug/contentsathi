import { Bell, Menu, UserCircle } from "lucide-react";

export function Header() {
  return (
    <header className="h-16 px-6 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button className="md:hidden text-gray-500 hover:text-gray-900 transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-sm font-medium text-gray-500 hidden sm:inline-block">
          Welcome back to Contentsathi 👋
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative text-gray-400 hover:text-gray-900 transition-colors p-2 rounded-full hover:bg-gray-100">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white"></span>
        </button>
        <div className="flex items-center gap-2 pl-4 border-l border-gray-100 cursor-pointer">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm font-semibold text-gray-900">Saurabh</span>
            <span className="text-xs text-gray-500">Real Estate</span>
          </div>
          <UserCircle className="w-8 h-8 text-gray-400" />
        </div>
      </div>
    </header>
  );
}
