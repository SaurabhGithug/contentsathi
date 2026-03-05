"use client";

import Link from "next/link";
import { ArrowLeft, Shield, Zap } from "lucide-react";

export default function PrivacyPage() {
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
      <section className="bg-gradient-to-br from-gray-900 to-indigo-950 text-white pt-20 pb-20 px-5 text-center relative overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <Shield className="w-16 h-16 text-indigo-400 mx-auto mb-6 opacity-90" />
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 relative z-10">Privacy Policy</h1>
        <p className="text-indigo-200 text-lg max-w-xl mx-auto relative z-10">
          Last updated: October 1, 2026. <br />We respect your privacy and are committed to protecting it.
        </p>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto w-full px-5 py-16">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-200 prose prose-indigo max-w-none">
          <h3>1. Information We Collect</h3>
          <p>We only collect the information necessary to provide you with the best experience on Contentsathi. This includes:</p>
          <ul>
            <li><strong>Account Information:</strong> Name, email address, password, and basic profile details.</li>
            <li><strong>OAuth Tokens:</strong> Encrypted access tokens from platforms you connect (Instagram, LinkedIn, YouTube, etc.).</li>
            <li><strong>Usage Data:</strong> Anonymised analytics on how you use our generation tools.</li>
          </ul>

          <h3>2. How We Use Your Data</h3>
          <p>Your data is used strictly to enhance your experience:</p>
          <ul>
            <li>To generate personalized, high-quality AI content.</li>
            <li>To publish content directly to your connected social channels.</li>
            <li>To manage your subscription and billing (processed securely via Razorpay).</li>
          </ul>
          
          <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 my-8 rounded-r-xl">
             <strong>A Note on AI Training:</strong> We <em>never</em> use your proprietary content, generated posts, or connected accounts to train our internal AI models, nor do we sell your data to third-party data brokers.
          </div>

          <h3>3. Data Security</h3>
          <p>We use state-of-the-art security measures to protect your data. All OAuth tokens are encrypted using AES-256 before being stored in our database. Web traffic is secured via HTTPS/SSL. Our infrastructure is hosted on secure AWS servers located in the Mumbai region to ensure data sovereignty.</p>

          <h3>4. Third-Party Services</h3>
          <p>Contentsathi integrates with third-party APIs including Google Gemini, Sarvam AI, Meta (Facebook/Instagram/WhatsApp), X, and LinkedIn. When you authorise these integrations, we securely pass data necessary to perform the requested actions (e.g., publishing a post or creating a lead).</p>

          <h3>5. Deleting Your Account</h3>
          <p>You own your data. You can delete your account at any time from your settings page. Deleting your account will immediately remove all your content, encrypted tokens, and personal information from our active databases.</p>

          <h3>6. Contact Us</h3>
          <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@contentsathi.com" className="text-indigo-600 font-medium">privacy@contentsathi.com</a>.</p>
        </div>
      </main>
    </div>
  );
}
