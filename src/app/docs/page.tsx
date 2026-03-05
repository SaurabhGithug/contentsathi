"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, ChevronRight, Code, Zap } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 h-16 flex items-center px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mr-6">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-semibold">Back to Home</span>
        </Link>
        <Link href="/" className="flex items-center gap-2.5 mx-auto md:mx-0 absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-200">
            <Zap className="w-4.5 h-4.5 text-white fill-white" style={{ width: "1.1rem", height: "1.1rem" }} />
          </div>
          <span className="text-lg font-black text-gray-900 tracking-tighter">Contentsathi</span>
        </Link>
      </header>

      {/* Hero Section */}
      <section className="bg-gray-50 pt-20 pb-16 px-5 border-b border-gray-200 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="w-16 h-16 bg-white border border-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Code className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 mb-4">Contentsathi API Documentation</h1>
          <p className="text-lg text-gray-600">
            Automate your social media pipeline. Build custom integrations using our robust REST API.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-5 py-12 grid grid-cols-1 md:grid-cols-4 gap-12 flex-grow">
        
        {/* Sidebar Nav (Mock) */}
        <aside className="hidden md:block col-span-1 space-y-6">
          <div>
            <h4 className="font-bold text-gray-900 text-sm uppercase tracking-widest mb-3">Getting Started</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg -ml-3">Introduction</li>
              <li className="px-3 hover:text-indigo-600 cursor-pointer transition-colors">Authentication</li>
              <li className="px-3 hover:text-indigo-600 cursor-pointer transition-colors">Rate Limits</li>
              <li className="px-3 hover:text-indigo-600 cursor-pointer transition-colors">Errors</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm uppercase tracking-widest mb-3">Endpoints</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="px-3 hover:text-indigo-600 cursor-pointer transition-colors">Generate Content</li>
              <li className="px-3 hover:text-indigo-600 cursor-pointer transition-colors">Repurpose URL</li>
              <li className="px-3 hover:text-indigo-600 cursor-pointer transition-colors">Publish Post</li>
              <li className="px-3 hover:text-indigo-600 cursor-pointer transition-colors">Latest Posts Widget</li>
            </ul>
          </div>
        </aside>

        {/* Content Area */}
        <div className="col-span-1 md:col-span-3">
          <div className="bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-xl mb-10 flex items-start gap-3">
             <BookOpen className="w-5 h-5 mt-0.5 shrink-0" />
             <div className="text-sm">
               <strong>Note:</strong> API access is exclusively available for users on the <strong>Creator and Agency tiers</strong>. You can generate your API Key from your dashboard settings.
             </div>
          </div>

          <div className="prose prose-indigo max-w-none">
            <h2 className="text-2xl font-bold border-b pb-2 mb-6 text-gray-900">Introduction</h2>
            <p>
              The Contentsathi API is organised around REST. Our API has predictable resource-oriented URLs, accepts JSON-encoded request bodies, returns JSON-encoded responses, and uses standard HTTP response codes, authentication, and verbs.
            </p>

            <h3 className="mt-10 text-xl font-bold text-gray-900">Base URL</h3>
            <pre className="mt-2 text-sm bg-gray-900 text-white rounded-xl p-4 overflow-x-auto border border-gray-800">
              <code>https://contentsathi.com/api/v1</code>
            </pre>

            <h3 className="mt-10 text-xl font-bold text-gray-900">Authentication</h3>
            <p>
              Authenticate your account when using the API by including your secret API key in the request. Use the standard <code>x-api-key</code> header.
            </p>
            <pre className="mt-2 text-sm bg-gray-900 text-white rounded-xl p-4 overflow-x-auto border border-gray-800">
              <code>{`GET /api/v1/posts
x-api-key: cs_live_12345...`}</code>
            </pre>
            <p className="text-sm text-gray-500 mt-2">Your API keys carry many privileges, so be sure to keep them secure! Do not share your secret API keys in publicly accessible areas such as GitHub, client-side code, and so forth.</p>
          
            <div className="flex justify-between items-center mt-12 border-t pt-8">
               <span className="text-gray-400">Previous: None</span>
               <button className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl font-semibold text-gray-700 transition-colors">
                 Authentication <ChevronRight className="w-4 h-4" />
               </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
