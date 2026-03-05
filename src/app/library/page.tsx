import Link from "next/link";

export default function LibraryPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto animation-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">Your Content Library</h1>
          <p className="text-gray-500 mt-2">Every post you generate is saved here.</p>
        </div>
        <Link href="/generator">
          <button className="bg-purple-600 hover:bg-purple-700">Generate Post →</button>
        </Link>
      </div>

      <div className="flex items-center space-x-2 mb-8 overflow-x-auto pb-2">
        {["All", "Instagram", "LinkedIn", "WhatsApp", "YouTube", "Draft", "Published"].map((filter) => (
          <button
            key={filter}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              filter === "All" ? "bg-purple-100 text-purple-700" : "bg-white border text-gray-600 hover:bg-gray-50"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border p-12 text-center shadow-sm">
        <div className="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Your library is empty</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          You haven&apos;t generated any content yet. Start by generating your first post using our AI engine.
        </p>
        <Link href="/generator">
          <button className="bg-purple-600 hover:bg-purple-700 rounded-full px-8 py-3 text-white font-bold transition-all">
            Generate your first post →
          </button>
        </Link>
      </div>
    </div>
  );
}
