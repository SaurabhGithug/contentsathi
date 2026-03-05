"use client";

import Link from "next/link";
import { ArrowLeft, FileText, Zap } from "lucide-react";

export default function TermsPage() {
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
      <section className="bg-gradient-to-br from-indigo-50 to-indigo-100 pt-20 pb-20 px-5 text-center relative border-b border-indigo-100">
        <FileText className="w-16 h-16 text-indigo-500 mx-auto mb-6 opacity-90" />
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-gray-900">Terms of Service</h1>
        <p className="text-gray-600 text-lg max-w-xl mx-auto">
          Please read these terms carefully before using Contentsathi. By using our platform, you agree to these legal obligations.
        </p>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto w-full px-5 py-16">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-200 prose prose-indigo max-w-none">
          <h3>1. Acceptance of Terms</h3>
          <p>By accessing and using Contentsathi (&quot;the Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. In addition, when using this Service&apos;s particular services, you shall be subject to any posted guidelines or rules applicable to such services.</p>

          <h3>2. Description of Service</h3>
          <p>Contentsathi provides AI-powered content generation, scheduling, and direct publishing to social media platforms via an automated Software as a Service (SaaS) platform, specifically tuned for Indian users, creators, and real estate professionals.</p>

          <h3>3. Subscription and Billing</h3>
          <ul>
            <li>We offer both Free and Premium tiers.</li>
            <li>Premium subscriptions (Starter, Creator, Agency) are billed strictly through our payment processor (Razorpay) on a monthly or annual basis based on the plan selected.</li>
            <li>There are no refunds for partial months of service.</li>
            <li>You may cancel your subscription at any time; access will continue until the end of your current billing cycle.</li>
          </ul>

          <h3>4. User Responsibilities & Content Liability</h3>
          <p>You are solely responsible for all content, data, and information you generate or publish via Contentsathi. While we filter inputs, we do not verify the factual accuracy of AI-generated content. You must review all content prior to publishing.</p>
          <p><strong>Prohibited Conduct:</strong> You agree not to use Contentsathi to generate illegal, strictly restricted, deceptive, spam, or abusive content.</p>

          <h3>5. Account Termination</h3>
          <p>We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>

          <h3>6. AI Service Partners</h3>
          <p>Our Service utilises underlying APIs from providers such as Google (Gemini) and Sarvam AI. Availability of these tools is subject to their absolute uptime. We do not claim ownership of the AI models themselves.</p>

          <h3>7. Modifications to Terms</h3>
          <p>We reserve the right to modify these terms from time to time at our sole discretion. Your continued use of the website or our service after any such change constitutes your acceptance of the new Terms of Service.</p>
          
          <hr />
          <p className="text-sm text-gray-500">Contact legal@contentsathi.com for any queries.</p>
        </div>
      </main>
    </div>
  );
}
