import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    let calendarItemId: string | undefined;
    try {
      const bodyText = await req.json();
      const { userId, title, body, imageUrl, accessToken, providerAccountId } = bodyText;
      calendarItemId = bodyText.calendarItemId;

    if (!providerAccountId || !accessToken) {
      return NextResponse.json({ error: "Instagram account not connected." }, { status: 400 });
    }

    // This route expects the providerAccountId to be the Instagram User ID
    // and the accessToken to be a valid long-lived Graph API token.

    // ── STEP 1: Create Media Container ─────────────────────────────────────
    let containerUrl = `https://graph.facebook.com/v19.0/${providerAccountId}/media`;
    let containerParams: Record<string, string> = {
      caption: body,
      access_token: accessToken,
    };

    if (imageUrl) {
      containerParams.image_url = imageUrl;
    } else {
      // If no image is provided, Instagram Graph API technically requires media.
      // For a text-only experience, users must use a background image.
      // We will error out here if no image is present since IG is visual-first.
      return NextResponse.json({ error: "Instagram requires an image or video to publish." }, { status: 400 });
    }

    const containerQuery = new URLSearchParams(containerParams).toString();
    const containerRes = await fetch(`${containerUrl}?${containerQuery}`, { method: "POST" });
    const containerData = await containerRes.json();

    if (!containerRes.ok) {
      console.error("[IG_CONTAINER_ERROR]", containerData);
      return NextResponse.json({ error: containerData.error?.message || "Failed to create Instagram media container." }, { status: 500 });
    }

    const creationId = containerData.id;

    // ── STEP 2: Publish Media Container ────────────────────────────────────
    const publishUrl = `https://graph.facebook.com/v19.0/${providerAccountId}/media_publish`;
    const publishParams = new URLSearchParams({
      creation_id: creationId,
      access_token: accessToken,
    }).toString();

    const publishRes = await fetch(`${publishUrl}?${publishParams}`, { method: "POST" });
    const publishData = await publishRes.json();

    if (!publishRes.ok) {
      console.error("[IG_PUBLISH_ERROR]", publishData);
      return NextResponse.json({ error: publishData.error?.message || "Failed to publish to Instagram." }, { status: 500 });
    }

    // ── STEP 3: Fetch Media URL (Shortcode) ────────────────────────────────
    let platformPostUrl = `https://www.instagram.com/`; // Fallback
    try {
      const mediaId = publishData.id;
      const shortcodeRes = await fetch(`https://graph.facebook.com/v19.0/${mediaId}?fields=shortcode&access_token=${accessToken}`);
      if (shortcodeRes.ok) {
        const shortcodeData = await shortcodeRes.json();
        if (shortcodeData.shortcode) {
          platformPostUrl = `https://www.instagram.com/p/${shortcodeData.shortcode}/`;
        }
      }
    } catch (e) {
      // Ignore shortcode fetch errors, we still published successfully
      console.log("Failed to fetch IG shortcode", e);
    }

    if (calendarItemId) {
      await prisma.calendarItem.update({
        where: { id: calendarItemId },
        data: {
          status: "published",
          platformPostId: publishData.id,
          platformPostUrl,
          publishedAt: new Date(),
        }
      });
    }

    return NextResponse.json({
      success: true,
      platformPostId: publishData.id,
      platformPostUrl,
    });

  } catch (error: any) {
    console.error(`[PUBLISH_INSTAGRAM_ERROR]`, error);
    if (calendarItemId) {
      try {
        await prisma.calendarItem.update({
          where: { id: calendarItemId },
          data: { status: "failed", failureReason: error.message },
        });
      } catch (e) { console.error("Failed to update IG error status", e); }
    }
    return NextResponse.json(
      { error: "Instagram publishing failed: " + error.message },
      { status: 500 }
    );
  }
}
