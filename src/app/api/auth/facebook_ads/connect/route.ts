import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/utils/auth";

// Facebook Ads Manager OAuth
// Uses the same Facebook App but requests ads_management scope
export async function GET() {
  const BASE = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.redirect(`${BASE}/auth/login`);
    }

    const appId = process.env.FACEBOOK_APP_ID;
    if (!appId) {
      console.error("[FB Ads Connect] FACEBOOK_APP_ID is not set");
      return NextResponse.redirect(`${BASE}/settings?tab=accounts&error=config_error`);
    }

    const redirectUri = encodeURIComponent(`${BASE}/api/auth/facebook_ads/callback`);
    // ads_management: read/write access to ad accounts, campaigns, and insights
    const scope = encodeURIComponent(
      "ads_management,ads_read,business_management,pages_read_engagement,email"
    );

    const fbOAuthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
    return NextResponse.redirect(fbOAuthUrl);
  } catch (err: any) {
    console.error("[FB Ads Connect] Fatal:", err?.message);
    return NextResponse.redirect(`${BASE}/settings?tab=accounts&error=connect_error`);
  }
}
