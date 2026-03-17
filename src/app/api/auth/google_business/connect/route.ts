import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Google Business Profile OAuth
// Uses Google OAuth with business.manage scope
export async function GET() {
  const BASE = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.redirect(`${BASE}/auth/login`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error("[Google Business Connect] GOOGLE_CLIENT_ID is not set");
      return NextResponse.redirect(`${BASE}/settings?tab=accounts&error=config_error`);
    }

    const redirectUri = encodeURIComponent(`${BASE}/api/auth/google_business/callback`);
    const scope = encodeURIComponent(
      "https://www.googleapis.com/auth/business.manage https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email"
    );
    const state = Buffer.from(session.user.email).toString("base64");

    const googleOAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}&access_type=offline&prompt=consent`;
    return NextResponse.redirect(googleOAuthUrl);
  } catch (err: any) {
    console.error("[Google Business Connect] Fatal:", err?.message);
    return NextResponse.redirect(`${BASE}/settings?tab=accounts&error=connect_error`);
  }
}
