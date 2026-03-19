import { prisma } from "@/lib/db/prisma";

// ── Token Refresh Utility ──────────────────────────────────────────────────
// Checks if a SocialAccount's token needs refresh and refreshes it if needed.
// Called before any publish operation.

const REFRESH_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function getValidToken(userId: string, platform: string): Promise<string | null> {
  const account = await prisma.socialAccount.findFirst({
    where: { userId, platform: platform as any, isActive: true },
  });

  if (!account) return null;

  // If no expiry or expiry is far in future, return existing token
  if (!account.tokenExpiry) return account.accessToken;

  const msUntilExpiry = account.tokenExpiry.getTime() - Date.now();

  // Token is still valid and not near expiry
  if (msUntilExpiry > REFRESH_THRESHOLD_MS) return account.accessToken;

  // Token expired or expiring soon — attempt refresh
  if (!account.refreshToken) {
    // No refresh token — mark as inactive
    await prisma.socialAccount.update({
      where: { id: account.id },
      data: { isActive: false },
    });
    return null;
  }

  const newToken = await refreshPlatformToken(platform, account.refreshToken, account.id);
  return newToken;
}

async function refreshPlatformToken(
  platform: string,
  refreshToken: string,
  accountId: string
): Promise<string | null> {
  try {
    let tokenData: { access_token?: string; expires_in?: number; refresh_token?: string } = {};

    if (platform === "youtube") {
      // Google OAuth token refresh
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
      });
      tokenData = await res.json();
    } else if (platform === "linkedin") {
      // LinkedIn token refresh
      const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
          client_id: process.env.LINKEDIN_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        }),
      });
      tokenData = await res.json();
    } else if (platform === "x") {
      // Twitter OAuth 2.0 token refresh
      const res = await fetch("https://api.twitter.com/2/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
          ).toString("base64")}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
      });
      tokenData = await res.json();
    }

    if (!tokenData.access_token) return null;

    const tokenExpiry = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000);

    // Update DB with new token
    await prisma.socialAccount.update({
      where: { id: accountId },
      data: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || refreshToken,
        tokenExpiry,
        isActive: true,
      },
    });

    return tokenData.access_token;
  } catch {
    return null;
  }
}
