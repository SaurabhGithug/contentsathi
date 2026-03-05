import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limiter";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    
    // Rate limit to prevent spam (3 per hour is generous for this)
    const limiter = rateLimit(`waitlist:${ip}`, { maxRequests: 10, windowSeconds: 3600 });
    if (!limiter.success) {
      return NextResponse.json(rateLimitResponse(limiter.retryAfter), { status: 429 });
    }

    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const userId = session?.user?.email 
      ? (await prisma.user.findUnique({ where: { email: session.user.email } }))?.id 
      : undefined;

    // Use upsert to gracefully handle existing emails
    await prisma.waitlist.upsert({
      where: { email },
      update: { userId }, // update userId if they logged in later
      create: { email, userId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[WAITLIST_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to join waitlist. Please try again." },
      { status: 500 }
    );
  }
}
