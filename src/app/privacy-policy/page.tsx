"use client";

import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPolicyPage() {
  const lastUpdated = "March 17, 2026";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center">
            <Shield className="w-7 h-7 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-gray-500 font-medium mt-1">
              Last updated: {lastUpdated}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-12 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">
              1. Introduction
            </h2>
            <p className="text-gray-600 leading-relaxed">
              ContentSathi (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;)
              operates the ContentSathi platform (the &quot;Service&quot;). This
              Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you use our Service, including when
              you connect third-party social media accounts such as LinkedIn,
              Instagram, YouTube, and X (Twitter).
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">
              2. Information We Collect
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-gray-800 mb-2">
                  2.1 Account Information
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  When you create an account, we collect your name, email
                  address, and profile picture through your chosen
                  authentication provider (e.g., Google).
                </p>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800 mb-2">
                  2.2 Social Media Account Data
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  When you connect social media accounts (LinkedIn, Instagram,
                  YouTube, X/Twitter), we collect and securely store OAuth
                  access tokens, your social media profile name, and account
                  identifiers. We do <strong>not</strong> store your social
                  media passwords. All tokens are encrypted using
                  industry-standard AES-256 encryption before storage.
                </p>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800 mb-2">
                  2.3 Content Data
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  We store content you create using our AI tools, including
                  generated text, image prompts, publishing schedules,
                  analytics data, and brand configuration details you provide
                  during onboarding.
                </p>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800 mb-2">
                  2.4 Usage Data
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  We automatically collect information about how you interact
                  with the Service, including pages visited, features used,
                  timestamps, and device/browser information.
                </p>
              </div>
            </div>
          </section>

          {/* How We Use Information */}
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">
              3. How We Use Your Information
            </h2>
            <ul className="space-y-2 text-gray-600">
              {[
                "To provide, maintain, and improve the Service",
                "To generate and publish content on your connected social media accounts on your behalf",
                "To personalize your content strategy using your brand profile and market intelligence",
                "To process payments and manage subscriptions",
                "To send transactional communications (e.g., payment confirmations, security alerts)",
                "To detect, prevent, and address technical issues and security threats",
                "To comply with legal obligations",
              ].map((item, i) => (
                <li key={i} className="flex gap-2 items-start">
                  <span className="text-indigo-400 mt-0.5 shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">
              4. Third-Party Services
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We integrate with the following third-party services and platforms.
              Each has its own privacy policy governing their use of your data:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  name: "LinkedIn",
                  use: "Content publishing and account connection",
                },
                {
                  name: "Instagram / Meta",
                  use: "Content publishing via Facebook Pages",
                },
                { name: "YouTube / Google", use: "Video publishing" },
                { name: "X (Twitter)", use: "Content publishing" },
                { name: "Google Gemini AI", use: "AI content generation" },
                { name: "Razorpay", use: "Payment processing" },
                { name: "Vercel", use: "Cloud hosting and deployment" },
                { name: "Neon (PostgreSQL)", use: "Database hosting" },
              ].map((svc, i) => (
                <div
                  key={i}
                  className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100"
                >
                  <p className="text-sm font-bold text-gray-900">{svc.name}</p>
                  <p className="text-xs text-gray-500">{svc.use}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">
              5. Data Security
            </h2>
            <p className="text-gray-600 leading-relaxed">
              We implement industry-standard security measures to protect your
              personal information, including:
            </p>
            <ul className="space-y-2 text-gray-600 mt-3">
              {[
                "AES-256 encryption for all OAuth tokens at rest",
                "HTTPS/TLS encryption for all data in transit",
                "Secure session management using NextAuth.js with JWT tokens",
                "Environment-level secret isolation on Vercel",
                "Rate limiting and abuse protection on all API endpoints",
              ].map((item, i) => (
                <li key={i} className="flex gap-2 items-start">
                  <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">
              6. Data Retention
            </h2>
            <p className="text-gray-600 leading-relaxed">
              We retain your personal data for as long as your account is
              active or as needed to provide you the Service. You may request
              deletion of your account and all associated data at any time by
              contacting us. Upon deletion, we will remove your data within 30
              days, except where retention is required by law.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">
              7. Your Rights
            </h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              Depending on your jurisdiction, you may have the following rights:
            </p>
            <ul className="space-y-2 text-gray-600">
              {[
                "Access: Request a copy of your personal data",
                "Correction: Request correction of inaccurate data",
                "Deletion: Request deletion of your data",
                "Portability: Request your data in a portable format",
                "Revocation: Disconnect any connected social media account at any time from Settings",
                "Objection: Object to processing of your data for specific purposes",
              ].map((item, i) => (
                <li key={i} className="flex gap-2 items-start">
                  <span className="text-indigo-400 mt-0.5 shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">
              8. Cookies
            </h2>
            <p className="text-gray-600 leading-relaxed">
              We use essential cookies for authentication and session management.
              We do not use third-party tracking or advertising cookies. The
              session cookie is required for the Service to function and is
              automatically managed by our authentication system.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">
              9. Children&apos;s Privacy
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Our Service is not intended for individuals under the age of 18. We
              do not knowingly collect personal information from children. If we
              become aware that we have collected data from a child, we will take
              steps to delete it promptly.
            </p>
          </section>

          {/* Changes to This Policy */}
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">
              10. Changes to This Policy
            </h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this Privacy Policy from time to time. We will
              notify you of any material changes by posting the new policy on
              this page and updating the &quot;Last updated&quot; date. Your
              continued use of the Service after changes constitutes acceptance
              of the updated policy.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">
              11. Contact Us
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              If you have any questions about this Privacy Policy or our data
              practices, please contact us at:
            </p>
            <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
              <p className="font-bold text-gray-900">ContentSathi</p>
              <p className="text-gray-600 text-sm mt-1">
                Email:{" "}
                <a
                  href="mailto:dangalesaurabh1996@gmail.com"
                  className="text-indigo-600 underline underline-offset-2"
                >
                  dangalesaurabh1996@gmail.com
                </a>
              </p>
              <p className="text-gray-600 text-sm mt-1">
                Website:{" "}
                <a
                  href="https://contentsathi.vercel.app"
                  className="text-indigo-600 underline underline-offset-2"
                >
                  https://contentsathi.vercel.app
                </a>
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-400 font-medium">
          © {new Date().getFullYear()} ContentSathi. All rights reserved.
        </div>
      </div>
    </div>
  );
}
