import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const baseUrl = (process.env.NEXTAUTH_URL || "http://localhost:3000").trim();
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // base64 encoded email
  const error = searchParams.get("error");

  if (error || !code || !state) {
    const errorMsg = error === "user_cancelled_login" || error === "user_cancelled_authorize" ? "oauth_denied" : "token_failed";
    return NextResponse.redirect(`${baseUrl}/settings?tab=accounts&error=${errorMsg}`);
  }

  let email = "";
  try {
    email = Buffer.from(state, "base64").toString("utf8");
  } catch {
    return NextResponse.redirect(`${baseUrl}/settings?tab=accounts&error=invalid_state`);
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID!;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!;
  const redirectUri = `${baseUrl}/api/auth/linkedin/callback`;

  // Exchange code for token
  const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
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
    console.error("[LinkedIn OAuth] Token exchange failed:", tokenData);
    return NextResponse.redirect(`${baseUrl}/settings?tab=accounts&error=token_failed`);
  }

  // Get LinkedIn profile using modern OpenID Connect userinfo endpoint
  const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const profile = await profileRes.json();
  const accountName = profile.name || `${profile.given_name} ${profile.family_name}`.trim();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.redirect(`${baseUrl}/settings?tab=accounts&error=user_not_found`);

  const tokenExpiry = new Date(Date.now() + (tokenData.expires_in || 5184000) * 1000);

  const { encryptToken } = require("@/lib/encryption");
  const encryptedAccess = encryptToken(tokenData.access_token);
  const encryptedRefresh = tokenData.refresh_token ? encryptToken(tokenData.refresh_token) : null;

  await (prisma.socialAccount as any).upsert({
    where: { userId_platform: { userId: user.id, platform: "linkedin" } },
    create: {
      userId: user.id,
      platform: "linkedin",
      accessToken: encryptedAccess,
      refreshToken: encryptedRefresh,
      tokenExpiry,
      accountId: profile.sub,
      accountName,
    },
    update: {
      accessToken: encryptedAccess,
      refreshToken: encryptedRefresh,
      tokenExpiry,
      accountId: profile.sub,
      accountName,
      isActive: true,
    },
  });

  return NextResponse.redirect(`${baseUrl}/settings?tab=accounts&success=linkedin`);
}
