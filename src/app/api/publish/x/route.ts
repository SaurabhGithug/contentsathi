import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { getValidToken } from "@/lib/token-refresh";

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { postText, imageUrl, calendarItemId } = await req.json();

  const account = await prisma.socialAccount.findFirst({
    where: { userId: user.id, platform: "x", isActive: true },
  });
  if (!account) return NextResponse.json({ error: "X (Twitter) not connected." }, { status: 400 });

  const accessToken = await getValidToken(user.id, "x");
  if (!accessToken) return NextResponse.json({ error: "X token expired. Please reconnect." }, { status: 401 });

  try {
    let mediaId = "";

    if (imageUrl) {
      // Upload image via Twitter v1.1 media upload
      const imgRes = await fetch(imageUrl);
      const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
      const mediaUploadRes = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          media_data: imgBuffer.toString("base64"),
        }),
      });
      const mediaData = await mediaUploadRes.json();
      mediaId = mediaData.media_id_string || "";
    }

    const tweetBody: any = { text: postText };
    if (mediaId) tweetBody.media = { media_ids: [mediaId] };

    const tweetRes = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tweetBody),
    });

    const tweetData = await tweetRes.json();
    const tweetId = tweetData.data?.id || "";
    const tweetUrl = tweetId ? `https://twitter.com/i/web/status/${tweetId}` : "";

    if (calendarItemId) {
      await prisma.calendarItem.update({
        where: { id: calendarItemId },
        data: { status: "published", platformPostId: tweetId, platformPostUrl: tweetUrl, publishedAt: new Date() },
      });
    }

    return NextResponse.json({ success: true, tweetId, tweetUrl });
  } catch (error: any) {
    if (calendarItemId) {
      await prisma.calendarItem.update({
        where: { id: calendarItemId },
        data: { status: "failed", failureReason: error.message },
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
