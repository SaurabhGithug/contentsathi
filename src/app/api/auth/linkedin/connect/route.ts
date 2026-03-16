import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.redirect("/auth/login");
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const baseUrl = (process.env.NEXTAUTH_URL || "http://localhost:3000").trim();
  const redirectUriStr = `${baseUrl}/api/auth/linkedin/callback`;
  const redirectUri = encodeURIComponent(redirectUriStr);
  
  const scope = encodeURIComponent("openid profile email w_member_social");
  const state = Buffer.from(session.user.email).toString("base64");

  const linkedinOAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}`;

  return NextResponse.redirect(linkedinOAuthUrl);
}
