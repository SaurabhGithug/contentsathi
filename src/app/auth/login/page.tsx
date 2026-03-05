"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const urlError = searchParams.get("error");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(urlError ? "Security session expired. Please sign in again." : "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent, isDemo = false) => {
    if (e) e.preventDefault();
    setError("");
    setLoading(true);

    const loginEmail = isDemo ? "demo@contentsathi.com" : email.trim().toLowerCase();
    const loginPassword = isDemo ? "demo" : password;

    if (!loginEmail || !loginPassword) {
      setError("Please enter your email and password, or use the 1-Click login.");
      setLoading(false);
      return;
    }

    const res = await signIn("credentials", {
      redirect: false,
      email: loginEmail,
      password: loginPassword,
      callbackUrl,
    });

    if (res?.error) {
      setLoading(false);
      setError("Invalid email or password. Please try again.");
    } else {
      window.location.href = callbackUrl;
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">Welcome back</h1>
        <p className="text-gray-500 mt-2 text-sm">Sign in to your Contentsathi account</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative">
        <button
          onClick={() => handleSubmit(undefined, true)}
          disabled={loading}
          type="button"
          className="w-full mb-6 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-bold transition-all shadow-md hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "⚡ 1-Click Fast Login (Demo)"}
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-400 font-semibold tracking-wider">Or use credentials</span>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <Link
                href="/auth/forgot-password"
                className="text-xs text-indigo-600 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In Manually"}
          </button>


        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="text-indigo-600 font-semibold hover:underline">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
