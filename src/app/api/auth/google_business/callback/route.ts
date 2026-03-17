import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encryptToken } from "@/lib/encryption";

export const dynamic = "force-dynamic";

// Google Business Profile OAuth Callback
export async function GET(req: Request) {
  const baseUrl = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // base64 encoded email
  const error = searchParams.get("error");

  if (error || !code || !state) {
    const errorMsg = error === "access_denied" ? "oauth_denied" : "token_exchange_failed";
    return NextResponse.redirect(`${baseUrl}/settings?tab=accounts&error=${errorMsg}`);
  }

  let email = "";
  try {
    email = Buffer.from(state, "base64").toString("utf8");
  } catch {
    return NextResponse.redirect(`${baseUrl}/settings?tab=accounts&error=invalid_state`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri = `${baseUrl}/api/auth/google_business/callback`;

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    console.error("[Google Business OAuth] Token exchange failed:", tokenData);
    return NextResponse.redirect(`${baseUrl}/settings?tab=accounts&error=token_exchange_failed`);
  }

  // Get user info
  const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const userInfo = await userInfoRes.json();

  // Try to get Business Profile info
  let businessName = userInfo.name || "Google Business Profile";
  let businessId = userInfo.id || "unknown";

  try {
    const businessRes = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );
    if (businessRes.ok) {
      const bizData = await businessRes.json();
      const firstAccount = bizData.accounts?.[0];
      if (firstAccount) {
        businessName = firstAccount.accountName || businessName;
        businessId = firstAccount.name?.split("/").pop() || businessId;
      }
    }
  } catch {
    // business profile API might not be available — still save the connection
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.redirect(`${baseUrl}/settings?tab=accounts&error=user_not_found`);

  const tokenExpiry = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000)
    : new Date(Date.now() + 3600 * 1000);

  let encryptedAccess, encryptedRefresh;
  try {
    encryptedAccess = encryptToken(tokenData.access_token);
    encryptedRefresh = tokenData.refresh_token ? encryptToken(tokenData.refresh_token) : null;
  } catch (err) {
    console.error("[Google Business OAuth] Encryption failed:", err);
    return NextResponse.redirect(`${baseUrl}/settings?tab=accounts&error=encryption_failed`);
  }

  await (prisma.socialAccount as any).upsert({
    where: { userId_platform: { userId: user.id, platform: "google_business" } },
    create: {
      userId: user.id,
      platform: "google_business",
      accessToken: encryptedAccess,
      refreshToken: encryptedRefresh,
      tokenExpiry,
      accountId: businessId,
      accountName: businessName,
      isActive: true,
    },
    update: {
      accessToken: encryptedAccess,
      refreshToken: encryptedRefresh,
      tokenExpiry,
      accountId: businessId,
      accountName: businessName,
      isActive: true,
    },
  });

  return NextResponse.redirect(`${baseUrl}/settings?tab=accounts&success=google_business`);
}
