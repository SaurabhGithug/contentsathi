import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { platform, calendarItemId, title, body, imageUrl } = await req.json();

    if (!platform || (!calendarItemId && !body)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Attempt to find the connected social account for this platform
    // Normalizing platform names (e.g. "YouTube Shorts" -> "youtube", "X (Twitter)" -> "twitter")
    let normalizedPlatform = platform.toLowerCase();
    if (normalizedPlatform.includes("youtube")) normalizedPlatform = "youtube";
    if (normalizedPlatform.includes("twitter") || normalizedPlatform === "x") normalizedPlatform = "twitter";
    if (normalizedPlatform.includes("linkedin")) normalizedPlatform = "linkedin";
    if (normalizedPlatform.includes("instagram")) normalizedPlatform = "instagram";
    if (normalizedPlatform.includes("facebook")) normalizedPlatform = "facebook";
    if (normalizedPlatform.includes("whatsapp")) normalizedPlatform = "whatsapp";

    const account = await prisma.socialAccount.findFirst({
      where: {
        userId: user.id,
        platform: normalizedPlatform,
      },
    });

    // In a fully working flow, we'd strictly require the account token here:
    // if (!account && normalizedPlatform !== "whatsapp") { // WhatsApp might use global business API key instead of user oauth
    //   return NextResponse.json({ error: `Not connected to ${platform}. Please connect your account first.` }, { status: 400 });
    // }

    // Dispatch to platform-specific routes
    let publishResult;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      // We'll call our own internal absolute API routes to handle the specific logic
      const response = await fetch(`${baseUrl}/api/publish/${normalizedPlatform}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Pass along a secret or the token so internal routes can auth
          "x-internal-auth": "true", 
        },
        body: JSON.stringify({
          userId: user.id,
          calendarItemId,
          title,
          body,
          imageUrl,
          // Pass the db token if it exists
          accessToken: account?.accessToken,
          refreshToken: account?.refreshToken,
          accountId: account?.accountId || account?.id,
          broadcastList: account?.accountName
        }),
      });

      publishResult = await response.json();
      
      if (!response.ok) {
        throw new Error(publishResult.error || `Failed to publish to ${platform}`);
      }
    } catch (err: any) {
      console.error(`[DISPATCH_TO_${normalizedPlatform.toUpperCase()}_ERROR]`, err);
      return NextResponse.json({ 
        error: `Kuch toh gadbad hai — couldn't reach ${platform}. Please try again.` 
      }, { status: 500 });
    }

    // Log the success
    const log = await prisma.publishLog.create({
      data: {
        userId: user.id,
        calendarItemId: calendarItemId || null, // Might be null if published directly from Generator
        platform: normalizedPlatform,
        status: "success",
        platformPostId: publishResult.platformPostId || null,
        platformPostUrl: publishResult.platformPostUrl || null,
        publishedAt: new Date(),
      }
    });

    // Update CalendarItem if applicable
    if (calendarItemId) {
      await prisma.calendarItem.update({
        where: { id: calendarItemId },
        data: {
          status: "published",
          platformPostId: publishResult.platformPostId,
          platformPostUrl: publishResult.platformPostUrl,
          publishedAt: new Date(),
        }
      });
    }

    return NextResponse.json({
      success: true,
      platformPostId: publishResult.platformPostId,
      platformPostUrl: publishResult.platformPostUrl,
      publishLogId: log.id,
    });

  } catch (error: any) {
    console.error("[PUBLISH_DISPATCH_ERROR]", error);
    return NextResponse.json(
      { error: "Publishing failed: " + error.message },
      { status: 500 }
    );
  }
}
