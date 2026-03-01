import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pendingVerifiers } from "@/app/api/auth/x/connect/route";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?tab=accounts&error=oauth_denied`);
  }

  const codeVerifier = pendingVerifiers.get(state);
  if (!codeVerifier) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?tab=accounts&error=session_expired`);
  }
  pendingVerifiers.delete(state);

  let email = "";
  try {
    email = Buffer.from(state, "base64url").toString("utf8");
  } catch {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?tab=accounts&error=invalid_state`);
  }

  const clientId = process.env.TWITTER_CLIENT_ID!;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET!;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/x/callback`;

  const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });
  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?tab=accounts&error=token_failed`);
  }

  // Get Twitter user info
  const userRes = await fetch("https://api.twitter.com/2/users/me", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const userData = await userRes.json();
  const twitterUser = userData.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?tab=accounts&error=user_not_found`);

  const tokenExpiry = new Date(Date.now() + (tokenData.expires_in || 7200) * 1000);

  const { encryptToken } = require("@/lib/encryption");
  const encryptedAccess = encryptToken(tokenData.access_token);
  const encryptedRefresh = tokenData.refresh_token ? encryptToken(tokenData.refresh_token) : null;

  await (prisma.socialAccount as any).upsert({
    where: { userId_platform: { userId: user.id, platform: "x" } },
    create: {
      userId: user.id,
      platform: "x",
      accessToken: encryptedAccess,
      refreshToken: encryptedRefresh,
      tokenExpiry,
      accountId: twitterUser?.id || "",
      accountName: `@${twitterUser?.username || ""}`,
    },
    update: {
      accessToken: encryptedAccess,
      refreshToken: encryptedRefresh,
      tokenExpiry,
      accountId: twitterUser?.id || "",
      accountName: `@${twitterUser?.username || ""}`,
      isActive: true,
    },
  });

  return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?tab=accounts&success=x`);
}
