"use client";

import Link from "next/link";
import { ArrowLeft, Mail, MapPin, MessageSquare, Zap, Loader2, CheckCircle } from "lucide-react";
import { useState } from "react";

const INQUIRY_TYPES = [
  { value: "general", label: "General Inquiry" },
  { value: "sales_pricing", label: "Sales & Pricing" },
  { value: "technical", label: "Technical Support" },
  { value: "api_access", label: "API Access" },
  { value: "partnership", label: "Partnership / White-Label" },
  { value: "billing", label: "Billing / Refund" },
];

const MAX_MESSAGE_LENGTH = 300;

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", inquiryType: "general", message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const charsLeft = MAX_MESSAGE_LENGTH - form.message.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
            <Zap className="text-white fill-white" style={{ width: "1.1rem", height: "1.1rem" }} />
          </div>
          <span className="text-lg font-black text-gray-900 tracking-tighter">Contentsathi</span>
        </Link>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-16 pb-12 px-5 border-b border-gray-100">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-[1.05] tracking-tight mb-4">
            Get in <span className="text-indigo-600">Touch</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Have questions about our API, pricing, or partnerships? We&apos;ll route you to the right team.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-grow max-w-6xl mx-auto w-full px-5 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12">

        {/* Contact Info */}
        <div className="space-y-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
            <p className="text-gray-600 mb-8">
              Reach out to us directly. We typically respond within 24 hours on business days.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                <Mail className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Email Us</h3>
                <p className="text-gray-500 text-sm mt-1">For support, billing, or general inquiries.</p>
                <a href="mailto:support@contentsathi.in" className="text-indigo-600 font-semibold mt-2 inline-block hover:underline">support@contentsathi.in</a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">WhatsApp Support</h3>
                <p className="text-gray-500 text-sm mt-1">Get quick answers from our customer success team.</p>
                <a href="https://wa.me/919876543210" className="text-green-600 font-semibold mt-2 inline-block hover:underline">+91 98765 43210</a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Headquarters</h3>
                <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                  Contentsathi HQ<br />IT Park Road, South Ambazari<br />Nagpur, Maharashtra 440022<br />India
                </p>
              </div>
            </div>
          </div>

          {/* Response time info */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { type: "General & Support", time: "< 24 hours" },
              { type: "Sales & Pricing", time: "< 2 hours" },
              { type: "Technical Support", time: "< 4 hours" },
              { type: "Partnership", time: "< 48 hours" },
            ].map((item) => (
              <div key={item.type} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-wide mb-1">{item.type}</p>
                <p className="text-sm font-black text-indigo-600">{item.time}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />

          {success ? (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Message Received! 🎉</h3>
              <p className="text-gray-500 text-sm">Our team will reach out soon. You can also email us directly at <span className="text-indigo-600 font-semibold">support@contentsathi.in</span></p>
              <button onClick={() => { setSuccess(false); setForm({ name: "", email: "", phone: "", inquiryType: "general", message: "" }); }}
                className="mt-6 px-6 py-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl font-bold text-sm transition-colors">
                Send Another Message
              </button>
            </div>
          ) : (
            <>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 relative z-10">Send a Message</h3>
              <form className="space-y-5 relative z-10" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name <span className="text-red-400">*</span></label>
                    <input required type="text" maxLength={80} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all" placeholder="Rahul Sharma" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone <span className="text-gray-400 font-normal text-xs">(optional)</span></label>
                    <input type="tel" maxLength={15} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all" placeholder="+91 98765 43210" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Work Email <span className="text-red-400">*</span></label>
                  <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all" placeholder="rahul@company.com" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type of Inquiry <span className="text-red-400">*</span></label>
                  <select value={form.inquiryType} onChange={e => setForm(f => ({ ...f, inquiryType: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-gray-700">
                    {INQUIRY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Message <span className="text-red-400">*</span></label>
                    <span className={`text-xs font-bold ${charsLeft < 50 ? "text-red-500" : "text-gray-400"}`}>{charsLeft} chars left</span>
                  </div>
                  <textarea required rows={4} maxLength={MAX_MESSAGE_LENGTH} value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all resize-none"
                    placeholder="How can we help you today? (max 300 characters)" />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{error}</div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg transition-all hover:-translate-y-0.5 shadow-lg shadow-indigo-200 disabled:opacity-70 flex items-center justify-center gap-2">
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</> : "Send Message →"}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
