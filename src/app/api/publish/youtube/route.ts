import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    let calendarItemId: string | undefined;
    try {
      const bodyText = await req.json();
      const { userId, title, body, imageUrl } = bodyText;
      calendarItemId = bodyText.calendarItemId;

    // YouTube Shorts through contentsathi is primarily a script generation tool.
    // Full automated video uploading would require OAuth via YouTube Data API + a rendered video file.
    // The current flow generates scripts that users record. 
    // We mock the "publish" action by simply marking it as active/published.

    // If an actual video URL was provided in `imageUrl` (hijacked for video context, though unlikely)
    // we could try to push it, but for now we just acknowledge the script.

    if (calendarItemId) {
      await prisma.calendarItem.update({
        where: { id: calendarItemId },
        data: {
          status: "published",
        }
      });
    }

    return NextResponse.json({
      success: true,
      platformPostId: `yt_script_${Date.now()}`,
      platformPostUrl: "https://studio.youtube.com/",
    });

  } catch (error: any) {
    console.error(`[PUBLISH_YOUTUBE_ERROR]`, error);
    if (calendarItemId) {
      try {
        await prisma.calendarItem.update({
          where: { id: calendarItemId },
          data: { status: "failed", failureReason: error.message },
        });
      } catch (e) { console.error("Failed to update YT status", e); }
    }
    return NextResponse.json(
      { error: "YouTube script processing failed: " + error.message },
      { status: 500 }
    );
  }
}
