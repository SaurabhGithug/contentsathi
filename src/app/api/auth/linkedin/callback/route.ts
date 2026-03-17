import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encryptToken } from "@/lib/encryption";

export async function GET(req: Request) {
  const baseUrl = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
  
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // base64 encoded email
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error || !code || !state) {
      console.error("[LinkedIn Callback] Error from LinkedIn:", error, errorDescription);
      const errorMsg = error === "user_cancelled_login" || error === "user_cancelled_authorize" ? "oauth_denied" : `oauth_error_${error}`;
      return NextResponse.redirect(`${baseUrl}/settings?tab=accounts&error=${errorMsg}`);
    }

    let email = "";
    try {
      email = Buffer.from(state, "base64").toString("utf8");
    } catch (e: any) {
      console.error("[LinkedIn Callback] State decode failed:", e);
      return NextResponse.redirect(`${baseUrl}/settings?tab=accounts&error=invalid_state_decode`);
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.error("[LinkedIn Callback] Missing client credentials in env");
      return NextResponse.redirect(`${baseUrl}/settings?tab=accounts&error=missing_credentials`);
    }

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
      return NextResponse.redirect(`${baseUrl}/settings?tab=accounts&error=token_exchange_failed`);
    }

    // Get LinkedIn profile
    let profile;
    try {
      const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      profile = await profileRes.json();
    } catch (e) {
      console.error("[LinkedIn OAuth] Fetch profile network error:", e);
      return NextResponse.redirect(`${baseUrl}/settings?tab=accounts&error=profile_fetch_network_error`);
    }
    
    if (!profile || profile.error) {
      console.error("[LinkedIn OAuth] Userinfo fetch returned error:", profile);
      return NextResponse.redirect(`${baseUrl}/settings?tab=accounts&error=profile_fetch_api_error`);
    }

    const accountName = profile.name || 
                        (profile.given_name ? `${profile.given_name} ${profile.family_name || ""}`.trim() : "LinkedIn User");

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error(`[LinkedIn OAuth] User not found for email: ${email}`);
      return NextResponse.redirect(`${baseUrl}/settings?tab=accounts&error=user_not_found`);
    }

    const tokenExpiry = new Date(Date.now() + (tokenData.expires_in || 5184000) * 1000);

    let encryptedAccess, encryptedRefresh;
    try {
      encryptedAccess = encryptToken(tokenData.access_token);
      encryptedRefresh = tokenData.refresh_token ? encryptToken(tokenData.refresh_token) : null;
    } catch (e: any) {
      console.error("[LinkedIn OAuth] Encryption failed:", e);
      return NextResponse.redirect(`${baseUrl}/settings?tab=accounts&error=encryption_failed`);
    }

    try {
      await (prisma as any).socialAccount.upsert({
        where: { userId_platform: { userId: user.id, platform: "linkedin" } },
        create: {
          userId: user.id,
          platform: "linkedin",
          accessToken: encryptedAccess,
          refreshToken: encryptedRefresh,
          tokenExpiry,
          accountId: profile.sub || "unknown",
          accountName,
        },
        update: {
          accessToken: encryptedAccess,
          refreshToken: encryptedRefresh,
          tokenExpiry,
          accountId: profile.sub || "unknown",
          accountName,
          isActive: true,
        },
      });
    } catch (e: any) {
      console.error("[LinkedIn OAuth] Database upsert failed:", e);
      return NextResponse.redirect(`${baseUrl}/settings?tab=accounts&error=db_upsert_failed`);
    }

    return NextResponse.redirect(`${baseUrl}/settings?tab=accounts&success=linkedin`);
  } catch (err: any) {
    console.error("[LinkedIn OAuth] Fatal Callback Error:", err);
    // Passing error message in URL so we can actually see it on Vercel
    const cleanMsg = err?.message ? err.message.replace(/[^a-zA-Z0-9_\-]/g, "_") : "unknown";
    return NextResponse.redirect(`${baseUrl}/settings?tab=accounts&error=fatal_${cleanMsg}`);
  }
}
