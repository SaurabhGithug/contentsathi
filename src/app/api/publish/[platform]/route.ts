import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { publishToInstagram } from "@/lib/publishers/instagram";
import { publishToLinkedIn } from "@/lib/publishers/linkedin";
import { publishToYouTube } from "@/lib/publishers/youtube";
import { publishToX } from "@/lib/publishers/x";
import { publishToWhatsApp } from "@/lib/publishers/whatsapp";

export async function POST(
  req: Request,
  { params }: { params: { platform: string } }
) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const platform = params.platform.toLowerCase();
  const body = await req.json();
  const { content, imageUrl, title, calendarItemId } = body;

  try {
    const user = await (prisma.user as any).findUnique({
      where: { email: session.user.email },
      include: { socialAccounts: true }
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const account = (user as any).socialAccounts.find((a: any) => a.platform.toLowerCase() === platform);
    if (!account || !account.isActive) {
      return NextResponse.json({ error: `No active ${platform} account found.` }, { status: 400 });
    }

    let result: any = { success: false, error: "Platform not supported yet" };

    if (platform === "instagram") {
      result = await publishToInstagram({
        accessToken: account.accessToken!,
        instagramBusinessAccountId: account.accountId!,
        imageUrl,
        caption: content
      });
    } else if (platform === "linkedin") {
      result = await publishToLinkedIn({
        accessToken: account.accessToken!,
        authorId: account.accountId!,
        text: content,
        imageUrl,
        title
      });
    } else if (platform === "x") {
        result = await publishToX({
            accessToken: account.accessToken!,
            text: content
        });
    } else if (platform === "whatsapp") {
        const metadata = account.metadata ? JSON.parse(account.metadata) : {};
        result = await publishToWhatsApp({
            accessToken: account.accessToken!,
            phoneNumberId: account.accountId!,
            recipientNumber: metadata.testNumber || "", // For MVP, using testNumber or need a recipient
            content,
            imageUrl
        });
    }

    // Update Logs and Calendar Items
    if (result.success) {
        if (calendarItemId) {
            await (prisma as any).calendarItem.update({
                where: { id: calendarItemId },
                data: {
                    status: "published",
                    platformPostId: result.postId,
                    platformPostUrl: result.url,
                    publishedAt: new Date()
                }
            });
        }

        await (prisma as any).publishLog.create({
            data: {
                userId: user.id,
                calendarItemId,
                platform,
                status: "success",
                platformPostId: result.postId,
                platformPostUrl: result.url,
                publishedAt: new Date()
            }
        });

        return NextResponse.json({ success: true, url: result.url });
    } else {
        await (prisma as any).publishLog.create({
            data: {
                userId: user.id,
                calendarItemId,
                platform,
                status: "failed",
                errorMessage: result.error
            }
        });
        return NextResponse.json({ error: result.error }, { status: 500 });
    }

  } catch (error: any) {
    console.error(`[PUBLISH_API_${platform.toUpperCase()}]`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
