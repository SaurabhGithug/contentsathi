import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  let calendarItemId: string | undefined;
  try {
    const bodyText = await req.json();
    const { body, imageUrl, accessToken, providerAccountId } = bodyText;
    calendarItemId = bodyText.calendarItemId;

    if (!accessToken || !providerAccountId) {
      return NextResponse.json({ error: "Facebook account not connected." }, { status: 400 });
    }

    // providerAccountId should be the Facebook Page ID
    // ── STEP 1: Exchange User Token for Page Token ─────────────────────────
    const accountsUrl = `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`;
    const accountsRes = await fetch(accountsUrl);
    const accountsData = await accountsRes.json();

    let pageAccessToken = accessToken;
    
    if (accountsRes.ok && accountsData.data) {
      const pageInfo = accountsData.data.find((p: any) => p.id === providerAccountId);
      if (pageInfo && pageInfo.access_token) {
        pageAccessToken = pageInfo.access_token;
      }
    }

    // ── STEP 2: Publish to Page ────────────────────────────────────────────
    let publishUrl = `https://graph.facebook.com/v19.0/${providerAccountId}/feed`;
    let publishParams: any = {
      message: body,
      access_token: pageAccessToken
    };

    if (imageUrl) {
      publishUrl = `https://graph.facebook.com/v19.0/${providerAccountId}/photos`;
      publishParams = {
        url: imageUrl,
        caption: body, 
        access_token: pageAccessToken
      };
    }

    const publishRes = await fetch(publishUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(publishParams)
    });

    const publishData = await publishRes.json();

    if (!publishRes.ok) {
      console.error("[FB_PUBLISH_ERROR]", publishData);
      throw new Error(publishData.error?.message || "Failed to publish to Facebook.");
    }

    // FB returns post ID as "PageID_PostID"
    const postIdParts = publishData.id.split('_');
    const rawPostId = postIdParts.length > 1 ? postIdParts[1] : publishData.id;
    const platformPostUrl = `https://www.facebook.com/${providerAccountId}/posts/${rawPostId}`;

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
    console.error(`[PUBLISH_FACEBOOK_ERROR]`, error);
    if (calendarItemId) {
      try {
        await prisma.calendarItem.update({
          where: { id: calendarItemId },
          data: { status: "failed", failureReason: error.message },
        });
      } catch (e) { console.error("Failed to update FB status", e); }
    }
    return NextResponse.json(
      { error: "Facebook publishing failed: " + error.message },
      { status: 500 }
    );
  }
}
