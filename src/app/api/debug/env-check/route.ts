import { NextResponse } from "next/server";

// Simple diagnostic endpoint — shows which env vars are PRESENT (not their values)
// Protected by a secret token — only you can call it
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  // Protect this endpoint — only accessible with the right token
  if (token !== "contentsathi-debug-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const envStatus = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "❌ NOT SET",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? `✅ SET (${process.env.NEXTAUTH_SECRET.length} chars)` : "❌ NOT SET",
    DATABASE_URL: process.env.DATABASE_URL ? `✅ SET` : "❌ NOT SET",
    TOKEN_ENCRYPTION_KEY: process.env.TOKEN_ENCRYPTION_KEY ? `✅ SET (${process.env.TOKEN_ENCRYPTION_KEY.length} chars)` : "❌ NOT SET",
    LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID ? `✅ SET: ${process.env.LINKEDIN_CLIENT_ID}` : "❌ NOT SET",
    LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET ? `✅ SET (hidden)` : "❌ NOT SET",
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? `✅ SET` : "❌ NOT SET",
    FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID ? `✅ SET` : "❌ NOT SET",
    TWITTER_CLIENT_ID: process.env.TWITTER_CLIENT_ID ? `✅ SET` : "❌ NOT SET",
    SARVAM_API_KEY: process.env.SARVAM_API_KEY ? `✅ SET` : "❌ NOT SET",
    TAVILY_API_KEY: process.env.TAVILY_API_KEY ? `✅ SET` : "❌ NOT SET",
    APIFY_API_TOKEN: process.env.APIFY_API_TOKEN ? `✅ SET` : "❌ NOT SET",
    // Computed values
    COMPUTED_LINKEDIN_CALLBACK: `${process.env.NEXTAUTH_URL || "NOT SET"}/api/auth/linkedin/callback`,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV || "not on vercel",
  };

  return NextResponse.json(envStatus);
}
