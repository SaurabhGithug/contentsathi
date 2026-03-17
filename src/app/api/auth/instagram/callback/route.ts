import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptToken } from "@/lib/encryption";

// ── Instagram OAuth Callback ─────────────────────────────────────────────────
// Facebook redirects here with ?code=... after user approves the OAuth dialog.

export const dynamic = "force-dynamic";

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
  const redirectUri = `${baseUrl}/api/auth/instagram/callback`;

  // Exchange code for short-lived token
  const tokenRes = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
  );
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    console.error("[Instagram OAuth] Token exchange failed:", tokenData);
    return NextResponse.redirect(`${baseUrl}/settings?tab=accounts&error=token_exchange_failed`);
  }

  // Exchange for long-lived token (60 days)
  const longLivedRes = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`
  );
  const longLivedData = await longLivedRes.json();
  const accessToken = longLivedData.access_token || tokenData.access_token;
  const expiresIn = longLivedData.expires_in || 5183944; // 60 days

  // Get FB user's pages (Instagram is linked to a Page)
  const pagesRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`);
  const pagesData = await pagesRes.json();
  const page = pagesData.data?.[0];

  let igAccountId = "";
  let igAccountName = "";
  let pageId = page?.id || "";

  if (page) {
    // Get linked Instagram Business Account
    const igRes = await fetch(
      `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token || accessToken}`
    );
    const igData = await igRes.json();
    igAccountId = igData.instagram_business_account?.id || "";

    if (igAccountId) {
      const igUserRes = await fetch(
        `https://graph.facebook.com/v18.0/${igAccountId}?fields=name,username&access_token=${accessToken}`
      );
      const igUser = await igUserRes.json();
      igAccountName = igUser.username || igUser.name || igAccountId;
    }
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.redirect(`${baseUrl}/settings?tab=accounts&error=user_not_found`);

  const tokenExpiry = new Date(Date.now() + expiresIn * 1000);

  let encryptedToken;
  try {
    encryptedToken = encryptToken(accessToken);
  } catch (err) {
    console.error("[Instagram OAuth] Encryption failed:", err);
    return NextResponse.redirect(`${baseUrl}/settings?tab=accounts&error=encryption_failed`);
  }

  await (prisma.socialAccount as any).upsert({
    where: { userId_platform: { userId: user.id, platform: "instagram" } },
    create: {
      userId: user.id,
      platform: "instagram",
      accessToken: encryptedToken,
      tokenExpiry,
      accountId: igAccountId,
      accountName: igAccountName,
      pageId,
    },
    update: {
      accessToken: encryptedToken,
      tokenExpiry,
      accountId: igAccountId,
      accountName: igAccountName,
      pageId,
      isActive: true,
    },
  });

  return NextResponse.redirect(`${baseUrl}/settings?tab=accounts&success=instagram`);
}
