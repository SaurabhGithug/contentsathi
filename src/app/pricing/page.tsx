"use client";

import { useState } from "react";

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <div className="p-8 max-w-7xl mx-auto py-16 animation-fade-in">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h1>
        <p className="text-xl text-gray-500 mb-8">Choose the plan that best fits your content needs.</p>
        
        <div className="inline-flex bg-gray-100 p-1 rounded-xl">
          <button 
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${!isYearly ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
            onClick={() => setIsYearly(false)}
          >
            Monthly
          </button>
          <button 
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${isYearly ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
            onClick={() => setIsYearly(true)}
          >
            Yearly <span className="text-green-600 text-xs ml-1 font-bold">— Save 2 months</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 items-start">
        {/* FREE */}
        <div className="bg-white rounded-3xl border p-8 shadow-sm h-full flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-2">FREE</h3>
          <div className="text-3xl font-bold mb-6">₹0<span className="text-gray-500 text-sm font-normal">/month forever</span></div>
          <ul className="space-y-4 mb-8 flex-grow">
            <li className="flex items-start text-sm text-gray-600"><span className="text-green-500 mr-2">✓</span>100 credits/month</li>
            <li className="flex items-start text-sm text-gray-600"><span className="text-green-500 mr-2">✓</span>2 social accounts</li>
            <li className="flex items-start text-sm text-gray-600"><span className="text-green-500 mr-2">✓</span>Instagram + LinkedIn only</li>
          </ul>
          <button className="w-full py-6 rounded-xl font-bold border border-gray-200 hover:bg-gray-50 transition-all">Start Free</button>
        </div>

        {/* STARTER */}
        <div className="bg-white rounded-3xl border p-8 shadow-sm h-full flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-2">STARTER</h3>
          <div className="text-3xl font-bold mb-6">₹{isYearly ? "7,990" : "799"}<span className="text-gray-500 text-sm font-normal">/{isYearly ? "year" : "month"}</span></div>
          <ul className="space-y-4 mb-8 flex-grow">
            <li className="flex items-start text-sm text-gray-600"><span className="text-green-500 mr-2">✓</span>1,500 credits/month</li>
            <li className="flex items-start text-sm text-gray-600"><span className="text-green-500 mr-2">✓</span>5 social accounts</li>
            <li className="flex items-start text-sm text-gray-600"><span className="text-green-500 mr-2">✓</span>All platforms</li>
            <li className="flex items-start text-sm text-gray-600"><span className="text-green-500 mr-2">✓</span>YouTube Research</li>
            <li className="flex items-start text-sm text-gray-600"><span className="text-green-500 mr-2">✓</span>WhatsApp Broadcast</li>
            <li className="flex items-start text-sm text-gray-600"><span className="text-green-500 mr-2">✓</span>Analytics</li>
          </ul>
          <button className="w-full py-6 rounded-xl font-bold border border-purple-200 text-purple-700 hover:bg-purple-50 transition-all">Start 7-Day Trial</button>
        </div>

        {/* CREATOR */}
        <div className="bg-purple-900 text-white rounded-3xl p-8 shadow-xl relative transform lg:-translate-y-4 h-full flex flex-col border border-purple-700">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-md">
            Most Popular
          </div>
          <h3 className="text-lg font-bold mb-2">CREATOR</h3>
          <div className="text-3xl font-bold mb-6">₹{isYearly ? "19,990" : "1,999"}<span className="text-purple-300 text-sm font-normal">/{isYearly ? "year" : "month"}</span></div>
          <ul className="space-y-4 mb-8 flex-grow">
            <li className="flex items-start text-sm text-purple-100"><span className="text-pink-400 mr-2">✓</span>5,000 credits/month</li>
            <li className="flex items-start text-sm text-purple-100"><span className="text-pink-400 mr-2">✓</span>10 social accounts</li>
            <li className="flex items-start text-sm text-purple-100"><span className="text-pink-400 mr-2">✓</span>Everything in Starter</li>
            <li className="flex items-start text-sm text-purple-100"><span className="text-pink-400 mr-2">✓</span>Website Blocks</li>
            <li className="flex items-start text-sm text-purple-100"><span className="text-pink-400 mr-2">✓</span>Unlimited templates</li>
            <li className="flex items-start text-sm text-purple-100"><span className="text-pink-400 mr-2">✓</span>Priority support</li>
          </ul>
          <button className="w-full py-6 rounded-xl font-bold bg-white text-purple-900 hover:bg-gray-100">Start 7-Day Trial</button>
        </div>

        {/* AGENCY */}
        <div className="bg-white rounded-3xl border p-8 shadow-sm h-full flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-2">AGENCY</h3>
          <div className="text-3xl font-bold mb-6">₹{isYearly ? "49,990" : "4,999"}<span className="text-gray-500 text-sm font-normal">/{isYearly ? "year" : "month"}</span></div>
          <ul className="space-y-4 mb-8 flex-grow">
            <li className="flex items-start text-sm text-gray-600"><span className="text-green-500 mr-2">✓</span>Unlimited credits</li>
            <li className="flex items-start text-sm text-gray-600"><span className="text-green-500 mr-2">✓</span>Unlimited accounts</li>
            <li className="flex items-start text-sm text-gray-600"><span className="text-green-500 mr-2">✓</span>5 team members</li>
            <li className="flex items-start text-sm text-gray-600"><span className="text-green-500 mr-2">✓</span>White label</li>
            <li className="flex items-start text-sm text-gray-600"><span className="text-green-500 mr-2">✓</span>API access</li>
            <li className="flex items-start text-sm text-gray-600"><span className="text-green-500 mr-2">✓</span>1-on-1 onboarding</li>
          </ul>
          <button className="w-full py-6 rounded-xl font-bold border border-gray-200 hover:bg-gray-50 transition-all">Book a Demo</button>
        </div>
      </div>

      <p className="text-center text-sm text-gray-500 mb-16">
        + 18% GST applicable for Indian customers
      </p>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto border-t pt-16">
        <h2 className="text-2xl font-bold text-center mb-10">Frequently Asked Questions</h2>
        
        <div className="space-y-8">
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">What is a credit?</h4>
            <p className="text-gray-600 leading-relaxed">
              One credit = one AI action. Generating a full week campaign = 10 credits. Publishing to one platform = 1 credit. New users get 100 free credits — no card needed.
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">Do you support UPI and Indian payments?</h4>
            <p className="text-gray-600 leading-relaxed">
              Yes. We use Razorpay — UPI, Net Banking, Credit/Debit cards, and EMI all supported.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
