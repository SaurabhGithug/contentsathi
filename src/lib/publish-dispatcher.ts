import { prisma } from "@/lib/prisma";
import { publishToLinkedIn } from "./publishers/linkedin";
import { publishToInstagram } from "./publishers/instagram";
import { publishToWhatsApp } from "./publishers/whatsapp";
import { publishToYouTube } from "./publishers/youtube";

export async function dispatchPublication(calendarItemId: string) {
  const item = await prisma.calendarItem.findUnique({
    where: { id: calendarItemId },
    include: {
      user: {
        include: {
          socialAccounts: true,
        },
      },
      generatedAsset: true,
    },
  });

  if (!item || !item.user) {
    throw new Error("Calendar item or user not found");
  }

  const platform = item.platform.toLowerCase();
  const account = item.user.socialAccounts.find(
    (a) => a.platform.toLowerCase() === platform
  );

  if (!account || !account.accessToken) {
    // If no real account, we log it but don't crash the loop
    // This allows the dashboard to show "skipped/unconnected" state
    await prisma.calendarItem.update({
      where: { id: item.id },
      data: {
        status: "failed",
        failureReason: `No connected ${platform} account found.`,
      },
    });
    return { success: false, error: "Account not connected" };
  }

  const content = item.generatedAsset?.body || item.notes || "";
  const title = item.generatedAsset?.title || "";
  const imageUrl = item.generatedAsset?.imageUrl || undefined;

  let result;

  try {
    switch (platform) {
      case "linkedin":
        result = await publishToLinkedIn({
          accessToken: account.accessToken,
          authorId: account.accountId || "me",
          text: content,
          imageUrl,
          title,
        });
        break;

      case "instagram":
        if (!account.pageId) throw new Error("Instagram Business Account ID missing");
        result = await publishToInstagram({
          accessToken: account.accessToken,
          instagramBusinessAccountId: account.pageId,
          imageUrl: imageUrl || "https://contentsathi.com/placeholder.png", // IG requires image
          caption: content,
        });
        break;

      case "whatsapp":
        if (!account.channelId) throw new Error("WhatsApp Phone Number ID missing");
        result = await publishToWhatsApp({
          accessToken: account.accessToken,
          phoneNumberId: account.channelId,
          recipientNumber: item.user.phone || "",
          content,
          imageUrl,
        });
        break;

      case "youtube":
        result = await publishToYouTube({
          accessToken: account.accessToken,
          title,
          description: content,
        });
        break;

      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    if (result.success) {
      const successResult = result as any;
      await prisma.calendarItem.update({
        where: { id: item.id },
        data: {
          status: "published",
          publishedAt: new Date(),
          platformPostId: successResult.postId,
          platformPostUrl: successResult.url,
        },
      });

      // Log the publication
      await prisma.publishLog.create({
        data: {
          userId: item.userId,
          calendarItemId: item.id,
          generatedAssetId: item.generatedAssetId,
          platform: item.platform,
          status: "SUCCESS",
          platformPostId: successResult.postId,
          platformPostUrl: successResult.url,
          publishedAt: new Date(),
        },
      });

      // Increment publish count on asset
      if (item.generatedAssetId) {
        await prisma.generatedAsset.update({
          where: { id: item.generatedAssetId },
          data: { publishCount: { increment: 1 } },
        });
      }

      return { success: true, data: result };
    } else {
      throw new Error(result.error || "Unknown publishing error");
    }
  } catch (err: any) {
    console.error(`[DISPATCH_PUBLISH_FAILED] [${platform}]`, err);
    
    await prisma.calendarItem.update({
      where: { id: item.id },
      data: {
        status: "failed",
        failureReason: err.message,
      },
    });

    await prisma.publishLog.create({
      data: {
        userId: item.userId,
        calendarItemId: item.id,
        generatedAssetId: item.generatedAssetId,
        platform: item.platform,
        status: "FAILED",
        errorMessage: err.message,
      },
    });

    return { success: false, error: err.message };
  }
}
