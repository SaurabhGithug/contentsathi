import Link from "next/link";

export default function AnalyticsPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto animation-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">Your Analytics</h1>
        <p className="text-gray-500 mt-2">Publish your first post to see performance data here.</p>
      </div>

      <div className="bg-white rounded-2xl border p-12 shadow-sm border-purple-100 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-purple-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

        <div className="relative z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-50 rounded-2xl flex items-center justify-center mb-8 shadow-sm border border-purple-100">
            <svg className="w-10 h-10 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Setup Progress</h3>
          
          <div className="space-y-4 mb-10">
            <div className="flex items-center text-gray-600">
              <div className="w-6 h-6 rounded-md border-2 border-gray-300 flex-shrink-0 mr-3"></div>
              <span>Connect a social account</span>
            </div>
            <div className="flex items-center text-gray-600">
              <div className="w-6 h-6 rounded-md border-2 border-gray-300 flex-shrink-0 mr-3"></div>
              <span>Generate your first post</span>
            </div>
            <div className="flex items-center text-gray-600">
              <div className="w-6 h-6 rounded-md border-2 border-gray-300 flex-shrink-0 mr-3"></div>
              <span>Publish it</span>
            </div>
            <div className="flex items-center text-gray-600">
              <div className="w-6 h-6 rounded-md border-2 border-gray-300 flex-shrink-0 mr-3"></div>
              <span>Wait 24 hours for analytics data to sync</span>
            </div>
          </div>

          <Link href="/settings">
            <button className="bg-purple-600 hover:bg-purple-700 rounded-full px-8 py-3 text-white font-bold shadow-md hover:shadow-lg transition-all">
              Connect Account →
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
