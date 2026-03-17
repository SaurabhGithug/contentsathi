import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const BASE = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.redirect(`${BASE}/auth/login`);

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = encodeURIComponent(`${process.env.NEXTAUTH_URL}/api/auth/youtube/callback`);
  const scope = encodeURIComponent(
    "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly"
  );
  const state = Buffer.from(session.user.email).toString("base64");

  const googleOAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}&access_type=offline&prompt=consent`;

  return NextResponse.redirect(googleOAuthUrl);
}
