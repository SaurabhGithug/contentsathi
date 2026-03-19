import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/utils/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";

// ── Instagram OAuth Connect ──────────────────────────────────────────────────
// Initiates the OAuth flow to get initial tokens from Facebook/Instagram.
// Requires in .env:
//   FACEBOOK_APP_ID=your_app_id
//   FACEBOOK_APP_SECRET=your_app_secret
//   NEXTAUTH_URL=http://localhost:3000

export async function GET() {
  const BASE = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.redirect(`${BASE}/auth/login`);
  }

  const appId = process.env.FACEBOOK_APP_ID;
  const redirectUri = encodeURIComponent(
    `${process.env.NEXTAUTH_URL}/api/auth/instagram/callback`
  );
  const scope = encodeURIComponent(
    "instagram_basic,instagram_content_publish,pages_manage_posts,pages_read_engagement"
  );

  const fbOAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;

  return NextResponse.redirect(fbOAuthUrl);
}
