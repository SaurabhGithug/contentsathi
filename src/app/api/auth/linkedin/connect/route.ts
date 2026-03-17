import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const BASE = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.redirect(`${BASE}/auth/login`);
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID;
    if (!clientId) {
      console.error("[LinkedIn Connect] LINKEDIN_CLIENT_ID is not set");
      return NextResponse.redirect(`${BASE}/settings?tab=accounts&error=config_error`);
    }

    const redirectUri = encodeURIComponent(`${BASE}/api/auth/linkedin/callback`);
    const scope = encodeURIComponent("openid profile email w_member_social");
    const state = Buffer.from(session.user.email).toString("base64");

    const linkedinOAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}`;
    return NextResponse.redirect(linkedinOAuthUrl);
  } catch (err: any) {
    console.error("[LinkedIn Connect] Fatal:", err?.message);
    return NextResponse.redirect(`${BASE}/settings?tab=accounts&error=connect_error`);
  }
}
