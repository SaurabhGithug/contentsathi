"use client";

import Link from "next/link";
import { ArrowLeft, Brain, Cpu, Globe, Heart, Shield, Zap } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
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
      <section className="relative bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-20 pb-16 px-5 overflow-hidden border-b border-gray-100">
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 leading-[1.05] tracking-tight mb-6">
            Our Mission is to <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Empower Every Indian Creator</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            We believe that language should never be a barrier to success. Contentsathi is built to give Indian businesses, real estate professionals, and solopreneurs a world-class AI engine that understands them natively.
          </p>
        </div>
      </section>

      {/* Content Section */}
      <main className="flex-grow max-w-5xl mx-auto w-full px-5 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-24">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Built for India, from the Ground Up.</h2>
            <p className="text-gray-600 leading-relaxed text-lg">
              Most AI tools are built for the West and translated poorly into Indian languages.
              We saw real estate agents struggling to write convincing Marathi property descriptions, and fitness coaches spending hours perfecting their Hinglish tone.
            </p>
            <p className="text-gray-600 leading-relaxed text-lg">
              That&apos;s why we built Contentsathi. By combining the reasoning power of Gemini with the native Indic capabilities of Sarvam AI, we&apos;ve created an engine that writes exactly how Indians speak, think, and sell.
            </p>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-3xl blur-2xl opacity-20 transform rotate-3" />
            <div className="bg-white border text-center border-gray-100 p-8 rounded-3xl shadow-xl relative z-10">
               <Globe className="w-16 h-16 text-indigo-500 mx-auto mb-6 opacity-80" />
               <h3 className="font-black text-2xl text-gray-900 mb-2">1.4 Billion Voices</h3>
               <p className="text-gray-500 font-medium">One platform to reach them all authentically.</p>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-4">Our Core Values</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Heart, title: "Authenticity", desc: "No robotic translations. Real, colloquial language that connects with local audiences." },
            { icon: Cpu, title: "Innovation", desc: "Using hybrid AI architectures to give you the best of global reasoning and local fluency." },
            { icon: Shield, title: "Privacy First", desc: "Your data is yours. We encrypt your tokens and never train on your proprietary content." },
          ].map((v, i) => (
            <div key={i} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-6">
                <v.icon className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{v.title}</h3>
              <p className="text-gray-600 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* CTA */}
      <section className="bg-gray-900 py-20 px-5 text-center">
        <h2 className="text-3xl font-bold text-white mb-6">Ready to scale your content?</h2>
        <Link href="/auth/register" className="inline-flex items-center justify-center px-8 py-4 bg-indigo-500 hover:bg-indigo-400 text-white rounded-full font-bold text-lg transition-all shadow-lg shadow-indigo-500/30">
          Get Started for Free
        </Link>
      </section>
    </div>
  );
}
