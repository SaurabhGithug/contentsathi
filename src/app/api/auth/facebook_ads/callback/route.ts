import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/utils/auth";
import { prisma } from "@/lib/db/prisma";
import { encryptToken } from "@/lib/utils/encryption";

export const dynamic = "force-dynamic";

// Facebook Ads Manager OAuth Callback
export async function GET(req: Request) {
  const baseUrl = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    const errorMsg = error === "access_denied" ? "oauth_denied" : "token_exchange_failed";
    return NextResponse.redirect(`${baseUrl}/settings?tab=accounts&error=${errorMsg}`);
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.redirect(`${baseUrl}/auth/login`);
  }

  const appId = process.env.FACEBOOK_APP_ID!;
  const appSecret = process.env.FACEBOOK_APP_SECRET!;
  const redirectUri = `${baseUrl}/api/auth/facebook_ads/callback`;

  // Exchange code for short-lived token
  const tokenRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
  );
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    console.error("[FB Ads OAuth] Token exchange failed:", tokenData);
    return NextResponse.redirect(`${baseUrl}/settings?tab=accounts&error=token_exchange_failed`);
  }

  // Exchange for long-lived token
  const longLivedRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`
  );
  const longLivedData = await longLivedRes.json();
  const accessToken = longLivedData.access_token || tokenData.access_token;
  const expiresIn = longLivedData.expires_in || 5183944;

  // Fetch user's Ad Accounts
  const adAccountsRes = await fetch(
    `https://graph.facebook.com/v19.0/me/adaccounts?fields=account_id,name,account_status&access_token=${accessToken}`
  );
  const adAccountsData = await adAccountsRes.json();
  const primaryAccount = adAccountsData.data?.[0];
  const accountId = primaryAccount?.account_id || "unknown";
  const accountName = primaryAccount?.name || "Meta Ads Manager";

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.redirect(`${baseUrl}/settings?tab=accounts&error=user_not_found`);

  const tokenExpiry = new Date(Date.now() + expiresIn * 1000);
  let encryptedToken;
  try {
    encryptedToken = encryptToken(accessToken);
  } catch (err) {
    console.error("[FB Ads OAuth] Encryption failed:", err);
    return NextResponse.redirect(`${baseUrl}/settings?tab=accounts&error=encryption_failed`);
  }

  await (prisma.socialAccount as any).upsert({
    where: { userId_platform: { userId: user.id, platform: "facebook_ads" } },
    create: {
      userId: user.id,
      platform: "facebook_ads",
      accessToken: encryptedToken,
      tokenExpiry,
      accountId,
      accountName,
    },
    update: {
      accessToken: encryptedToken,
      tokenExpiry,
      accountId,
      accountName,
      isActive: true,
    },
  });

  return NextResponse.redirect(`${baseUrl}/settings?tab=accounts&success=facebook_ads`);
}
