import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encryptToken } from "@/lib/encryption";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code || !state) {
    const errorMsg = error === "access_denied" ? "oauth_denied" : "token_failed";
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?tab=accounts&error=${errorMsg}`);
  }

  let email = "";
  try {
    email = Buffer.from(state, "base64").toString("utf8");
  } catch {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?tab=accounts&error=invalid_state`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/youtube/callback`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    console.error("[YouTube OAuth] Token exchange failed:", tokenData);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?tab=accounts&error=token_failed`);
  }

  // Get YouTube Channel Info
  const channelRes = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
    { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
  );
  const channelData = await channelRes.json();
  const channel = channelData.items?.[0];
  const channelId = channel?.id || "";
  const channelName = channel?.snippet?.title || "My Channel";

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?tab=accounts&error=user_not_found`);

  const tokenExpiry = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000);

  const encryptedAccess = encryptToken(tokenData.access_token);
  const encryptedRefresh = tokenData.refresh_token ? encryptToken(tokenData.refresh_token) : null;

  await (prisma.socialAccount as any).upsert({
    where: { userId_platform: { userId: user.id, platform: "youtube" } },
    create: {
      userId: user.id,
      platform: "youtube",
      accessToken: encryptedAccess,
      refreshToken: encryptedRefresh,
      tokenExpiry,
      accountId: channelId,
      accountName: channelName,
    },
    update: {
      accessToken: encryptedAccess,
      refreshToken: encryptedRefresh,
      tokenExpiry,
      accountId: channelId,
      accountName: channelName,
      isActive: true,
    },
  });

  return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?tab=accounts&success=youtube`);
}
