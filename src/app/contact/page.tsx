"use client";

import Link from "next/link";
import { ArrowLeft, Mail, MapPin, MessageSquare, Phone, Zap } from "lucide-react";

export default function ContactPage() {
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
      <section className="relative bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-16 pb-12 px-5 border-b border-gray-100">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-[1.05] tracking-tight mb-4">
            Get in <span className="text-indigo-600">Touch</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Have questions about our API, pricing, or need custom white-label solutions? We&apos;re here to help.
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
              Reach out to us directly through any of these channels. We typically respond within 24 hours on business days.
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
                 <a href="mailto:support@contentsathi.com" className="text-indigo-600 font-semibold mt-2 inline-block hover:underline">support@contentsathi.com</a>
               </div>
             </div>

             <div className="flex items-start gap-4">
               <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                 <MessageSquare className="w-6 h-6 text-green-600" />
               </div>
               <div>
                 <h3 className="font-bold text-gray-900">WhatsApp Support</h3>
                 <p className="text-gray-500 text-sm mt-1">Get quick answers from our customer success team.</p>
                 <a href="#" className="text-green-600 font-semibold mt-2 inline-block hover:underline">+91 98765 43210</a>
               </div>
             </div>

             <div className="flex items-start gap-4">
               <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center shrink-0">
                 <MapPin className="w-6 h-6 text-violet-600" />
               </div>
               <div>
                 <h3 className="font-bold text-gray-900">Headquarters</h3>
                 <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                   Contentsathi HQ<br/>
                   IT Park Road, South Ambazari<br/>
                   Nagpur, Maharashtra 440022<br/>
                   India
                 </p>
               </div>
             </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl font-bold" />
          <h3 className="text-2xl font-bold text-gray-900 mb-6 relative z-10">Send a Message</h3>
          
          <form className="space-y-5 relative z-10" onSubmit={(e) => { e.preventDefault(); alert("Thanks for reaching out! We will contact you soon."); }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">First Name</label>
                <input required type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all" placeholder="Rahul" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Last Name</label>
                <input required type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all" placeholder="Sharma" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Work Email</label>
              <input required type="email" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all" placeholder="rahul@company.com" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subject</label>
              <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-gray-700">
                <option>General Inquiry</option>
                <option>Sales & Pricing</option>
                <option>Technical Support</option>
                <option>API Access</option>
                <option>Partnership</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message</label>
              <textarea required rows={4} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all resize-none" placeholder="How can we help you today?"></textarea>
            </div>

            <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg transition-transform hover:-translate-y-0.5 shadow-lg shadow-indigo-200">
              Send Message
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}
