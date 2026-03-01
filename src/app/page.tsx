import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full text-center space-y-8">
        <nav className="flex items-center justify-between h-20 px-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black">C</span>
            </div>
            <span className="text-xl font-black text-gray-900 tracking-tighter">Contentsathi</span>
          </div>
        </nav>
        <div className="mx-auto w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 mb-8 transform hover:scale-105 transition-transform">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight">
          Contentsathi
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          The ultimate AI content engine for solopreneurs & real estate professionals.
          <br className="hidden md:block" /> One topic. One week of content.
        </p>

        <div className="pt-8">
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-100">
            <h3 className="font-semibold text-lg text-gray-900 mb-2">Multilingual</h3>
            <p className="text-gray-600">English, Hindi, Marathi, & Hinglish built-in.</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-100">
            <h3 className="font-semibold text-lg text-gray-900 mb-2">Omnichannel</h3>
            <p className="text-gray-600">Insta, LinkedIn, X, YouTube Shorts & WhatsApp.</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-100">
            <h3 className="font-semibold text-lg text-gray-900 mb-2">Brand OS</h3>
            <p className="text-gray-600">Your unique tone, rules, and CTAs injected automatically.</p>
          </div>
        </div>

        {/* ── FAQ Section ── */}
        <div className="mt-24 text-left max-w-4xl mx-auto pb-24">
          <h2 className="text-3xl font-black text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">How does ContentSathi differ from tools like Make.com or n8n?</h3>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  While n8n and Make.com are fantastic for generic workflow automation, <strong>ContentSathi is a purpose-built, dedicated SaaS platform</strong> specifically designed for Real Estate content engines. Here is why that matters:
                </p>
                <ul className="list-disc pl-5 space-y-3">
                  <li>
                    <strong className="text-gray-900">Native Integrations:</strong> You do not need to build complex API nodes, handle data passing, or manage error-checking loops. We talk directly to the official LinkedIn, Meta, and X APIs in the background. Token encryption, formatting, and publish scheduling all happen instantly when you click &quot;Publish&quot;.
                  </li>
                  <li>
                    <strong className="text-gray-900">Hyper-Specialized AI:</strong> Generic automation tools just pass basic prompts to OpenAI. ContentSathi possesses a <em>ContentBrain</em>. It intrinsically knows your unique brand voice, your exact target audience, details about local markets (like Nagpur localities), and even tracks the Indian Festival Calendar to proactively suggest context-aware content.
                  </li>
                  <li>
                    <strong className="text-gray-900">A Complete User Experience:</strong> Automation pipelines don&apos;t have visual interfaces. With ContentSathi, you get a beautiful React UI where you can visually review, edit, and score AI-generated posts in real-time before dragging and dropping them onto an interactive Content Calendar.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
