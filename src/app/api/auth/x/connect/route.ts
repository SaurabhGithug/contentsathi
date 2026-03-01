import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "crypto";

// Twitter OAuth 2.0 PKCE flow
// Store code_verifier in a server-side state map (use Redis in production)
const pendingVerifiers = new Map<string, string>();

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.email) return NextResponse.redirect("/auth/login");

  const clientId = process.env.TWITTER_CLIENT_ID;
  const redirectUri = encodeURIComponent(`${process.env.NEXTAUTH_URL}/api/auth/x/callback`);

  // PKCE: generate code_verifier and code_challenge
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  const state = Buffer.from(session.user.email).toString("base64url");
  pendingVerifiers.set(state, codeVerifier);

  const twitterOAuthUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=tweet.write%20tweet.read%20users.read%20offline.access&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

  return NextResponse.redirect(twitterOAuthUrl);
}

// Export verifiers map so callback can access it
export { pendingVerifiers };
